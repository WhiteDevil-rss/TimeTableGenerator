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
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Departments Directory</h2>
                        <p className="text-slate-500">Manage all registered departments, faculties, and core configurations.</p>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-primary shadow-md hover:bg-primary/90">
                        <LuPlus className="w-4 h-4 mr-2" /> Add Department
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map(dept => (
                            <Card key={dept.id} className="shadow-sm border-slate-200">
                                <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl group">
                                    <CardTitle className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-lg">{dept.shortName}</span>
                                            <CardDescription className="line-clamp-1 mt-1">{dept.name}</CardDescription>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">HOD</span>
                                        <span className="font-medium text-slate-700">{dept.hod || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600 mb-4">
                                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Contact</span>
                                        <span className="font-medium text-slate-700">{dept.email}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-t pt-4">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-800">{dept._count?.faculty || 0}</div>
                                            <div className="text-xs text-slate-500 font-medium">Faculty</div>
                                        </div>
                                        <div className="text-center border-l border-r">
                                            <div className="text-xl font-bold text-slate-800">{dept._count?.courses || 0}</div>
                                            <div className="text-xs text-slate-500 font-medium">Subjects</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-800">{dept._count?.batches || 0}</div>
                                            <div className="text-xs text-slate-500 font-medium">Batches</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <Button
                                            variant="outline"
                                            className="w-1/2 text-slate-600"
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
                                            variant="outline"
                                            className="w-1/2 text-red-600 border-red-200 hover:bg-red-50"
                                            size="sm"
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                        >
                                            <LuTrash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {departments.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
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
