import { useState, useEffect } from 'react';
import WeatherForecast from './WeatherForecast';
import TripMap from './TripMap';
import VoteSpotMap from './VoteSpotMap';
import { authFetch } from '../utils/authFetch';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/** Copy shown on the access-request screen, keyed by GET /members/me status. */
const ACCESS_COPY = {
    NOT_FOUND: {
        title: 'Trip not found',
        body: "This trip doesn't exist, or the link is wrong.",
    },
    NONE: {
        title: 'Request access',
        body: "You'll need the trip owner's approval to view this trip.",
    },
    PENDING: {
        title: 'Request sent',
        body: 'Waiting for the trip owner to approve your access.',
    },
    REJECTED: {
        title: 'Access denied',
        body: "The trip owner didn't approve your request to join this trip.",
    },
};

/**
 * TripDetails displays and manages a selected trip itinerary.
 *
 * It loads trip days, destination suggestions, votes, activities, weather, and
 * user actions for adding days, suggesting spots, voting, and joining activities.
 * Visitors who are not the owner or an approved member see a request-access
 * screen instead, since every other trip endpoint rejects them.
 */

export default function TripDetails({ tripId, trip, onBack, units, currentUserId }) {
    const [days, setDays] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [votedLocations, setVotedLocations] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [dayDataError, setDayDataError] = useState('');
    const [actionError, setActionError] = useState('');
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

    // Own access status for the current tripId, tagged with the tripId it was
    // fetched for so a stale response for a previous trip is ignored. Every
    // trip-scoped endpoint 403s anyone but the owner or an approved member,
    // so gate both the fetches and the view on this.
    const [accessResult, setAccessResult] = useState({ tripId: null, status: null });
    const [requestPending, setRequestPending] = useState(false);
    const [requestError, setRequestError] = useState('');

    const access = accessResult.tripId === tripId ? accessResult.status : null;
    const hasAccess = access === 'OWNER' || access === 'APPROVED';
    const isOwner = Boolean(trip?.user?.id) && trip.user.id === currentUserId;

    // Fetch the caller's own access status for this trip
    useEffect(() => {
        let cancelled = false;

        authFetch(`/api/trips/${tripId}/members/me`)
            .then(res => {
                if (res.status === 404) return { status: 'NOT_FOUND' };
                if (!res.ok) throw new Error('Failed to load access status.');
                return res.json();
            })
            .then(data => { if (!cancelled) setAccessResult({ tripId, status: data.status }); })
            .catch(err => {
                console.error('Failed to load access status:', err);
                if (!cancelled) setAccessResult({ tripId, status: 'NONE' });
            });

        return () => { cancelled = true; };
    }, [tripId]);

    const handleRequestAccess = async () => {
        setRequestPending(true);
        setRequestError('');
        try {
            const res = await authFetch(`/api/trips/${tripId}/members/request`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to request access.');
            const data = await res.json();
            setAccessResult({ tripId, status: data.status });
        } catch (err) {
            console.error(err);
            setRequestError('Could not request access. Try again.');
        } finally {
            setRequestPending(false);
        }
    };

    // Fetch all days for the trip
    useEffect(() => {
        if (!hasAccess) return;

        authFetch(`/api/trips/${tripId}/days`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load days.');
                return res.json();
            })
            .then(data => {
                setDays(data);
                if (data.length > 0) setSelectedDayId(data[0].id);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load days:", err);
                setLoadError('Could not load this trip. Try refreshing the page.');
                setLoading(false);
            });
    }, [tripId, hasAccess]);

    // Fetch activities and voted locations when selected day changes
    useEffect(() => {
        if (!selectedDayId || !hasAccess) return;

        let cancelled = false;

        const fetchLocations = authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load destinations.');
                return res.json();
            });

        const fetchActivities = authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load activities.');
                return res.json();
            });

        Promise.all([fetchLocations, fetchActivities])
            .then(([locData, actData]) => {
                if (cancelled) return;
                setVotedLocations(locData);
                setHasVoted(locData.some(d => d.voteCount !== null));
                setActivities(actData);
                setDayDataError('');
            })
            .catch(err => {
                console.error("Failed to load day data:", err);
                if (!cancelled) setDayDataError('Could not load activities or votes for this day.');
            });

        return () => { cancelled = true; };
    }, [selectedDayId, tripId, hasAccess]);

    // Fetch existing members on load
    useEffect(() => {
        if (!hasAccess) return;

        authFetch(`/api/trips/${tripId}/members`)
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error('Failed to load members:', err));
    }, [tripId, hasAccess]);

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
        try {
            const res = await authFetch(`/api/trips/${tripId}/members?email=${encodeURIComponent(email)}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove member.');
            setMembers(prev => prev.filter(m => m.email !== email));
        } catch (err) {
            console.error(err);
            setMemberStatus('Could not remove that member.');
            setTimeout(() => setMemberStatus(''), 3000);
        }
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

        setActionError('');
        authFetch(`/api/trips/${tripId}/days`, {
            method: 'POST',
            body: JSON.stringify({ date: newDayDate })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to add day.');
                return res.json();
            })
            .then(data => {
                setDays(prev => [...prev, data]);
                setSelectedDayId(data.id);
                setNewDayDate('');
            })
            .catch(err => {
                console.error(err);
                setActionError('Could not add that day.');
            });
    };

    const handleVote = (locationId) => {
        setActionError('');
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/vote?votedLocationId=${locationId}`, {
            method: 'POST'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to cast vote.');
                return authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`);
            })
            .then(res => res.json())
            .then(data => {
                setVotedLocations(data);
                setHasVoted(true);
            })
            .catch(err => {
                console.error(err);
                setActionError('Could not cast that vote.');
            });
    };

    const handleAddLocation = () => {
        if (!newLocation.trim() || !newLocationAddress.trim() || !newLocationVisitTime || !selectedDayId) {
            return;
        }

        setActionError('');
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/destinations`, {
            method: 'POST',
            body: JSON.stringify({
                name: newLocation,
                address: newLocationAddress,
                visitTime: newLocationVisitTime
            })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to add location.');
                return res.json();
            })
            .then(data => {
                setVotedLocations(prev => [...prev, data]);
                setNewLocation('');
                setNewLocationAddress('');
                setNewLocationVisitTime('');
            })
            .catch(err => {
                console.error(err);
                setActionError('Could not suggest that spot.');
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

        setActionError('');
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`, {
            method: 'POST',
            body: JSON.stringify(newActivity)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to add activity.');
                return authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`);
            })
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setNewActivity({ name: '', category: '', address: '', visitTime: '' });
            })
            .catch(err => {
                console.error(err);
                setActionError('Could not add that activity.');
            });
    };

    const handleJoinActivity = (activityId) => {
        setActionError('');
        authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities/${activityId}/join`, {
            method: 'POST'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to join activity.');
                return authFetch(`/api/trips/${tripId}/days/${selectedDayId}/activities`);
            })
            .then(res => res.json())
            .then(data => setActivities(data))
            .catch(err => {
                console.error(err);
                setActionError('Could not join that activity.');
            });
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

    if (access === null) return <p className={styles.note}>Loading...</p>;

    // Every trip-scoped endpoint 403s anyone who isn't the owner or an
    // approved member, so show a request-access screen instead of a page
    // full of empty, failed sections.
    if (!hasAccess) {
        const copy = ACCESS_COPY[access] || ACCESS_COPY.NONE;

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
                </header>

                <section className={dash.section}>
                    <div className={dash.rail}>
                        <span className={dash.caption}>Access</span>
                    </div>

                    <div>
                        <h2 className={dash.sectionTitle}>{copy.title}</h2>
                        <p className={styles.note}>{copy.body}</p>

                        {access === 'NONE' && (
                            <button
                                type="button"
                                className={`${dash.submit} ${styles.suggest}`}
                                onClick={handleRequestAccess}
                                disabled={requestPending}
                            >
                                <span>{requestPending ? 'Requesting…' : 'Request access'}</span>
                                <span className={dash.arrow} aria-hidden="true">→</span>
                            </button>
                        )}
                        {requestError && (
                            <p className={`${styles.note} ${styles.noteError} ${styles.noteTop}`}>{requestError}</p>
                        )}
                    </div>
                </section>
            </div>
        );
    }

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

            {loadError && (
                <p className={`${styles.note} ${styles.noteError} ${styles.noteTop}`}>{loadError}</p>
            )}
            {actionError && (
                <p className={`${styles.note} ${styles.noteError} ${styles.noteTop}`}>{actionError}</p>
            )}

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
                                    {isOwner && (
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
                                    )}
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
            ) : dayDataError ? (
                <section className={dash.section}>
                    <div className={dash.rail}>
                        <span className={dash.caption}>Activities</span>
                    </div>
                    <p className={`${styles.note} ${styles.noteError}`}>{dayDataError}</p>
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
