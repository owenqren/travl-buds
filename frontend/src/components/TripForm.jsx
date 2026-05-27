import { useState } from 'react';
/**
 * TripForm lets a user create a new trip.
 *
 * It collects trip name, destination, start date, and end date, then posts the
 * trip to the backend and notifies the parent when creation succeeds.
 */
export default function TripForm({ onTripAdded }) {
    const [tripData, setTripData] = useState({
        name: '', destination: '', startDate: '', endDate: ''
    });

    // TODO: remove later
    const currentUserId = 1;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips?userId=${currentUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripData)
            });
            if (response.ok) {
                const newTrip = await response.json();
                onTripAdded(newTrip);
                setTripData({ name: '', destination: '', startDate: '', endDate: '' });
            }
        } catch (error) {
            console.error("Failed to save trip:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
                name="name"
                placeholder="Trip Name"
                value={tripData.name}
                onChange={e => setTripData({ ...tripData, name: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
                name="destination"
                placeholder="Destination"
                value={tripData.destination}
                onChange={e => setTripData({ ...tripData, destination: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
                type="date"
                value={tripData.startDate}
                onChange={e => setTripData({ ...tripData, startDate: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', colorScheme: 'light', color: '#2c3e50', backgroundColor: '#fff' }}
            />
            <input
                type="date"
                value={tripData.endDate}
                onChange={e => setTripData({ ...tripData, endDate: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', colorScheme: 'light', color: '#2c3e50', backgroundColor: '#fff' }}
            />
            <button
                type="submit"
                style={{ padding: '10px', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Add Trip
            </button>
        </form>
    );
}