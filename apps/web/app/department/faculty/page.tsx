'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlus, LuTrash2, LuPencil, LuSearch, LuBookOpen } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

interface Department {
    id: string;
    name: string;
    shortName: string;
}

interface FacultyDepartment {
    departmentId: string;
}

interface FacultySubject {
    courseId: string;
    course?: {
        id: string;
        name: string;
        code: string;
    }
}

interface Faculty {
    id: string;
    name: string;
    email: string;
    designation?: string;
    departments?: FacultyDepartment[];
    subjects?: FacultySubject[];
}

interface Course {
    id: string;
    name: string;
    code: string;
    credits: number;
}

export default function DeptFacultyDashboard() {
    const { user } = useAuthStore();
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedFacId, setSelectedFacId] = useState<string | null>(null);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [newFacForm, setNewFacForm] = useState({
        name: '', email: '', designation: '', password: ''
    });
    const [editFacForm, setEditFacForm] = useState({
        name: '', email: '', designation: '', departmentIds: [] as string[]
    });
    const [assignSubjectsForm, setAssignSubjectsForm] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        if (!user?.entityId) return;
        try {
            // Build query params — only include universityId if it's set (uni admins)
            const params = new URLSearchParams();
            if (user.universityId) params.set('universityId', user.universityId);
            if (user.entityId) params.set('departmentId', user.entityId);

            const [facRes, deptRes, coursesRes] = await Promise.all([
                api.get(`/faculty?${params.toString()}`),
                user.universityId
                    ? api.get(`/universities/${user.universityId}/departments`)
                    : api.get(`/faculty`).then(() => ({ data: [] })).catch(() => ({ data: [] })),
                api.get(`/courses?${params.toString()}`)
            ]);
            setFaculties(facRes.data);
            setDepartments(deptRes.data);
            setCourses(coursesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.entityId, user?.universityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filtered = faculties.filter(fac =>
        !searchTerm ||
        fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fac.designation && fac.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreateFaculty = async () => {
        try {
            const payload = { ...newFacForm, departmentIds: [user?.entityId], universityId: user?.universityId };
            await api.post(`/faculty`, payload);
            setIsAddOpen(false);
            setNewFacForm({ name: '', email: '', designation: '', password: '' });
            fetchData();
            showToast('success', 'Faculty provisioned successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to provision faculty.';
            showToast('error', errorMsg);
        }
    };

    const handleEditFaculty = async () => {
        if (!selectedFacId) return;
        try {
            await api.put(`/faculty/${selectedFacId}`, editFacForm);
            setIsEditOpen(false);
            fetchData();
            showToast('success', 'Faculty updated successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update faculty.';
            showToast('error', errorMsg);
        }
    };

    const handleAssignSubjects = async () => {
        if (!selectedFacId) return;
        try {
            await api.put(`/faculty/${selectedFacId}`, { subjectIds: assignSubjectsForm });
            setIsAssignOpen(false);
            fetchData();
            showToast('success', 'Subjects assigned successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to assign subjects.';
            showToast('error', errorMsg);
        }
    }

    const handleDeleteFaculty = (id: string) => {
        askConfirm({
            title: 'Delete Faculty',
            message: 'Are you sure you want to completely de-provision this faculty account? This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/faculty/${id}`);
                    fetchData();
                } catch {
                    showToast('error', 'Failed to delete faculty.');
                }
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Department Faculty">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Faculty Directory</h2>
                        <p className="text-slate-500 dark:text-slate-400">Manage all registered teaching bodies and workload capacities for your department.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 glass border rounded-lg px-3 py-2 shadow-sm w-full sm:w-64">
                            <LuSearch className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                            <Input
                                placeholder="Search faculty..."
                                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsAddOpen(true)} className="bg-primary shadow-md hover:bg-primary/90 text-white shrink-0">
                            <LuPlus className="w-4 h-4 mr-2" /> Register Faculty
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(fac => (
                            <Card key={fac.id} className="glass-card shadow-sm border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow overflow-hidden group">
                                <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 dark:from-indigo-500/10 to-indigo-50/30 dark:to-transparent border-slate-100 dark:border-white/5">
                                    <CardTitle className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">{fac.name}</span>
                                            <CardDescription className="line-clamp-1 mt-1 font-medium text-emerald-600 dark:text-emerald-400">{fac.designation || 'Lecturer'}</CardDescription>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {fac.departments?.map((fd) => (
                                                    <span key={fd.departmentId} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-full flex items-center uppercase tracking-tight border dark:border-slate-700">
                                                        {departments.find(d => d.id === fd.departmentId)?.shortName || '???'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        <span className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Contact</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{fac.email}</span>
                                    </div>
                                    <div className="flex gap-2 mt-5">
                                        <Button
                                            variant="outline"
                                            className="w-1/3 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-slate-200 dark:border-white/10 dark:bg-transparent"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFacId(fac.id);
                                                setEditFacForm({
                                                    name: fac.name, email: fac.email, designation: fac.designation || '',
                                                    departmentIds: fac.departments?.map((d) => d.departmentId) || [],
                                                });
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <LuPencil className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-1/3 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-slate-200 dark:border-white/10 dark:bg-transparent"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFacId(fac.id);
                                                setAssignSubjectsForm(fac.subjects?.map(s => s.courseId) || []);
                                                setIsAssignOpen(true);
                                            }}
                                        >
                                            <LuBookOpen className="w-4 h-4 mr-2" /> Subjects
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-1/3 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 dark:bg-transparent"
                                            size="sm"
                                            onClick={() => handleDeleteFaculty(fac.id)}
                                        >
                                            <LuTrash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filtered.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 glass-card rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                                {searchTerm ? `No results found for "${searchTerm}"` : 'No faculty members found. Provision teaching personnel to construct schedules.'}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Faculty Modal */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-card dark:border-white/10">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Register Department Faculty</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Department</label>
                                <div className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 flex items-center">
                                    {departments.find(d => d.id === user?.entityId)?.name || 'Your Department'}
                                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">(auto-assigned)</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Full Name</label>
                                <Input
                                    placeholder="e.g. Dr. Apurva Desai"
                                    value={newFacForm.name}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, name: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="faculty@dcs.vnsgu.ac.in"
                                    value={newFacForm.email}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, email: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Designation</label>
                                <Input
                                    placeholder="e.g. Associate Professor"
                                    value={newFacForm.designation}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, designation: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white"
                                />
                            </div>

                            <hr className="my-2 dark:border-white/5" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Temporary Portal Password</label>
                                <Input type="password" placeholder="••••••••" value={newFacForm.password}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, password: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white" />
                            </div>
                        </div>
                        <DialogFooter className="border-t dark:border-white/5 pt-4">
                            <Button variant="outline" className="dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleCreateFaculty}
                                disabled={!newFacForm.name || !newFacForm.email || !newFacForm.password}>
                                Provision Faculty
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Faculty Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-card dark:border-white/10">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Edit Faculty Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Full Name</label>
                                <Input placeholder="e.g. Dr. Smith" value={editFacForm.name}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, name: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Contact Email</label>
                                <Input type="email" value={editFacForm.email}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, email: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Designation</label>
                                <Input placeholder="e.g. Professor" value={editFacForm.designation}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, designation: e.target.value })}
                                    className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Department Assignment(s)</label>
                                <div className="grid grid-cols-2 gap-2 p-3 border dark:border-white/10 rounded-md bg-slate-50/50 dark:bg-slate-900/50">
                                    {departments.map(dept => (
                                        <label key={dept.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition-colors text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-primary focus:ring-primary dark:bg-slate-800"
                                                checked={editFacForm.departmentIds.includes(dept.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...editFacForm.departmentIds, dept.id]
                                                        : editFacForm.departmentIds.filter(id => id !== dept.id);
                                                    setEditFacForm({ ...editFacForm, departmentIds: ids });
                                                }}
                                            />
                                            <span className="truncate">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-t dark:border-white/5 pt-4">
                            <Button variant="outline" className="dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleEditFaculty} disabled={!editFacForm.name || !editFacForm.email}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Subjects Modal */}
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass-card dark:border-white/10">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Assign Subjects</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">
                                Select the courses this faculty member is qualified to teach.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-slate-300">Available Courses</label>
                                <div className="grid grid-cols-1 gap-2 p-3 border dark:border-white/10 rounded-md bg-slate-50/50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
                                    {courses.map(course => (
                                        <label key={course.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-primary focus:ring-primary dark:bg-slate-800 shrink-0"
                                                checked={assignSubjectsForm.includes(course.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...assignSubjectsForm, course.id]
                                                        : assignSubjectsForm.filter(id => id !== course.id);
                                                    setAssignSubjectsForm(ids);
                                                }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold truncate">{course.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{course.code} • {course.credits} Credits</span>
                                            </div>
                                        </label>
                                    ))}
                                    {courses.length === 0 && (
                                        <span className="text-slate-500 dark:text-slate-400 text-sm italic">No courses available.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-t dark:border-white/5 pt-4">
                            <Button variant="outline" className="dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleAssignSubjects}>
                                Save Assignments
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DashboardLayout>
        </ProtectedRoute>
    );
}
