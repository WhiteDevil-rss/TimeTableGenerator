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
            console.error(e);
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
        } catch (e) {
            console.error(e);
            showToast('error', 'Failed to create university. Ensure shortName or admin username is unique.');
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
            console.error(e);
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
                    console.error(e);
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

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Universities Overview</h2>
                        <p className="text-slate-500">Manage all registered universities and their credentials.</p>
                    </div>
                    <Button onClick={() => setIsAddUniOpen(true)} className="bg-primary shadow-md hover:bg-primary/90">
                        <LuPlus className="w-4 h-4 mr-2" /> Add University
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {universities.map(uni => (
                            <Card key={uni.id} className="shadow-sm hover:shadow-md transition-all border-slate-200 group">
                                <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl relative">
                                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-primary"
                                            onClick={() => openEditDialog(uni)}
                                        >
                                            <LuPencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                                            onClick={() => handleDeleteUniversity(uni.id, uni.name)}
                                        >
                                            <LuTrash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="flex items-start justify-between pr-16 text-slate-800">
                                        <span className="font-semibold text-lg">{uni.shortName}</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">ACTIVE</span>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1">{uni.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                                        <span className="flex items-center"><LuBuilding2 className="w-4 h-4 mr-2 text-primary/70" /> Departments</span>
                                        <span className="font-semibold px-2 bg-slate-100 rounded-md">{uni._count?.departments || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                                        <span className="flex items-center"><LuUsers className="w-4 h-4 mr-2 text-primary/70" /> Faculty</span>
                                        <span className="font-semibold px-2 bg-slate-100 rounded-md">{uni._count?.faculty || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {universities.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                No universities found. Please add one to get started.
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
