import { LayoutDashboard, Users, GraduationCap, BookOpen, Network, Monitor, Calendar, Zap, ShieldCheck, Building2 } from 'lucide-react';
import { ReactNode } from 'react';

export interface NavItem {
    title: string;
    href: string;
    icon: ReactNode;
}

export const DEPT_ADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/department', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Faculty', href: '/department/faculty', icon: <Users className="w-5 h-5" /> },
    { title: 'Programs', href: '/department/courses', icon: <GraduationCap className="w-5 h-5" /> },
    { title: 'Subjects', href: '/department/subjects', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Batches', href: '/department/batches', icon: <Network className="w-5 h-5" /> },
    { title: 'Resources', href: '/department/resources', icon: <Monitor className="w-5 h-5" /> },
    { title: 'Timetables', href: '/department/timetables', icon: <Calendar className="w-5 h-5" /> },
];

export const UNI_ADMIN_NAV: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Departments', href: '/dashboard/departments', icon: <Building2 className="w-5 h-5" /> },
    { title: 'Faculty', href: '/dashboard/faculty', icon: <Users className="w-5 h-5" /> },
    { title: 'Resources', href: '/dashboard/resources', icon: <Monitor className="w-5 h-5" /> },
];

export const SUPERADMIN_NAV: NavItem[] = [
    { title: 'Universities', href: '/superadmin/universities', icon: <Building2 className="w-5 h-5" /> },
    { title: 'Global Settings', href: '/superadmin/settings', icon: <ShieldCheck className="w-5 h-5" /> },
];
