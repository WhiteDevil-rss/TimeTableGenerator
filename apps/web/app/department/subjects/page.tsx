'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlus, LuTrash2, LuPencil, LuSearch, LuFilter, LuBookOpen } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

const emptyForm = { name: '', code: '', program: '', semester: 0, credits: 4, weeklyHrs: 4, type: 'Theory' };
type SubjectForm = typeof emptyForm;

interface Program {
    id: string;
    name: string;
    shortName: string;
}

interface Subject {
    id: string;
    name: string;
    code: string;
    program?: string;
    semester?: number;
    credits: number;
    type: string;
}

// ALL sub-components defined OUTSIDE the parent — fixes focus loss on typing
function ProgramSelect({ value, onChange, programs }: { value: string; onChange: (v: string) => void; programs: Program[] }) {
    return (
        <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">No program / General</option>
            {programs.map(p => <option key={p.id} value={p.shortName}>{p.name} ({p.shortName})</option>)}
        </select>
    );
}

function SubjectFormFields({
    form, setForm, error, programs,
}: {
    form: SubjectForm; setForm: (f: SubjectForm) => void; error: string; programs: Program[];
}) {
    return (
        <div className="space-y-4 py-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
            <div className="space-y-2">
                <label className="text-sm font-medium">Subject Name</label>
                <Input
                    placeholder="e.g. Data Structures and Algorithms"
                    value={form.name}
                    onChange={(e) => {
                        const newName = e.target.value;
                        // auto-sync program name if it's empty or matches previous name
                        const shouldSync = !form.program || form.program === form.name;
                        setForm({
                            ...form,
                            name: newName,
                            program: shouldSync ? newName : form.program
                        });
                    }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Code</label>
                    <Input
                        placeholder="e.g. MCA-201"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Type</label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab / Practical</option>
                        <option value="Theory+Lab">Theory + Lab</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Program</label>
                    <ProgramSelect value={form.program} onChange={(v) => setForm({ ...form, program: v })} programs={programs} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Semester</label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                    >
                        <option value={0}>Not specified</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Credits <span className="text-slate-400 font-normal">(1 Credit = 1 Hour/Week)</span></label>
                <Input
                    type="number" min="1" max="10"
                    value={form.credits}
                    onChange={(e) => {
                        const c = parseInt(e.target.value) || 1;
                        setForm({ ...form, credits: c, weeklyHrs: c });
                    }}
                />
                <p className="text-xs text-slate-500">Weekly teaching hours are automatically set equal to credits.</p>
            </div>
        </div>
    );
}

const typeColor: Record<string, string> = {
    Theory: 'bg-blue-100 text-blue-700 border-blue-200',
    Lab: 'bg-green-100 text-green-700 border-green-200',
    'Theory+Lab': 'bg-purple-100 text-purple-700 border-purple-200',
};

import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

export default function DeptSubjectsDashboard() {
    const { user } = useAuthStore();
    const [courses, setCourses] = useState<Subject[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);

    const [loading, setLoading] = useState(true);
    const [filterProgram, setFilterProgram] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<SubjectForm>({ ...emptyForm });
    const [editForm, setEditForm] = useState<SubjectForm>({ ...emptyForm });
    const [error, setError] = useState('');
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    const fetchData = useCallback(async () => {
        if (!user?.entityId) return;
        setLoading(true);
        try {
            const [coursesRes, programsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/programs'),
            ]);
            setCourses(coursesRes.data);
            setPrograms(programsRes.data);

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user?.entityId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = courses.filter(c => {
        const matchesProgram = !filterProgram || c.program === filterProgram;
        const matchesSearch = !searchTerm ||
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProgram && matchesSearch;
    });

    const handleCreate = async () => {
        setError('');
        try {
            await api.post('/courses', {
                ...addForm,
                departmentId: user?.entityId,
                universityId: user?.universityId,
            });
            setIsAddOpen(false);
            setAddForm({ ...emptyForm });
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create subject.';
            setError(errorMsg);
        }
    };

    const handleEdit = async () => {
        if (!selectedId) return;
        setError('');
        try {
            await api.put(`/courses/${selectedId}`, editForm);
            setIsEditOpen(false);
            fetchData();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update subject.';
            setError(errorMsg);
        }
    };

    const handleDelete = (id: string) => {
        askConfirm({
            title: 'Delete Subject',
            message: 'Delete this subject? Faculty assignments for this subject will also be removed. This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/courses/${id}`);
                    fetchData();
                } catch (e) {
                    const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete subject.';
                    showToast('error', errorMsg);
                }
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Academic Subjects">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Subjects Catalog</h2>
                        <p className="text-slate-500">Manage all subjects offered across programs in your department.</p>
                    </div>
                    <Button onClick={() => { setError(''); setAddForm({ ...emptyForm }); setIsAddOpen(true); }} className="bg-primary shadow-md hover:bg-primary/90 shrink-0">
                        <LuPlus className="w-4 h-4 mr-2" /> Add Subject
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-full max-w-sm">
                        <LuFilter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            className="flex-1 text-sm bg-transparent outline-none"
                            value={filterProgram}
                            onChange={(e) => setFilterProgram(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {programs.map(p => <option key={p.id} value={p.shortName}>{p.name} ({p.shortName})</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-full max-w-sm">
                        <LuSearch className="w-4 h-4 text-slate-400 shrink-0" />
                        <Input
                            placeholder="Search by name or code..."
                            className="border-0 p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(course => (
                            <Card key={course.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <CardTitle className="text-base font-bold text-slate-800 line-clamp-2 leading-tight">{course.name}</CardTitle>
                                            <CardDescription className="font-mono font-bold text-sm mt-1 text-slate-500">{course.code}</CardDescription>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border shrink-0 ${typeColor[course.type] || 'bg-slate-100 text-slate-600'}`}>
                                            {course.type}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                        <div className="bg-slate-50 rounded-lg p-2">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Program</div>
                                            <div className="text-sm font-bold text-indigo-600">{course.program || '—'}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Credits</div>
                                            <div className="text-sm font-bold text-emerald-600">{course.credits}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">Semester</div>
                                            <div className="text-sm font-bold text-amber-600">{course.semester ? `Sem ${course.semester}` : '—'}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="w-1/2 hover:text-indigo-600 hover:bg-indigo-50"
                                            onClick={() => {
                                                setSelectedId(course.id);
                                                setEditForm({ name: course.name, code: course.code, program: course.program || '', semester: course.semester ?? 0, credits: course.credits, weeklyHrs: course.credits, type: course.type });
                                                setError('');
                                                setIsEditOpen(true);
                                            }}>
                                            <LuPencil className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-1/2 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleDelete(course.id)}>
                                            <LuTrash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border-dashed border-2 border-slate-200">
                                <LuBookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-slate-700">{filterProgram ? `No subjects for ${filterProgram}` : 'No subjects added yet'}</h3>
                                <p className="text-sm mt-1">Add subjects and link them to programs to enable timetable generation.</p>
                            </div>
                        )}
                    </div>
                )}

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Add New Subject</DialogTitle></DialogHeader>
                        <SubjectFormFields form={addForm} setForm={setAddForm} error={error} programs={programs} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!addForm.name || !addForm.code}>Add Subject</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
                        <SubjectFormFields form={editForm} setForm={setEditForm} error={error} programs={programs} />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEdit} disabled={!editForm.name || !editForm.code}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
}