import { useState, useEffect } from 'react';
import WeatherForecast from './WeatherForecast';
import TripMap from './TripMap';
import VoteSpotMap from './VoteSpotMap';
import TripAccessRequest from './TripAccessRequest';
import TripMembers from './TripMembers';
import DaySelector from './DaySelector';
import ActivityPlanner from './ActivityPlanner';
import RestaurantVote from './RestaurantVote';
import { authFetch } from '../utils/authFetch';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/**
 * TripDetails displays and manages a selected trip itinerary.
 *
 * It owns the data fetching and mutation handlers for the trip's days,
 * members, activities, votes and AI chat, and composes the section
 * components (TripMembers, DaySelector, ActivityPlanner, RestaurantVote)
 * that render them. Visitors who are not the owner or an approved member
 * see TripAccessRequest instead, since every other trip endpoint 403s them.
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

    if (access === null) return <p className={styles.note}>Loading...</p>;

    // Every trip-scoped endpoint 403s anyone who isn't the owner or an
    // approved member, so show a request-access screen instead of a page
    // full of empty, failed sections.
    if (!hasAccess) {
        return (
            <TripAccessRequest
                tripId={tripId}
                tripName={trip?.name}
                onBack={onBack}
                access={access}
                requestPending={requestPending}
                requestError={requestError}
                onRequestAccess={handleRequestAccess}
            />
        );
    }

    if (loading) return <p className={styles.note}>Loading...</p>;

    const selectedDay = days.find(day => day.id === selectedDayId);

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

            <div className={styles.layout}>
                <div className={styles.sidebar}>
                    <DaySelector
                        days={days}
                        selectedDayId={selectedDayId}
                        onSelectDay={setSelectedDayId}
                        newDayDate={newDayDate}
                        setNewDayDate={setNewDayDate}
                        onAddDay={handleAddDay}
                    />

                    <TripMembers
                        members={members}
                        isOwner={isOwner}
                        newMemberEmail={newMemberEmail}
                        setNewMemberEmail={setNewMemberEmail}
                        memberStatus={memberStatus}
                        onAddMember={handleAddMember}
                        onApproveMember={handleApproveMember}
                        onRejectMember={handleRejectMember}
                        onRemoveMember={handleRemoveMember}
                    />
                </div>

                <div className={styles.main}>
                    <TripMap destination={trip?.destination} mapProvider={units.mapProvider} />
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
                            <ActivityPlanner
                                selectedDay={selectedDay}
                                aiMessages={aiMessages}
                                aiInput={aiInput}
                                setAiInput={setAiInput}
                                aiLoading={aiLoading}
                                onSendAiMessage={sendAiMessage}
                                onSuggestIdeas={handleSuggestIdeas}
                                activities={activities}
                                newActivity={newActivity}
                                setNewActivity={setNewActivity}
                                onAddActivity={handleAddActivity}
                                onJoinActivity={handleJoinActivity}
                            />

                            <RestaurantVote
                                selectedDay={selectedDay}
                                hasVoted={hasVoted}
                                votedLocations={votedLocations}
                                onVote={handleVote}
                                newLocation={newLocation}
                                setNewLocation={setNewLocation}
                                newLocationAddress={newLocationAddress}
                                setNewLocationAddress={setNewLocationAddress}
                                newLocationVisitTime={newLocationVisitTime}
                                setNewLocationVisitTime={setNewLocationVisitTime}
                                onAddLocation={handleAddLocation}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
