"""
Pydantic models for the AI Timetable Engine v3.1.0
Backward-compatible: all new fields are Optional with safe defaults.
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# Sub-models
# ─────────────────────────────────────────────────────────────────────────────

class FacultyAvailability(BaseModel):
    """A blocked (unavailable) time window for a faculty member."""
    dayOfWeek: int    # 1=Mon … 7=Sun
    slotNumber: int   # 1-indexed lecture slot within that day


class FacultySubject(BaseModel):
    courseId: str


class Faculty(BaseModel):
    id: str
    name: str
    subjects: List[FacultySubject] = []
    availability: List[FacultyAvailability] = []   # blocked slots


class Course(BaseModel):
    id: str
    code: str
    name: str
    type: str = "Theory"                           # Theory | Lab | Theory+Lab
    weeklyHrs: int = 1
    program: Optional[str] = None
    semester: Optional[int] = None
    isElective: bool = False
    requiredRoomType: Optional[str] = None         # "Lab" | "Classroom" | None
    labDuration: int = 1                           # consecutive slots for lab (≥2 = lab block)


class Batch(BaseModel):
    id: str
    name: str
    strength: int = 30
    program: Optional[str] = None
    semester: Optional[int] = None


class Resource(BaseModel):
    id: str
    name: str
    capacity: int
    type: str = "Classroom"                        # Classroom | Lab | Seminar | etc.


class ScheduleConfig(BaseModel):
    startTime: str = "09:00"
    endTime: str = "17:00"
    lectureDuration: int = 60                      # minutes per slot
    breakDuration: int = 60                        # minutes per break
    numberOfBreaks: int = 1
    daysPerWeek: int = 5
    continuousMode: str = "balanced"               # "off" | "balanced" | "strict"


# ─────────────────────────────────────────────────────────────────────────────
# Elective Basket Models
# ─────────────────────────────────────────────────────────────────────────────

class ElectiveSubgroup(BaseModel):
    """A capacity-split piece of an elective option (e.g. 90 students split into 60 and 30)."""
    subgroupId: str
    name: str
    enrollmentCount: int


class ElectiveOption(BaseModel):
    """One option within an elective basket (e.g. Blockchain, Python)."""
    optionId: str
    courseId: str
    enrollmentCount: int = 30                      # Total sub-batch head-count
    facultyId: Optional[str] = None                # preferred faculty if specified
    subgroups: List[ElectiveSubgroup] = []         # Splits for room capacities


class ElectiveBasket(BaseModel):
    """A group of parallel elective options sharing the SAME time slot."""
    basketId: str
    subjectCode: str                               # e.g. "204"
    name: str                                      # display name
    semester: Optional[int] = None
    program: Optional[str] = None
    weeklyHrs: int = 2
    divisionIds: List[str] = []                    # Parent batches (divisions) this basket belongs to
    options: List[ElectiveOption] = []


# ─────────────────────────────────────────────────────────────────────────────
# Slot models (locked / existing)
# ─────────────────────────────────────────────────────────────────────────────

class ExistingSlot(BaseModel):
    dayOfWeek: int
    slotNumber: int
    courseId: Optional[str] = None
    facultyId: Optional[str] = None
    roomId: Optional[str] = None
    batchId: Optional[str] = None
    isBreak: bool = False
    isLocked: bool = False                         # True = pin this slot, do not overwrite


# ─────────────────────────────────────────────────────────────────────────────
# Generate Request / Response
# ─────────────────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    faculty: List[Faculty] = []
    courses: List[Course] = []
    batches: List[Batch] = []
    resources: List[Resource] = []
    config: ScheduleConfig = Field(default_factory=ScheduleConfig)
    daysPerWeek: int = 5                           # alias kept for backward compat
    excludedDayIds: List[int] = []
    existingSlots: List[ExistingSlot] = []
    lockedSlots: List[ExistingSlot] = []           # alias for existingSlots

    # ── NEW v3.1 ──────────────────────────────────────────────────────────
    electiveBaskets: List[ElectiveBasket] = []


class SlotResult(BaseModel):
    dayOfWeek: int
    slotNumber: int
    startTime: str
    endTime: str
    courseId: Optional[str] = None
    courseName: Optional[str] = None
    courseCode: Optional[str] = None
    slotType: Optional[str] = None
    facultyId: Optional[str] = None
    facultyName: Optional[str] = None
    roomId: Optional[str] = None
    roomName: Optional[str] = None
    batchId: Optional[str] = None
    batchName: Optional[str] = None
    isBreak: bool = False
    # Elective metadata
    basketId: Optional[str] = None
    isElective: bool = False
    optionId: Optional[str] = None


class GenerateResponse(BaseModel):
    status: str                                    # "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "ERROR"
    message: str = ""
    slots: List[SlotResult] = []
    solveTimeMs: int = 0
    workloadVariance: float = 0.0
    utilizationScore: float = 0.0
    # ── NEW v3.1 ──────────────────────────────────────────────────────────
    gapScore: float = 0.0                          # avg idle slots per batch per day (lower = better)
    electiveGroupCount: int = 0                    # number of elective baskets scheduled
