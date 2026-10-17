// LoginForm is the login/register/forgot form; AuthLanding.module.css supplies the landing page styles.
import LoginForm from './LoginForm';
import styles from './AuthLanding.module.css';

// Marketing copy for the landing page, rendered by the list below.
/**
 * Index of what TravlBuds does, shown beside the auth form.
 * Kept as data so the masthead stays declarative.
 */
const CAPABILITIES = [
    { num: '01', label: 'Suggest, then decide together', note: 'Anonymous voting on spots and restaurants — results revealed once everyone is in.' },
    { num: '02', label: 'A day-by-day itinerary', note: 'Activities and voted locations ordered by day, with travel times and forecast.' },
    { num: '03', label: 'Opt in, not out', note: 'Nobody is signed up for the 6am hike by default. Members join what they want.' },
];

/**
 * AuthLanding renders the unauthenticated surface: an editorial masthead
 * paired with the login/register form.
 *
 * @param {(authResponse: object) => void} onLogin Called with the auth payload on success.
 */
// Presentational component: no state of its own; it forwards onLogin (App.jsx handleLogin) to LoginForm.
export default function AuthLanding({ onLogin }) {
    return (
        // Page layout: left masthead, right auth panel.
        <main className={styles.page}>
            {/* Masthead: headline, pitch and capability list. */}
            <section className={styles.masthead}>
                <p className={styles.eyebrow}>TravlBuds — Collaborative Planning</p>

                {/* Display headline. */}
                <h1 className={styles.display}>
                    Plan the trip
                    <span className={styles.displayThin}>
                        without the <span className={styles.displayMark}>group chat</span>
                    </span>
                </h1>

                {/* Short pitch paragraph. */}
                <p className={styles.lede}>
                    Nine people, one thread, forty unread messages and still no booking.
                    TravlBuds turns that into a plan everyone actually agreed to.
                </p>

                {/* Numbered list built from CAPABILITIES. */}
                <ol className={styles.index}>
                    {CAPABILITIES.map(({ num, label, note }) => (
                        <li key={num} className={styles.indexItem}>
                            <span className={styles.indexNum}>{num}</span>
                            <span className={styles.indexLabel}>
                                {label}
                                <span className={styles.indexNote}>{note}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Auth panel: LoginForm plus a privacy note. */}
            <section className={styles.panel}>
                <LoginForm onLogin={onLogin} />

                <p className={styles.footnote}>
                    Trips, groups and votes stay private to your group.
                </p>
            </section>
        </main>
    );
}
