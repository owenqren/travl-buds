import { useState, useEffect } from 'react';
import WeatherForecast from './WeatherForecast';
import TripMap from './TripMap';
import VoteSpotMap from './VoteSpotMap';

/**
 * TripDetails displays and manages a selected trip itinerary.
 *
 * It loads trip days, destination suggestions, votes, activities, weather, and
 * user actions for adding days, suggesting spots, voting, and joining activities.
 */

export default function TripDetails({ tripId, trip, onBack, units }) {
    const [days, setDays] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [votedLocations, setVotedLocations] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLocation, setNewLocation] = useState('');
    const [newActivity, setNewActivity] = useState({
        name: '',
        category: '',
        address: '',
        visitTime: ''
    });
    const [newLocationAddress, setNewLocationAddress] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [newDayDate, setNewDayDate] = useState(null);
    const [newLocationVisitTime, setNewLocationVisitTime] = useState('');

    // TODO: remove later
    const currentUserId = 1;

    // Fetch all days for the trip
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days`)
            .then(res => res.json())
            .then(data => {
                setDays(data);
                if (data.length > 0) setSelectedDayId(data[0].id);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load days:", err);
                setLoading(false);
            });
    }, [tripId]);

    // Fetch activities and voted locations when selected day changes
    useEffect(() => {
        if (!selectedDayId) return;

        const fetchLocations = fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/destinations?userId=${currentUserId}`)
            .then(res => res.json());
        const fetchActivities = fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/activities`)
            .then(res => res.json());

        Promise.all([fetchLocations, fetchActivities])
            .then(([locData, actData]) => {
                setVotedLocations(locData);
                setHasVoted(locData.some(d => d.voteCount !== null));
                setActivities(actData);
            })
            .catch(err => console.error("Failed to load day data:", err));
    }, [selectedDayId]);

    const handleAddDay = () => {
        if (!newDayDate) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: newDayDate })
        })
            .then(res => res.json())
            .then(data => {
                setDays(prev => [...prev, data]);
                setSelectedDayId(data.id);
                setNewDayDate('');
            });
    };

    const handleVote = (locationId) => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/vote?userId=${currentUserId}&votedLocationId=${locationId}`, {
            method: 'POST'
        })
            .then(() => fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/destinations?userId=${currentUserId}`))
            .then(res => res.json())
            .then(data => {
                setVotedLocations(data);
                setHasVoted(true);
            });
    };

    const handleAddLocation = () => {
        if (!newLocation.trim() || !newLocationAddress.trim() || !newLocationVisitTime || !selectedDayId) {
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/destinations?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newLocation,
                address: newLocationAddress,
                visitTime: newLocationVisitTime
            })
        })
            .then(res => res.json())
            .then(data => {
                setVotedLocations(prev => [...prev, data]);
                setNewLocation('');
                setNewLocationAddress('');
                setNewLocationVisitTime('');

            });
    };

    const handleAddActivity = () => {
        if (!newActivity.name.trim() || !newActivity.address.trim() || !newActivity.visitTime || !selectedDayId) {
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/activities?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActivity)
        })
            .then(() => fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/activities`))
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setNewActivity({ name: '', category: '', address: '', visitTime: '' });
            });
    };

    const handleJoinActivity = (activityId) => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/activities/${activityId}/join?userId=${currentUserId}`, {
            method: 'POST'
        })
            .then(() => fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/days/${selectedDayId}/activities`))
            .then(res => res.json())
            .then(data => setActivities(data));
    };

    const dayStops = [
        ...activities.map(activity => ({
            id: `activity-${activity.id}`,
            name: activity.name,
            address: activity.address,
            visitTime: activity.visitTime,
            type: 'Activity'
        })),
        ...votedLocations.map(location => ({
            id: `spot-${location.id}`,
            name: location.name,
            address: location.address,
            visitTime: location.visitTime,
            type: 'Vote Spot'
        }))
    ].filter(stop => stop.address && stop.visitTime)
        .sort((a, b) => a.visitTime.localeCompare(b.visitTime));

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <button
                onClick={onBack}
                style={{ marginBottom: '20px', padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#2c3e50', color: '#fff' }}
            >
                ← Back
            </button>

            <h2 style={{ color: '#2c3e50', marginTop: 0 }}>{trip?.name || `Trip #${tripId}`}</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>📍 {trip?.destination}</p>
            <TripMap destination={trip?.destination} />

            {/* DAY SELECTOR */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                {days.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setSelectedDayId(day.id)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid #ccc',
                            backgroundColor: selectedDayId === day.id ? '#2c3e50' : '#fff',
                            color: selectedDayId === day.id ? '#fff' : '#2c3e50',
                            cursor: 'pointer',
                            fontWeight: selectedDayId === day.id ? 'bold' : 'normal'
                        }}
                    >
                        {day.date}
                    </button>
                ))}

                {/* Add Day */}
                <input
                    type="date"
                    value={newDayDate || ''}
                    onChange={e => setNewDayDate(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddDay(); }}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', colorScheme: 'light', color: '#2c3e50', backgroundColor: '#fff' }}
                />
                <button
                    onClick={handleAddDay}
                    style={{ padding: '8px 16px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
                >
                    + Add Day
                </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '20px' }} />
            <WeatherForecast destination={trip?.destination} tripDays={days} units={units} />
            <VoteSpotMap locations={dayStops} destination={trip?.destination} />

            {!selectedDayId ? (
                <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Add a day above to get started!</p>
            ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

                    {/* ACTIVITY IDEAS SECTION */}
                    <div style={{ flex: 1, minWidth: '280px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                        <h3 style={{ marginTop: 0, color: '#27ae60' }}>Activity Ideas</h3>

                        {activities.length === 0 ? (
                            <p style={{ color: '#7f8c8d' }}>No activities yet. Add one below!</p>
                        ) : (
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {activities.map(activity => (
                                    <li key={activity.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold' }}>{activity.name}</span>
                                                {activity.category && (
                                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#7f8c8d', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '10px' }}>
                                                        {activity.category}
                                                    </span>
                                                )}

                                                {activity.address && (
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                                                        📍 {activity.address}
                                                    </p>
                                                )}
                                                {activity.visitTime && (
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                                                        🕒 {activity.visitTime}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleJoinActivity(activity.id)}
                                                style={{ padding: '5px 10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Join
                                            </button>
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#95a5a6' }}>
                                            {activity.interestedUsers?.length || 0} interested
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div style={{ marginTop: '15px' }}>
                            <input
                                type="text"
                                placeholder="Activity name"
                                value={newActivity.name}
                                onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <input
                                type="text"
                                placeholder="Category (e.g. Museum, Hike)"
                                value={newActivity.category}
                                onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <input
                                type="text"
                                placeholder="Precise address required"
                                value={newActivity.address}
                                required
                                onChange={e => setNewActivity({ ...newActivity, address: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <input
                                type="time"
                                value={newActivity.visitTime}
                                required
                                onChange={e => setNewActivity({ ...newActivity, visitTime: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <button
                                onClick={handleAddActivity}
                                style={{ width: '100%', padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Add Activity
                            </button>
                        </div>
                    </div>

                    {/* VOTE ON A SPOT SECTION */}
                    <div style={{ flex: 1, minWidth: '280px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                        <h3 style={{ marginTop: 0, color: '#e74c3c' }}>Vote on a Spot</h3>
                        {!hasVoted && (
                            <p style={{ fontSize: '13px', color: '#e67e22', marginBottom: '10px' }}>
                                Cast your vote to see the results!
                            </p>
                        )}

                        {votedLocations.length === 0 ? (
                            <p style={{ color: '#7f8c8d' }}>No locations suggested yet. Add one below!</p>
                        ) : (
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {votedLocations.map(loc => (
                                    <li key={loc.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold' }}>{loc.name}</span>
                                            {hasVoted && (
                                                <span style={{ marginLeft: '10px', fontSize: '13px', color: '#7f8c8d' }}>
                                                    {loc.voteCount} vote{loc.voteCount !== 1 ? 's' : ''}
                                                </span>
                                            )}

                                            {loc.address && (
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                                                    📍 {loc.address}
                                                </p>
                                            )}
                                            {loc.visitTime && (
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                                                    🕒 {loc.visitTime}
                                                </p>
                                            )}
                                        </div>
                                        {!hasVoted && (
                                            <button
                                                onClick={() => handleVote(loc.id)}
                                                style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Vote
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Voting suggest a spot */}
                        <div style={{ marginTop: '15px' }}>
                            <input
                                type="text"
                                placeholder="Spot name"
                                value={newLocation}
                                required
                                onChange={e => setNewLocation(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <input
                                type="text"
                                placeholder="Precise address required"
                                value={newLocationAddress}
                                required
                                onChange={e => setNewLocationAddress(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <input
                                type="time"
                                value={newLocationVisitTime}
                                required
                                onChange={e => setNewLocationVisitTime(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <button
                                onClick={handleAddLocation}
                                style={{ width: '100%', padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Suggest a Spot
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}