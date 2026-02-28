from ortools.sat.python import cp_model
from app.models import GenerateRequest
from pydantic import BaseModel
from typing import List
from datetime import datetime

class TimetableScheduler:
    def __init__(self, request: GenerateRequest):
        self.request = request
        self.model = cp_model.CpModel()
        self.vars = {}
        self.slots_definition = self._generate_time_slots()
        self.days = list(range(1, request.config.daysPerWeek + 1))
        
        # Mappings for quick lookup
        self.courses_dict = {c.id: c for c in request.courses}
        self.faculty_dict = {f.id: f for f in request.faculty}
        self.rooms_dict = {r.id: r for r in request.resources}
        self.batches_dict = {b.id: b for b in request.batches}
        
        print(f"[AI Diagnostics] Starting Solver: {len(request.courses)} Courses, {len(request.faculty)} Faculty, {len(request.batches)} Batches, {len(request.resources)} Rooms.")
        
        # Extract break slots
        self.break_slots = [p for p, is_break in self.slots_definition if is_break]
        self.lecture_slots = [p for p, is_break in self.slots_definition if not is_break]

    def _generate_time_slots(self):
        """Map config to discrete periods (lecture/break) with minute increments"""
        periods = []
        lecture_duration = self.request.config.lectureDuration
        break_duration = self.request.config.breakDuration
        num_breaks = self.request.config.numberOfBreaks
        start_time_str = self.request.config.startTime
        end_time_str = self.request.config.endTime
        
        from datetime import datetime, timedelta
        try:
            current_time = datetime.strptime(start_time_str, "%H:%M")
            end_of_day = datetime.strptime(end_time_str, "%H:%M")
        except ValueError:
            current_time = datetime.strptime("09:00", "%H:%M")
            end_of_day = datetime.strptime("16:00", "%H:%M")
            
        total_day_minutes = (end_of_day - current_time).total_seconds() / 60.0
        total_lecture_minutes = total_day_minutes - (num_breaks * break_duration)
        if total_lecture_minutes < 0: total_lecture_minutes = 0
        lectures_per_day = int(total_lecture_minutes // lecture_duration)
        
        break_after = lectures_per_day // (num_breaks + 1) if num_breaks > 0 else 0
        
        slot_idx_in_day = 1
        consecutive_lectures = 0
        total_lectures_added = 0
        breaks_placed = 0
        
        self.slot_times = {}
        
        while total_lectures_added < lectures_per_day:
            if consecutive_lectures == break_after and break_after > 0 and breaks_placed < num_breaks:
                end_time = current_time + timedelta(minutes=break_duration)
                periods.append((slot_idx_in_day, True))
                self.slot_times[slot_idx_in_day] = (current_time.strftime("%H:%M"), end_time.strftime("%H:%M"))
                current_time = end_time
                consecutive_lectures = 0
                breaks_placed += 1
            else:
                end_time = current_time + timedelta(minutes=lecture_duration)
                periods.append((slot_idx_in_day, False))
                self.slot_times[slot_idx_in_day] = (current_time.strftime("%H:%M"), end_time.strftime("%H:%M"))
                current_time = end_time
                consecutive_lectures += 1
                total_lectures_added += 1
                
            slot_idx_in_day += 1
            
        return periods

    def _setup_variables(self):
        """Create integer boolean decision variables"""
        for d in self.days:
            for p, is_break in self.slots_definition:
                if is_break:
                    continue # Skip breaks for decision variables
                    
                for c in self.request.courses:
                    for f in self.request.faculty:
                        for r in self.request.resources:
                            for b in self.request.batches:
                                # v(d, p, c, f, r, b) = 1 if scheduled, else 0
                                key = (d, p, c.id, f.id, r.id, b.id)
                                self.vars[key] = self.model.NewBoolVar(f"d{d}p{p}c{c.id}f{f.id}r{r.id}b{b.id}")

    def _add_hard_constraints(self):
        # 1. Weekly hours matching per course (Scoped by Program)
        for b in self.request.batches:
            for c in self.request.courses:
                course_slots = []
                
                # Verify if the Course explicitly belongs to this Batch's Program
                program_mismatch = False
                if c.program and b.program and c.program != b.program:
                    program_mismatch = True

                # Check if any faculty can teach this course
                can_be_taught = any(c.id in [sub.courseId for sub in f.subjects] for f in self.request.faculty)
                
                for d in self.days:
                    for p in self.lecture_slots:
                        for f in self.request.faculty:
                            for r in self.request.resources:
                                course_slots.append(self.vars[(d, p, c.id, f.id, r.id, b.id)])
                
                if program_mismatch or not can_be_taught:
                    # If this Course isn't for this Batch's Program, or no Faculty exist, strictly 0 slots
                    self.model.Add(sum(course_slots) == 0)
                else:
                    self.model.AddExactlyOne(course_slots) if c.weeklyHrs == 1 else self.model.Add(sum(course_slots) == c.weeklyHrs)

        # 2. Faculty cannot be double booked at identical (d, p)
        for d in self.days:
            for p in self.lecture_slots:
                for f in self.request.faculty:
                    slots_for_f = []
                    for c in self.request.courses:
                        for r in self.request.resources:
                            for b in self.request.batches:
                                slots_for_f.append(self.vars[(d, p, c.id, f.id, r.id, b.id)])
                    self.model.AddAtMostOne(slots_for_f)

        # 3. Batch cannot be double booked at identical (d, p)
        for d in self.days:
            for p in self.lecture_slots:
                for b in self.request.batches:
                    slots_for_b = []
                    for c in self.request.courses:
                        for f in self.request.faculty:
                            for r in self.request.resources:
                                slots_for_b.append(self.vars[(d, p, c.id, f.id, r.id, b.id)])
                    self.model.AddAtMostOne(slots_for_b)

        # 4. Room cannot be double booked at identical (d, p)
        for d in self.days:
            for p in self.lecture_slots:
                for r in self.request.resources:
                    slots_for_r = []
                    for c in self.request.courses:
                        for f in self.request.faculty:
                            for b in self.request.batches:
                                slots_for_r.append(self.vars[(d, p, c.id, f.id, r.id, b.id)])
                    self.model.AddAtMostOne(slots_for_r)

        # 5. Room capacity must match or exceed batch strength
        for d in self.days:
            for p in self.lecture_slots:
                for b in self.request.batches:
                    for c in self.request.courses:
                        for f in self.request.faculty:
                            for r in self.request.resources:
                                if r.capacity < b.strength:
                                    self.model.Add(self.vars[(d, p, c.id, f.id, r.id, b.id)] == 0)
                                    
        # 6. Faculty must only teach assigned subjects
        for f in self.request.faculty:
            allowed_course_ids = [sub.courseId for sub in f.subjects]
            for d in self.days:
                for p in self.lecture_slots:
                    for c in self.request.courses:
                        if c.id not in allowed_course_ids:
                            for r in self.request.resources:
                                for b in self.request.batches:
                                    self.model.Add(self.vars[(d, p, c.id, f.id, r.id, b.id)] == 0)

        # 7. Faculty MAX daily hours limit
        for f in self.request.faculty:
            for d in self.days:
                daily_slots = []
                for p in self.lecture_slots:
                    for c in self.request.courses:
                        for r in self.request.resources:
                            for b in self.request.batches:
                                daily_slots.append(self.vars[(d, p, c.id, f.id, r.id, b.id)])
                self.model.Add(sum(daily_slots) <= f.maxHrsPerDay)

        # 8. Special Timetable Exclusions
        for d in self.days:
            for p in self.lecture_slots:
                for c in self.request.courses:
                    for f in self.request.faculty:
                        for r in self.request.resources:
                            for b in self.request.batches:
                                if f.id in self.request.excludedFacultyIds or r.id in self.request.excludedRoomIds or d in self.request.excludedDayIds:
                                    self.model.Add(self.vars[(d, p, c.id, f.id, r.id, b.id)] == 0)

        # 9. Handle Existing Slots (Partial Re-generation)
        # If a slot is provided in existingSlots, we pin it as a hard constraint
        pinned_keys = set()
        for slot in self.request.existingSlots:
            if slot.isBreak or not slot.courseId or not slot.facultyId or not slot.roomId or not slot.batchId:
                continue
            
            key = (slot.dayOfWeek, slot.slotNumber, slot.courseId, slot.facultyId, slot.roomId, slot.batchId)
            if key in self.vars:
                self.model.Add(self.vars[key] == 1)
                pinned_keys.add(key)

    def _add_soft_constraints(self):
        """Add objectives for better utilization and distribution"""
        obj_vars = []
        obj_coeffs = []
        
        # A. Maximize Room Utilization: Prefer larger rooms to be filled closer to capacity
        # or simply penalize using rooms that are way too big for a batch?
        # Let's reward using rooms where capacity is closer to batch strength.
        for key, var in self.vars.items():
            d, p, c_id, f_id, r_id, b_id = key
            room = self.rooms_dict.get(r_id)
            batch = self.batches_dict.get(b_id)
            if room and batch:
                # Higher score for closer fit
                # Score = 100 - (Capacity - Strength)
                # This encourages using appropriate rooms.
                utilization_score = max(0, 100 - (room.capacity - batch.strength))
                obj_vars.append(var)
                obj_coeffs.append(utilization_score)

        # B. Even Workload Distribution (Faculty)
        # We want to minimize the variance of hours per day for each faculty.
        # This is harder with pure linear objectives, but we can reward 'compact' schedules
        # or penalize long gaps.
        # For simplicity, let's just reward balanced weekly hours if possible.

        self.model.Maximize(sum(obj_vars[i] * obj_coeffs[i] for i in range(len(obj_vars))))

    def solve(self):
        self._setup_variables()
        self._add_hard_constraints()
        self._add_soft_constraints()
        
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        # Enable multi-threading for faster search
        solver.parameters.num_search_workers = 8
        status = solver.Solve(self.model)
        
        ret = {'status': solver.StatusName(status), 'slots': []}
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for d in self.days:
                for p in self.lecture_slots:
                    for c in self.request.courses:
                        for f in self.request.faculty:
                            for r in self.request.resources:
                                for b in self.request.batches:
                                    if solver.Value(self.vars[(d, p, c.id, f.id, r.id, b.id)]) == 1:
                                        start_str, end_str = self.slot_times[p]
                                        
                                        ret['slots'].append({
                                            "dayOfWeek": d,
                                            "slotNumber": p,
                                            "startTime": start_str,
                                            "endTime": end_str,
                                            "courseId": c.id,
                                            "facultyId": f.id,
                                            "roomId": r.id,
                                            "batchId": b.id,
                                            "isBreak": False,
                                            "slotType": c.type.upper()
                                        })
            
            # Map break slots
            for d in self.days:
                for p in self.break_slots:
                    start_str, end_str = self.slot_times[p]
                    for b in self.request.batches:
                        ret['slots'].append({
                            "dayOfWeek": d,
                            "slotNumber": p,
                            "startTime": start_str,
                            "endTime": end_str,
                            "batchId": b.id,
                            "isBreak": True,
                            "slotType": "BREAK"
                        })
                                            
        return ret
