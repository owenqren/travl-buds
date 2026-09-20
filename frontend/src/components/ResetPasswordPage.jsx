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
    const navigate = useNavigate();
    const fieldId = useId();
    const token = new URLSearchParams(window.location.search).get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : 'Could not reset your password.');
            }

            onLogin(data);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.masthead}>
                <p className={styles.eyebrow}>TravlBuds — Collaborative Planning</p>
                <h1 className={styles.display}>
                    Set a new
                    <span className={styles.displayThin}>
                        <span className={styles.displayMark}>password</span>
                    </span>
                </h1>
            </section>

            <section className={styles.panel}>
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

                            {error && (
                                <p className={styles.error} role="alert">
                                    {error}
                                </p>
                            )}

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
