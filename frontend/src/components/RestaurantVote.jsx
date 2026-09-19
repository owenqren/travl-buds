import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/** The "Vote on a restaurant" section: blind-until-voted results, and a form to suggest a spot. */
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
    const spotValid = newLocation.trim() && newLocationAddress.trim() && newLocationVisitTime;

    return (
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
