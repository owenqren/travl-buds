// React state/effect hooks, router pieces, child screens, the authenticated fetch helper and the dashboard CSS module.
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import AuthLanding from './components/AuthLanding';
import ResetPasswordPage from './components/ResetPasswordPage';
import { authFetch } from './utils/authFetch';
import styles from './components/Dashboard.module.css';

/** Settings shown in the settings panel; `key` is the field on the `units` state. */
const SETTINGS = [
    { key: 'temperature', label: 'Temperature', options: [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }] },
    { key: 'distance', label: 'Distance', options: [{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }] },
    { key: 'mapProvider', label: 'Map', options: [{ value: 'google', label: 'Google Maps' }, { value: 'baidu', label: 'Baidu Maps' }] },
];

// Theme choices; 'system' means no data-theme attribute so the OS preference in index.css applies.
const THEME_OPTIONS = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

/**
 * App coordinates the main TravlBuds dashboard.
 *
 * Loads the current user's trips, manages settings such as temperature and
 * distance units, and switches between the trip list and selected trip details.
 */
function App() {
    // UI state: the trip list, settings panel visibility, unit preferences passed down as props, and the saved theme.
    const [trips, setTrips] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [units, setUnits] = useState({ temperature: 'C', distance: 'km', mapProvider: 'google' });
    // How: passing a function to useState makes React run it only on the first render, so localStorage is read once and
    // the saved theme survives page reloads.
    const [theme, setTheme] = useState(() => localStorage.getItem('travlbudsTheme') || 'system');

    // Logged-in user restored from localStorage ('travlbudsUser'); null shows the landing page.
    // How: the lazy initializer parses the JSON string saved at login; it returns null when nothing is saved, which
    // makes the component render the landing page.
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('travlbudsUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Applies the theme to <html data-theme> (read by index.css) and persists it.
    useEffect(() => {
        // How: removing the attribute lets the prefers-color-scheme media query in index.css decide, while data-
        // theme='light' or 'dark' triggers the explicit :root[data-theme] rules. The effect re-runs only when `theme`
        // changes because of its dependency array.
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('travlbudsTheme', theme);
    }, [theme]);

    // Loads the user's trips (owned + approved) from GET /api/trips whenever the logged-in user changes.
    useEffect(() => {
        if (!currentUser) return;

        // How: the effect depends on [currentUser], so it runs after login and after logout. The .then chain checks
        // res.ok, parses the JSON array and stores it in state, which re-renders TripList.
        authFetch('/api/trips')
            .then(res => {
                if (!res.ok) throw new Error("Backend rejected the request!");
                return res.json();
            })
            .then(data => setTrips(data))
            .catch(err => console.error("Error fetching trips:", err));
    }, [currentUser]);

    // Appends a freshly created trip (from TripForm) to the list without refetching.
    const handleTripAdded = (newTrip) => {
        // How: the functional form receives the latest state and returns a new array; React detects the change by
        // reference and re-renders the list.
        setTrips(prevTrips => [...prevTrips, newTrip]);
    };

    // Router navigation helpers: open a trip's detail route and return to the list.
    const navigate = useNavigate();

    const handleViewTripDetails = (tripId) => {
        navigate(`/trips/${tripId}`);
    };

    const handleBackToTrips = () => {
        navigate('/');
    };

    // Called by the login/register/reset forms: splits the token from the user, saves both to localStorage, then updates state.
    const handleLogin = (authResponse) => {
        // How: object rest syntax separates the token from every other field, so only the non-secret profile goes into
        // 'travlbudsUser' and component state.
        const { token, ...user } = authResponse;

        localStorage.setItem('travlbudsToken', token);
        localStorage.setItem('travlbudsUser', JSON.stringify(user));

        setCurrentUser(user);
    };

    // Clears the saved session and local state, then returns to the root route.
    const handleLogout = () => {
        localStorage.removeItem('travlbudsToken');
        localStorage.removeItem('travlbudsUser');
        setCurrentUser(null);
        setTrips([]);
        navigate('/');
    };

    // Emailed reset links land here; checked before the login gate so it works logged-out.
    // How: this reads the browser's raw path instead of using a Route, so it works before login; ResetPasswordPage reads
    // the token from the query string itself.
    if (window.location.pathname === '/reset-password') {
        return <ResetPasswordPage onLogin={handleLogin} />;
    }

    // Not logged in: show the public landing/auth screen.
    if (!currentUser) {
        return <AuthLanding onLogin={handleLogin} />;
    }

    return (
        <div className={styles.shell}>
            <div>
                {/* Masthead: wordmark plus Settings and Log out actions. */}
                <header className={styles.masthead}>
                    <p className={styles.eyebrow}>Collaborative vacation planning</p>
                    <h1 className={styles.wordmark}>
                        Travl<span className={styles.wordmarkThin}>Buds</span>
                    </h1>

                    <nav className={styles.actions} aria-label="Account">
                        <button
                            type="button"
                            className={styles.textButton}
                            aria-expanded={showSettings}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            Settings
                        </button>
                        <button
                            type="button"
                            className={`${styles.textButton} ${styles.danger}`}
                            onClick={handleLogout}
                        >
                            Log out
                        </button>
                    </nav>
                </header>

                {/* SETTINGS PANEL */}
                {/* How: && renders the panel only while showSettings is true; the Settings button flips that state. */}
                {showSettings && (
                    <section className={styles.settings} aria-label="Settings">
                        {/* Theme row: updates `theme`, which the effect above applies. */}
                        <div className={styles.settingRow}>
                            <span className={styles.caption}>Theme</span>
                            <div className={styles.options}>
                                {/* How: map turns each option object into a button; key lets React track items, and aria-
                                    pressed is what the CSS uses to draw the selected state. */}
                                {THEME_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={styles.option}
                                        aria-pressed={theme === option.value}
                                        onClick={() => setTheme(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* One row per entry in SETTINGS; each button updates the matching field on `units`. */}
                        {/* How: the computed property [key] in the onClick handler replaces only that one setting while
                            the spread copies the rest. The resulting units object is passed down as props to TripDetails
                            and on to the weather and map components. */}
                        {SETTINGS.map(({ key, label, options }) => (
                            <div key={key} className={styles.settingRow}>
                                <span className={styles.caption}>{label}</span>
                                <div className={styles.options}>
                                    {options.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={styles.option}
                                            aria-pressed={units[key] === option.value}
                                            onClick={() => setUnits({ ...units, [key]: option.value })}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>

            {/* Routes: "/" shows the new-trip form and trip list; "/trips/:tripId" shows one trip's details. */}
            {/* How: react-router compares the current URL with each Route path and renders only the matching element;
                BrowserRouter in main.jsx supplies the URL state through React context. */}
            <Routes>
                <Route
                    path="/"
                    element={
                        <div className={styles.stack}>
                            <TripForm onTripAdded={handleTripAdded} />
                            <hr className={styles.divider} />
                            <TripList trips={trips} onViewDetails={handleViewTripDetails} currentUserId={currentUser.id} />
                        </div>
                    }
                />
                <Route
                    path="/trips/:tripId"
                    element={
                        <TripDetailsRoute
                            trips={trips}
                            onBack={handleBackToTrips}
                            units={units}
                            currentUserId={currentUser.id}
                        />
                    }
                />
            </Routes>

            {/* Footer with the support contact. */}
            <footer className={styles.footer}>
                <span className={styles.footerLabel}>Report a bug or request a feature</span>
                <a className={styles.footerLink} href="mailto:support@travlbuds.com">support@travlbuds.com</a>
            </footer>
        </div>
    );
}
// Route wrapper: reads :tripId from the URL, finds that trip in the already-loaded list and renders TripDetails.
// How: useParams returns URL parameters as strings, so Number() converts the id before comparing it with the numeric
// trip ids. find() searches the trips already fetched and returns undefined until they load, which is why TripDetails
// uses trip?.name.
function TripDetailsRoute({ trips, onBack, units, currentUserId }) {
    const { tripId } = useParams();
    const numericTripId = Number(tripId);

    return (
        <TripDetails
            tripId={numericTripId}
            trip={trips.find(t => t.id === numericTripId)}
            onBack={onBack}
            units={units}
            currentUserId={currentUserId}
        />
    );
}

export default App;
