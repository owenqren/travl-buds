// dash = shared dashboard styles, styles = trip page styles.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

// Maps a member status to its CSS class (anything other than APPROVED/REJECTED looks pending).
function statusClass(status) {
    if (status === 'APPROVED') return styles.statusApproved;
    if (status === 'REJECTED') return styles.statusRejected;
    return styles.statusPending;
}

/**
 * The "Trip access" section: the member list with owner-only moderation
 * actions, and the add-by-email form any member can use.
 */
// Props come from TripDetails: members, owner flag, email input state and the add/approve/reject/remove handlers.
export default function TripMembers({
    members,
    isOwner,
    newMemberEmail,
    setNewMemberEmail,
    memberStatus,
    onAddMember,
    onApproveMember,
    onRejectMember,
    onRemoveMember,
}) {
    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Group</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Trip access</h2>

                {/* Member list: email and status for everyone. */}
                {members.length > 0 && (
                    <ul className={`${styles.rows} ${styles.rowsFirst}`}>
                        {/* How: each member becomes one row keyed by its id; statusClass(m.status) picks the color class
                            for that status. */}
                        {members.map(m => (
                            <li key={m.id} className={styles.memberRow}>
                                <span className={styles.memberInfo}>
                                    <span className={styles.memberEmail}>{m.email}</span>
                                    <span className={`${styles.status} ${statusClass(m.status)}`}>{m.status}</span>
                                </span>
                                {/* Owner-only actions. */}
                                {/* How: isOwner is computed in TripDetails from the trip's owner id; the backend
                                    independently enforces the same rule, so hiding the buttons is only a convenience. */}
                                {isOwner && (
                                    <span className={styles.memberActions}>
                                        {/* Approve/Reject only for PENDING members. */}
                                        {m.status === 'PENDING' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={dash.textButton}
                                                    onClick={() => onApproveMember(m.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${dash.textButton} ${dash.danger}`}
                                                    onClick={() => onRejectMember(m.id)}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {/* Remove is available for every member. */}
                                        <button
                                            type="button"
                                            className={`${dash.textButton} ${dash.danger}`}
                                            onClick={() => onRemoveMember(m.email)}
                                        >
                                            Remove
                                        </button>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Add-by-email form; Enter or the button calls onAddMember. */}
                <div className={styles.inlineForm}>
                    <label className={`${dash.field} ${styles.grow}`}>
                        <span className={dash.label}>Add by email</span>
                        <input
                            type="email"
                            className={dash.input}
                            placeholder="friend@example.com"
                            value={newMemberEmail}
                            onChange={e => setNewMemberEmail(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onAddMember(); }}
                        />
                    </label>
                    <button
                        type="button"
                        className={`${dash.textButton} ${styles.inlineAction}`}
                        onClick={onAddMember}
                        disabled={!newMemberEmail.trim()}
                    >
                        Add →
                    </button>
                </div>
                {/* Feedback message from the last add attempt. */}
                {memberStatus && (
                    <p className={`${styles.note} ${styles.noteTop}`}>{memberStatus}</p>
                )}
            </div>
        </section>
    );
}
