// dash = shared dashboard styles, styles = trip page styles; both are CSS modules.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

// Props come from TripDetails: the days list, selection state and the add-day form state/handlers.
/** The "Days" section: a toggle strip of existing days, and a form to add one. */
export default function DaySelector({
    days,
    selectedDayId,
    onSelectDay,
    newDayDate,
    setNewDayDate,
    onAddDay,
}) {
    return (
        // Section layout: a label rail on the left, content on the right.
        <section className={dash.section}>
            <div className={dash.rail}>
                <span className={dash.caption}>Calendar</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Days</h2>

                {/* Toggle buttons, one per existing day; the selected day is marked with aria-pressed. */}
                {days.length > 0 && (
                    <div className={`${dash.options} ${styles.dayOptions}`}>
                        {days.map(day => (
                            <button
                                key={day.id}
                                type="button"
                                className={dash.option}
                                aria-pressed={selectedDayId === day.id}
                                onClick={() => onSelectDay(day.id)}
                            >
                                {day.date}
                            </button>
                        ))}
                    </div>
                )}

                {/* Add Day */}
                {/* Date input (Enter submits) plus a button that is disabled until a date is chosen; both call onAddDay in TripDetails. */}
                <div className={styles.inlineForm}>
                    <label className={`${dash.field} ${styles.grow}`}>
                        <span className={dash.label}>Add a day</span>
                        <input
                            type="date"
                            className={dash.input}
                            value={newDayDate || ''}
                            onChange={e => setNewDayDate(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onAddDay(); }}
                        />
                    </label>
                    <button
                        type="button"
                        className={`${dash.textButton} ${styles.inlineAction}`}
                        onClick={onAddDay}
                        disabled={!newDayDate}
                    >
                        Add day →
                    </button>
                </div>
            </div>
        </section>
    );
}
