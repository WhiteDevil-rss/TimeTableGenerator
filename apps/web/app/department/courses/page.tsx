'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlus, LuTrash2, LuPencil, LuClock, LuLayers, LuSearch, LuGraduationCap } from 'react-icons/lu';
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

import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

interface Program {
    id: string;
    name: string;
    shortName: string;
    type: string;
    duration: number;
    totalSems: number;
}

export default function DeptProgramsDashboard() {
    const { user } = useAuthStore();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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
            const { data } = await api.get('/programs');
            setPrograms(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.universityId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = programs.filter(p =>
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.shortName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async () => {
        setError('');
        try {
            await api.post('/programs', { ...addForm, universityId: user?.universityId });
            setIsAddOpen(false);
            setAddForm({ ...emptyForm });
            fetchData();
        } catch (e) {
            setError((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create program.');
        }
    };

    const handleEdit = async () => {
        if (!selectedId) return;
        setError('');
        try {
            await api.put(`/programs/${selectedId}`, editForm);
            setIsEditOpen(false);
            fetchData();
        } catch (e) {
            setError((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update program.');
        }
    };

    const handleDelete = (id: string) => {
        askConfirm({
            title: 'Delete Program',
            message: 'Delete this program? All linked batches and subjects may be affected. This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/programs/${id}`);
                    fetchData();
                } catch (e) {
                    showToast('error', (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete program.');
                }
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Academic Programs">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Programs Directory</h2>
                        <p className="text-slate-500">Manage degree programs offered by your department.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-full sm:w-64">
                            <LuSearch className="w-4 h-4 text-slate-400 shrink-0" />
                            <Input
                                placeholder="Search programs..."
                                className="border-0 p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => { setError(''); setIsAddOpen(true); }} className="bg-primary shadow-md hover:bg-primary/90">
                            <LuPlus className="w-4 h-4 mr-2" /> Add Program
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(prog => (
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
                                            <LuClock className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Duration</div>
                                                <div className="text-sm font-semibold">{prog.duration} {prog.duration === 1 ? 'Year' : 'Years'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <LuLayers className="w-4 h-4 text-slate-400" />
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
                                            <LuPencil className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-1/2 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleDelete(prog.id)}>
                                            <LuTrash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                <LuGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-slate-700">{searchTerm ? `No results for "${searchTerm}"` : 'No programs added yet'}</h3>
                                <p className="text-sm mt-1">{searchTerm ? 'Try a different search term' : 'Add your first degree program (e.g. MCA, BCA) to get started.'}</p>
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
