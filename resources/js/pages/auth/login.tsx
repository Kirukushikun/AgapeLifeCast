import { useEffect, useState } from 'react';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';

type Props = { status?: string };

export default function Login({ status }: Props) {
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShowLogin(true), 3400);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <Head title="Sign In" />

            <div className="lc-ls-screen">
                <div className="lc-ls-grid" />
                <div className="lc-ls-glow" />

                {/* Brand — slides up when login shows */}
                <div className={`lc-ls-brand${showLogin ? ' show-login' : ''}`}>
                    <img
                        className="lc-ls-logo"
                        src="/images/lcmi-lifecast.png"
                        alt="LCMI LifeCast"
                    />
                    <div className="lc-ls-tagline">Presentation · Made Simple</div>
                </div>

                {/* Loading bar + status — hidden when login shows */}
                <div className={`lc-ls-bar-wrap${showLogin ? ' hide' : ''}`}>
                    <div className="lc-ls-bar" />
                </div>
                <div className={`lc-ls-status${showLogin ? ' hide' : ''}`}>
                    Starting up…
                </div>

                {/* Login form — appears after loading */}
                <Form
                    action="/login"
                    method="post"
                    resetOnSuccess={['password']}
                    className={`lc-ls-form${showLogin ? ' show' : ''}`}
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="lc-ls-form-label">Sign in to continue</div>

                            <div>
                                <input
                                    className={`lc-ls-input${errors.email ? ' has-error' : ''}`}
                                    type="email"
                                    name="email"
                                    placeholder="Email address"
                                    autoComplete="email"
                                    autoFocus
                                    tabIndex={1}
                                />
                                <InputError message={errors.email} className="lc-ls-error" />
                            </div>

                            <div>
                                <input
                                    className={`lc-ls-input${errors.password ? ' has-error' : ''}`}
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    tabIndex={2}
                                />
                                <InputError message={errors.password} className="lc-ls-error" />
                            </div>

                            <button
                                className="lc-ls-submit"
                                type="submit"
                                disabled={processing}
                                tabIndex={3}
                            >
                                {processing && <span className="lc-ls-spinner" />}
                                {processing ? 'Signing in…' : 'Sign In'}
                            </button>

                            {status && (
                                <div className="lc-ls-error" style={{ textAlign: 'center' }}>
                                    {status}
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

// Bypass the default auth layout — this page is self-contained full-screen
(Login as any).layout = null;
