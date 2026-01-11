import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { nl } from '@/lib/translations';
import LoginBg from '@/assets/login-bg.jpg';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError(null);

        try {
            await pb.collection('users').requestPasswordReset(email);
            setStatus('success');
        } catch (err: unknown) {
            console.error('Password reset request failed:', err);
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : nl.error;
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
                        <span className="text-5xl">🔐</span>
                        <h1 className="text-2xl font-bold mt-2">{nl.resetPassword}</h1>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="alert alert-success">
                                <span>{nl.emailSent}</span>
                            </div>
                            <p>{nl.checkEmail}</p>
                            <Link to="/login" className="btn btn-primary w-full">
                                {nl.backToLogin}
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
                                    <span className="label-text">{nl.email}</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="je@email.nl"
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
                                    nl.requestResetLink
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
