'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
    LuGraduationCap, LuPlus, LuTrash2, LuPencil,
    LuSearch, LuTriangleAlert, LuUserCheck,
    LuChevronDown, LuChevronUp, LuNetwork
} from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────
const emptyBatchForm = { name: '', program: '', semester: 1, year: '', totalStudents: 60 };
const emptyDivForm = { division: '', strength: 30 };
type BatchForm = typeof emptyBatchForm;
type DivForm = typeof emptyDivForm;

interface Program {
    id: string;
    name: string;
    shortName: string;
}

interface Batch {
    id: string;
    name: string;
    program: string | null;
    semester: number | null;
    year: string | null;
    totalStudents: number;
    division?: string;
    strength?: number;
}

// ── Sub-components OUTSIDE parent (prevents focus loss on re-render) ───────────
function ProgramSelect({ value, onChange, programs }: { value: string; onChange: (v: string) => void; programs: Program[] }) {
    return (
        <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">No Program / General</option>
            {programs.map(p => <option key={p.id} value={p.shortName}>{p.name} ({p.shortName})</option>)}
        </select>
    );
}

// Progress bar for division fill
function DivisionFill({ used, total }: { used: number; total: number }) {
    if (!total) return null;
    const pct = Math.min(100, Math.round((used / total) * 100));
    const over = used > total;
    return (
        <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
                <span className={over ? 'text-red-600 font-bold' : 'text-slate-500'}>
                    {over && <LuTriangleAlert className="w-3 h-3 inline mr-1" />}
                    {used} / {total} students assigned
                </span>
                <span className={over ? 'text-red-600 font-bold' : 'text-slate-400'}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 90 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
        </div>
    );
}

// Custom confirm dialog — replaces native confirm() which can be auto-dismissed in dev mode
type ConfirmState = { open: boolean; title: string; message: string; onConfirm: () => void };
const emptyConfirm: ConfirmState = { open: false, title: '', message: '', onConfirm: () => { } };

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
    return (
        <Dialog open={state.open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <LuTrash2 className="w-5 h-5" /> {state.title}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-600 py-2">{state.message}</p>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => { state.onConfirm(); onClose(); }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

export default function DeptBatchesDashboard() {
    const { user } = useAuthStore();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

    // Dialog state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddDivOpen, setIsAddDivOpen] = useState(false);
    const [isEditDivOpen, setIsEditDivOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [selectedDivId, setSelectedDivId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(emptyConfirm);
    const closeConfirm = () => setConfirmDialog(emptyConfirm);

    // Form state
    const [addForm, setAddForm] = useState<BatchForm>({ ...emptyBatchForm });
    const [editForm, setEditForm] = useState<BatchForm>({ ...emptyBatchForm });
    const [addDivForm, setAddDivForm] = useState<DivForm>({ ...emptyDivForm });
    const [editDivForm, setEditDivForm] = useState<DivForm>({ ...emptyDivForm });
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        if (!user?.entityId) return;
        setLoading(true);
        try {
            const [batchRes, progRes] = await Promise.all([api.get('/batches'), api.get('/programs')]);
            setBatches(batchRes.data);
            setPrograms(progRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user?.entityId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter batches based on search term
    const filteredBatches = batches.filter(batch =>
        !searchTerm ||
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.program && batch.program.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Group batches by "program__name" key — each group is one logical batch, rows are divisions
    const batchGroups: Record<string, Batch[]> = filteredBatches.reduce((acc: Record<string, Batch[]>, batch) => {
        const key = `${batch.program || 'general'}__${batch.name}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(batch);
        return acc;
    }, {});

    // ── Create new batch (with Division A auto-created) ────────────────────────
    const handleCreateBatch = async () => {
        setError('');
        if (!addForm.name) return setError('Batch name is required.');
        if (addForm.totalStudents < 1) return setError('Total students must be at least 1.');
        try {
            await api.post('/batches', {
                ...addForm,
                division: 'A',
                strength: addForm.totalStudents, // Division A gets full capacity initially
                departmentId: user?.entityId,
                universityId: user?.universityId,
            });
            setIsAddOpen(false);
            setAddForm({ ...emptyBatchForm });
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create batch.';
            setError(errorMsg);
        }
    };

    // ── Add new division to existing batch group ───────────────────────────────
    const handleAddDivision = async () => {
        if (!selectedBatchId) return;
        setError('');
        const base = batches.find(b => b.id === selectedBatchId);
        if (!base) return;

        // Validate: sum of existing divisions + new strength ≤ totalStudents
        const groupKey = `${base.program || 'general'}__${base.name}`;
        const groupDivisions = batchGroups[groupKey] || [];
        const usedStrength = groupDivisions.reduce((s, d) => s + (d.strength || 0), 0);
        const newStrength = addDivForm.strength || 0;

        if (usedStrength + newStrength > base.totalStudents) {
            const remaining = base.totalStudents - usedStrength;
            return setError(`Total batch capacity is ${base.totalStudents} students. Already allocated ${usedStrength}. Only ${remaining} students remaining.`);
        }
        if (!addDivForm.division.trim()) {
            return setError('Division name/label is required.');
        }

        try {
            await api.post('/batches', {
                name: base.name,
                program: base.program,
                semester: base.semester,
                year: base.year,
                division: addDivForm.division.trim(),
                strength: newStrength,
                totalStudents: base.totalStudents,
                departmentId: user?.entityId,
                universityId: user?.universityId,
            });
            setIsAddDivOpen(false);
            setAddDivForm({ ...emptyDivForm });
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to add division.';
            setError(errorMsg);
        }
    };

    // ── Edit a specific division row ──────────────────────────────────────────
    const handleEditDivision = async () => {
        if (!selectedDivId || !selectedBatchId) return;
        setError('');
        const base = batches.find(b => b.id === selectedBatchId);
        const div = batches.find(b => b.id === selectedDivId);
        if (!base || !div) return;

        const groupKey = `${base.program || 'general'}__${base.name}`;
        const groupDivisions = batchGroups[groupKey] || [];
        const usedExcludingThis = groupDivisions
            .filter(d => d.id !== selectedDivId)
            .reduce((s, d) => s + (d.strength || 0), 0);

        if (usedExcludingThis + editDivForm.strength > base.totalStudents) {
            const remaining = base.totalStudents - usedExcludingThis;
            return setError(`Only ${remaining} students available for this division (batch total: ${base.totalStudents}).`);
        }

        try {
            await api.put(`/batches/${selectedDivId}`, {
                name: div.name,
                program: div.program,
                semester: div.semester,
                year: div.year,
                division: editDivForm.division.trim(),
                strength: editDivForm.strength,
                totalStudents: div.totalStudents,
            });
            setIsEditDivOpen(false);
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to edit division.';
            setError(errorMsg);
        }
    };

    // ── Edit overall batch metadata ────────────────────────────────────────────
    const handleEditBatch = async () => {
        if (!selectedBatchId) return;
        setError('');
        const base = batches.find(b => b.id === selectedBatchId);
        if (!base) return;

        const groupKey = `${base.program || 'general'}__${base.name}`;
        const groupDivisions = batchGroups[groupKey] || [];
        const usedStrength = groupDivisions.reduce((s, d) => s + (d.strength || 0), 0);
        if (editForm.totalStudents < usedStrength) {
            return setError(`Cannot set total below the already-assigned ${usedStrength} students across divisions.`);
        }

        try {
            // Update all divisions in the group to use the new batch metadata
            await Promise.all(
                groupDivisions.map(div =>
                    api.put(`/batches/${div.id}`, {
                        name: editForm.name,
                        program: editForm.program,
                        semester: editForm.semester,
                        year: editForm.year,
                        division: div.division,
                        strength: div.strength,
                        totalStudents: editForm.totalStudents,
                    })
                )
            );
            setIsEditOpen(false);
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update batch.';
            setError(errorMsg);
        }
    };

    // ── Delete entire batch (all its divisions) ────────────────────────────
    const handleDeleteBatch = (divisions: Batch[], batchName: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Batch',
            message: `Delete the entire batch "${batchName}" and all its ${divisions.length} division(s)? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    await Promise.all(divisions.map(div => api.delete(`/batches/${div.id}`)));
                    fetchData();
                } catch (e) {
                    const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete batch.';
                    setError(errorMsg);
                }
            },
        });
    };

    // ── Delete a single division row ───────────────────────────────────────────
    const handleDeleteDivision = (id: string, divLabel: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Division',
            message: `Delete Division "${divLabel}"? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/batches/${id}`);
                    fetchData();
                } catch (e) {
                    const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete division.';
                    setError(errorMsg);
                }
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Student Batches">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Batch Management</h2>
                        <p className="text-slate-500">Manage batches like &quot;MCA 25-27&quot; with divisions (A, B, C) and student counts.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-full sm:w-64">
                            <LuSearch className="w-4 h-4 text-slate-400 shrink-0" />
                            <Input
                                placeholder="Search batches..."
                                className="border-0 p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => { setError(''); setAddForm({ ...emptyBatchForm }); setIsAddOpen(true); }} className="bg-primary shadow-md">
                            <LuPlus className="w-4 h-4 mr-2" /> New Batch
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(batchGroups).map(([groupKey, divisions]) => {
                            const first = divisions[0];
                            const isExpanded = expandedBatch === groupKey;
                            const usedStudents = divisions.reduce((s, d) => s + (d.strength || 0), 0);
                            const totalCap = first.totalStudents || 0;

                            return (
                                <Card key={groupKey} className="shadow-sm border-slate-200 overflow-hidden">
                                    <CardHeader className="pb-0 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b">
                                        <div className="pb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                                        <LuGraduationCap className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-slate-800">{first.name}</CardTitle>
                                                        <CardDescription className="text-sm">
                                                            <span className="font-semibold text-indigo-600">{first.program || 'General'}</span>
                                                            {first.year && <span className="text-slate-400"> · {first.year}</span>}
                                                            {first.semester && <span className="text-slate-400"> · Sem {first.semester}</span>}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                                        {divisions.length} {divisions.length === 1 ? 'Division' : 'Divisions'}
                                                    </span>
                                                    <Button variant="ghost" size="sm"
                                                        onClick={() => {
                                                            setSelectedBatchId(first.id);
                                                            setEditForm({ name: first.name, program: first.program || '', semester: first.semester || 1, year: first.year || '', totalStudents: first.totalStudents || 0 });
                                                            setError('');
                                                            setIsEditOpen(true);
                                                        }}>
                                                        <LuPencil className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteBatch(divisions, first.name)}>
                                                        <LuTrash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setExpandedBatch(isExpanded ? null : groupKey)}>
                                                        {isExpanded ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            {totalCap > 0 && (
                                                <DivisionFill used={usedStudents} total={totalCap} />
                                            )}
                                        </div>
                                    </CardHeader>

                                    {isExpanded && (
                                        <CardContent className="pt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                                {divisions.map(div => (
                                                    <div key={div.id} className="border border-slate-200 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                                    <span className="text-emerald-700 font-bold text-sm">{div.division || '?'}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-700">Div {div.division || 'Default'}</div>
                                                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                                                        <LuUserCheck className="w-3 h-3" /> {div.strength} students
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <Button variant="outline" size="sm" className="flex-1 text-xs hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => {
                                                                    setSelectedDivId(div.id);
                                                                    setSelectedBatchId(first.id);
                                                                    setEditDivForm({ division: div.division || '', strength: div.strength || 0 });
                                                                    setError('');
                                                                    setIsEditDivOpen(true);
                                                                }}>
                                                                <LuPencil className="w-3 h-3 mr-1" /> Edit
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleDeleteDivision(div.id, div.division || '?')}>
                                                                <LuTrash2 className="w-3 h-3 mr-1" /> Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="outline" size="sm"
                                                className="border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 w-full"
                                                onClick={() => {
                                                    setSelectedBatchId(first.id);
                                                    // Suggest next division label
                                                    const nextLabel = String.fromCharCode(65 + divisions.length);
                                                    const usedNow = divisions.reduce((s, d) => s + (d.strength || 0), 0);
                                                    const remaining = Math.max(0, (first.totalStudents || 0) - usedNow);
                                                    setAddDivForm({ division: nextLabel, strength: remaining });
                                                    setError('');
                                                    setIsAddDivOpen(true);
                                                }}>
                                                <LuPlus className="w-4 h-4 mr-2" /> Add Division to {first.name}
                                            </Button>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}

                        {Object.keys(batchGroups).length === 0 && (
                            <div className="py-20 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                <LuNetwork className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700">No batches yet</h3>
                                <p className="text-sm mt-2 max-w-sm mx-auto">Create a batch like &quot;MCA 25-27&quot; with a total student count, then add divisions within it.</p>
                                <Button className="mt-5" onClick={() => { setError(''); setIsAddOpen(true); }}>
                                    <LuPlus className="w-4 h-4 mr-2" /> Create First Batch
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Confirm Delete Dialog ─────────────────────────────────────── */}
                <ConfirmDialog state={confirmDialog} onClose={closeConfirm} />

                {/* ── Add New Batch Dialog ─────────────────────────────────────── */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Create New Batch</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm flex gap-2"><LuTriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Batch Name</label>
                                <Input placeholder="e.g. MCA 25-27" value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                                <p className="text-xs text-slate-500">This name is shared across all divisions of this batch.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Total Students (Batch Capacity)</label>
                                <Input type="number" min="1" placeholder="e.g. 120" value={addForm.totalStudents}
                                    onChange={(e) => setAddForm({ ...addForm, totalStudents: parseInt(e.target.value) || 0 })} />
                                <p className="text-xs text-slate-500">The maximum number of students across ALL divisions of this batch.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Program</label>
                                <ProgramSelect value={addForm.program} onChange={(v) => setAddForm({ ...addForm, program: v })} programs={programs} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Academic Year</label>
                                    <Input placeholder="e.g. 2025-27" value={addForm.year}
                                        onChange={(e) => setAddForm({ ...addForm, year: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Semester</label>
                                    <Input type="number" min="1" max="12" value={addForm.semester}
                                        onChange={(e) => setAddForm({ ...addForm, semester: parseInt(e.target.value) || 1 })} />
                                </div>
                            </div>
                            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700">
                                <strong>Division A</strong> will be created automatically with full batch capacity. You can add more divisions (B, C…) and adjust student counts after creation.
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateBatch} disabled={!addForm.name || addForm.totalStudents < 1}>Create Batch</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Add Division Dialog ──────────────────────────────────────── */}
                <Dialog open={isAddDivOpen} onOpenChange={setIsAddDivOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader><DialogTitle>Add New Division</DialogTitle></DialogHeader>
                        {(() => {
                            const base = batches.find(b => b.id === selectedBatchId);
                            if (!base) return null;
                            const groupKey = `${base.program || 'general'}__${base.name}`;
                            const used = (batchGroups[groupKey] || []).reduce((s: number, d) => s + (d.strength || 0), 0);
                            const remaining = (base.totalStudents || 0) - used;
                            return (
                                <div className="space-y-4 py-4">
                                    {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm flex gap-2"><LuTriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
                                    <div className="rounded-lg bg-slate-50 border px-3 py-2 text-sm text-slate-600">
                                        <strong>{base.name}</strong> — {used} of {base.totalStudents} students allocated.
                                        <span className={`ml-2 font-semibold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {remaining > 0 ? `${remaining} available` : 'No capacity left'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Division Name / Label</label>
                                        <Input placeholder="e.g. B or C" value={addDivForm.division}
                                            onChange={(e) => setAddDivForm({ ...addDivForm, division: e.target.value })} />
                                        <p className="text-xs text-slate-500">Use a short label like A, B, C or Morning, Evening.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Students in this Division</label>
                                        <Input type="number" min="1" max={remaining > 0 ? remaining : 1}
                                            value={addDivForm.strength}
                                            onChange={(e) => setAddDivForm({ ...addDivForm, strength: parseInt(e.target.value) || 1 })} />
                                        <p className="text-xs text-slate-500">Max allowed: {remaining} students</p>
                                    </div>
                                </div>
                            );
                        })()}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDivOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddDivision} disabled={!addDivForm.division.trim() || addDivForm.strength < 1}>Add Division</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Edit Division Dialog ─────────────────────────────────────── */}
                <Dialog open={isEditDivOpen} onOpenChange={setIsEditDivOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader><DialogTitle>Edit Division</DialogTitle></DialogHeader>
                        {(() => {
                            const base = batches.find(b => b.id === selectedBatchId);
                            const div = batches.find(b => b.id === selectedDivId);
                            if (!base || !div) return null;
                            const groupKey = `${base.program || 'general'}__${base.name}`;
                            const usedExcl = (batchGroups[groupKey] || []).filter((d: Batch) => d.id !== selectedDivId).reduce((s: number, d: Batch) => s + (d.strength || 0), 0);
                            const maxAllowed = (base.totalStudents || 0) - usedExcl;
                            return (
                                <div className="space-y-4 py-4">
                                    {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm flex gap-2"><LuTriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Division Label</label>
                                        <Input value={editDivForm.division}
                                            onChange={(e) => setEditDivForm({ ...editDivForm, division: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Students in this Division</label>
                                        <Input type="number" min="1" max={maxAllowed}
                                            value={editDivForm.strength}
                                            onChange={(e) => setEditDivForm({ ...editDivForm, strength: parseInt(e.target.value) || 1 })} />
                                        <p className="text-xs text-slate-500">Max allowed for this division: {maxAllowed} students</p>
                                    </div>
                                </div>
                            );
                        })()}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDivOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditDivision}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Edit Batch Metadata Dialog ───────────────────────────────── */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Edit Batch Details</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm flex gap-2"><LuTriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Batch Name</label>
                                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Total Students (Batch Capacity)</label>
                                <Input type="number" min="1" value={editForm.totalStudents}
                                    onChange={(e) => setEditForm({ ...editForm, totalStudents: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Program</label>
                                <ProgramSelect value={editForm.program} onChange={(v) => setEditForm({ ...editForm, program: v })} programs={programs} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Academic Year</label>
                                    <Input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Semester</label>
                                    <Input type="number" min="1" max="12" value={editForm.semester}
                                        onChange={(e) => setEditForm({ ...editForm, semester: parseInt(e.target.value) || 1 })} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditBatch} disabled={!editForm.name}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
