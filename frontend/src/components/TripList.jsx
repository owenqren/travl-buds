// Dashboard CSS module.
import styles from './Dashboard.module.css';

/**
 * TripList displays the user's saved itineraries.
 *
 * It renders an empty state when no trips exist and lets users open the details
 * view for a selected trip. Trips the user was added to (rather than created)
 * are marked "Shared" so they're not mistaken for the user's own trips.
 */

// Accept 'trips' directly as a prop from App.jsx
// Presentational: no state; trips come from App.jsx and onViewDetails navigates to the trip route.
export default function TripList({ trips, onViewDetails, currentUserId }) {
    // Layout: caption rail on the left, list on the right.
    return (
        <section className={styles.section}>
            {/* Captions, including the saved-trip count when there are trips. */}
            <div className={styles.rail}>
                <span className={styles.caption}>02</span>
                <span className={styles.caption}>Itineraries</span>
                {trips.length > 0 && (
                    <span className={styles.caption}>{String(trips.length).padStart(2, '0')} saved</span>
                )}
            </div>

            <div>
                <h2 className={styles.sectionTitle}>Your trips</h2>

                {/* Handle the initial state before any data has loaded over the network */}
                {trips.length === 0 ? (
                    <div className={styles.empty}>
                        <p className={styles.emptyTitle}>No trips yet.</p>
                        <p className={styles.emptyNote}>
                            Use the form above to start planning your first vacation.
                        </p>
                    </div>
                ) : (
                    <ul className={styles.tripList}>
                        {trips.map((trip) => {
                            // Owner if the trip's user id matches the logged-in user, otherwise it is shared.
                            const isOwner = trip.user?.id === currentUserId;

                            // One clickable row per trip.
                            return (
                                <li key={trip.id}>
                                    <button
                                        type="button"
                                        className={styles.tripRow}
                                        onClick={() => onViewDetails(trip.id)}
                                    >
                                        <span>
                                            <span className={styles.tripName}>{trip.name}</span>
                                            <span className={styles.tripDestination}>{trip.destination}</span>
                                        </span>
                                        <span className={styles.tripMeta}>
                                            {/* Badge: Owner or Shared. */}
                                            <span className={`${styles.tripBadge} ${isOwner ? '' : styles.tripBadgeShared}`}>
                                                {isOwner ? 'Owner' : 'Shared'}
                                            </span>
                                            {/* Start and end dates. */}
                                            <span className={styles.tripDates}>
                                                {trip.startDate}
                                                <br />
                                                {trip.endDate}
                                            </span>
                                        </span>
                                        <span className={styles.arrow} aria-hidden="true">→</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
