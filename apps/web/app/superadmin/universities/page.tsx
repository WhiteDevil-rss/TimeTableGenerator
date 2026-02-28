'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuBuilding2, LuPlus, LuUsers, LuLayoutDashboard, LuPencil, LuTrash2, LuClipboardList } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast, Toast } from '@/components/ui/toast-alert';
import { useConfirm, ConfirmDialog } from '@/components/ui/confirm-dialog';

interface University {
    id: string;
    name: string;
    shortName: string;
    location?: string;
    email?: string;
    _count?: {
        departments: number;
        faculty: number;
    };
}

export default function SuperAdminDashboard() {
    const { toast, showToast, hideToast } = useToast();
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddUniOpen, setIsAddUniOpen] = useState(false);
    const [isEditUniOpen, setIsEditUniOpen] = useState(false);
    const [editingUni, setEditingUni] = useState<University | null>(null);

    const [newUniForm, setNewUniForm] = useState({
        name: '', shortName: '', location: '', email: '', adminUsername: '', adminPassword: ''
    });

    const [editUniForm, setEditUniForm] = useState({
        name: '', shortName: '', location: '', email: ''
    });

    const fetchUniversities = useCallback(async () => {
        try {
            const { data } = await api.get('/universities');
            setUniversities(data);
        } catch (e) {
            console.warn(e);
            showToast('error', 'Failed to fetch universities');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUniversities();
    }, [fetchUniversities]);

    const handleCreateUniversity = async () => {
        try {
            await api.post('/universities', newUniForm);
            setIsAddUniOpen(false);
            setNewUniForm({ name: '', shortName: '', location: '', email: '', adminUsername: '', adminPassword: '' });
            fetchUniversities();
            showToast('success', 'University and Admin account implicitly created!');
        } catch (e: any) {
            console.warn(e);
            const errorMessage = e.response?.data?.error || 'Failed to create university. Ensure shortName or admin username is unique.';
            showToast('error', errorMessage);
        }
    };

    const handleUpdateUniversity = async () => {
        if (!editingUni) return;
        try {
            await api.put(`/universities/${editingUni.id}`, editUniForm);
            setIsEditUniOpen(false);
            setEditingUni(null);
            fetchUniversities();
            showToast('success', 'University updated successfully!');
        } catch (e) {
            console.warn(e);
            showToast('error', 'Failed to update university.');
        }
    };

    const handleDeleteUniversity = async (id: string, name: string) => {
        askConfirm({
            title: `Delete ${name}?`,
            message: 'This will permanently delete ALL associated data including departments, courses, faculty, and users. This action cannot be undone.',
            danger: true,
            confirmLabel: 'Yes, Delete Everything',
            onConfirm: async () => {
                try {
                    await api.delete(`/universities/${id}`);
                    fetchUniversities();
                    showToast('success', 'University and all associated data deleted successfully!');
                } catch (e) {
                    console.warn(e);
                    showToast('error', 'Failed to delete university.');
                }
            }
        });
    };

    const openEditDialog = (uni: University) => {
        setEditingUni(uni);
        setEditUniForm({
            name: uni.name,
            shortName: uni.shortName,
            location: uni.location || '',
            email: uni.email || ''
        });
        setIsEditUniOpen(true);
    };


    const navItems = [
        { title: 'Overview', href: '/superadmin', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Universities', href: '/superadmin/universities', icon: <LuBuilding2 className="w-5 h-5" /> },
        { title: 'Users', href: '/superadmin/users', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Audit Logs', href: '/superadmin/logs', icon: <LuClipboardList className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN']}>
            <DashboardLayout navItems={navItems} title="Super Admin Dashboard">

                <div className="flex justify-between items-center mb-10 relative z-20">
                    <div>
                        <h2 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white glow-cyan">Universities Overview</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-light mt-1">Manage global university partitions securely via the Neural Constraint Solver matrix.</p>
                    </div>
                    <Button onClick={() => setIsAddUniOpen(true)} className="bg-neon-cyan text-white dark:text-slate-900 shadow-md dark:shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-lg hover:bg-cyan-600 dark:hover:bg-white font-bold transition-all px-6">
                        <LuPlus className="w-5 h-5 mr-2" /> Provision Partition
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-10 h-10 rounded-full border-4 border-neon-cyan border-t-transparent animate-spin shadow-[0_0_15px_rgba(57,193,239,0.5)]" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-20">
                        {universities.map(uni => (
                            <div key={uni.id} className="glass-card rounded-[1.5rem] overflow-hidden group hover:border-cyan-500/30 dark:hover:border-neon-cyan/40 transition-all duration-500 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(57,193,239,0.15)] relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[40px] rounded-full group-hover:bg-neon-cyan/25 dark:bg-neon-cyan/5 dark:group-hover:bg-neon-cyan/15 transition-colors duration-500" />

                                <div className="p-6 border-b border-slate-200 dark:border-white/5 relative z-10">
                                    <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-neon-cyan hover:bg-cyan-50 dark:hover:bg-neon-cyan/10 rounded-lg"
                                            onClick={() => openEditDialog(uni)}
                                        >
                                            <LuPencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                            onClick={() => handleDeleteUniversity(uni.id, uni.name)}
                                        >
                                            <LuTrash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-start justify-between pr-16 text-slate-900 dark:text-white mb-2">
                                        <span className="font-heading font-extrabold text-2xl tracking-tight">{uni.shortName}</span>
                                        <span className="px-3 py-1 bg-cyan-100 dark:bg-neon-cyan/10 border border-cyan-200 dark:border-neon-cyan/20 text-cyan-700 dark:text-neon-cyan text-xs font-bold uppercase rounded-full shrink-0 shadow-sm dark:shadow-[0_0_10px_rgba(57,193,239,0.1)]">ACTIVE</span>
                                    </div>
                                    <p className="line-clamp-1 text-slate-600 dark:text-slate-400 font-medium text-sm">{uni.name}</p>
                                </div>
                                <div className="p-6 pt-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm mb-3 group/stat">
                                        <span className="flex items-center text-slate-600 dark:text-slate-400 font-medium group-hover/stat:text-cyan-600 dark:group-hover/stat:text-neon-cyan transition-colors"><LuBuilding2 className="w-4 h-4 mr-2" /> Topology Sectors</span>
                                        <span className="font-bold text-slate-900 dark:text-white px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg group-hover/stat:border-cyan-300 dark:group-hover/stat:border-neon-cyan/30 transition-colors">{uni._count?.departments || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm group/stat">
                                        <span className="flex items-center text-slate-600 dark:text-slate-400 font-medium group-hover/stat:text-cyan-600 dark:group-hover/stat:text-neon-cyan transition-colors"><LuUsers className="w-4 h-4 mr-2" /> Active Resources</span>
                                        <span className="font-bold text-slate-900 dark:text-white px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg group-hover/stat:border-cyan-300 dark:group-hover/stat:border-neon-cyan/30 transition-colors">{uni._count?.faculty || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {universities.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-600 dark:text-slate-400 glass-card rounded-[2rem] border-dashed border-slate-300 dark:border-white/20">
                                No partitions allocated. Initialize a new matrix to commence optimization.
                            </div>
                        )}
                    </div>
                )}

                {/* Add University Modal */}
                <Dialog open={isAddUniOpen} onOpenChange={setIsAddUniOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Register New University</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Institution Name</label>
                                <Input
                                    placeholder="e.g. Veer Narmad South Gujarat University"
                                    value={newUniForm.name}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Name (Identifier)</label>
                                <Input
                                    placeholder="e.g. VNSGU"
                                    value={newUniForm.shortName}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, shortName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    placeholder="e.g. Surat, Gujarat"
                                    value={newUniForm.location}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="admin@vnsgu.ac.in"
                                    value={newUniForm.email}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, email: e.target.value })}
                                />
                            </div>

                            <hr className="my-4" />
                            <h4 className="text-sm font-semibold text-slate-800">Root Admin Account</h4>
                            <p className="text-xs text-slate-500 mb-2">This account will have total control over the newly provisioned university.</p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Username</label>
                                <Input
                                    placeholder="admin_vnsgu"
                                    value={newUniForm.adminUsername}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, adminUsername: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Temporary Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newUniForm.adminPassword}
                                    onChange={(e) => setNewUniForm({ ...newUniForm, adminPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddUniOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreateUniversity}
                                disabled={!newUniForm.name || !newUniForm.shortName || !newUniForm.adminUsername || !newUniForm.adminPassword}
                            >
                                Provision Tenant
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit University Modal */}
                <Dialog open={isEditUniOpen} onOpenChange={setIsEditUniOpen}>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit University Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Institution Name</label>
                                <Input
                                    placeholder="e.g. Veer Narmad South Gujarat University"
                                    value={editUniForm.name}
                                    onChange={(e) => setEditUniForm({ ...editUniForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Name (Identifier)</label>
                                <Input
                                    placeholder="e.g. VNSGU"
                                    value={editUniForm.shortName}
                                    onChange={(e) => setEditUniForm({ ...editUniForm, shortName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    placeholder="e.g. Surat, Gujarat"
                                    value={editUniForm.location}
                                    onChange={(e) => setEditUniForm({ ...editUniForm, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input
                                    type="email"
                                    placeholder="admin@vnsgu.ac.in"
                                    value={editUniForm.email}
                                    onChange={(e) => setEditUniForm({ ...editUniForm, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditUniOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleUpdateUniversity}
                                disabled={!editUniForm.name || !editUniForm.shortName}
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Toast toast={toast} onClose={hideToast} />
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
