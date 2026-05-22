import { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import TripDetails from './components/TripDetails';
import './App.css';

function App() {
    const [trips, setTrips] = useState([]);
    
    //Track which trip the user wants to look at (null means show the main dashboard)
    const [selectedTripId, setSelectedTripId] = useState(null); 
    
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

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50' }}>TravlBuds</h1>
                <p style={{ color: '#7f8c8d' }}>Collaborative vacation planning</p>
            </header>

            {/*THE CONDITIONAL RENDER */}
            {selectedTripId ? (
                // IF a trip is selected, only show the Details page
                <TripDetails 
                    tripId={selectedTripId} 
                    onBack={() => setSelectedTripId(null)} 
                />
            ) : (
                // ELSE, show the normal dashboard
                <>
                    <TripForm onTripAdded={handleTripAdded} />
                    <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <TripList trips={trips} onViewDetails={setSelectedTripId} />
                </>
            )}
        </div>
    );
}

export default App;