export interface University {
    id: string;
    name: string;
    shortName: string;
    location?: string;
    email?: string;
}

export interface FacultySubject {
    courseId: string;
}

export interface Faculty {
    id: string;
    name: string;
    email: string;
    designation?: string;
    departmentId: string;
    universityId: string;
    subjects: FacultySubject[];
}

export interface TimetableSlot {
    id: string;
    dayOfWeek: number;
    slotNumber: number;
    startTime: string;
    endTime: string;
    courseName?: string;
    courseCode?: string;
    facultyName?: string;
    roomName?: string;
    batchName?: string;
    slotType: 'THEORY' | 'LAB' | 'BREAK';
    isBreak: boolean;
}

export interface TimeSlot {
    slotNumber: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
}

export interface ScheduleConfig {
    startTime: string;
    endTime: string;
    lectureDuration: number;
    breakDuration: number;
    breakAfterLecture: number;
    daysPerWeek: number;
    semesterStartDate?: string;
    semesterEndDate?: string;
}

export interface GenerateRequest {
    departmentId: string;
    batchIds: string[];
    config: ScheduleConfig;
    excludedFacultyIds?: string[];
    excludedRoomIds?: string[];
    excludedDayIds?: number[];
}
