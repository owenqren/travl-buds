// dash = shared dashboard styles, styles = trip page styles.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/** The "Vote on a restaurant" section: blind-until-voted results, and a form to suggest a spot. */
// Presentational: voting state and handlers come from TripDetails.
export default function RestaurantVote({
    selectedDay,
    hasVoted,
    votedLocations,
    onVote,
    newLocation,
    setNewLocation,
    newLocationAddress,
    setNewLocationAddress,
    newLocationVisitTime,
    setNewLocationVisitTime,
    onAddLocation,
}) {
    // Truthy only when name, address and time are filled in.
    const spotValid = newLocation.trim() && newLocationAddress.trim() && newLocationVisitTime;

    // Layout: caption rail with the selected day, then the content column.
    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Vote</span>
                {selectedDay && <span className={dash.caption}>{selectedDay.date}</span>}
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Vote on a restaurant</h2>
                {/* Blind-vote hint: counts stay hidden until the user has voted. */}
                {!hasVoted && (
                    <p className={styles.hint}>Cast your vote to see the results!</p>
                )}

                {/* Candidate spots for the day. */}
                <p className={styles.subhead}>Options</p>
                {/* How: ternary between the empty message and the list of spots. */}
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
                                    {/* After voting show the count (the backend only sends it then); before voting show a Vote button. */}
                                    {/* How: counts are shown only after the user has voted, because before that the
                                        backend sends voteCount as null; loc.voteCount !== 1 decides whether to add an 's'
                                        to 'vote'. */}
                                    {hasVoted && (
                                        <span className={styles.itemCount}>
                                            {loc.voteCount} vote{loc.voteCount !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {!hasVoted && (
                                        <button
                                            type="button"
                                            className={dash.textButton}
                                            onClick={() => onVote(loc.id)}
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
                {/* Suggest-a-spot form; fields update the newLocation* state in TripDetails and Enter calls onAddLocation. */}
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
                            onKeyDown={e => { if (e.key === 'Enter') onAddLocation(); }}
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
                            onKeyDown={e => { if (e.key === 'Enter') onAddLocation(); }}
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
                            onKeyDown={e => { if (e.key === 'Enter') onAddLocation(); }}
                        />
                    </label>
                    {/* Submit stays disabled until spotValid. */}
                    <button
                        type="button"
                        className={dash.submit}
                        onClick={onAddLocation}
                        disabled={!spotValid}
                    >
                        <span>Suggest a spot</span>
                        <span className={dash.arrow} aria-hidden="true">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
