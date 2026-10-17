import { useId, useState } from 'react';
import styles from './AuthLanding.module.css';

/**
 * LoginForm handles both login and registration against the auth API.
 *
 * @param {(authResponse: object) => void} onLogin Called with the auth payload on success.
 */
export default function LoginForm({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotSent, setForgotSent] = useState(false);

    const fieldId = useId();
    const isRegister = mode === 'register';
    const isForgot = mode === 'forgot';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Authentication failed.');
            }

            onLogin(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Something went wrong.');
            }

            setForgotSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (nextMode) => {
        setError('');
        setForgotSent(false);
        setMode(nextMode);
    };

    if (isForgot) {
        return (
            <>
                <header className={styles.panelHead}>
                    <h2 className={styles.panelTitle}>Reset password</h2>
                    <span className={styles.panelStep}>1 field</span>
                </header>

                {forgotSent ? (
                    <p className={styles.footnote}>
                        If an account exists for that email, we've sent a reset link.
                    </p>
                ) : (
                    <form className={styles.form} onSubmit={handleForgotSubmit} noValidate={false}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor={`${fieldId}-forgot-email`}>
                                Email
                            </label>
                            <input
                                id={`${fieldId}-forgot-email`}
                                className={styles.input}
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                required
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}

                        <div className={styles.actions}>
                            <button className={styles.submit} type="submit" disabled={loading}>
                                <span>{loading ? 'Sending…' : 'Send reset link'}</span>
                                <span className={styles.submitArrow} aria-hidden="true">→</span>
                            </button>
                        </div>
                    </form>
                )}

                <p className={styles.switchRow}>
                    <button className={styles.switch} type="button" onClick={() => switchMode('login')}>
                        Back to log in
                    </button>
                </p>
            </>
        );
    }

    return (
        <>
            <header className={styles.panelHead}>
                <h2 className={styles.panelTitle}>
                    {isRegister ? 'Create account' : 'Log in'}
                </h2>
                <span className={styles.panelStep}>
                    {isRegister ? '3 fields' : '2 fields'}
                </span>
            </header>

            <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
                {isRegister && (
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor={`${fieldId}-username`}>
                            Username
                        </label>
                        <input
                            id={`${fieldId}-username`}
                            className={styles.input}
                            name="username"
                            autoComplete="username"
                            placeholder="how the group sees you"
                            value={formData.username}
                            required
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                )}

                <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${fieldId}-email`}>
                        Email
                    </label>
                    <input
                        id={`${fieldId}-email`}
                        className={styles.input}
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        required
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${fieldId}-password`}>
                        Password
                    </label>
                    <input
                        id={`${fieldId}-password`}
                        className={styles.input}
                        type="password"
                        name="password"
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        placeholder="••••••••"
                        value={formData.password}
                        required
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    {!isRegister && (
                        <button
                            className={styles.switch}
                            type="button"
                            onClick={() => switchMode('forgot')}
                        >
                            Forgot password?
                        </button>
                    )}
                </div>

                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <div className={styles.actions}>
                    <button className={styles.submit} type="submit" disabled={loading}>
                        <span>
                            {loading
                                ? 'Working…'
                                : isRegister
                                    ? 'Create account'
                                    : 'Log in'}
                        </span>
                        <span className={styles.submitArrow} aria-hidden="true">→</span>
                    </button>

                    <p className={styles.switchRow}>
                        {isRegister ? 'Already have an account?' : 'No account yet?'}
                        <button
                            className={styles.switch}
                            type="button"
                            onClick={() => switchMode(isRegister ? 'login' : 'register')}
                        >
                            {isRegister ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </form>
        </>
    );
}
