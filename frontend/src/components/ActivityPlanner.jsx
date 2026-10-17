// dash = shared dashboard styles, styles = trip page styles.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/**
 * The "Activity ideas" section: the AI planning chat plus the list of
 * activities for the selected day and the form to add one.
 */
// Presentational: all state and handlers come from TripDetails (AI chat, activities list, new-activity form).
export default function ActivityPlanner({
    selectedDay,
    aiMessages,
    aiInput,
    setAiInput,
    aiLoading,
    onSendAiMessage,
    onSuggestIdeas,
    activities,
    newActivity,
    setNewActivity,
    onAddActivity,
    onJoinActivity,
}) {
    // Truthy only when name, address and visit time are filled in.
    const activityValid = newActivity.name.trim() && newActivity.address.trim() && newActivity.visitTime;

    // Layout: caption rail with the selected day, then the content column.
    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Activities</span>
                {selectedDay && <span className={dash.caption}>{selectedDay.date}</span>}
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Activity ideas</h2>

                {/* AI assistant chat log (messages from POST /api/ai/suggestions, kept in TripDetails). */}
                <p className={styles.subhead}>Assistant</p>
                <div className={styles.chatLog}>
                    {/* Empty hint or one bubble per message, styled by role. */}
                    {aiMessages.length === 0 ? (
                        <p className={styles.note}>
                            Ask for trip ideas or use the suggestion button.
                        </p>
                    ) : (
                        aiMessages.map((message, index) => (
                            <div
                                key={index}
                                className={message.role === 'user' ? styles.bubbleUser : styles.bubbleAi}
                            >
                                {message.content}
                            </div>
                        ))
                    )}
                </div>

                {/* Free-form prompt: Enter or Send calls onSendAiMessage and clears the input. */}
                <div className={styles.inlineForm}>
                    <label className={`${dash.field} ${styles.grow}`}>
                        <span className={dash.label}>Ask the AI</span>
                        <input
                            type="text"
                            className={dash.input}
                            placeholder="Somewhere quiet for lunch..."
                            value={aiInput}
                            onChange={e => setAiInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    onSendAiMessage(aiInput);
                                    setAiInput('');
                                }
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        className={`${dash.textButton} ${styles.inlineAction}`}
                        onClick={() => {
                            onSendAiMessage(aiInput);
                            setAiInput('');
                        }}
                        disabled={aiLoading || !aiInput.trim()}
                    >
                        Send →
                    </button>
                </div>

                {/* One-click suggestion request for the selected day. */}
                <button
                    type="button"
                    className={`${dash.submit} ${styles.suggest}`}
                    onClick={onSuggestIdeas}
                    disabled={aiLoading || !selectedDay}
                >
                    <span>{aiLoading ? 'Thinking...' : 'Suggest ideas'}</span>
                    <span className={dash.arrow} aria-hidden="true">→</span>
                </button>

                {/* Activities already on the plan, with a Join button and interested count (activity.interestedUsers). */}
                <p className={styles.subhead}>On the plan</p>
                {activities.length === 0 ? (
                    <p className={styles.note}>No activities yet. Add one below!</p>
                ) : (
                    <ul className={styles.rows}>
                        {activities.map(activity => (
                            <li key={activity.id} className={styles.item}>
                                <div>
                                    <span className={styles.itemName}>{activity.name}</span>
                                    {activity.category && (
                                        <span className={styles.itemTag}>{activity.category}</span>
                                    )}
                                    {(activity.visitTime || activity.address) && (
                                        <span className={styles.itemMeta}>
                                            {[activity.visitTime, activity.address].filter(Boolean).join(' · ')}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.itemSide}>
                                    <button
                                        type="button"
                                        className={dash.textButton}
                                        onClick={() => onJoinActivity(activity.id)}
                                    >
                                        Join
                                    </button>
                                    <span className={styles.itemCount}>
                                        {activity.interestedUsers?.length || 0} interested
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* New-activity form; every field updates newActivity and Enter calls onAddActivity. */}
                <p className={styles.subhead}>Add an activity</p>
                <div className={styles.formStack}>
                    <label className={dash.field}>
                        <span className={dash.label}>Name</span>
                        <input
                            type="text"
                            className={dash.input}
                            placeholder="Activity name"
                            value={newActivity.name}
                            onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') onAddActivity(); }}
                        />
                    </label>
                    <div className={dash.fieldRow}>
                        <label className={dash.field}>
                            <span className={dash.label}>Category</span>
                            <input
                                type="text"
                                className={dash.input}
                                placeholder="Museum, Hike"
                                value={newActivity.category}
                                onChange={e => setNewActivity({ ...newActivity, category: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') onAddActivity(); }}
                            />
                        </label>
                        <label className={dash.field}>
                            <span className={dash.label}>Time</span>
                            <input
                                type="time"
                                className={dash.input}
                                value={newActivity.visitTime}
                                required
                                onChange={e => setNewActivity({ ...newActivity, visitTime: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') onAddActivity(); }}
                            />
                        </label>
                    </div>
                    <label className={dash.field}>
                        <span className={dash.label}>Address</span>
                        <input
                            type="text"
                            className={dash.input}
                            placeholder="Precise address required"
                            value={newActivity.address}
                            required
                            onChange={e => setNewActivity({ ...newActivity, address: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') onAddActivity(); }}
                        />
                    </label>
                    {/* Add button stays disabled until activityValid. */}
                    <button
                        type="button"
                        className={dash.submit}
                        onClick={onAddActivity}
                        disabled={!activityValid}
                    >
                        <span>Add activity</span>
                        <span className={dash.arrow} aria-hidden="true">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
