'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
    LuMonitor, LuLayoutDashboard, LuUsers, LuBuilding2,
    LuPlus, LuTrash2, LuPencil, LuFlaskConical, LuMic, LuSchool, LuSearch
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
    Classroom: { icon: <LuSchool className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10' },
    Lab: { icon: <LuFlaskConical className="w-5 h-5" />, color: 'text-purple-600 dark:text-neon-purple', bg: 'bg-purple-100 dark:bg-neon-purple/10' },
    'Seminar Hall': { icon: <LuMic className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/10' },
    Auditorium: { icon: <LuBuilding2 className="w-5 h-5" />, color: 'text-rose-600 dark:text-neon-pink', bg: 'bg-rose-100 dark:bg-neon-pink/10' },
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

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-20">
                    <div>
                        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white glow-cyan">Resources Dashboard</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-light mt-1">Manage classrooms, labs, and venues available for timetable scheduling.</p>
                    </div>
                    <Button onClick={() => { setError(''); setAddForm({ ...emptyForm }); setIsAddOpen(true); }} className="bg-neon-cyan text-white dark:text-slate-900 shadow-md dark:shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-lg hover:bg-cyan-600 dark:hover:bg-white font-bold transition-all px-6 shrink-0">
                        <LuPlus className="w-5 h-5 mr-2" /> Add Resource
                    </Button>
                </div>

                {/* Type filter chips */}
                <div className="flex flex-wrap gap-2 mb-5 relative z-20">
                    {RESOURCE_TYPES.map(t => {
                        const cfg = typeConfig[t];
                        return (
                            <button key={t}
                                onClick={() => setFilterType(filterType === t ? '' : t)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all glass-card
                                    ${filterType === t
                                        ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-offset-2 ring-offset-background dark:ring-offset-background ring-current`
                                        : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'}`}>
                                <span className={filterType === t ? cfg.color : ''}>{cfg.icon}</span>
                                {t}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterType === t ? 'bg-white/50 dark:bg-black/20' : cfg.bg} ${cfg.color}`}>{typeCounts[t]}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-3 shadow-sm mb-6 max-w-sm relative z-20 border border-slate-200 dark:border-white/10">
                    <LuSearch className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <input className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Search by name or building…" value={search}
                        onChange={(e) => setSearch(e.target.value)} />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-20">
                        {filtered.map(r => {
                            const cfg = typeConfig[r.type] || { icon: <LuMonitor className="w-5 h-5" />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-white/5' };
                            return (
                                <div key={r.id} className="glass-card rounded-[1.5rem] overflow-hidden group hover:border-cyan-500/30 dark:hover:border-neon-cyan/40 transition-all duration-500 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(57,193,239,0.15)] relative flex flex-col">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[40px] rounded-full group-hover:bg-neon-cyan/25 dark:bg-neon-cyan/5 dark:group-hover:bg-neon-cyan/15 transition-colors duration-500" />

                                    <div className="p-5 border-b border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-transparent">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border border-white/50 dark:border-white/5 shadow-sm`}>
                                                <span className={cfg.color}>{cfg.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white tracking-tight line-clamp-1">{r.name}</h3>
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{r.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 pt-4 relative z-10 flex-1 flex flex-col">
                                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2">
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Seats</div>
                                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{r.capacity}</div>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2">
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Building</div>
                                                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{r.building || '—'}</div>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2">
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Floor</div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{r.floor || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-auto pt-2">
                                            <Button variant="ghost" size="sm" className="flex-1 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-cyan-700 dark:hover:text-neon-cyan hover:bg-cyan-50 dark:hover:bg-neon-cyan/10"
                                                onClick={() => {
                                                    setSelectedId(r.id);
                                                    setEditForm({ name: r.name, type: r.type, capacity: r.capacity, floor: r.floor || '', building: r.building || '' });
                                                    setError('');
                                                    setIsEditOpen(true);
                                                }}>
                                                <LuPencil className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="flex-1 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                onClick={() => handleDelete(r.id, r.name)}>
                                                <LuTrash2 className="w-4 h-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-600 dark:text-slate-400 glass-card rounded-[2rem] border-dashed border-slate-300 dark:border-white/20">
                                <LuMonitor className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="text-2xl font-semibold text-slate-700 dark:text-white font-heading tracking-tight">{search || filterType ? 'No matches found' : 'No resources yet'}</h3>
                                <p className="text-sm mt-2 max-w-sm mx-auto font-light">
                                    {search || filterType ? 'Try clearing the filter or search.' : 'Add classrooms, labs, and halls to make them available for timetable scheduling.'}
                                </p>
                                {!search && !filterType && (
                                    <Button className="mt-6 bg-neon-cyan text-white dark:text-slate-900 shadow-md dark:shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-lg hover:bg-cyan-600 dark:hover:bg-white font-bold transition-all px-6" onClick={() => setIsAddOpen(true)}>
                                        <LuPlus className="w-5 h-5 mr-2" /> Add First Resource
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
