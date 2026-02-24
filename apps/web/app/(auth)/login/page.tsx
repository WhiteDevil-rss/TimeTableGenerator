'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GraduationCap, LogIn } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user } = response.data;

            setAuth(user, token);

            // Redirect based on role
            switch (user.role) {
                case 'SUPERADMIN':
                    router.push('/superadmin');
                    break;
                case 'UNI_ADMIN':
                    router.push('/dashboard');
                    break;
                case 'DEPT_ADMIN':
                    router.push('/department');
                    break;
                case 'FACULTY':
                    router.push('/faculty-panel');
                    break;
                default:
                    router.push('/');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('Invalid username or password');
            } else {
                setError('Something went wrong. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="space-y-1 pb-6 relative overflow-hidden rounded-t-xl bg-primary text-primary-foreground">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                            <GraduationCap className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-white mb-2 text-center leading-tight">
                            Zembaa Solution
                        </CardTitle>
                        <CardDescription className="text-blue-100 text-center font-medium">
                            Intelligent Scheduling Reinvented
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Username
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g. admin_vnsgu"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none">Password</label>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col border-t bg-gray-50/50 pt-6 text-xs text-center text-gray-500 rounded-b-xl">
                    <p>Demo Accounts:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono w-full text-left bg-white p-3 rounded border">
                        <div><span className="font-semibold text-gray-700">superadmin</span> / password123</div>
                        <div><span className="font-semibold text-gray-700">admin_vnsgu</span> / password123</div>
                        <div><span className="font-semibold text-gray-700">admin_dcs_vnsgu</span> / password123</div>
                        <div><span className="font-semibold text-gray-700">ravi</span> / password123</div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
