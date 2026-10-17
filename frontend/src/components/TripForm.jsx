// useState holds the form fields; authFetch sends the authenticated POST; styles are the dashboard CSS module.
import { useState } from 'react';

import { authFetch } from '../utils/authFetch';
import styles from './Dashboard.module.css';

/**
 * TripForm lets a user create a new trip.
 *
 * It collects trip name, destination, start date, and end date, then posts the
 * trip to the backend and notifies the parent when creation succeeds.
 */
export default function TripForm({ onTripAdded }) {
    // Form fields as one object; reset after a successful save.
    const [tripData, setTripData] = useState({
        name: '', destination: '', startDate: '', endDate: ''
    });

    // Truthy only when name, destination and both dates are filled in.
    const isValid = tripData.name.trim() && tripData.destination.trim() && tripData.startDate && tripData.endDate;

    // Posts the trip to POST /api/trips; the owner is set server-side from the JWT.
    const handleSubmit = async (e) => {
        e.preventDefault();
        // The date fields also call this directly on Enter, bypassing the
        // submit button's disabled state, so re-check validity here too.
        if (!isValid) return;

        try {
            // authFetch adds the Bearer token and VITE_API_URL.
            const response = await authFetch('/api/trips', {
                method: 'POST',
                body: JSON.stringify(tripData)
            });
            // On success pass the saved trip to App.jsx (onTripAdded) and clear the form.
            if (response.ok) {
                const newTrip = await response.json();
                onTripAdded(newTrip);
                setTripData({ name: '', destination: '', startDate: '', endDate: '' });
            }
        } catch (error) {
            console.error("Failed to save trip:", error);
        }
    };
    // Layout: caption rail on the left, form on the right.
    return (
        <section className={styles.section}>
            {/* Section captions. */}
            <div className={styles.rail}>
                <span className={styles.caption}>01</span>
                <span className={styles.caption}>Plan</span>
            </div>

            <div>
                <h2 className={styles.sectionTitle}>New trip</h2>

                {/* Name and destination inputs update tripData. */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label className={styles.field}>
                        <span className={styles.label}>Trip name</span>
                        <input
                            name="name"
                            className={styles.input}
                            placeholder="Lisbon with the crew"
                            value={tripData.name}
                            onChange={e => setTripData({ ...tripData, name: e.target.value })}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>Destination</span>
                        <input
                            name="destination"
                            className={styles.input}
                            placeholder="Lisbon, Portugal"
                            value={tripData.destination}
                            onChange={e => setTripData({ ...tripData, destination: e.target.value })}
                        />
                    </label>
                    {/* Start and end dates; Enter submits via handleSubmit. */}
                    <div className={styles.fieldRow}>
                        <label className={styles.field}>
                            <span className={styles.label}>Start</span>
                            <input
                                type="date"
                                className={styles.input}
                                value={tripData.startDate}
                                onChange={e => setTripData({ ...tripData, startDate: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                            />
                        </label>
                        <label className={styles.field}>
                            <span className={styles.label}>End</span>
                            <input
                                type="date"
                                className={styles.input}
                                value={tripData.endDate}
                                onChange={e => setTripData({ ...tripData, endDate: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                            />
                        </label>
                    </div>
                    {/* Submit stays disabled until isValid. */}
                    <button type="submit" disabled={!isValid} className={styles.submit}>
                        <span>Add trip</span>
                        <span className={styles.arrow} aria-hidden="true">→</span>
                    </button>
                </form>
            </div>
        </section>
    );
}
