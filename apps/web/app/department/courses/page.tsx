'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { GraduationCap, Plus, LayoutDashboard, Users, BookOpen, Network, Calendar, Trash2, Edit, Clock, Layers, Monitor } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

const PROGRAM_TYPES = ['UG', 'PG', 'Diploma', 'Ph.D'];

const emptyForm = { name: '', shortName: '', type: 'PG', duration: 2, totalSems: 4 };

type ProgramForm = typeof emptyForm;

// Defined OUTSIDE the parent — prevents remounts on re-render (fixes focus loss)
function ProgramFormFields({
    form,
    setForm,
    error,
}: {
    form: ProgramForm;
    setForm: (f: ProgramForm) => void;
    error: string;
}) {
    return (
        <div className="space-y-4 py-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
            <div className="space-y-2">
                <label className="text-sm font-medium">Full Program Name</label>
                <Input
                    placeholder="e.g. Master of Computer Application"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Short Name / Code</label>
                    <Input
                        placeholder="e.g. MCA"
                        value={form.shortName}
                        onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Program Type</label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                        {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (Years)</label>
                    <Input
                        type="number" min="1" max="6"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 2 })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Total Semesters</label>
                    <Input
                        type="number" min="1" max="12"
                        value={form.totalSems}
                        onChange={(e) => setForm({ ...form, totalSems: parseInt(e.target.value) || 4 })}
                    />
                </div>
            </div>
        </div>
    );
}

const typeColors: Record<string, string> = {
    PG: 'bg-purple-100 text-purple-700 border-purple-200',
    UG: 'bg-blue-100 text-blue-700 border-blue-200',
    Diploma: 'bg-amber-100 text-amber-700 border-amber-200',
    'Ph.D': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const navItems = [
    { title: 'Dashboard', href: '/department', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Faculty', href: '/department/faculty', icon: <Users className="w-5 h-5" /> },
    { title: 'Courses', href: '/department/courses', icon: <GraduationCap className="w-5 h-5 text-indigo-500" /> },
    { title: 'Subjects', href: '/department/subjects', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Batches', href: '/department/batches', icon: <Network className="w-5 h-5" /> },
    { title: 'Resources', href: '/department/resources', icon: <Monitor className="w-5 h-5" /> },
    { title: 'Timetables', href: '/department/timetables', icon: <Calendar className="w-5 h-5" /> },
];

export default function DeptSubjectsDashboard() {
    const { user } = useAuthStore();
    const [programs, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<ProgramForm>({ ...emptyForm });
    const [editForm, setEditForm] = useState<ProgramForm>({ ...emptyForm });
    const [error, setError] = useState('');
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user?.universityId) return;
        setLoading(true);
        try {
            const { data } = await api.get('/courses');
            setSubjects(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.universityId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        setError('');
        try {
            await api.post('/courses', { ...addForm, universityId: user?.universityId });
            setIsAddOpen(false);
            setAddForm({ ...emptyForm });
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to create program.');
        }
    };

    const handleEdit = async () => {
        if (!selectedId) return;
        setError('');
        try {
            await api.put(`/courses/${selectedId}`, editForm);
            setIsEditOpen(false);
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to update program.');
        }
    };

    const handleDelete = (id: string) => {
        askConfirm({
            title: 'Delete Program',
            message: 'Delete this program? All linked batches and subjects may be affected. This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/courses/${id}`);
                    fetchData();
                } catch (e: any) {
                    showToast('error', e.response?.data?.error || 'Failed to delete program.');
                }
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Academic Subjects">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Subjects Directory</h2>
                        <p className="text-slate-500">Manage degree programs offered by your department.</p>
                    </div>
                    <Button onClick={() => { setError(''); setIsAddOpen(true); }} className="bg-primary shadow-md hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" /> Add Program
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map(prog => (
                            <Card key={prog.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base font-bold text-slate-800 leading-tight line-clamp-2">{prog.name}</CardTitle>
                                            <CardDescription className="font-mono font-bold text-sm mt-1 text-indigo-600">{prog.shortName}</CardDescription>
                                        </div>
                                        <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border shrink-0 ${typeColors[prog.type] || 'bg-slate-100 text-slate-600'}`}>
                                            {prog.type}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Duration</div>
                                                <div className="text-sm font-semibold">{prog.duration} {prog.duration === 1 ? 'Year' : 'Years'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Layers className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Semesters</div>
                                                <div className="text-sm font-semibold">{prog.totalSems} Sem</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="w-1/2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                            onClick={() => {
                                                setSelectedId(prog.id);
                                                setEditForm({ name: prog.name, shortName: prog.shortName, type: prog.type, duration: prog.duration, totalSems: prog.totalSems });
                                                setError('');
                                                setIsEditOpen(true);
                                            }}>
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-1/2 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleDelete(prog.id)}>
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {programs.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-slate-700">No programs added yet</h3>
                                <p className="text-sm mt-1">Add your first degree program (e.g. MCA, BCA) to get started.</p>
                            </div>
                        )}
                    </div>
                )}

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Add Academic Program</DialogTitle></DialogHeader>
                        <ProgramFormFields form={addForm} setForm={setAddForm} error={error} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!addForm.name || !addForm.shortName}>Create Program</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Edit Program</DialogTitle></DialogHeader>
                        <ProgramFormFields form={editForm} setForm={setEditForm} error={error} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEdit} disabled={!editForm.name || !editForm.shortName}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
