import { LuLayoutDashboard, LuUsers, LuGraduationCap, LuBookOpen, LuNetwork, LuMonitor, LuCalendar, LuShieldCheck, LuBuilding2 } from 'react-icons/lu';
import { ReactNode } from 'react';

export interface NavItem {
    title: string;
    href: string;
    icon: ReactNode;
}

export const DEPT_ADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/department', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Faculty', href: '/department/faculty', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Programs', href: '/department/courses', icon: <LuGraduationCap className="w-5 h-5" /> },
    { title: 'Subjects', href: '/department/subjects', icon: <LuBookOpen className="w-5 h-5" /> },
    { title: 'Batches', href: '/department/batches', icon: <LuNetwork className="w-5 h-5" /> },
    { title: 'Resources', href: '/department/resources', icon: <LuMonitor className="w-5 h-5" /> },
    { title: 'Timetables', href: '/department/timetables', icon: <LuCalendar className="w-5 h-5" /> },
];

export const UNI_ADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5" /> },
    { title: 'Faculty', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Resources', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5" /> },
];

export const SUPERADMIN_NAV: NavItem[] = [
    { title: 'Universities', href: '/superadmin/universities', icon: <LuBuilding2 className="w-5 h-5" /> },
    { title: 'Global Settings', href: '/superadmin/settings', icon: <LuShieldCheck className="w-5 h-5" /> },
];
