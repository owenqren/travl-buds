import { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import './App.css';

function App() {
  // 1. State to hold the master list of trips
  const [trips, setTrips] = useState([]);

  // 2. Fetch all trips from Spring Boot when the app first opens
  useEffect(() => {

    fetch(`${import.meta.env.VITE_API_URL}/api/trips`,)
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Error fetching trips:", err));
  }, []);

  // 3. The function we pass to the form to update the UI instantly
  const handleTripAdded = (newTrip) => {
    setTrips(prevTrips => [...prevTrips, newTrip]);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50' }}>Fairshare Travel</h1>
        <p style={{ color: '#7f8c8d' }}>Collaborative vacation planning</p>
      </header>
      
      {/* New Form component */}
      <TripForm onTripAdded={handleTripAdded} />
      
      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} />
      
      {/* List component */}
      <TripList trips={trips} />
      
    </div>
  );
}

export default App;