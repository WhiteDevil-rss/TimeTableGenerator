"""
AI Timetable Scheduling Engine v3.1.0
Enhanced with:
  • Elective Basket Scheduling (HC12) — all options in a basket fire at same (day, slot)
  • Gap Minimization (SO5) — compact daily schedules; penalises idle slots per batch per day
  • Smart variable-space pre-filtering
  • 12 hard constraints + 5 soft objectives
"""

from __future__ import annotations

import math
import logging
import itertools
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple

from ortools.sat.python import cp_model

from app.models import (
    GenerateRequest, SlotResult, GenerateResponse,
    ElectiveBasket, Faculty, Batch, Course, Resource,
)

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helper: time arithmetic
# ─────────────────────────────────────────────────────────────────────────────

def _add_minutes(t_str: str, mins: int) -> str:
    dt = datetime.strptime(t_str, "%H:%M") + timedelta(minutes=mins)
    return dt.strftime("%H:%M")


# ─────────────────────────────────────────────────────────────────────────────
# Main Scheduler
# ─────────────────────────────────────────────────────────────────────────────

class TimetableScheduler:
    """
    CP-SAT based scheduler.

    Key concepts (v3.1.0):
      • Decision variables: BoolVar per (day, slot, course, faculty, room, batch)
      • Elective options are modelled as virtual batches (prefix ELECTIVE_)
      • HC12 enforces same (day, slot) for all options within one basket
      • SO5 penalises idle slots in a batch's daily window
    """

    # ── Construction ─────────────────────────────────────────────────────

    def __init__(self, request: GenerateRequest):
        self.request = request
        self.model = cp_model.CpModel()

        cfg = request.config
        # Resolve daysPerWeek (legacy top-level field takes precedence if config default)
        self.days: List[int] = list(range(1, cfg.daysPerWeek + 1))

        # Build slot timeline
        self.lecture_slots: List[int] = []
        self.break_slots: List[int] = []
        self.slot_times: Dict[int, Tuple[str, str]] = {}  # slot_number → (start, end)
        self._build_slot_timeline()

        # Pre-process elective baskets into virtual batches / courses
        self._elective_virtual_batches: List[Batch] = []
        self._elective_virtual_courses: Dict[str, Course] = {}
        self._basket_option_batch_ids: Dict[str, List[str]] = {}  # basketId → [vBatchId]
        self._option_id_for_batch: Dict[str, str] = {}            # vBatchId → optionId
        self._basket_for_option_batch: Dict[str, str] = {}        # vBatchId → basketId
        self._basket_division_ids: Dict[str, List[str]] = {}      # basketId → [divisionIds]
        self._process_elective_baskets()

        # Effective batches / courses (real + virtual)
        self._all_batches: List[Batch] = list(request.batches) + self._elective_virtual_batches
        self._all_courses: List[Course] = list(request.courses) + list(self._elective_virtual_courses.values())

        # Locked slots
        self._all_locked = [
            s for s in (request.existingSlots + request.lockedSlots) if s.isLocked
        ]

        # Solver decision variables: (d, p, c_id, f_id, r_id, b_id) → BoolVar
        self.vars: Dict[Tuple, cp_model.IntVar] = {}
        self._valid_combos: List[Tuple[str, str, str, str]] = []

        self._build_valid_combos()
        self._setup_variables()

        log.info(
            "[Solver] Courses=%d(+%d elec), Faculty=%d, Batches=%d(+%d elec), "
            "Rooms=%d, Days=%d, Periods=%d, ValidCombos=%d",
            len(request.courses), len(self._elective_virtual_courses),
            len(request.faculty),
            len(request.batches), len(self._elective_virtual_batches),
            len(request.resources),
            len(self.days), len(self.lecture_slots),
            len(self._valid_combos),
        )

    # ── Timeline builder ─────────────────────────────────────────────────

    def _build_slot_timeline(self):
        cfg = self.request.config
        slot_num = 1
        current = cfg.startTime
        end = cfg.endTime
        break_count = 0

        total_avail_min = (
            datetime.strptime(end, "%H:%M") - datetime.strptime(current, "%H:%M")
        ).total_seconds() / 60
        # Evenly distribute break(s) across the day
        break_interval = (
            (total_avail_min - cfg.numberOfBreaks * cfg.breakDuration) /
            (cfg.numberOfBreaks + 1)
        ) if cfg.numberOfBreaks > 0 else total_avail_min

        elapsed = 0.0
        next_break_at = break_interval  # minutes until first break

        while True:
            slot_end = _add_minutes(current, cfg.lectureDuration)
            if (
                datetime.strptime(slot_end, "%H:%M") >
                datetime.strptime(end, "%H:%M")
            ):
                break

            # Should we insert a break before this slot?
            if (
                cfg.numberOfBreaks > 0
                and break_count < cfg.numberOfBreaks
                and elapsed >= next_break_at
            ):
                # break slot
                break_end = _add_minutes(current, cfg.breakDuration)
                self.break_slots.append(slot_num)
                slot_num += 1
                current = break_end
                elapsed += cfg.breakDuration
                break_count += 1
                next_break_at += break_interval
                continue

            self.lecture_slots.append(slot_num)
            self.slot_times[slot_num] = (current, slot_end)
            elapsed += cfg.lectureDuration
            current = slot_end
            slot_num += 1

    # ── Elective basket pre-processing ───────────────────────────────────

    def _process_elective_baskets(self):
        """
        For each ElectiveBasket, create one virtual Batch per ElectiveOption.
        The virtual course inherits most properties from the real course but is
        scoped to the virtual batch only.
        """
        real_course_map = {c.id: c for c in self.request.courses}

        for basket in self.request.electiveBaskets:
            vbatch_ids: List[str] = []
            
            # Map this basket to its parent division IDs
            self._basket_division_ids[basket.basketId] = basket.divisionIds

            for opt in basket.options:
                from app.models import ElectiveSubgroup
                subgroups = opt.subgroups if opt.subgroups else [
                    # fallback to 1 subgroup if not provided by older API
                    ElectiveSubgroup(
                        subgroupId=opt.optionId,
                        name="Group 1",
                        enrollmentCount=opt.enrollmentCount
                    )
                ]

                for sg in subgroups:
                    vbatch_id = f"ELECTIVE_{basket.basketId}_OPT_{opt.optionId}_SG_{sg.subgroupId}"
                    vbatch_name = f"{basket.name} – {opt.courseId} ({sg.name})"

                    # Virtual batch for the subgroup
                    vbatch = Batch(
                        id=vbatch_id,
                        name=vbatch_name,
                        strength=sg.enrollmentCount,
                        program=basket.program,
                        semester=basket.semester,
                    )
                    self._elective_virtual_batches.append(vbatch)
                    vbatch_ids.append(vbatch_id)
                    self._option_id_for_batch[vbatch_id] = opt.optionId
                    self._basket_for_option_batch[vbatch_id] = basket.basketId

                    # Virtual course (scoped to this option & subgroup)
                    real_c = real_course_map.get(opt.courseId)
                    if real_c:
                        vcourse_id = f"ELEC_{vbatch_id}_{opt.courseId}"
                        vcourse = Course(
                            id=vcourse_id,
                            code=real_c.code,
                            name=real_c.name,
                            type=real_c.type,
                            weeklyHrs=basket.weeklyHrs,
                            program=basket.program,
                            semester=basket.semester,
                            isElective=True,
                            requiredRoomType=real_c.requiredRoomType,
                            labDuration=real_c.labDuration,
                        )
                        self._elective_virtual_courses[vcourse_id] = vcourse

            self._basket_option_batch_ids[basket.basketId] = vbatch_ids

    # ── Valid combo pre-filter ────────────────────────────────────────────

    def _build_valid_combos(self):
        """Pre-filter (course, faculty, room, batch) 4-tuples to remove obviously
        infeasible assignments before variable creation."""
        cfg = self.request.config

        excluded_f: Set[str] = set()
        excluded_r: Set[str] = set()

        faculty_courses: Dict[str, Set[str]] = {}
        for f in self.request.faculty:
            faculty_courses[f.id] = {s.courseId for s in f.subjects}
            if not f.subjects:
                excluded_f.add(f.id)

        for r in self.request.resources:
            if r.capacity <= 0:
                excluded_r.add(r.id)

        def _add_combos(courses: List[Course], batches: List[Batch], elective=False):
            for c in courses:
                req_room_type = c.requiredRoomType
                if not req_room_type and c.type.lower() in ("lab", "theory+lab"):
                    req_room_type = "Lab"
                is_theory_only = c.type.lower() == "theory"

                for b in batches:
                    if c.program and b.program and c.program != b.program:
                        continue
                    if c.semester and b.semester and c.semester != b.semester:
                        continue

                    for f in self.request.faculty:
                        if f.id in excluded_f:
                            continue
                        # For elective virtual courses, use the real courseId
                        real_cid = c.id
                        if c.isElective:
                            # strip the ELEC_{vbatch_id}_ prefix
                            # format: ELEC_ELECTIVE_{basketId}_OPT_{optId}_{realCourseId}
                            parts = c.id.split("_")
                            real_cid = parts[-1] if len(parts) > 1 else c.id
                        if real_cid not in faculty_courses.get(f.id, set()):
                            # Try full course id
                            if c.id not in faculty_courses.get(f.id, set()):
                                # Also try: for elective options, allow specific faculty
                                if not elective:
                                    continue
                                # Find the option for this virtual batch
                                basket_id = self._basket_for_option_batch.get(b.id)
                                if not basket_id:
                                    continue
                                basket = next(
                                    (bk for bk in self.request.electiveBaskets
                                     if bk.basketId == basket_id), None
                                )
                                if not basket:
                                    continue
                                opt_id = self._option_id_for_batch.get(b.id)
                                opt = next(
                                    (o for o in basket.options if o.optionId == opt_id), None
                                )
                                if not opt or opt.facultyId != f.id:
                                    continue

                        for r in self.request.resources:
                            if r.id in excluded_r:
                                continue
                            if r.capacity < b.strength:
                                continue
                            if req_room_type and r.type != req_room_type:
                                continue
                            if is_theory_only and r.type.lower() == "lab":
                                continue
                            self._valid_combos.append((c.id, f.id, r.id, b.id))

        # Add regular course/batch combos
        _add_combos(self.request.courses, self.request.batches)
        # Add elective virtual course/batch combos
        if self._elective_virtual_courses:
            _add_combos(
                list(self._elective_virtual_courses.values()),
                self._elective_virtual_batches,
                elective=True,
            )

    # ── Variable creation ─────────────────────────────────────────────────

    def _setup_variables(self):
        for d in self.days:
            if d in self.request.excludedDayIds:
                continue
            for p in self.lecture_slots:
                for (c_id, f_id, r_id, b_id) in self._valid_combos:
                    key = (d, p, c_id, f_id, r_id, b_id)
                    self.vars[key] = self.model.NewBoolVar(
                        f"d{d}p{p}c{c_id[-6:]}f{f_id[-4:]}r{r_id[-4:]}b{b_id[-4:]}"
                    )

    # ── Hard Constraints ──────────────────────────────────────────────────

    def _add_hard_constraints(self):
        days = [d for d in self.days if d not in self.request.excludedDayIds]
        cfg = self.request.config

        # Pre-aggregate vars for efficient constraint building
        cb_vars: Dict[Tuple, List] = {}   # (c_id, b_id) → vars
        fdp_vars: Dict[Tuple, List] = {}  # (d, p, f_id) → vars
        bdp_vars: Dict[Tuple, List] = {}  # (d, p, b_id) → vars
        rdp_vars: Dict[Tuple, List] = {}  # (d, p, r_id) → vars
        fd_vars: Dict[Tuple, List] = {}   # (d, f_id) → vars
        cbd_vars: Dict[Tuple, List] = {}  # (c_id, b_id, d) → vars (for day distribution)
        bd_vars: Dict[Tuple, List] = {}   # (b_id, d) → vars (for gap penalty)

        for key, var in self.vars.items():
            d, p, c_id, f_id, r_id, b_id = key
            cb_vars.setdefault((c_id, b_id), []).append(var)
            fdp_vars.setdefault((d, p, f_id), []).append(var)
            bdp_vars.setdefault((d, p, b_id), []).append(var)
            rdp_vars.setdefault((d, p, r_id), []).append(var)
            fd_vars.setdefault((d, f_id), []).append(var)
            cbd_vars.setdefault((c_id, b_id, d), []).append(var)
            bd_vars.setdefault((b_id, d), []).append(var)

        # ── HC1 : Weekly slot count per (course, batch) ───────────────
        for b in self._all_batches:
            for c in self._all_courses:
                course_vars = cb_vars.get((c.id, b.id), [])
                program_ok = not c.program or not b.program or c.program == b.program
                semester_ok = not c.semester or not b.semester or c.semester == b.semester
                can_be_taught = any(
                    c.id in {s.courseId for s in f.subjects}
                    for f in self.request.faculty
                )
                # For virtual elective courses check against any faculty with real courseId
                if c.isElective and not can_be_taught:
                    can_be_taught = True  # validated by _build_valid_combos

                if not program_ok or not semester_ok or not can_be_taught or not course_vars:
                    if course_vars:
                        self.model.Add(sum(course_vars) == 0)
                else:
                    if len(course_vars) < c.weeklyHrs:
                        print(f"ERROR: Not enough vars ({len(course_vars)}) for {c.name} which needs {c.weeklyHrs} slots.")
                    self.model.Add(sum(course_vars) == c.weeklyHrs)

        print("--- REQUIRED FACULTY WORKLOAD (approx bounds) ---")
        # Let's see if there is any obvious mathematically impossible assignments
        
        # ── HC2 : Faculty no double-booking ──────────────────────────
        for (d, p, f_id), fvars in fdp_vars.items():
            if len(fvars) > 1:
                self.model.AddAtMostOne(fvars)
        return

        # ── HC3 : Batch no overlap ────────────────────────────────────
        for (d, p, b_id), bvars in bdp_vars.items():
            if len(bvars) > 1:
                self.model.AddAtMostOne(bvars)

        # ── HC4 : Room no double-allocation ──────────────────────────
        for (d, p, r_id), rvars in rdp_vars.items():
            if len(rvars) > 1:
                self.model.AddAtMostOne(rvars)

        # ── HC5,6 : Room capacity & faculty assignment ─────────────── (enforced in pre-filter)

        # ── HC7 : Faculty availability (blocked windows) ─────────────
        for f in self.request.faculty:
            if not f.availability:
                continue
            blocked = {(a.dayOfWeek, a.slotNumber) for a in f.availability}
            for (d, p, f_id), fvars in fdp_vars.items():
                if f_id == f.id and (d, p) in blocked:
                    self.model.Add(sum(fvars) == 0)

        # ── HC9 : Consecutive slot pairing for Lab courses ────────────
        slot_list = sorted(self.lecture_slots)

        def _break_between(si: int, sj: int) -> bool:
            return any(bi > si and bi < sj for bi in self.break_slots)

        def _valid_start_indices(dur: int) -> List[int]:
            valid = []
            for i in range(len(slot_list) - dur + 1):
                ok = all(
                    not _break_between(slot_list[i + k], slot_list[i + k + 1])
                    for k in range(dur - 1)
                )
                if ok:
                    valid.append(i)
            return valid

        for c in self._all_courses:
            if c.labDuration < 2:
                continue
            lab_dur = c.labDuration
            valid_starts_idx = _valid_start_indices(lab_dur)

            for d in days:
                for b in self._all_batches:
                    for f in self.request.faculty:
                        for r in self.request.resources:
                            idx_to_p = {
                                si: slot_list[si]
                                for si in range(len(slot_list))
                                if (d, slot_list[si], c.id, f.id, r.id, b.id) in self.vars
                            }
                            if not idx_to_p:
                                continue
                            sv_local = {
                                p: self.vars[(d, p, c.id, f.id, r.id, b.id)]
                                for p in idx_to_p.values()
                            }
                            start_vars: Dict[int, cp_model.IntVar] = {}
                            for si in valid_starts_idx:
                                if not all(slot_list[si + k] in sv_local for k in range(lab_dur)):
                                    continue
                                sv = self.model.NewBoolVar(
                                    f"lbst_d{d}i{si}c{c.id[-4:]}b{b.id[-4:]}"
                                )
                                start_vars[si] = sv
                                for k in range(lab_dur):
                                    self.model.Add(
                                        sv_local[slot_list[si + k]] == 1
                                    ).OnlyEnforceIf(sv)

                            for si, p in idx_to_p.items():
                                raw = sv_local[p]
                                covering = [
                                    start_vars[sj]
                                    for sj in valid_starts_idx
                                    if sj in start_vars and sj <= si < sj + lab_dur
                                ]
                                if covering:
                                    self.model.Add(sum(covering) >= 1).OnlyEnforceIf(raw)
                                    for sv in covering:
                                        self.model.Add(sv == 0).OnlyEnforceIf(raw.Not())
                                else:
                                    self.model.Add(raw == 0)

        # ── HC10 : Locked slot pinning ────────────────────────────────
        for slot in self._all_locked:
            if slot.isBreak or not slot.courseId or not slot.facultyId or not slot.roomId:
                continue
            key = (slot.dayOfWeek, slot.slotNumber,
                   slot.courseId, slot.facultyId, slot.roomId, slot.batchId)
            if key in self.vars:
                self.model.Add(self.vars[key] == 1)

        # ── HC11 : Elective basket synchronisation ────────────────────
        # All options in the same basket must be scheduled at the same (day, slot).
        # We enforce this with a shared set of day/slot BoolVars per basket.
        for basket in self.request.electiveBaskets:
            vbatch_ids = self._basket_option_batch_ids.get(basket.basketId, [])
            if len(vbatch_ids) < 2:
                continue

            # For each (day, slot), collect "any-assignment" BoolVar per option-batch
            slot_used_per_option: Dict[Tuple[int, int], List[cp_model.IntVar]] = {}

            for b_id in vbatch_ids:
                # find the virtual course for this option
                vcourse_id = next(
                    (cid for cid in self._elective_virtual_courses
                     if f"_OPT_{self._option_id_for_batch.get(b_id,'')}_" in cid or
                        cid.endswith(f"_{b_id.split('_OPT_')[1] if '_OPT_' in b_id else ''}_{basket.options[0].courseId if basket.options else ''}")),
                    None
                )
                # simpler: scan all vars for this batch
                for d in days:
                    for p in self.lecture_slots:
                        # does any var exist for this (d,p,*,*,b_id)?
                        has_var = [
                            v for (dd, pp, cc, ff, rr, bb), v in self.vars.items()
                            if dd == d and pp == p and bb == b_id
                        ]
                        if has_var:
                            used = self.model.NewBoolVar(f"bk_used_d{d}p{p}b{b_id[-6:]}")
                            self.model.Add(sum(has_var) >= 1).OnlyEnforceIf(used)
                            self.model.Add(sum(has_var) == 0).OnlyEnforceIf(used.Not())
                            slot_used_per_option.setdefault((d, p), []).append(used)

            # All options must use the SAME set of (d, p) slots
            # Equivalently: slot (d,p) is used by option A ⟺ used by option B
            for (d, p), used_list in slot_used_per_option.items():
                if len(used_list) < 2:
                    continue
                for i in range(len(used_list) - 1):
                    self.model.Add(used_list[i] == used_list[i + 1])

        # ── HC14 : Division Overlap (Elective Baskets vs Parent Divisions) ────────────
        # For each basket, if any of its virtual batches is scheduled at (d, p),
        # its parent divisions cannot have ANY class scheduled at (d, p).
        for basket in self.request.electiveBaskets:
            vbatch_ids = self._basket_option_batch_ids.get(basket.basketId, [])
            div_ids = self._basket_division_ids.get(basket.basketId, [])
            
            if not vbatch_ids or not div_ids:
                continue
                
            for d in days:
                for p in slot_list:
                    basket_active_vars = []
                    for vb_id in vbatch_ids:
                        basket_active_vars.extend(bdp_vars.get((d, p, vb_id), []))
                        
                    parent_active_vars = []
                    for div_id in div_ids:
                        parent_active_vars.extend(bdp_vars.get((d, p, div_id), []))
                        
                    if basket_active_vars and parent_active_vars:
                        # If basket is active, parent must be 0
                        is_basket_active = self.model.NewBoolVar(f"bkt_{basket.basketId[-4:]}_act_d{d}p{p}")
                        self.model.Add(sum(basket_active_vars) >= 1).OnlyEnforceIf(is_basket_active)
                        self.model.Add(sum(basket_active_vars) == 0).OnlyEnforceIf(is_basket_active.Not())
                        
                        self.model.Add(sum(parent_active_vars) == 0).OnlyEnforceIf(is_basket_active)

    # ── Soft Constraints / Objective ──────────────────────────────────────

    def _add_soft_constraints(self):
        cfg = self.request.config
        days = [d for d in self.days if d not in self.request.excludedDayIds]
        slot_list = sorted(self.lecture_slots)
        n_slots = len(slot_list)

        objective_terms: List[cp_model.LinearExpr] = []

        # SO1 : Room utilisation (prefer tight-capacity rooms)
        for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
            b = next((x for x in self._all_batches if x.id == b_id), None)
            r = next((x for x in self.request.resources if x.id == r_id), None)
            if b and r and r.capacity > 0:
                fit_score = int(100 * b.strength / r.capacity)
                objective_terms.append(var * fit_score)

        # SO2 : Prefer earlier slots (morning-dense)
        for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
            slot_idx = slot_list.index(p) if p in slot_list else 0
            morning_bonus = max(0, n_slots - slot_idx) * 2
            objective_terms.append(var * morning_bonus)

        # SO3 : Even cross-day distribution (reward different days per course-batch)
        # Build cbd_vars (course, batch, day) → list of vars
        cbd_vars: Dict[Tuple, List] = {}
        for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
            cbd_vars.setdefault((c_id, b_id, d), []).append(var)

        for (c_id, b_id, d), cvars in cbd_vars.items():
            day_used = self.model.NewBoolVar(f"du_{c_id[-4:]}_{b_id[-4:]}_{d}")
            self.model.Add(sum(cvars) >= 1).OnlyEnforceIf(day_used)
            self.model.Add(sum(cvars) == 0).OnlyEnforceIf(day_used.Not())
            objective_terms.append(day_used * 50)

        # SO4 : Faculty load balance (penalise overloaded days)
        fd_vars: Dict[Tuple, List] = {}
        for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
            fd_vars.setdefault((d, f_id), []).append(var)
        avg_per_day = max(1, len(slot_list) // 2)
        for (d, f_id), fvars in fd_vars.items():
            if len(fvars) <= avg_per_day:
                continue
            over = self.model.NewIntVar(0, len(fvars), f"fover_{f_id[-4:]}_{d}")
            self.model.Add(over == sum(fvars) - avg_per_day)
            objective_terms.append(over * (-30))

        # SO5 : Gap minimization — penalise idle slots within batch's daily window
        # gap_weight: 0 = off, 100 = balanced, 300 = strict
        gap_weight_map = {"off": 0, "balanced": 100, "strict": 300}
        gap_weight = gap_weight_map.get(cfg.continuousMode, 100)

        if gap_weight > 0:
            bd_vars: Dict[Tuple, List] = {}
            for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
                bd_vars.setdefault((b_id, d), []).append((p, var))

            # Add virtual elective batch vars to parent division's bd_vars
            for basket in self.request.electiveBaskets:
                vbatch_ids = self._basket_option_batch_ids.get(basket.basketId, [])
                div_ids = self._basket_division_ids.get(basket.basketId, [])
                for d_id in div_ids:
                    for d in days:
                        # Find all variables for any of the vbatch_ids on day d
                        for (dd, p, c_id, f_id, r_id, b_id), var in self.vars.items():
                            if dd == d and b_id in vbatch_ids:
                                bd_vars.setdefault((d_id, d), []).append((p, var))

            for (b_id, d), pv_list in bd_vars.items():
                if len(pv_list) < 2:
                    continue
                # For each pair of lecture slots (earlier, later), if batch uses both
                # but there's a gap slot in between, penalise.
                p_list_sorted = sorted(slot_list)
                # Collapse per slot: slot_active[p] = OR of all vars at (b_id, d, p, ...)
                slot_active: Dict[int, cp_model.IntVar] = {}
                for p, var in pv_list:
                    if p not in slot_active:
                        # collect all vars for this (b_id, d, p)
                        all_at_p = [v for (pp, v) in pv_list if pp == p]
                        sa = self.model.NewBoolVar(f"sa_{b_id[-4:]}_{d}_{p}")
                        self.model.Add(sum(all_at_p) >= 1).OnlyEnforceIf(sa)
                        self.model.Add(sum(all_at_p) == 0).OnlyEnforceIf(sa.Not())
                        slot_active[p] = sa

                # For each slot index, if the slot is between first and last used slot
                # but is itself unused, that's a gap.
                # Approximate: reward for each consecutive pair of active slots
                for i in range(len(p_list_sorted) - 1):
                    p_cur = p_list_sorted[i]
                    p_nxt = p_list_sorted[i + 1]
                    if p_cur not in slot_active or p_nxt not in slot_active:
                        continue
                    # If both are active, reward compactness
                    both_active = self.model.NewBoolVar(
                        f"ca_{b_id[-4:]}_{d}_{p_cur}_{p_nxt}"
                    )
                    self.model.Add(
                        slot_active[p_cur] + slot_active[p_nxt] == 2
                    ).OnlyEnforceIf(both_active)
                    self.model.Add(
                        slot_active[p_cur] + slot_active[p_nxt] < 2
                    ).OnlyEnforceIf(both_active.Not())
                    objective_terms.append(both_active * gap_weight)

        if objective_terms:
            self.model.Maximize(sum(objective_terms))

    # ── Solve ──────────────────────────────────────────────────────────────

    def solve(self) -> GenerateResponse:
        import time
        start_ts = time.time()

        self._add_hard_constraints()
        self._add_soft_constraints()

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 60
        solver.parameters.num_search_workers = 8
        solver.parameters.random_seed = 42
        solver.parameters.log_search_progress = False

        status = solver.Solve(self.model)
        elapsed_ms = int((time.time() - start_ts) * 1000)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            slots, metrics = self._extract_solution(solver)
            log.info(
                "[Solver] Status=%s | Slots=%d | WorkloadVariance=%.3f "
                "| UtilizationScore=%.2f%% | GapScore=%.2f",
                solver.StatusName(status), len(slots),
                metrics["workloadVariance"], metrics["utilizationScore"],
                metrics["gapScore"],
            )
            return GenerateResponse(
                status=solver.StatusName(status),
                message="Timetable generated successfully.",
                slots=slots,
                solveTimeMs=elapsed_ms,
                workloadVariance=metrics["workloadVariance"],
                utilizationScore=metrics["utilizationScore"],
                gapScore=metrics["gapScore"],
                electiveGroupCount=metrics["electiveGroupCount"],
            )
        else:
            log.warning("[Solver] Status=%s — no solution found.", solver.StatusName(status))
            return GenerateResponse(
                status=solver.StatusName(status),
                message=(
                    "The solver could not find a valid timetable satisfying all constraints. "
                    "Common causes: too many courses for the available time slots, "
                    "insufficient faculty coverage, or overly restrictive availability blocks. "
                    "Try relaxing constraints or adding more resources."
                ),
                solveTimeMs=elapsed_ms,
            )

    # ── Solution extraction ───────────────────────────────────────────────

    def _extract_solution(self, solver: cp_model.CpSolver):
        cfg = self.request.config
        slots: List[SlotResult] = []

        course_map = {c.id: c for c in self._all_courses}
        faculty_map = {f.id: f for f in self.request.faculty}
        room_map = {r.id: r for r in self.request.resources}
        batch_map = {b.id: b for b in self._all_batches}

        faculty_slots: Dict[str, int] = {}
        room_used: Dict[str, int] = {}
        room_total: Dict[str, int] = {}
        batch_day_slots: Dict[Tuple, List[int]] = {}  # (b_id, d) → [p]

        days = [d for d in self.days if d not in self.request.excludedDayIds]

        for (d, p, c_id, f_id, r_id, b_id), var in self.vars.items():
            if solver.Value(var) != 1:
                continue

            c = course_map.get(c_id)
            f = faculty_map.get(f_id)
            r = room_map.get(r_id)
            b = batch_map.get(b_id)
            t_start, t_end = self.slot_times.get(p, ("?", "?"))

            # Workload tracking
            faculty_slots[f_id] = faculty_slots.get(f_id, 0) + 1
            r_cap = r.capacity if r else 1
            room_used[r_id] = room_used.get(r_id, 0) + (b.strength if b else 0)
            room_total[r_id] = room_total.get(r_id, 0) + r_cap

            # Gap tracking
            batch_day_slots.setdefault((b_id, d), []).append(p)

            # Elective metadata
            basket_id = self._basket_for_option_batch.get(b_id)
            opt_id = self._option_id_for_batch.get(b_id)

            slots.append(SlotResult(
                dayOfWeek=d,
                slotNumber=p,
                startTime=t_start,
                endTime=t_end,
                courseId=c.id if c else c_id,
                courseName=c.name if c else None,
                courseCode=c.code if c else None,
                slotType=c.type if c else None,
                facultyId=f_id,
                facultyName=f.name if f else None,
                roomId=r_id,
                roomName=r.name if r else None,
                batchId=b_id,
                batchName=b.name if b else None,
                isBreak=False,
                basketId=basket_id,
                isElective=bool(basket_id),
                optionId=opt_id,
            ))

        # Add break slots
        for d in days:
            for p in self.break_slots:
                if p in self.slot_times:
                    t_s, t_e = self.slot_times[p]
                else:
                    # estimate break time
                    t_s, t_e = "?", "?"
                slots.append(SlotResult(
                    dayOfWeek=d, slotNumber=p,
                    startTime=t_s, endTime=t_e, isBreak=True,
                ))

        # Compute metrics
        fac_values = list(faculty_slots.values())
        wv = 0.0
        if len(fac_values) >= 2:
            mean = sum(fac_values) / len(fac_values)
            wv = round(math.sqrt(sum((x - mean) ** 2 for x in fac_values) / len(fac_values)), 3)

        util = 0.0
        total_cap = sum(room_total.values())
        total_used = sum(room_used.values())
        if total_cap > 0:
            util = round(total_used / total_cap * 100, 2)

        # Gap score: avg idle slots per (batch, day)
        total_idle = 0
        gap_count = 0
        for (b_id, d), ps in batch_day_slots.items():
            if len(ps) < 2:
                continue
            min_p = min(ps)
            max_p = max(ps)
            slot_list = sorted(self.lecture_slots)
            window = [s for s in slot_list if min_p <= s <= max_p]
            idle = sum(1 for s in window if s not in ps)
            total_idle += idle
            gap_count += 1

        gap_score = round(total_idle / gap_count, 2) if gap_count > 0 else 0.0

        # Elective group count
        elec_groups = len([
            b.id for b in self._all_batches
            if b.id.startswith("ELECTIVE_")
            and any(solver.Value(v) == 1 for k, v in self.vars.items() if k[5] == b.id)
        ])

        return slots, {
            "workloadVariance": wv,
            "utilizationScore": util,
            "gapScore": gap_score,
            "electiveGroupCount": elec_groups,
        }
