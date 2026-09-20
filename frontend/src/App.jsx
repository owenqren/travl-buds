import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import './App.css';
import AuthLanding from './components/AuthLanding';
import { authFetch } from './utils/authFetch';
import styles from './components/Dashboard.module.css';

/** Settings shown in the settings panel; `key` is the field on the `units` state. */
const SETTINGS = [
    { key: 'temperature', label: 'Temperature', options: [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }] },
    { key: 'distance', label: 'Distance', options: [{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }] },
    { key: 'mapProvider', label: 'Map', options: [{ value: 'google', label: 'Google Maps' }, { value: 'baidu', label: 'Baidu Maps' }] },
];

/**
 * App coordinates the main TravlBuds dashboard.
 *
 * Loads the current user's trips, manages settings such as temperature and
 * distance units, and switches between the trip list and selected trip details.
 */
function App() {
    const [trips, setTrips] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [units, setUnits] = useState({ temperature: 'C', distance: 'km', mapProvider: 'google' });

    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('travlbudsUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (!currentUser) return;

        authFetch('/api/trips')
            .then(res => {
                if (!res.ok) throw new Error("Backend rejected the request!");
                return res.json();
            })
            .then(data => setTrips(data))
            .catch(err => console.error("Error fetching trips:", err));
    }, [currentUser]);

    const handleTripAdded = (newTrip) => {
        setTrips(prevTrips => [...prevTrips, newTrip]);
    };

    const navigate = useNavigate();

    const handleViewTripDetails = (tripId) => {
        navigate(`/trips/${tripId}`);
    };

    const handleBackToTrips = () => {
        navigate('/');
    };

    const handleLogin = (authResponse) => {
        const { token, ...user } = authResponse;

        localStorage.setItem('travlbudsToken', token);
        localStorage.setItem('travlbudsUser', JSON.stringify(user));

        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('travlbudsToken');
        localStorage.removeItem('travlbudsUser');
        setCurrentUser(null);
        setTrips([]);
        navigate('/');
    };

    if (!currentUser) {
        return <AuthLanding onLogin={handleLogin} />;
    }

    return (
        <div className={styles.shell}>
            <div>
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
                {showSettings && (
                    <section className={styles.settings} aria-label="Settings">
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

            <Routes>
                <Route
                    path="/"
                    element={
                        <div className={styles.stack}>
                            <TripForm onTripAdded={handleTripAdded} />
                            <hr className={styles.divider} />
                            <TripList trips={trips} onViewDetails={handleViewTripDetails} />
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

            <footer className={styles.footer}>
                <span className={styles.footerLabel}>Report a bug or request a feature</span>
                <a className={styles.footerLink} href="mailto:support@travlbuds.com">support@travlbuds.com</a>
            </footer>
        </div>
    );
}
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
