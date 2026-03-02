"""
FastAPI entrypoint for the AI Timetable Engine — v3.1.0
"""

import math
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import GenerateRequest, GenerateResponse
from app.solver import TimetableScheduler

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="AI Timetable Engine", version="3.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-engine",
        "solver": "Google OR-Tools CP-SAT",
        "solverTimeoutSec": 60,
        "hardConstraints": 11,   # HC1-HC11 (incl. basket sync)
        "softConstraints": 5,   # SO1-SO5 (incl. gap minimization)
        "version": "3.1.0",
        "features": [
            "elective-basket-scheduling",
            "gap-minimization",
            "lab-consecutive-pairing",
            "faculty-availability",
            "partial-regeneration",
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight validation helpers
# ─────────────────────────────────────────────────────────────────────────────

def _preflight_errors(req: GenerateRequest) -> list[str]:
    """Return a list of human-readable pre-flight errors (empty = OK)."""
    errors: list[str] = []
    cfg = req.config

    # 1. Presence checks
    if not req.resources:
        errors.append("No rooms/resources provided.")
    if not req.batches:
        errors.append("No batches provided.")
    if not req.faculty:
        errors.append("No faculty provided.")
    if not req.courses and not req.electiveBaskets:
        errors.append("No courses or elective baskets provided.")
    if errors:
        return errors

    # 2. Convert weeklyHrs to slot counts
    for c in req.courses:
        c.weeklyHrs = math.ceil((c.weeklyHrs * 60) / cfg.lectureDuration)
        if hasattr(c, 'labDuration') and c.labDuration > 0:
            c.labDuration = math.ceil((c.labDuration * 60) / cfg.lectureDuration)
    for basket in req.electiveBaskets:
        basket.weeklyHrs = math.ceil((basket.weeklyHrs * 60) / cfg.lectureDuration)

    # 3. Temporal capacity
    from datetime import datetime, timedelta
    start = datetime.strptime(cfg.startTime, "%H:%M")
    end = datetime.strptime(cfg.endTime, "%H:%M")
    total_min = (end - start).total_seconds() / 60
    lecture_min = total_min - cfg.numberOfBreaks * cfg.breakDuration
    if lecture_min <= 0:
        errors.append("Break duration exceeds available day time — no lecture slots remain.")
        return errors
    lpd = int(lecture_min // cfg.lectureDuration)
    if lpd < 1:
        errors.append(
            f"Lecture duration ({cfg.lectureDuration}min) is too long for the day window "
            f"({cfg.startTime}–{cfg.endTime})."
        )
        return errors
    total_slots_week = lpd * cfg.daysPerWeek

    for b in req.batches:
        batch_courses = [
            c for c in req.courses
            if (not c.program or not b.program or c.program == b.program)
            and (not c.semester or not b.semester or c.semester == b.semester)
            and not c.isElective
        ]
        batch_load = sum(c.weeklyHrs for c in batch_courses)
        
        # Add basket loads for this batch's program/semester
        for bk in req.electiveBaskets:
            if hasattr(bk, 'divisionIds') and bk.divisionIds:
                if b.id in bk.divisionIds:
                    batch_load += bk.weeklyHrs
            else:
                if (not bk.program or not b.program or bk.program == b.program) and \
                   (not bk.semester or not b.semester or bk.semester == b.semester):
                    batch_load += bk.weeklyHrs

        if batch_load > total_slots_week:
            errors.append(
                f"Batch '{b.name}' requires {batch_load} slots/week but only "
                f"{total_slots_week} are available ({lpd} slots/day × {cfg.daysPerWeek} days). "
                "Reduce course hours, add days, or extend the day window."
            )

    # 4. Room capacity check per batch
    for b in req.batches:
        if not any(r.capacity >= b.strength for r in req.resources):
            errors.append(
                f"No room can accommodate batch '{b.name}' "
                f"(size {b.strength}, max room capacity {max(r.capacity for r in req.resources)})."
            )

    # 5. Lab room availability
    lab_courses = [c for c in req.courses if c.type.lower() in ("lab", "theory+lab") or c.requiredRoomType == "Lab"]
    if lab_courses:
        lab_rooms = [r for r in req.resources if r.type.lower() == "lab"]
        if not lab_rooms:
            errors.append(
                f"There are {len(lab_courses)} lab course(s) but no Lab rooms in resources."
            )

    # 6. Elective basket room check
    for basket in req.electiveBaskets:
        for opt in basket.options:
            if not any(r.capacity >= opt.enrollmentCount for r in req.resources):
                errors.append(
                    f"Elective basket '{basket.name}' option (courseId={opt.courseId}) has "
                    f"enrollment={opt.enrollmentCount} but no room has sufficient capacity."
                )

    # 7. Faculty workload feasibility
    faculty_loads: dict[str, int] = {}
    for f in req.faculty:
        f_load = sum(
            c.weeklyHrs for c in req.courses
            if any(s.courseId == c.id for s in f.subjects)
        )
        faculty_loads[f.id] = f_load

    for fac in req.faculty:
        load = faculty_loads.get(fac.id, 0)
        if load > total_slots_week:
            errors.append(
                f"Faculty '{fac.name}' has {load} required slots/week but only "
                f"{total_slots_week} slots exist."
            )

    # 8. Unassigned course checks (Mandatory courses MUST have at least 1 faculty)
    for c in req.courses:
        if not c.isElective:
            assigned = any(
                any(s.courseId == c.id for s in f.subjects)
                for f in req.faculty
            )
            if not assigned:
                errors.append(
                    f"Course '{c.name}' cannot be scheduled because no faculty is assigned to teach it."
                )

    return errors


# ─────────────────────────────────────────────────────────────────────────────
# Solve endpoint
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/solve", response_model=GenerateResponse)
def solve_timetable(req: GenerateRequest):
    # Merge locked slots
    req.existingSlots = req.existingSlots + req.lockedSlots

    # Pre-flight checks
    errors = _preflight_errors(req)
    if errors:
        return GenerateResponse(
            status="INFEASIBLE",
            message=" | ".join(errors),
        )

    try:
        scheduler = TimetableScheduler(req)
        return scheduler.solve()
    except Exception as exc:
        log.exception("Solver crashed: %s", exc)
        return GenerateResponse(
            status="ERROR",
            message=f"Internal solver error: {str(exc)}",
        )
