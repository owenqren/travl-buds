// dash = shared dashboard styles, styles = trip page styles; both are CSS modules.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

// Title and message per status returned by GET /members/me (plus NOT_FOUND).
/** Copy shown on this screen, keyed by GET /members/me status. */
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

// Props come from TripDetails: access status, request state and handlers.
/**
 * Shown instead of the trip page to anyone who isn't the owner or an
 * approved member, since every other trip-scoped endpoint 403s them.
 * Lets a visitor with no membership row ask the owner for access.
 */
export default function TripAccessRequest({
    tripId,
    tripName,
    onBack,
    access,
    requestPending,
    requestError,
    onRequestAccess,
}) {
    // Falls back to the NONE copy for unexpected status values.
    const copy = ACCESS_COPY[access] || ACCESS_COPY.NONE;

    // Page layout: header with back button, then an access section.
    return (
        <div className={styles.page}>
            {/* Back button and trip title. */}
            <header className={styles.header}>
                <button
                    type="button"
                    className={`${dash.textButton} ${styles.back}`}
                    onClick={onBack}
                >
                    ← Back to trips
                </button>
                <h2 className={styles.title}>{tripName || `Trip #${tripId}`}</h2>
            </header>

            {/* Status title and message. */}
            <section className={dash.section}>
                <div className={dash.rail}>
                    <span className={dash.caption}>Access</span>
                </div>

                <div>
                    <h2 className={dash.sectionTitle}>{copy.title}</h2>
                    <p className={styles.note}>{copy.body}</p>

                    {/* Request button only for visitors with no membership yet; calls onRequestAccess. */}
                    {access === 'NONE' && (
                        <button
                            type="button"
                            className={`${dash.submit} ${styles.suggest}`}
                            onClick={onRequestAccess}
                            disabled={requestPending}
                        >
                            <span>{requestPending ? 'Requesting…' : 'Request access'}</span>
                            <span className={dash.arrow} aria-hidden="true">→</span>
                        </button>
                    )}
                    {/* Error from a failed request. */}
                    {requestError && (
                        <p className={`${styles.note} ${styles.noteError} ${styles.noteTop}`}>{requestError}</p>
                    )}
                </div>
            </section>
        </div>
    );
}
