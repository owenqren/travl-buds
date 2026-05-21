import { useState } from 'react';

export default function TripForm({ onTripAdded }) {
    const [tripData, setTripData] = useState({
        name: '', destination: '', startDate: '', endDate: ''
    });

    // TODO: Remove later
    const currentUserId = 1;

    const handleChange = (e) => {
        setTripData({ ...tripData, [e.target.name]: e.target.value });
    };

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
        <form onSubmit={handleSubmit}>
            <input
                name="name"
                placeholder="Trip Name"
                value={tripData.name}
                onChange={handleChange}
            />
            <input
                name="destination"
                placeholder="Destination"
                value={tripData.destination}
                onChange={handleChange}
            />
            <input
                name="startDate"
                type="date"
                value={tripData.startDate}
                onChange={handleChange}
            />
            <input
                name="endDate"
                type="date"
                value={tripData.endDate}
                onChange={handleChange}
            />
            <button type="submit">Add Trip</button>
        </form>
    );
}