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
    const [tripData, setTripData] = useState({
        name: '', destination: '', startDate: '', endDate: ''
    });

    const isValid = tripData.name.trim() && tripData.destination.trim() && tripData.startDate && tripData.endDate;

    const handleSubmit = async (e) => {
        e.preventDefault();
        // The date fields also call this directly on Enter, bypassing the
        // submit button's disabled state, so re-check validity here too.
        if (!isValid) return;

        try {
            const response = await authFetch('/api/trips', {
                method: 'POST',
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
        <section className={styles.section}>
            <div className={styles.rail}>
                <span className={styles.caption}>01</span>
                <span className={styles.caption}>Plan</span>
            </div>

            <div>
                <h2 className={styles.sectionTitle}>New trip</h2>

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
                    <button type="submit" disabled={!isValid} className={styles.submit}>
                        <span>Add trip</span>
                        <span className={styles.arrow} aria-hidden="true">→</span>
                    </button>
                </form>
            </div>
        </section>
    );
}
