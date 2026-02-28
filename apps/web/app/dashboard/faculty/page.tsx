'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuUsers, LuPlus, LuLayoutDashboard, LuBuilding2, LuTrash2, LuPencil, LuMonitor } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

interface Department {
    id: string;
    name: string;
    shortName: string;
}

interface FacultyDepartment {
    departmentId: string;
}

interface Faculty {
    id: string;
    name: string;
    email: string;
    designation?: string;

    departments?: FacultyDepartment[];
}

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedFacId, setSelectedFacId] = useState<string | null>(null);

    const [newFacForm, setNewFacForm] = useState({
        departmentIds: [] as string[], name: '', email: '', designation: '',
        password: ''
    });
    const [editFacForm, setEditFacForm] = useState({
        name: '', email: '', designation: '', departmentIds: [] as string[]
    });

    const fetchData = useCallback(async () => {
        if (!user?.universityId) return;
        try {
            const [facRes, deptRes] = await Promise.all([
                api.get(`/faculty?universityId=${user.universityId}`),
                api.get(`/universities/${user.universityId}/departments`)
            ]);
            setFaculties(facRes.data);
            setDepartments(deptRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.universityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateFaculty = async () => {
        try {
            const payload = { ...newFacForm, universityId: user?.universityId };
            await api.post(`/faculty`, payload);
            setIsAddOpen(false);
            setNewFacForm({ departmentIds: [], name: '', email: '', designation: '', password: '' });
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

    const navItems = [
        { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5" /> },
        { title: 'Faculty', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5 text-indigo-500" /> },
        { title: 'Resources', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5" /> },
    ];

    // const getDepartmentNames = (facDepartments: FacultyDepartment[]) => {
    //     if (!facDepartments || facDepartments.length === 0) return 'No Dept';
    //     return facDepartments.map(fd => {
    //         const d = departments.find(dept => dept.id === fd.departmentId);
    //         return d ? d.shortName : 'Unknown';
    //     }).join(', ');
    // };

    return (
        <ProtectedRoute allowedRoles={['UNI_ADMIN']}>
            <DashboardLayout navItems={navItems} title="University Faculty">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-20">
                    <div>
                        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white glow-cyan">Faculty Directory</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-light mt-1">Manage all registered teaching bodies and their workload capacities.</p>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-neon-cyan text-white dark:text-slate-900 shadow-md dark:shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-lg hover:bg-cyan-600 dark:hover:bg-white font-bold transition-all px-6 shrink-0">
                        <LuPlus className="w-5 h-5 mr-2" /> Register Faculty
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
                        {faculties.map(fac => (
                            <div key={fac.id} className="glass-card rounded-[1.5rem] overflow-hidden group hover:border-cyan-500/30 dark:hover:border-neon-cyan/40 transition-all duration-500 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(57,193,239,0.15)] relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[40px] rounded-full group-hover:bg-neon-cyan/25 dark:bg-neon-cyan/5 dark:group-hover:bg-neon-cyan/15 transition-colors duration-500" />

                                <div className="p-6 border-b border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-transparent">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-heading font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">{fac.name}</span>
                                            <span className="line-clamp-1 mt-1 font-medium text-emerald-600 dark:text-emerald-400 text-sm">{fac.designation || 'Lecturer'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {fac.departments?.map((fd) => (
                                            <span key={fd.departmentId} className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-full flex items-center uppercase tracking-tight border border-slate-300 dark:border-white/10">
                                                <LuBuilding2 className="w-2.5 h-2.5 mr-1" />
                                                {departments.find(d => d.id === fd.departmentId)?.shortName || '???'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 pt-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm mb-4 group/stat">
                                        <span className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider group-hover/stat:text-cyan-600 dark:group-hover/stat:text-neon-cyan transition-colors">Contact</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{fac.email}</span>
                                    </div>


                                    <div className="flex gap-2 mt-5">
                                        <Button
                                            variant="ghost"
                                            className="w-1/2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-cyan-700 dark:hover:text-neon-cyan hover:bg-cyan-50 dark:hover:bg-neon-cyan/10"
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
                                            variant="ghost"
                                            className="w-1/2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            size="sm"
                                            onClick={() => handleDeleteFaculty(fac.id)}
                                        >
                                            <LuTrash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {faculties.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-600 dark:text-slate-400 glass-card rounded-[2rem] border-dashed border-slate-300 dark:border-white/20">
                                No faculty members found. Provision teaching personnel to construct schedules.
                            </div>
                        )}
                    </div>
                )}

                {/* Add Faculty Modal */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Register Teaching Faculty</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    placeholder="e.g. Dr. Apurva Desai"
                                    value={newFacForm.name}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="faculty@dcs.vnsgu.ac.in"
                                    value={newFacForm.email}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Designation</label>
                                <Input
                                    placeholder="e.g. Associate Professor"
                                    value={newFacForm.designation}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, designation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department Assignment(s)</label>
                                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50/50">
                                    {departments.map(dept => (
                                        <label key={dept.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                checked={newFacForm.departmentIds.includes(dept.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...newFacForm.departmentIds, dept.id]
                                                        : newFacForm.departmentIds.filter(id => id !== dept.id);
                                                    setNewFacForm({ ...newFacForm, departmentIds: ids });
                                                }}
                                            />
                                            <span className="truncate">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {newFacForm.departmentIds.length === 0 && (
                                    <p className="text-[10px] text-amber-600 font-medium italic">At least one department assignment is required</p>
                                )}
                            </div>


                            <hr className="my-2" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Temporary Portal Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newFacForm.password}
                                    onChange={(e) => setNewFacForm({ ...newFacForm, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreateFaculty}
                                disabled={!newFacForm.name || !newFacForm.email || newFacForm.departmentIds.length === 0 || !newFacForm.password}
                            >
                                Provision Faculty
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Faculty Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Refactor Profile Identity</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input placeholder="e.g. Dr. Smith" value={editFacForm.name}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input type="email" value={editFacForm.email}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Designation</label>
                                <Input placeholder="e.g. Professor" value={editFacForm.designation}
                                    onChange={(e) => setEditFacForm({ ...editFacForm, designation: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department Assignment(s)</label>
                                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50/50">
                                    {departments.map(dept => (
                                        <label key={dept.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
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
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleEditFaculty}
                                disabled={!editFacForm.name || !editFacForm.email}
                            >
                                Save Revisions
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DashboardLayout>
        </ProtectedRoute>
    );
}
