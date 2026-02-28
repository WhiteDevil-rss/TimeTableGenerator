'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuBuilding2, LuUsers, LuLayoutDashboard, LuUserPlus, LuShieldAlert, LuKeyRound, LuPower, LuPowerOff, LuClipboardList } from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    universityId?: string;
    university?: University;
    isActive: boolean;
}

interface University {
    id: string;
    name: string;
    shortName: string;
}

export default function SuperAdminUsers() {
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    // Modals state
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [universitiesList, setUniversitiesList] = useState<University[]>([]);

    // Form inputs
    const [newUserForm, setNewUserForm] = useState({ username: '', email: '', password: '', role: 'SUPERADMIN', universityId: '' });
    const [editUserForm, setEditUserForm] = useState({ username: '', email: '', role: 'SUPERADMIN', universityId: '' });
    const [newPassword, setNewPassword] = useState('');


    const fetchUniversities = useCallback(async () => {
        try {
            const { data } = await api.get('/universities');
            setUniversitiesList(data);
        } catch (e) {
            console.error('Failed to load universities:', e);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsersList(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchUniversities();
    }, [fetchUsers, fetchUniversities]);

    const handleCreateUser = async () => {
        try {
            const payload = { ...newUserForm, entityId: newUserForm.universityId || null };
            await api.post('/users', payload);
            setIsAddUserOpen(false);
            setNewUserForm({ username: '', email: '', password: '', role: 'SUPERADMIN', universityId: '' });
            fetchUsers();
        } catch {
            showToast('error', 'Failed to create user. Ensure username/email are unique.');
        }
    };

    const handleEditUser = async () => {
        if (!selectedUserId) return;
        try {
            const payload = { ...editUserForm, entityId: editUserForm.universityId || null };
            await api.put(`/users/${selectedUserId}`, payload);
            setIsEditUserOpen(false);
            fetchUsers();
            showToast('success', 'User updated successfully!');
        } catch {
            showToast('error', 'Failed to update user. Username or email might be in use.');
        }
    };

    const handleDeleteUser = (id: string) => {
        askConfirm({
            title: 'Delete User',
            message: 'Permanently delete this user account? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    fetchUsers();
                } catch {
                    showToast('error', 'Failed to delete user. Cannot delete your own account.');
                }
            },
        });
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
            fetchUsers();
        } catch {
            showToast('error', 'Failed to update status. Cannot disable your own account.');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUserId || newPassword.length < 6) {
            showToast('error', 'Password must be at least 6 characters.');
            return;
        }
        try {
            await api.patch(`/users/${selectedUserId}/password`, { newPassword });
            setIsResetPasswordOpen(false);
            setNewPassword('');
            setSelectedUserId(null);
            showToast('success', 'Password reset successfully!');
        } catch {
            showToast('error', 'Failed to reset password.');
        }
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
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Users Directory</h2>
                        <p className="text-slate-500">Manage platform access, roles, and reset credentials securely.</p>
                    </div>
                    <Button onClick={() => setIsAddUserOpen(true)} className="bg-primary shadow-md hover:bg-primary/90">
                        <LuUserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : (
                    <Card className="shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle>Registered Accounts</CardTitle>
                            <CardDescription>A complete list of users registered across the multi-tenant architecture.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">User</th>
                                            <th className="px-6 py-4 font-semibold">Role</th>
                                            <th className="px-6 py-4 font-semibold">Affiliation</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usersList.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800">{user.username}</div>
                                                    <div className="text-slate-500 text-xs">{user.email || 'No email provided'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 font-mono">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {user.university ? user.university.shortName : 'System Wide'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.isActive ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></div> Disabled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUserId(user.id);
                                                            setEditUserForm({
                                                                username: user.username,
                                                                email: user.email || '',
                                                                role: user.role,
                                                                universityId: user.universityId || ''
                                                            });
                                                            setIsEditUserOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setSelectedUserId(user.id); setIsResetPasswordOpen(true); }}
                                                    >
                                                        <LuKeyRound className="w-3.5 h-3.5 mr-1" /> Reset
                                                    </Button>
                                                    <Button
                                                        variant={user.isActive ? "outline" : "default"}
                                                        className={user.isActive ? "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" : ""}
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                    >
                                                        {user.isActive ? <LuPowerOff className="w-3.5 h-3.5 mr-1" /> : <LuPower className="w-3.5 h-3.5 mr-1" />}
                                                        {user.isActive ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {usersList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                    <LuShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                    No users found in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Add User Modal */}
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    placeholder="Enter username"
                                    value={newUserForm.username}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Temporary Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">System Role</label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <option value="SUPERADMIN">Super Admin</option>
                                    <option value="UNI_ADMIN">University Admin</option>
                                    <option value="DEPT_ADMIN">Department Admin</option>
                                    <option value="FACULTY">Faculty</option>
                                </select>
                            </div>
                            {newUserForm.role !== 'SUPERADMIN' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">University Assignment</label>
                                    <select
                                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                                        value={newUserForm.universityId}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, universityId: e.target.value })}
                                    >
                                        <option value="">-- Select University --</option>
                                        {universitiesList.map((uni) => (
                                            <option key={uni.id} value={uni.id}>{uni.name} ({uni.shortName})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateUser} disabled={!newUserForm.username || !newUserForm.password}>Provision Account</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit User Modal */}
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    placeholder="Enter username"
                                    value={editUserForm.username}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={editUserForm.email}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">System Role</label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                                    value={editUserForm.role}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                                >
                                    <option value="SUPERADMIN">Super Admin</option>
                                    <option value="UNI_ADMIN">University Admin</option>
                                    <option value="DEPT_ADMIN">Department Admin</option>
                                    <option value="FACULTY">Faculty</option>
                                </select>
                            </div>
                            {editUserForm.role !== 'SUPERADMIN' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">University Assignment</label>
                                    <select
                                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                                        value={editUserForm.universityId}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, universityId: e.target.value })}
                                    >
                                        <option value="">-- Select University --</option>
                                        {universitiesList.map((uni) => (
                                            <option key={uni.id} value={uni.id}>{uni.name} ({uni.shortName})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditUser} disabled={!editUserForm.username}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Modal */}
                <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Force Password Reset</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-red-600">New Secure Password</label>
                                <Input
                                    type="password"
                                    placeholder="Enter new 6+ char password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">This action cannot be undone. The user will be required to use this new credential to authenticate.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
                            <Button variant="outline" className="bg-red-600 text-white hover:bg-red-700 hover:text-white" onClick={handleResetPassword} disabled={newPassword.length < 6}>Reset Credentials</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DashboardLayout>
        </ProtectedRoute>
    );
}
