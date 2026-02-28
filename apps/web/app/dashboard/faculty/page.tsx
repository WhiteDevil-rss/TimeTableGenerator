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
    maxHrsPerDay: number;
    maxHrsPerWeek: number;
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
        maxHrsPerDay: 4, maxHrsPerWeek: 20, password: ''
    });
    const [editFacForm, setEditFacForm] = useState({
        name: '', email: '', designation: '', maxHrsPerDay: 4, maxHrsPerWeek: 20, departmentIds: [] as string[]
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
            setNewFacForm({ departmentIds: [], name: '', email: '', designation: '', maxHrsPerDay: 4, maxHrsPerWeek: 20, password: '' });
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
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Faculty Directory</h2>
                        <p className="text-slate-500">Manage all registered teaching bodies and their workload capacities.</p>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-primary shadow-md hover:bg-primary/90">
                        <LuPlus className="w-4 h-4 mr-2" /> Register Faculty
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {faculties.map(fac => (
                            <Card key={fac.id} className="shadow-sm border-slate-200">
                                <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl group">
                                    <CardTitle className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-lg">{fac.name}</span>
                                            <CardDescription className="line-clamp-1 mt-1 font-medium text-emerald-600">{fac.designation || 'Lecturer'}</CardDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {fac.departments?.map((fd) => (
                                                <span key={fd.departmentId} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full flex items-center uppercase tracking-tight">
                                                    <LuBuilding2 className="w-2.5 h-2.5 mr-1" />
                                                    {departments.find(d => d.id === fd.departmentId)?.shortName || '???'}
                                                </span>
                                            ))}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Contact</span>
                                        <span className="font-medium text-slate-700">{fac.email}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 border-t pt-4">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-slate-800">{fac.maxHrsPerDay}h</div>
                                            <div className="text-xs text-slate-500 font-medium">Daily Limit</div>
                                        </div>
                                        <div className="text-center border-l">
                                            <div className="text-xl font-bold text-slate-800">{fac.maxHrsPerWeek}h</div>
                                            <div className="text-xs text-slate-500 font-medium">Weekly Limit</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <Button
                                            variant="outline"
                                            className="w-1/2 text-slate-600"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFacId(fac.id);
                                                setEditFacForm({
                                                    name: fac.name, email: fac.email, designation: fac.designation || '',
                                                    maxHrsPerDay: fac.maxHrsPerDay, maxHrsPerWeek: fac.maxHrsPerWeek,
                                                    departmentIds: fac.departments?.map((d) => d.departmentId) || [],
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
                                            onClick={() => handleDeleteFaculty(fac.id)}
                                        >
                                            <LuTrash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {faculties.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
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
                            <h4 className="text-sm font-semibold text-slate-800">Workload Capacity Logic</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Hrs / Day</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={newFacForm.maxHrsPerDay}
                                        onChange={(e) => setNewFacForm({ ...newFacForm, maxHrsPerDay: parseInt(e.target.value) || 4 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Hrs / Week</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={newFacForm.maxHrsPerWeek}
                                        onChange={(e) => setNewFacForm({ ...newFacForm, maxHrsPerWeek: parseInt(e.target.value) || 20 })}
                                    />
                                </div>
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

                            <hr className="my-2" />
                            <h4 className="text-sm font-semibold text-slate-800">Capacity Constraints</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Hrs / Day</label>
                                    <Input type="number" min="1" max="12" value={editFacForm.maxHrsPerDay}
                                        onChange={(e) => setEditFacForm({ ...editFacForm, maxHrsPerDay: parseInt(e.target.value) || 4 })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Hrs / Week</label>
                                    <Input type="number" min="1" max="50" value={editFacForm.maxHrsPerWeek}
                                        onChange={(e) => setEditFacForm({ ...editFacForm, maxHrsPerWeek: parseInt(e.target.value) || 20 })} />
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
