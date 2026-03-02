'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlus, LuTrash2, LuPencil, LuSearch, LuClipboardList, LuLayers, LuUsers, LuBookOpen } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';
import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

interface ElectiveOption {
    id?: string;
    courseId: string;
    enrollmentCount: number;
    facultyId?: string | null;
    course?: { name: string; code: string; type?: string };
    faculty?: { name: string };
    subgroups?: any[];
}

interface ElectiveBasket {
    id: string;
    subjectCode: string;
    name: string;
    semester?: number;
    program?: string;
    weeklyHrs: number;
    options: ElectiveOption[];
}

interface Course {
    id: string;
    name: string;
    code: string;
    weeklyHrs: number;
    semester?: number;
    program?: string;
}

interface Faculty {
    id: string;
    name: string;
}

interface Program {
    id: string;
    name: string;
    shortName: string;
}

const emptyOption = { courseId: '', enrollmentCount: 30, facultyId: null };
const emptyForm = {
    subjectCode: '',
    name: '',
    semester: 0,
    program: '',
    weeklyHrs: 2,
    options: [{ ...emptyOption }, { ...emptyOption }]
};

export default function ElectiveBasketsPage() {
    const { user } = useAuthStore();
    const [baskets, setBaskets] = useState<ElectiveBasket[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState(JSON.parse(JSON.stringify(emptyForm)));
    const [error, setError] = useState('');
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user?.entityId) return;
        setLoading(true);
        try {
            const [basketsRes, coursesRes, facultyRes, programsRes] = await Promise.all([
                api.get(`/departments/${user.entityId}/electives`),
                api.get('/courses'),
                api.get('/faculty'),
                api.get('/programs'),
            ]);
            setBaskets(basketsRes.data);
            setCourses(coursesRes.data);
            setFaculty(facultyRes.data);
            setPrograms(programsRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.entityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddOption = () => {
        setForm({ ...form, options: [...form.options, { ...emptyOption }] });
    };

    const handleRemoveOption = (index: number) => {
        if (form.options.length <= 2) {
            showToast('error', 'An elective basket must have at least 2 options.');
            return;
        }
        const newOptions = [...form.options];
        newOptions.splice(index, 1);
        setForm({ ...form, options: newOptions });
    };

    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...form.options];
        newOptions[index] = { ...newOptions[index], [field]: value };

        // Auto-fill logic from first course selection
        if (field === 'courseId' && value) {
            const course = courses.find(c => c.id === value);
            if (course && (index === 0 || !form.name)) {
                // If this is the first option or name is empty, suggest a name and sync metadata
                setForm({
                    ...form,
                    options: newOptions,
                    name: form.name || `${course.name} Basket`,
                    subjectCode: form.subjectCode || course.code,
                    weeklyHrs: course.weeklyHrs,
                    semester: course.semester || 0,
                    program: course.program || ''
                });
                return;
            }
        }

        setForm({ ...form, options: newOptions });
    };

    const handleSave = async () => {
        setError('');
        if (!form.subjectCode || !form.name) {
            setError('Subject code and basket name are required.');
            return;
        }

        if (form.options.length < 2) {
            setError('An elective basket must have at least 2 options.');
            return;
        }

        const selectedCourseIds = form.options.map((opt: any) => opt.courseId);
        if (new Set(selectedCourseIds).size !== selectedCourseIds.length) {
            setError('Duplicate subjects selected in the same basket.');
            return;
        }

        const invalidOption = form.options.some((opt: any) => !opt.courseId || opt.enrollmentCount <= 0);
        if (invalidOption) {
            setError('All options must have a course selected and enrollment count > 0.');
            return;
        }

        // Validate matching hours
        const firstCourse = courses.find(c => c.id === form.options[0].courseId);
        for (const opt of form.options) {
            const c = courses.find(course => course.id === opt.courseId);
            if (c && c.weeklyHrs !== firstCourse?.weeklyHrs) {
                setError(`Mismatched hours: ${c.name} has ${c.weeklyHrs} hrs, but ${firstCourse?.name} has ${firstCourse?.weeklyHrs} hrs.`);
                return;
            }
        }

        try {
            if (isEditOpen) {
                await api.put(`/departments/${user?.entityId}/electives/${selectedId}`, form);
            } else {
                await api.post(`/departments/${user?.entityId}/electives`, form);
            }
            setIsAddOpen(false);
            setIsEditOpen(false);
            fetchData();
            showToast('success', `Elective basket ${isEditOpen ? 'updated' : 'created'} successfully.`);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to save elective basket.');
        }
    };

    const handleDelete = (id: string) => {
        askConfirm({
            title: 'Delete Elective Basket',
            message: 'Are you sure you want to delete this elective basket? This will remove the parallel scheduling constraint for its options.',
            requireTypedConfirm: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/departments/${user?.entityId}/electives/${id}`);
                    fetchData();
                    showToast('success', 'Elective basket deleted.');
                } catch (e: any) {
                    showToast('error', e.response?.data?.error || 'Failed to delete.');
                }
            }
        });
    };

    const filtered = baskets.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Elective Baskets">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Elective Baskets</h2>
                        <p className="text-slate-500 dark:text-slate-400">Manage groups of elective subjects that must be scheduled in parallel.</p>
                    </div>
                    <Button onClick={() => {
                        setForm(JSON.parse(JSON.stringify(emptyForm)));
                        setError('');
                        setIsAddOpen(true);
                    }} className="bg-primary shadow-md hover:bg-primary/90 text-white">
                        <LuPlus className="w-4 h-4 mr-2" /> Create Basket
                    </Button>
                </div>

                <div className="flex items-center gap-2 glass border rounded-lg px-3 py-2 shadow-sm w-full max-w-sm mb-6">
                    <LuSearch className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <Input
                        placeholder="Search baskets..."
                        className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.map(basket => (
                            <Card key={basket.id} className="glass-card shadow-sm border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow group">
                                <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">{basket.name}</CardTitle>
                                            <CardDescription className="font-mono font-bold text-sm text-indigo-500">{basket.subjectCode}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setForm({
                                                    subjectCode: basket.subjectCode,
                                                    name: basket.name,
                                                    semester: basket.semester || 0,
                                                    program: basket.program || '',
                                                    weeklyHrs: basket.weeklyHrs,
                                                    options: basket.options.map(o => ({
                                                        courseId: o.courseId,
                                                        enrollmentCount: o.enrollmentCount,
                                                        facultyId: o.facultyId
                                                    }))
                                                });
                                                setSelectedId(basket.id);
                                                setError('');
                                                setIsEditOpen(true);
                                            }} className="h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                <LuPencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(basket.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                <LuTrash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex gap-4 mb-4 text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                        <span>Sem: {basket.semester || 'Any'}</span>
                                        <span>•</span>
                                        <span>{basket.program || 'General'}</span>
                                        <span>•</span>
                                        <span>{basket.weeklyHrs} hrs/week</span>
                                    </div>
                                    <div className="space-y-2">
                                        {basket.options.map((opt, idx) => (
                                            <div key={idx} className="flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/30">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center font-bold text-[10px] uppercase shadow-inner">
                                                            <span className="leading-none">{opt.course?.code?.substring(0, 3)}</span>
                                                            <span className="text-[8px] opacity-70 mt-0.5">{opt.course?.type?.substring(0, 1)}</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200">{opt.course?.name}</div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                                <div className="flex items-center gap-1">
                                                                    <LuUsers className="w-3 h-3 text-indigo-500" />
                                                                    <span className="font-medium">{opt.faculty?.name || 'AI Assigned'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-sm">
                                                            {opt.enrollmentCount} Students
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Subgroups UI */}
                                                {opt.subgroups && opt.subgroups.length > 0 && (
                                                    <div className="mt-3 pl-13 pr-1 space-y-2">
                                                        <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
                                                            <span>Capacity Split ({opt.subgroups.length} Grp)</span>
                                                            <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {opt.subgroups.map((sg: any, sgIdx: number) => (
                                                                <div key={sgIdx} className="flex items-center justify-between bg-white dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] shadow-sm">
                                                                    <span className="font-medium text-slate-600 dark:text-slate-300">{sg.name || `Subgroup ${sgIdx + 1}`}</span>
                                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{sg.enrollmentCount} <span className="text-[9px] font-medium text-slate-400">capacity</span></span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 glass-card rounded-xl border-dashed border-2 border-slate-200 dark:border-white/10">
                                <LuLayers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold">No elective baskets found</h3>
                                <p className="text-sm mt-1">Create a group of elective options that students can choose from.</p>
                            </div>
                        )}
                    </div>
                )}

                <Dialog open={isAddOpen || isEditOpen} onOpenChange={(val) => { if (!val) { setIsAddOpen(false); setIsEditOpen(false); } }}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card dark:border-white/10">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white uppercase tracking-wider text-xs font-bold text-indigo-500">
                                {isEditOpen ? 'Edit Elective Basket' : 'Construct New Elective Basket'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium">{error}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">Basket / Group Name</label>
                                    <Input
                                        placeholder="e.g. Elective-III Specialization"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">Subject / Basket Code</label>
                                    <Input
                                        placeholder="e.g. CS-404-B"
                                        value={form.subjectCode}
                                        onChange={e => setForm({ ...form, subjectCode: e.target.value })}
                                        className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">Program</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background dark:bg-slate-900/50 dark:border-white/10 dark:text-white px-3 py-2 text-sm outline-none font-medium"
                                        value={form.program}
                                        onChange={e => setForm({ ...form, program: e.target.value })}
                                    >
                                        <option value="">General</option>
                                        {programs.map(p => <option key={p.id} value={p.shortName}>{p.shortName}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">Semester</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background dark:bg-slate-900/50 dark:border-white/10 dark:text-white px-3 py-2 text-sm outline-none font-medium"
                                        value={form.semester}
                                        onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>Any</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">Weekly Hours</label>
                                    <Input
                                        type="number" min="1" max="10"
                                        value={form.weeklyHrs}
                                        onChange={e => setForm({ ...form, weeklyHrs: parseInt(e.target.value) || 2 })}
                                        className="dark:bg-slate-900/50 dark:border-white/10 dark:text-white font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <LuLayers className="w-4 h-4 text-primary" /> Basket Options
                                    </label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="h-7 text-[10px] font-bold uppercase tracking-wider dark:border-white/10 dark:text-slate-300">
                                        <LuPlus className="w-3 h-3 mr-1" /> Add Option
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {form.options.map((opt: any, idx: number) => {
                                        const selectedCourse = courses.find(c => c.id === opt.courseId);
                                        return (
                                            <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 relative">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                    <div className="md:col-span-5 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Course / Specialization</label>
                                                        <div className="relative group/search">
                                                            <select
                                                                className="w-full h-9 rounded-md border border-input bg-background dark:bg-slate-900/50 dark:border-indigo-500/20 dark:text-white px-3 text-sm outline-none font-bold appearance-none cursor-pointer"
                                                                value={opt.courseId}
                                                                onChange={e => handleOptionChange(idx, 'courseId', e.target.value)}
                                                            >
                                                                <option value="">Select Course</option>
                                                                {courses
                                                                    .filter(c => (form.semester === 0 || c.semester === form.semester) && (!form.program || c.program === form.program))
                                                                    .map(c => (
                                                                        <option key={c.id} value={c.id}>
                                                                            {c.name} ({c.code}) — {c.weeklyHrs}h
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <LuBookOpen className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-4 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Assigned Faculty</label>
                                                        <select
                                                            className="w-full h-9 rounded-md border border-input bg-background dark:bg-slate-900/50 dark:border-indigo-500/20 dark:text-white px-3 text-sm outline-none"
                                                            value={opt.facultyId || ''}
                                                            onChange={e => handleOptionChange(idx, 'facultyId', e.target.value || null)}
                                                        >
                                                            <option value="">AI Auto-assign</option>
                                                            {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Enrollment</label>
                                                        <Input
                                                            type="number" min="1"
                                                            value={opt.enrollmentCount}
                                                            onChange={e => handleOptionChange(idx, 'enrollmentCount', parseInt(e.target.value) || 0)}
                                                            className="h-9 dark:bg-slate-900/50 dark:border-indigo-500/20 dark:text-white font-bold text-center"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1 flex justify-center pb-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)} className="h-8 w-8 text-slate-300 hover:text-red-500 dark:hover:text-red-400">
                                                            <LuTrash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {selectedCourse && (
                                                    <div className="mt-2 text-[10px] text-indigo-500 flex items-center gap-2 font-bold px-1">
                                                        <span>{selectedCourse.code}</span>
                                                        <span>•</span>
                                                        <span>{selectedCourse.weeklyHrs} hrs/week</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t dark:border-white/5 pt-6 mt-2">
                            <Button variant="outline" className="dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white min-w-[120px] font-bold" onClick={handleSave}>
                                {isEditOpen ? 'Save Changes' : 'Launch Basket'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
