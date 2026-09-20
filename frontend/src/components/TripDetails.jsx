import { useState, useEffect } from 'react';
import WeatherForecast from './WeatherForecast';
import TripMap from './TripMap';
import VoteSpotMap from './VoteSpotMap';
import { authFetch } from '../utils/authFetch';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

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
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');

    const [members, setMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [memberStatus, setMemberStatus] = useState('');
    const [shareStatus, setShareStatus] = useState('');

    

    // Fetch all days for the trip
    useEffect(() => {
        authFetch(`/api/trips/${tripId}/days`)
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

        const fetchLocations = authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`)
            .then(res => res.json());

        const fetchActivities = authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`)
            .then(res => res.json());

        Promise.all([fetchLocations, fetchActivities])
            .then(([locData, actData]) => {
                setVotedLocations(locData);
                setHasVoted(locData.some(d => d.voteCount !== null));
                setActivities(actData);
            })
            .catch(err => console.error("Failed to load day data:", err));
    }, [selectedDayId, tripId]);

    // Fetch existing members on load
    useEffect(() => {
        authFetch(`/api/trips/${tripId}/members`)
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error('Failed to load members:', err));
    }, [tripId]);

    const handleAddMember = async () => {
        const email = newMemberEmail.trim().toLowerCase();
        if (!email) return;

        try {
            const res = await authFetch(`/api/trips/${tripId}/members`, {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            if (!res.ok) {
                const msg = await res.text();
                setMemberStatus(msg || 'Failed to add.');
            } else {
                const data = await res.json();
                setMembers(prev => [...prev, data]);
                setNewMemberEmail('');
                setMemberStatus('Access granted!');
            }
        } catch {
            setMemberStatus('Error adding member.');
        }
        setTimeout(() => setMemberStatus(''), 3000);
    };

    const handleRemoveMember = async (email) => {
        await authFetch(`/api/trips/${tripId}/members?email=${encodeURIComponent(email)}`, {
            method: 'DELETE'
        });
        setMembers(prev => prev.filter(m => m.email !== email));
    };

    const handleApproveMember = async (memberId) => {
        const res = await authFetch(`/api/trips/${tripId}/members/${memberId}/approve`, { method: 'POST' });
        if (res.ok) {
            const updated = await res.json();
            setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
        }
    };

    const handleRejectMember = async (memberId) => {
        const res = await authFetch(`/api/trips/${tripId}/members/${memberId}/reject`, { method: 'POST' });
        if (res.ok) {
            const updated = await res.json();
            setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
        }
    };

    const handleCopyShareLink = async () => {
        const shareUrl = `${window.location.origin}/trips/${tripId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareStatus('Link copied!');
            setTimeout(() => setShareStatus(''), 2000);
        } catch (error) {
            console.error('Failed to copy share link:', error);
            setShareStatus(shareUrl);
        }
    };

    const handleAddDay = () => {
        if (!newDayDate) return;

        authFetch(`/api/trips/${tripId}/days`, {
            method: 'POST',
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
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/vote?votedLocationId=${locationId}`, {
            method: 'POST'
        })
            .then(() => authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`))
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

        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`, {
            method: 'POST',
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

    const sendAiMessage = async (message) => {
        const trimmedMessage = message?.trim();

        if (!trimmedMessage) return;

        const userMessage = { role: 'user', content: trimmedMessage };
        setAiMessages(prev => [...prev, userMessage]);
        setAiLoading(true);

        try {
            const response = await authFetch('/api/ai/suggestions', {
                method: 'POST',
                body: JSON.stringify({
                    destination: trip?.destination,
                    date: days.find(day => day.id === selectedDayId)?.date,
                    message: trimmedMessage
                })
            });

            const data = await response.json();
            const reply = response.ok
                ? data.choices?.[0]?.message?.content || 'No response returned.'
                : data.error || 'The AI assistant is unavailable right now.';

            setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (error) {
            console.error('AI chat failed:', error);
            setAiMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Could not reach the AI assistant.' }
            ]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSuggestIdeas = () => {
        const selectedDay = days.find(day => day.id === selectedDayId);

        sendAiMessage(`
            Suggest 5 realistic activities or food spots for this trip day.

            Destination: ${trip?.destination}
            Date: ${selectedDay?.date}

            For each idea, include:
            - name
            - category
            - why it is good
            - best time of day
            - remind me to verify the precise address
            `);
    };

    const handleAddActivity = () => {
        if (!newActivity.name.trim() || !newActivity.address.trim() || !newActivity.visitTime || !selectedDayId) {
            return;
        }

        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`, {
            method: 'POST',
            body: JSON.stringify(newActivity)
        })
            .then(() => authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`))
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setNewActivity({ name: '', category: '', address: '', visitTime: '' });
            });
    };

    const handleJoinActivity = (activityId) => {
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities/${activityId}/join`, {
            method: 'POST'
        })
            .then(() => authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`))
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

    const activityValid = newActivity.name.trim() && newActivity.address.trim() && newActivity.visitTime;
    const spotValid = newLocation.trim() && newLocationAddress.trim() && newLocationVisitTime;

    if (loading) return <p className={styles.note}>Loading...</p>;

    const selectedDay = days.find(day => day.id === selectedDayId);

    const statusClass = (status) => {
        if (status === 'APPROVED') return styles.statusApproved;
        if (status === 'REJECTED') return styles.statusRejected;
        return styles.statusPending;
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button
                    type="button"
                    className={`${dash.textButton} ${styles.back}`}
                    onClick={onBack}
                >
                    ← Back to trips
                </button>

                <h2 className={styles.title}>{trip?.name || `Trip #${tripId}`}</h2>
                <p className={styles.destination}>{trip?.destination}</p>

                {/* SHARE LINK */}
                <div className={styles.share}>
                    <button type="button" className={dash.textButton} onClick={handleCopyShareLink}>
                        Share link
                    </button>
                    {shareStatus && (
                        <span className={styles.shareStatus}>{shareStatus}</span>
                    )}
                </div>
            </header>

            {/* TRIP ACCESS */}
            <section className={dash.section}>
                <div className={dash.rail}>
                    <span className={dash.caption}>Group</span>
                </div>

                <div>
                    <h2 className={dash.sectionTitle}>Trip access</h2>

                    {members.length > 0 && (
                        <ul className={`${styles.rows} ${styles.rowsFirst}`}>
                            {members.map(m => (
                                <li key={m.id} className={styles.memberRow}>
                                    <span className={styles.memberInfo}>
                                        <span className={styles.memberEmail}>{m.email}</span>
                                        <span className={`${styles.status} ${statusClass(m.status)}`}>{m.status}</span>
                                    </span>
                                    <span className={styles.memberActions}>
                                        {m.status === 'PENDING' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={dash.textButton}
                                                    onClick={() => handleApproveMember(m.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${dash.textButton} ${dash.danger}`}
                                                    onClick={() => handleRejectMember(m.id)}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            className={`${dash.textButton} ${dash.danger}`}
                                            onClick={() => handleRemoveMember(m.email)}
                                        >
                                            Remove
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className={styles.inlineForm}>
                        <label className={`${dash.field} ${styles.grow}`}>
                            <span className={dash.label}>Add by email</span>
                            <input
                                type="email"
                                className={dash.input}
                                placeholder="friend@example.com"
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddMember(); }}
                            />
                        </label>
                        <button
                            type="button"
                            className={`${dash.textButton} ${styles.inlineAction}`}
                            onClick={handleAddMember}
                            disabled={!newMemberEmail.trim()}
                        >
                            Add →
                        </button>
                    </div>
                    {memberStatus && (
                        <p className={`${styles.note} ${styles.noteTop}`}>{memberStatus}</p>
                    )}
                </div>
            </section>

            <TripMap destination={trip?.destination} mapProvider={units.mapProvider} />

            {/* DAY SELECTOR */}
            <section className={dash.section}>
                <div className={dash.rail}>
                    <span className={dash.caption}>Calendar</span>
                </div>

                <div>
                    <h2 className={dash.sectionTitle}>Days</h2>

                    {days.length > 0 && (
                        <div className={`${dash.options} ${styles.dayOptions}`}>
                            {days.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    className={dash.option}
                                    aria-pressed={selectedDayId === day.id}
                                    onClick={() => setSelectedDayId(day.id)}
                                >
                                    {day.date}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Add Day */}
                    <div className={styles.inlineForm}>
                        <label className={`${dash.field} ${styles.grow}`}>
                            <span className={dash.label}>Add a day</span>
                            <input
                                type="date"
                                className={dash.input}
                                value={newDayDate || ''}
                                onChange={e => setNewDayDate(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddDay(); }}
                            />
                        </label>
                        <button
                            type="button"
                            className={`${dash.textButton} ${styles.inlineAction}`}
                            onClick={handleAddDay}
                            disabled={!newDayDate}
                        >
                            Add day →
                        </button>
                    </div>
                </div>
            </section>

            <WeatherForecast destination={trip?.destination} tripDays={days} units={units} />
            <VoteSpotMap locations={dayStops} destination={trip?.destination} />

            {!selectedDayId ? (
                <section className={dash.section}>
                    <div className={dash.rail}>
                        <span className={dash.caption}>Next</span>
                    </div>
                    <p className={styles.note}>Add a day above to get started!</p>
                </section>
            ) : (
                <>
                    {/* ACTIVITY IDEAS SECTION */}
                    <section className={dash.section}>
                        <div className={dash.rail}>
                            <span className={dash.caption}>Activities</span>
                            {selectedDay && <span className={dash.caption}>{selectedDay.date}</span>}
                        </div>

                        <div>
                            <h2 className={dash.sectionTitle}>Activity ideas</h2>

                            <p className={styles.subhead}>Assistant</p>
                            <div className={styles.chatLog}>
                                {aiMessages.length === 0 ? (
                                    <p className={styles.note}>
                                        Ask for trip ideas or use the suggestion button.
                                    </p>
                                ) : (
                                    aiMessages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={message.role === 'user' ? styles.bubbleUser : styles.bubbleAi}
                                        >
                                            {message.content}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.inlineForm}>
                                <label className={`${dash.field} ${styles.grow}`}>
                                    <span className={dash.label}>Ask the AI</span>
                                    <input
                                        type="text"
                                        className={dash.input}
                                        placeholder="Somewhere quiet for lunch..."
                                        value={aiInput}
                                        onChange={e => setAiInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                sendAiMessage(aiInput);
                                                setAiInput('');
                                            }
                                        }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={`${dash.textButton} ${styles.inlineAction}`}
                                    onClick={() => {
                                        sendAiMessage(aiInput);
                                        setAiInput('');
                                    }}
                                    disabled={aiLoading || !aiInput.trim()}
                                >
                                    Send →
                                </button>
                            </div>

                            <button
                                type="button"
                                className={`${dash.submit} ${styles.suggest}`}
                                onClick={handleSuggestIdeas}
                                disabled={aiLoading || !selectedDayId}
                            >
                                <span>{aiLoading ? 'Thinking...' : 'Suggest ideas'}</span>
                                <span className={dash.arrow} aria-hidden="true">→</span>
                            </button>

                            <p className={styles.subhead}>On the plan</p>
                            {activities.length === 0 ? (
                                <p className={styles.note}>No activities yet. Add one below!</p>
                            ) : (
                                <ul className={styles.rows}>
                                    {activities.map(activity => (
                                        <li key={activity.id} className={styles.item}>
                                            <div>
                                                <span className={styles.itemName}>{activity.name}</span>
                                                {activity.category && (
                                                    <span className={styles.itemTag}>{activity.category}</span>
                                                )}
                                                {(activity.visitTime || activity.address) && (
                                                    <span className={styles.itemMeta}>
                                                        {[activity.visitTime, activity.address].filter(Boolean).join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.itemSide}>
                                                <button
                                                    type="button"
                                                    className={dash.textButton}
                                                    onClick={() => handleJoinActivity(activity.id)}
                                                >
                                                    Join
                                                </button>
                                                <span className={styles.itemCount}>
                                                    {activity.interestedUsers?.length || 0} interested
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className={styles.subhead}>Add an activity</p>
                            <div className={styles.formStack}>
                                <label className={dash.field}>
                                    <span className={dash.label}>Name</span>
                                    <input
                                        type="text"
                                        className={dash.input}
                                        placeholder="Activity name"
                                        value={newActivity.name}
                                        onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                    />
                                </label>
                                <div className={dash.fieldRow}>
                                    <label className={dash.field}>
                                        <span className={dash.label}>Category</span>
                                        <input
                                            type="text"
                                            className={dash.input}
                                            placeholder="Museum, Hike"
                                            value={newActivity.category}
                                            onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                        />
                                    </label>
                                    <label className={dash.field}>
                                        <span className={dash.label}>Time</span>
                                        <input
                                            type="time"
                                            className={dash.input}
                                            value={newActivity.visitTime}
                                            required
                                            onChange={e => setNewActivity({ ...newActivity, visitTime: e.target.value })}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                        />
                                    </label>
                                </div>
                                <label className={dash.field}>
                                    <span className={dash.label}>Address</span>
                                    <input
                                        type="text"
                                        className={dash.input}
                                        placeholder="Precise address required"
                                        value={newActivity.address}
                                        required
                                        onChange={e => setNewActivity({ ...newActivity, address: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={dash.submit}
                                    onClick={handleAddActivity}
                                    disabled={!activityValid}
                                >
                                    <span>Add activity</span>
                                    <span className={dash.arrow} aria-hidden="true">→</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* VOTE ON A RESTAURANT SECTION */}
                    <section className={dash.section}>
                        <div className={dash.rail}>
                            <span className={dash.caption}>Vote</span>
                            {selectedDay && <span className={dash.caption}>{selectedDay.date}</span>}
                        </div>

                        <div>
                            <h2 className={dash.sectionTitle}>Vote on a restaurant</h2>
                            {!hasVoted && (
                                <p className={styles.hint}>Cast your vote to see the results!</p>
                            )}

                            <p className={styles.subhead}>Options</p>
                            {votedLocations.length === 0 ? (
                                <p className={styles.note}>No locations suggested yet. Add one below!</p>
                            ) : (
                                <ul className={styles.rows}>
                                    {votedLocations.map(loc => (
                                        <li key={loc.id} className={styles.item}>
                                            <div>
                                                <span className={styles.itemName}>{loc.name}</span>
                                                {(loc.visitTime || loc.address) && (
                                                    <span className={styles.itemMeta}>
                                                        {[loc.visitTime, loc.address].filter(Boolean).join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.itemSide}>
                                                {hasVoted && (
                                                    <span className={styles.itemCount}>
                                                        {loc.voteCount} vote{loc.voteCount !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {!hasVoted && (
                                                    <button
                                                        type="button"
                                                        className={dash.textButton}
                                                        onClick={() => handleVote(loc.id)}
                                                    >
                                                        Vote
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Voting suggest a spot */}
                            <p className={styles.subhead}>Suggest a spot</p>
                            <div className={styles.formStack}>
                                <label className={dash.field}>
                                    <span className={dash.label}>Name</span>
                                    <input
                                        type="text"
                                        className={dash.input}
                                        placeholder="Spot name"
                                        value={newLocation}
                                        required
                                        onChange={e => setNewLocation(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                    />
                                </label>
                                <label className={dash.field}>
                                    <span className={dash.label}>Address</span>
                                    <input
                                        type="text"
                                        className={dash.input}
                                        placeholder="Precise address required"
                                        value={newLocationAddress}
                                        required
                                        onChange={e => setNewLocationAddress(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                    />
                                </label>
                                <label className={dash.field}>
                                    <span className={dash.label}>Time</span>
                                    <input
                                        type="time"
                                        className={dash.input}
                                        value={newLocationVisitTime}
                                        required
                                        onChange={e => setNewLocationVisitTime(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddLocation(); }}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={dash.submit}
                                    onClick={handleAddLocation}
                                    disabled={!spotValid}
                                >
                                    <span>Suggest a spot</span>
                                    <span className={dash.arrow} aria-hidden="true">→</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
