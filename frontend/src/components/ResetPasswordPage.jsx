// React hooks, router navigation and the shared auth page styles.
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthLanding.module.css';

/**
 * ResetPasswordPage is the standalone screen reached from the emailed reset
 * link (`/reset-password?token=...`), rendered before the app's normal
 * login-gated routing takes over.
 *
 * Asymmetry: it keeps AuthLanding's 7/5 masthead-vs-panel split so the reset
 * flow reads as a continuation of the same auth surface rather than a
 * bespoke page.
 *
 * @param {(authResponse: object) => void} onLogin Called with the auth payload once the password is reset.
 */
export default function ResetPasswordPage({ onLogin }) {
    // navigate redirects after success; fieldId links labels to inputs; token is read from the ?token= query param of the emailed link.
    const navigate = useNavigate();
    const fieldId = useId();
    // How: window.location.search is the '?token=...' part of the URL; URLSearchParams parses it and get() returns null
    // when the parameter is missing.
    const token = new URLSearchParams(window.location.search).get('token');

    // Form state: both password fields, an error message and a submit-in-progress flag.
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Validates the two passwords match, then posts the token and new password to the backend.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Mismatch: show an error and stop before any request.
        // How: this client-side check avoids a round trip for a typo; the backend separately enforces the 8-character
        // minimum.
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Disable the submit button while the request runs.
        setLoading(true);

        try {
            // POST to /api/auth/reset-password (plain fetch: the user has no JWT yet).
            // How: the raw token and the new password are sent in the JSON body; the backend hashes the token to find
            // the user.
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            // Failure bodies are plain strings; success is an AuthResponse (token + user).
            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : 'Could not reset your password.');
            }

            // Success: log the user in through App.jsx's handleLogin, then go to the dashboard route.
            onLogin(data);
            // How: replace swaps the current history entry, so the Back button does not return to the reset URL with its
            // token.
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Page layout mirrors AuthLanding: masthead on the left, panel on the right.
    return (
        <main className={styles.page}>
            {/* Masthead headline. */}
            <section className={styles.masthead}>
                <p className={styles.eyebrow}>TravlBuds — Collaborative Planning</p>
                <h1 className={styles.display}>
                    Set a new
                    <span className={styles.displayThin}>
                        <span className={styles.displayMark}>password</span>
                    </span>
                </h1>
            </section>

            {/* Panel: shows an invalid-link message without a token, otherwise the reset form. */}
            <section className={styles.panel}>
                {/* How: a ternary inside JSX shows an error panel without a token and the form with one. */}
                {!token ? (
                    <>
                        <header className={styles.panelHead}>
                            <h2 className={styles.panelTitle}>Invalid link</h2>
                        </header>
                        <p className={styles.footnote}>
                            This reset link is missing or malformed. Request a new one from the log in screen.
                        </p>
                    </>
                ) : (
                    <>
                        <header className={styles.panelHead}>
                            <h2 className={styles.panelTitle}>Reset password</h2>
                            <span className={styles.panelStep}>2 fields</span>
                        </header>

                        {/* Reset form; submitting calls handleSubmit. */}
                        <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor={`${fieldId}-new-password`}>
                                    New password
                                </label>
                                <input
                                    id={`${fieldId}-new-password`}
                                    className={styles.input}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    required
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor={`${fieldId}-confirm-password`}>
                                    Confirm password
                                </label>
                                <input
                                    id={`${fieldId}-confirm-password`}
                                    className={styles.input}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    required
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            {/* Inline error (mismatch or backend failure). */}
                            {error && (
                                <p className={styles.error} role="alert">
                                    {error}
                                </p>
                            )}

                            {/* Submit button, disabled and relabelled while loading. */}
                            <div className={styles.actions}>
                                <button className={styles.submit} type="submit" disabled={loading}>
                                    <span>{loading ? 'Working…' : 'Set new password'}</span>
                                    <span className={styles.submitArrow} aria-hidden="true">→</span>
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </section>
        </main>
    );
}
