import { LuLayoutDashboard, LuUsers, LuGraduationCap, LuBookOpen, LuNetwork, LuMonitor, LuCalendar, LuShieldCheck, LuBuilding2, LuUser, LuClipboardList, LuMailOpen } from 'react-icons/lu';
import { ReactNode } from 'react';

export interface NavItem {
    title: string;
    href: string;
    icon: ReactNode;
}

export const DEPT_ADMIN_NAV: NavItem[] = [
    { title: 'Overview', href: '/department', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Faculty', href: '/department/faculty', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Programs', href: '/department/courses', icon: <LuGraduationCap className="w-5 h-5" /> },
    { title: 'Subjects', href: '/department/subjects', icon: <LuBookOpen className="w-5 h-5" /> },
    { title: 'Elective Baskets', href: '/department/electives', icon: <LuClipboardList className="w-5 h-5" /> },
    { title: 'Batches', href: '/department/batches', icon: <LuNetwork className="w-5 h-5" /> },
    { title: 'Resources', href: '/department/resources', icon: <LuMonitor className="w-5 h-5" /> },
    { title: 'Timetables', href: '/department/timetables', icon: <LuCalendar className="w-5 h-5" /> },
    { title: 'Profile', href: '/profile', icon: <LuUser className="w-5 h-5" /> },
];

export const UNI_ADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5" /> },
    { title: 'Faculty Pool', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Infrastructure', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5" /> },
    { title: 'My Profile', href: '/profile', icon: <LuUser className="w-5 h-5" /> },
];

export const SUPERADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/superadmin', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Universities', href: '/superadmin/universities', icon: <LuBuilding2 className="w-5 h-5" /> },
    { title: 'Users', href: '/superadmin/users', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Subscribers', href: '/superadmin/subscribers', icon: <LuMailOpen className="w-5 h-5" /> },
    { title: 'Inquiries', href: '/superadmin/inquiries', icon: <LuMailOpen className="w-5 h-5" /> },
    { title: 'Global Settings', href: '/superadmin/settings', icon: <LuShieldCheck className="w-5 h-5" /> },
    { title: 'Audit Logs', href: '/superadmin/logs', icon: <LuClipboardList className="w-5 h-5" /> },
    { title: 'Profile', href: '/profile', icon: <LuUser className="w-5 h-5" /> },
];

export const FACULTY_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/faculty-panel', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'My Schedule', href: '/faculty-panel/schedule', icon: <LuCalendar className="w-5 h-5" /> },
    { title: 'Profile Settings', href: '/profile', icon: <LuUser className="w-5 h-5" /> },
];
