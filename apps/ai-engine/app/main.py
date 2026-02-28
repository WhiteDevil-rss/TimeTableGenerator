from fastapi import FastAPI, HTTPException
from app.models import GenerateRequest, GenerateResponse
from app.solver import TimetableScheduler
from collections import defaultdict

app = FastAPI(title="NEP-Scheduler AI Engine")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-engine",
        "solver": "Google OR-Tools CP-SAT",
        "solverTimeoutMs": 30000,
        "hardConstraints": 9,
        "softConstraints": 3,
        "version": "2.1.0"
    }


@app.post("/solve", response_model=GenerateResponse)
def solve_timetable(request: GenerateRequest):
    try:
        # Pre-Validation Checks
        if not request.resources:
            return GenerateResponse(status="INFEASIBLE", message="Critical Failure: No physical Classrooms or Labs are provisioned for this University.", slots=[], conflictCount=-1)
        if not request.batches:
            return GenerateResponse(status="INFEASIBLE", message="Validation Error: No student Batches found to schedule.", slots=[], conflictCount=-1)
        if not request.courses:
            return GenerateResponse(status="INFEASIBLE", message="Validation Error: No active Courses found in this department.", slots=[], conflictCount=-1)
        if not request.faculty:
            return GenerateResponse(status="INFEASIBLE", message="Validation Error: No Faculty members have been assigned.", slots=[], conflictCount=-1)
            
        max_room_cap = max((r.capacity for r in request.resources), default=0)
        invalid_batches = [b.name for b in request.batches if b.strength > max_room_cap]
        if invalid_batches:
            return GenerateResponse(
                status="INFEASIBLE", 
                message=f"Constraint Violation: Batches ({', '.join(invalid_batches)}) exceed the maximum available room capacity of {max_room_cap} pax.", 
                slots=[], 
                conflictCount=-1
            )
            
        # Convert course weeklyHrs to required slots based on lectureDuration
        import math
        for c in request.courses:
            # weeklyHrs is in hours, lectureDuration is in minutes
            c.weeklyHrs = math.ceil((c.weeklyHrs * 60) / request.config.lectureDuration)
            
        # Validate per-batch curriculum load
        batch_load = {}
        for b in request.batches:
            # A batch must attend all courses for its Program AND its Semester
            # We filter courses tailored to this specific batch's path
            relevant_courses = [
                c for c in request.courses 
                if (c.program == b.program or not c.program or not b.program) and
                   (c.semester == b.semester or c.semester is None)
            ]
            total_b_slots = sum(c.weeklyHrs for c in relevant_courses)
            batch_load[b.name] = total_b_slots
            
        max_program_slots = max(batch_load.values()) if batch_load else 0
        from datetime import datetime
        try:
            current_time = datetime.strptime(request.config.startTime, "%H:%M")
            end_of_day = datetime.strptime(request.config.endTime, "%H:%M")
        except ValueError:
            current_time = datetime.strptime("09:00", "%H:%M")
            end_of_day = datetime.strptime("16:00", "%H:%M")
        
        total_day_minutes = (end_of_day - current_time).total_seconds() / 60.0
        total_lecture_minutes = total_day_minutes - (request.config.numberOfBreaks * request.config.breakDuration)
        if total_lecture_minutes < 0: total_lecture_minutes = 0
        lectures_per_day = int(total_lecture_minutes // request.config.lectureDuration)
        max_possible_slots = lectures_per_day * request.config.daysPerWeek
        
        print(f"[Temporal Validation Trace] Max Batch Required Slots: {max_program_slots} | Max Possible Slots: {max_possible_slots}")
        
        if max_program_slots > max_possible_slots:
            violating_batches = [name for name, slots in batch_load.items() if slots > max_possible_slots]
            return GenerateResponse(
                status="INFEASIBLE", 
                message=f"Temporal Violation: The curriculum for Batches [{', '.join(violating_batches)}] requires up to {max_program_slots} slots/week, but your Time Configuration only permits {max_possible_slots} total slots per week.", 
                slots=[], 
                conflictCount=-1
            )
            
        # Validate exclusive Faculty workload constraints 
        faculty_exclusive_load = defaultdict(int)
        for c in request.courses:
            # Find Faculty who teach this course
            capable_faculty = [f for f in request.faculty if any(s.courseId == c.id for s in f.subjects)]
            if len(capable_faculty) == 1:
                # This faculty is the exclusive teacher. Required slots = course slots * (number of batches taking this program)
                f = capable_faculty[0]
                target_batches = [b for b in request.batches if (b.program == c.program) or (not b.program) or (not c.program)]
                required_slots = c.weeklyHrs * len(target_batches)
                faculty_exclusive_load[f.name] += required_slots
                
        for fname, required_slots in faculty_exclusive_load.items():
            if required_slots > max_possible_slots:
                return GenerateResponse(
                    status="INFEASIBLE", 
                    message=f"Workload Violation: Faculty '{fname}' is the exclusive teacher for courses requiring {required_slots} distinct lecture slots, but the Time Configuration only provides {max_possible_slots} total slots per week. Please assign more faculty or increase 'Lectures Per Day'.", 
                    slots=[], 
                    conflictCount=-1
                )
            # Workload check against maxHrsPerDay is handled inside the solver.
            pass

        scheduler = TimetableScheduler(request)
        result = scheduler.solve()
        
        if result['status'] in ['OPTIMAL', 'FEASIBLE']:
            return GenerateResponse(
                status=result['status'],
                message="Timetable generated successfully.",
                slots=result['slots'],
                conflictCount=0,
                workloadVariance=result.get('workloadVariance', 0.0)
            )
        else:
            return GenerateResponse(
                status="INFEASIBLE",
                message="Could not find a valid timetable matching the constraints.",
                slots=[],
                conflictCount=-1
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
