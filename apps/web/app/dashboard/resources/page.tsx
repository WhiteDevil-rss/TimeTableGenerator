'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
    LuMonitor, LuLayoutDashboard, LuUsers, LuBuilding2,
    LuPlus, LuTrash2, LuPencil, LuFlaskConical, LuMic2, LuSchool, LuSearch
} from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

const RESOURCE_TYPES = ['Classroom', 'Lab', 'Seminar Hall', 'Auditorium'];

const emptyForm = { name: '', type: 'Classroom', capacity: 30, floor: '', building: '' };
type ResourceForm = typeof emptyForm;

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    Classroom: { icon: <LuSchool className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' },
    Lab: { icon: <LuFlaskConical className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' },
    'Seminar Hall': { icon: <LuMic2 className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-100' },
    Auditorium: { icon: <LuBuilding2 className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-100' },
};

function ResourceFormFields({ form, setForm, error }: { form: ResourceForm; setForm: (f: ResourceForm) => void; error: string }) {
    return (
        <div className="space-y-4 py-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
            <div className="space-y-2">
                <label className="text-sm font-medium">Resource Name</label>
                <Input placeholder="e.g. Room 101 or Computer Lab A" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity (seats)</label>
                    <Input type="number" min="1" value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Building</label>
                    <Input placeholder="e.g. Main Block" value={form.building}
                        onChange={(e) => setForm({ ...form, building: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Floor</label>
                    <Input placeholder="e.g. Ground / 1st" value={form.floor}
                        onChange={(e) => setForm({ ...form, floor: e.target.value })} />
                </div>
            </div>
        </div>
    );
}

const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5" /> },
    { title: 'Faculty', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5" /> },
    { title: 'Resources', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5 text-indigo-500" /> },
];

interface Resource {
    id: string;
    name: string;
    type: string;
    capacity: number;
    floor?: string;
    building?: string;
}

export default function UniResourcesDashboard() {
    const { user } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<ResourceForm>({ ...emptyForm });
    const [editForm, setEditForm] = useState<ResourceForm>({ ...emptyForm });
    const [error, setError] = useState('');
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/resources');
            setResources(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = resources.filter(r => {
        const matchType = filterType ? r.type === filterType : true;
        const matchSearch = search
            ? r.name.toLowerCase().includes(search.toLowerCase()) || (r.building || '').toLowerCase().includes(search.toLowerCase())
            : true;
        return matchType && matchSearch;
    });

    const handleCreate = async () => {
        setError('');
        if (!addForm.name) return setError('Resource name is required.');
        try {
            await api.post('/resources', { ...addForm, universityId: user?.universityId });
            setIsAddOpen(false);
            setAddForm({ ...emptyForm });
            fetchData();
            showToast('success', 'Resource added successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create resource.';
            setError(errorMsg);
        }
    };

    const handleEdit = async () => {
        if (!selectedId) return;
        setError('');
        try {
            await api.put(`/resources/${selectedId}`, editForm);
            setIsEditOpen(false);
            fetchData();
            showToast('success', 'Resource updated successfully!');
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update resource.';
            setError(errorMsg);
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete Resource',
            message: `Delete "${name}"? It will be removed from all timetable slot assignments.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/resources/${id}`);
                    fetchData();
                } catch (e) {
                    const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete resource.';
                    showToast('error', errorMsg);
                }
            },
        });
    };

    const typeCounts = RESOURCE_TYPES.reduce((acc, t) => {
        acc[t] = resources.filter(r => r.type === t).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <ProtectedRoute allowedRoles={['UNI_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Resources">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Resources</h2>
                        <p className="text-slate-500">Manage classrooms, labs, and venues available for timetable scheduling.</p>
                    </div>
                    <Button onClick={() => { setError(''); setAddForm({ ...emptyForm }); setIsAddOpen(true); }} className="bg-primary shadow-md shrink-0">
                        <LuPlus className="w-4 h-4 mr-2" /> Add Resource
                    </Button>
                </div>

                {/* Type filter chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {RESOURCE_TYPES.map(t => {
                        const cfg = typeConfig[t];
                        return (
                            <button key={t}
                                onClick={() => setFilterType(filterType === t ? '' : t)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all
                                    ${filterType === t
                                        ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-offset-1 ring-current`
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                <span className={cfg.color}>{cfg.icon}</span>
                                {t}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{typeCounts[t]}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm mb-6 max-w-sm">
                    <LuSearch className="w-4 h-4 text-slate-400 shrink-0" />
                    <input className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
                        placeholder="Search by name or building…" value={search}
                        onChange={(e) => setSearch(e.target.value)} />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(r => {
                            const cfg = typeConfig[r.type] || { icon: <LuMonitor className="w-5 h-5" />, color: 'text-slate-600', bg: 'bg-slate-100' };
                            return (
                                <Card key={r.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                                <span className={cfg.color}>{cfg.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-sm font-bold text-slate-800 line-clamp-1">{r.name}</CardTitle>
                                                <CardDescription className="text-xs">{r.type}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                            <div className="bg-slate-50 rounded-lg p-2">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Seats</div>
                                                <div className="text-sm font-bold text-emerald-600">{r.capacity}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Building</div>
                                                <div className="text-sm font-bold text-indigo-600 truncate">{r.building || '—'}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">Floor</div>
                                                <div className="text-sm font-bold text-slate-700">{r.floor || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 text-xs hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => {
                                                    setSelectedId(r.id);
                                                    setEditForm({ name: r.name, type: r.type, capacity: r.capacity, floor: r.floor || '', building: r.building || '' });
                                                    setError('');
                                                    setIsEditOpen(true);
                                                }}>
                                                <LuPencil className="w-3 h-3 mr-1" /> Edit
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleDelete(r.id, r.name)}>
                                                <LuTrash2 className="w-3 h-3 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                <LuMonitor className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700">{search || filterType ? 'No matches found' : 'No resources yet'}</h3>
                                <p className="text-sm mt-2 max-w-sm mx-auto">
                                    {search || filterType ? 'Try clearing the filter or search.' : 'Add classrooms, labs, and halls to make them available for timetable scheduling.'}
                                </p>
                                {!search && !filterType && (
                                    <Button className="mt-5" onClick={() => setIsAddOpen(true)}>
                                        <LuPlus className="w-4 h-4 mr-2" /> Add First Resource
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Add New Resource</DialogTitle></DialogHeader>
                        <ResourceFormFields form={addForm} setForm={setAddForm} error={error} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!addForm.name}>Add Resource</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Edit Resource</DialogTitle></DialogHeader>
                        <ResourceFormFields form={editForm} setForm={setEditForm} error={error} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEdit} disabled={!editForm.name}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
