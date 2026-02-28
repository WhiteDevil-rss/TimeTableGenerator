from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class ScheduleConfig(BaseModel):
    startTime: str
    endTime: str
    lectureDuration: int
    breakDuration: int
    numberOfBreaks: int
    daysPerWeek: int

class FacultySubject(BaseModel):
    courseId: str
    isPrimary: bool

class Faculty(BaseModel):
    id: str
    name: str
    maxHrsPerDay: int
    subjects: List[FacultySubject]

class Course(BaseModel):
    id: str
    code: str
    weeklyHrs: int
    type: str # Theory, Lab, Theory+Lab
    program: Optional[str] = None
    semester: Optional[int] = None

class Batch(BaseModel):
    id: str
    name: str
    strength: int
    program: Optional[str] = None
    semester: Optional[int] = None

class Resource(BaseModel):
    id: str
    name: str
    type: str
    capacity: int

class TimetableSlot(BaseModel):
    dayOfWeek: int
    slotNumber: int
    startTime: str
    endTime: str
    courseId: Optional[str] = None
    facultyId: Optional[str] = None
    roomId: Optional[str] = None
    batchId: str
    isBreak: bool
    slotType: str

class GenerateRequest(BaseModel):
    departmentId: str
    config: ScheduleConfig
    faculty: List[Faculty]
    courses: List[Course]
    batches: List[Batch]
    resources: List[Resource]
    excludedFacultyIds: List[str] = []
    excludedRoomIds: List[str] = []
    excludedDayIds: List[int] = []
    existingSlots: List[TimetableSlot] = []

    model_config = ConfigDict(extra='ignore')

class GenerateResponse(BaseModel):
    status: str
    message: str
    slots: List[TimetableSlot] = []
    conflictCount: int = 0
    workloadVariance: float = 0.0
