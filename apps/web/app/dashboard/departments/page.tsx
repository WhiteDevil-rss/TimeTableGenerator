'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuBuilding2, LuPlus, LuUsers, LuLayoutDashboard, LuTrash2, LuPencil, LuMonitor } from 'react-icons/lu';
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
    hod?: string;
    email: string;
    _count?: {
        faculty: number;
        courses: number;
        batches: number;
    };
}

export default function DepartmentsDashboard() {
    const { user } = useAuthStore();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

    const [newDeptForm, setNewDeptForm] = useState({
        name: '', shortName: '', hod: '', email: '', adminUsername: '', adminPassword: ''
    });
    const [editDeptForm, setEditDeptForm] = useState({
        name: '', shortName: '', hod: '', email: ''
    });

    const fetchDepartments = useCallback(async () => {
        if (!user?.universityId) return;
        try {
            const { data } = await api.get(`/universities/${user.universityId}/departments`);
            setDepartments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.universityId]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleCreateDepartment = async () => {
        try {
            await api.post(`/universities/${user?.universityId}/departments`, newDeptForm);
            setIsAddOpen(false);
            setNewDeptForm({ name: '', shortName: '', hod: '', email: '', adminUsername: '', adminPassword: '' });
            fetchDepartments();
            showToast('success', 'Department and Admin account provisioned successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create department. Verify the Admin username is unique globally.';
            showToast('error', errorMsg);
        }
    };

    const handleEditDepartment = async () => {
        if (!selectedDeptId) return;
        try {
            await api.put(`/universities/${user?.universityId}/departments/${selectedDeptId}`, editDeptForm);
            setIsEditOpen(false);
            fetchDepartments();
            showToast('success', 'Department updated successfully!');
        } catch {
            showToast('error', 'Failed to update department.');
        }
    };

    const handleDeleteDepartment = (id: string) => {
        askConfirm({
            title: 'Delete Department',
            message: 'Permanently delete this department? All child associations (faculty, batches, timetables) will be affected. This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/universities/${user?.universityId}/departments/${id}`);
                    fetchDepartments();
                } catch {
                    showToast('error', 'Failed to delete department. Dependencies may still exist.');
                }
            },
        });
    };

    const navItems = [
        { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5 text-indigo-500" /> },
        { title: 'Faculty', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Resources', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['UNI_ADMIN']}>
            <DashboardLayout navItems={navItems} title="University Departments">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex justify-between items-center mb-6 relative z-20">
                    <div>
                        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white glow-cyan">Departments Directory</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-light mt-1">Manage all registered departments, faculties, and core configurations.</p>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-neon-cyan text-white dark:text-slate-900 shadow-md dark:shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-lg hover:bg-cyan-600 dark:hover:bg-white font-bold transition-all px-6">
                        <LuPlus className="w-5 h-5 mr-2" /> Add Department
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
                        {departments.map(dept => (
                            <div key={dept.id} className="glass-card rounded-[1.5rem] overflow-hidden group hover:border-cyan-500/30 dark:hover:border-neon-cyan/40 transition-all duration-500 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(57,193,239,0.15)] relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[40px] rounded-full group-hover:bg-neon-cyan/25 dark:bg-neon-cyan/5 dark:group-hover:bg-neon-cyan/15 transition-colors duration-500" />

                                <div className="p-6 border-b border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-transparent">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-heading font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">{dept.shortName}</span>
                                            <span className="line-clamp-1 mt-1 text-slate-600 dark:text-slate-400 font-medium text-sm">{dept.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 pt-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm mb-2 group/stat">
                                        <span className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider group-hover/stat:text-cyan-600 dark:group-hover/stat:text-neon-cyan transition-colors">HOD</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{dept.hod || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-4 group/stat items-center">
                                        <span className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider group-hover/stat:text-cyan-600 dark:group-hover/stat:text-neon-cyan transition-colors">Contact</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{dept.email}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-t border-slate-200 dark:border-white/10 pt-4">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">{dept._count?.faculty || 0}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">Faculty</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">{dept._count?.courses || 0}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">Subjects</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">{dept._count?.batches || 0}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">Batches</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <Button
                                            variant="ghost"
                                            className="w-1/2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-cyan-700 dark:hover:text-neon-cyan hover:bg-cyan-50 dark:hover:bg-neon-cyan/10"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedDeptId(dept.id);
                                                setEditDeptForm({
                                                    name: dept.name, shortName: dept.shortName, hod: dept.hod || '', email: dept.email || ''
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
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                        >
                                            <LuTrash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {departments.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-600 dark:text-slate-400 glass-card rounded-[2rem] border-dashed border-slate-300 dark:border-white/20">
                                No departments initialized. Provision a department to construct schedules.
                            </div>
                        )}
                    </div>
                )}

                {/* Add Department Modal */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Register New Department</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department Name</label>
                                <Input
                                    placeholder="e.g. Department of Computer Science"
                                    value={newDeptForm.name}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Name</label>
                                <Input
                                    placeholder="e.g. DCS"
                                    value={newDeptForm.shortName}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, shortName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Head of Department (HOD)</label>
                                <Input
                                    placeholder="e.g. Dr. Apurva Desai"
                                    value={newDeptForm.hod}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, hod: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="contact@dcs.vnsgu.ac.in"
                                    value={newDeptForm.email}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, email: e.target.value })}
                                />
                            </div>

                            <hr className="my-4" />
                            <h4 className="text-sm font-semibold text-slate-800">Department Admin Account</h4>
                            <p className="text-xs text-slate-500 mb-2">This account orchestrates schedules localized to this department entirely.</p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Username</label>
                                <Input
                                    placeholder="admin_dcs_vnsgu"
                                    value={newDeptForm.adminUsername}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, adminUsername: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Temporary Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newDeptForm.adminPassword}
                                    onChange={(e) => setNewDeptForm({ ...newDeptForm, adminPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreateDepartment}
                                disabled={!newDeptForm.name || !newDeptForm.shortName || !newDeptForm.adminUsername || !newDeptForm.adminPassword}
                            >
                                Provision Department
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Department Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Department Profiles</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department Name</label>
                                <Input
                                    placeholder="e.g. Department of Computer Science"
                                    value={editDeptForm.name}
                                    onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Name</label>
                                <Input
                                    placeholder="e.g. DCS"
                                    value={editDeptForm.shortName}
                                    onChange={(e) => setEditDeptForm({ ...editDeptForm, shortName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Head of Department (HOD)</label>
                                <Input
                                    placeholder="e.g. Dr. Smith"
                                    value={editDeptForm.hod}
                                    onChange={(e) => setEditDeptForm({ ...editDeptForm, hod: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="contact@example.com"
                                    value={editDeptForm.email}
                                    onChange={(e) => setEditDeptForm({ ...editDeptForm, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleEditDepartment}
                                disabled={!editDeptForm.name || !editDeptForm.shortName}
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
