import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

function statusClass(status) {
    if (status === 'APPROVED') return styles.statusApproved;
    if (status === 'REJECTED') return styles.statusRejected;
    return styles.statusPending;
}

/**
 * The "Trip access" section: the member list with owner-only moderation
 * actions, and the add-by-email form any member can use.
 */
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
                {memberStatus && (
                    <p className={`${styles.note} ${styles.noteTop}`}>{memberStatus}</p>
                )}
            </div>
        </section>
    );
}
