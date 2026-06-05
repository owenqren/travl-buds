import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import './App.css';
/**
 * App coordinates the main TravlBuds dashboard.
 *
 * Loads the current user's trips, manages settings such as temperature and
 * distance units, and switches between the trip list and selected trip details.
 */
function App() {
    const [trips, setTrips] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [units, setUnits] = useState({ temperature: 'C', distance: 'km' });

    // TODO: Remove later
    const currentUserId = 1;

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips?userId=${currentUserId}`)
            .then(res => {
                if (!res.ok) throw new Error("Backend rejected the request!");
                return res.json();
            })
            .then(data => setTrips(data))
            .catch(err => console.error("Error fetching trips:", err));
    }, []);

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

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', margin: '0 0 8px' }}>TravlBuds</h1>
                <p style={{ color: '#7f8c8d', margin: '0 0 12px' }}>
                    Collaborative vacation planning
                </p>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        color: '#2c3e50',
                        border: '1px solid #b8c2cc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',

                    }}
                >
                    ⚙️ Settings
                </button>
            </header>

            {/* SETTINGS PANEL */}
            {showSettings && (
                <div style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Settings</h3>

                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>Temperature</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setUnits({ ...units, temperature: 'C' })}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: units.temperature === 'C' ? '#2c3e50' : '#fff', color: units.temperature === 'C' ? '#fff' : '#2c3e50', cursor: 'pointer' }}
                            >
                                °C
                            </button>
                            <button
                                onClick={() => setUnits({ ...units, temperature: 'F' })}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: units.temperature === 'F' ? '#2c3e50' : '#fff', color: units.temperature === 'F' ? '#fff' : '#2c3e50', cursor: 'pointer' }}
                            >
                                °F
                            </button>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>Distance</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setUnits({ ...units, distance: 'km' })}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: units.distance === 'km' ? '#2c3e50' : '#fff', color: units.distance === 'km' ? '#fff' : '#2c3e50', cursor: 'pointer' }}
                            >
                                km
                            </button>
                            <button
                                onClick={() => setUnits({ ...units, distance: 'mi' })}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: units.distance === 'mi' ? '#2c3e50' : '#fff', color: units.distance === 'mi' ? '#fff' : '#2c3e50', cursor: 'pointer' }}
                            >
                                mi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Routes>
                <Route
                    path="/"
                    element={
                        <>
                            <TripForm onTripAdded={handleTripAdded} />
                            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />
                            <TripList trips={trips} onViewDetails={handleViewTripDetails} />
                        </>
                    }
                />
                <Route
                    path="/trips/:tripId"
                    element={
                        <TripDetailsRoute
                            trips={trips}
                            onBack={handleBackToTrips}
                            units={units}
                        />
                    }
                />
            </Routes>
        </div>
    );
}
function TripDetailsRoute({ trips, onBack, units }) {
    const { tripId } = useParams();
    const numericTripId = Number(tripId);

    return (
        <TripDetails
            tripId={numericTripId}
            trip={trips.find(t => t.id === numericTripId)}
            onBack={onBack}
            units={units}
        />
    );
}

export default App;