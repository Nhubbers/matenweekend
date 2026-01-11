import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { nl } from '@/lib/translations';
import LoginBg from '@/assets/login-bg.jpg';

export function ConfirmPasswordResetPage() {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setError(nl.passwordMinLength);
            return;
        }

        if (password !== passwordConfirm) {
            setError(nl.passwordsDoNotMatch);
            return;
        }

        setStatus('loading');
        setError(null);

        try {
            await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
            setStatus('success');
        } catch (err: unknown) {
            console.error('Password reset confirmation failed:', err);
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : nl.passwordResetError;
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${LoginBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            </div>

            <div className="card w-full max-w-sm bg-base-200/90 shadow-xl z-10 backdrop-blur-md">
                <div className="card-body">
                    <div className="text-center mb-4">
                        <span className="text-5xl">🔄</span>
                        <h1 className="text-2xl font-bold mt-2">{nl.resetPassword}</h1>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="alert alert-success">
                                <span>{nl.passwordResetSuccess}</span>
                            </div>
                            <Link to="/login" className="btn btn-primary w-full">
                                {nl.login}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="alert alert-error">
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{nl.newPassword}</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{nl.confirmPassword}</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    nl.resetPassword
                                )}
                            </button>

                            <div className="text-center mt-2">
                                <Link to="/login" className="link link-hover text-sm">
                                    {nl.backToLogin}
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
