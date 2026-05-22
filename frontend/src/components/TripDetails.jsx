import { useState, useEffect } from 'react';

export default function TripDetails({ tripId, onBack }) {
    const [votedLocations, setVotedLocations] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLocation, setNewLocation] = useState('');
    const [newActivity, setNewActivity] = useState({ name: '', category: '' });
    const [hasVoted, setHasVoted] = useState(false);
    // TODO: remove later
    const currentUserId = 1;

    useEffect(() => {
        // Fetch voted locations
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/destinations?userId=${currentUserId}`)
            .then(res => res.json())
            .then(data => {
                setVotedLocations(data);
                setHasVoted(data.some(d => d.voteCount !== null));
            });

        // Fetch activities
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/activities`)
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setLoading(false);
            });
    }, [tripId]);

    const handleVote = (locationId) => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/vote?userId=${currentUserId}&destinationId=${locationId}`, {
            method: 'POST'
        })
            .then(res => res.text())
            .then(() => {
                // Refresh voted locations to show results
                return fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/destinations?userId=${currentUserId}`);
            })
            .then(res => res.json())
            .then(data => {
                setVotedLocations(data);
                setHasVoted(true);
            });
    };

    const handleAddLocation = () => {
        if (!newLocation.trim()) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/destinations?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newLocation })
        })
            .then(res => res.json())
            .then(data => {
                setVotedLocations(prev => [...prev, data]);
                setNewLocation('');
            });
    };

    const handleAddActivity = () => {
        if (!newActivity.name.trim()) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/activities?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActivity)
        })
            .then(res => res.text())
            .then(() => {
                return fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/activities`);
            })
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setNewActivity({ name: '', category: '' });
            });
    };

    const handleJoinActivity = (activityId) => {
        fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/activities/${activityId}/join?userId=${currentUserId}`, {
            method: 'POST'
        }).then(() => {
            return fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/activities`);
        })
            .then(res => res.json())
            .then(data => setActivities(data));
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <button
                onClick={onBack}
                style={{ marginBottom: '20px', padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#2c3e50' }}
            >
                Back
            </button>

            <h2 style={{ color: '#2c3e50', marginTop: 0 }}>Trip #{tripId}</h2>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '20px' }} />

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

                    {/* Add Activity Form */}
                    <div style={{ marginTop: '15px' }}>
                        <input
                            type="text"
                            placeholder="Activity name"
                            value={newActivity.name}
                            onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                        <input
                            type="text"
                            placeholder="Category (e.g. Museum, Hike)"
                            value={newActivity.category}
                            onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
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

                    {/* Add Location Form */}
                    <div style={{ marginTop: '15px' }}>
                        <input
                            type="text"
                            placeholder="e.g. Nobu, Shake Shack"
                            value={newLocation}
                            onChange={e => setNewLocation(e.target.value)}
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
        </div>
    );
}