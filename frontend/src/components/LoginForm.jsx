// useId makes unique input ids; useState holds form state; styles come from the landing page CSS module.
import { useId, useState } from 'react';
import styles from './AuthLanding.module.css';

/**
 * LoginForm handles both login and registration against the auth API.
 *
 * @param {(authResponse: object) => void} onLogin Called with the auth payload on success.
 */
export default function LoginForm({ onLogin }) {
    // UI state: current mode (login | register | forgot), the typed field values, an error message and a submit-in-progress flag.
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // True after a forgot-password request succeeds, which swaps the form for a confirmation message.
    const [forgotSent, setForgotSent] = useState(false);

    // Unique id prefix so label/input pairs stay linked; isRegister/isForgot are derived from mode.
    const fieldId = useId();
    const isRegister = mode === 'register';
    const isForgot = mode === 'forgot';

    // Submits login or register to the backend; this uses fetch directly because there is no token yet (unlike authFetch).
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Picks the AuthController endpoint for the current mode.
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        try {
            // POST the form data as JSON to VITE_API_URL + endpoint.
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Response is a message string/object on failure or an AuthResponse (token + user) on success.
            const data = await response.json();

            // Failure: surface the backend message (string body or {message}) through the catch below.
            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Authentication failed.');
            }

            // Success: hand the auth payload to App.jsx's handleLogin, which stores the session.
            onLogin(data);
        // Show the error and always clear the loading flag.
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Sends the forgot-password request; the backend answers generically whether or not the email exists.
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // POST only the email to /api/auth/forgot-password.
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Something went wrong.');
            }

            // Show the generic confirmation message.
            setForgotSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Switches between login/register/forgot while clearing any previous error and confirmation.
    const switchMode = (nextMode) => {
        setError('');
        setForgotSent(false);
        setMode(nextMode);
    };

    // Forgot-password view (mode === 'forgot').
    if (isForgot) {
        return (
            <>
                {/* Panel heading. */}
                <header className={styles.panelHead}>
                    <h2 className={styles.panelTitle}>Reset password</h2>
                    <span className={styles.panelStep}>1 field</span>
                </header>

                {/* After sending, show the confirmation; otherwise show the email form. */}
                {forgotSent ? (
                    <p className={styles.footnote}>
                        If an account exists for that email, we've sent a reset link.
                    </p>
                ) : (
                    // Email-only form that calls handleForgotSubmit.
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

                        {/* Inline error from a failed request. */}
                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}

                        {/* Submit button, disabled and relabelled while loading. */}
                        <div className={styles.actions}>
                            <button className={styles.submit} type="submit" disabled={loading}>
                                <span>{loading ? 'Sending…' : 'Send reset link'}</span>
                                <span className={styles.submitArrow} aria-hidden="true">→</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* Link back to the login view. */}
                <p className={styles.switchRow}>
                    <button className={styles.switch} type="button" onClick={() => switchMode('login')}>
                        Back to log in
                    </button>
                </p>
            </>
        );
    }

    return (
        // Login / register view.
        <>
            {/* Heading changes with the mode. */}
            <header className={styles.panelHead}>
                <h2 className={styles.panelTitle}>
                    {isRegister ? 'Create account' : 'Log in'}
                </h2>
                <span className={styles.panelStep}>
                    {isRegister ? '3 fields' : '2 fields'}
                </span>
            </header>

            {/* Main form; submitting calls handleSubmit. */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
                {/* Username field is only needed when registering. */}
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

                {/* Email field. */}
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

                {/* Password field; autocomplete hint differs between register and login. */}
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
                    {/* 'Forgot password?' link only appears on the login view. */}
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

                {/* Inline error from a failed request. */}
                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                {/* Submit button (label depends on loading and mode) and the login/register switch link. */}
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
