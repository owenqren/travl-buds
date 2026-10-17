/**
 * VoteSpotMap builds a Google Maps route from the user's current location
 * through the suggested vote spots for the selected trip day.
 */
// React hooks plus the shared CSS modules.
import { useEffect, useMemo, useState } from 'react';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

export default function VoteSpotMap({ locations = [], destination }) {
    // Props: suggested spots for the day and the trip destination used as a fallback route origin. travelMode toggles walking/driving; currentPosition holds the browser's geolocation.
    const [travelMode, setTravelMode] = useState('walking');
    const [currentPosition, setCurrentPosition] = useState(null);

    // Addresses (or names) of the suggested spots, recomputed only when locations change.
    const spots = useMemo(() => {
        return locations
            .map(location => location.address?.trim() || location.name?.trim())
            .filter(Boolean);
    }, [locations]);

    // Asks the browser for the user's position once; on denial the position stays null.
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            position => {
                setCurrentPosition({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                setCurrentPosition(null);
            }
        );
    }, []);

    // No spots, no map.
    if (spots.length === 0) return null;

    // Route starts at the user's location when known, otherwise the trip destination.
    const origin = currentPosition
        ? `${currentPosition.lat},${currentPosition.lng}`
        : destination;

    // Last spot is the route destination; earlier spots become waypoints.
    const finalSpot = spots[spots.length - 1];
    const waypointSpots = spots.slice(0, -1);

    // Google Maps directions URL built from origin, destination, waypoints and travel mode.
    const mapUrl = [
        'https://www.google.com/maps/dir/?api=1',
        `origin=${encodeURIComponent(origin || finalSpot)}`,
        `destination=${encodeURIComponent(finalSpot)}`,
        waypointSpots.length > 0
            ? `waypoints=${encodeURIComponent(waypointSpots.join('|'))}`
            : '',
        `travelmode=${travelMode}`,
        'output=embed',
    ].filter(Boolean).join('&');

    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Route</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Day route</h2>

                {/* Walking / driving toggle. */}
                <div className={`${dash.options} ${styles.modeOptions}`}>
                    <button
                        type="button"
                        className={dash.option}
                        aria-pressed={travelMode === 'walking'}
                        onClick={() => setTravelMode('walking')}
                    >
                        Walking
                    </button>
                    <button
                        type="button"
                        className={dash.option}
                        aria-pressed={travelMode === 'driving'}
                        onClick={() => setTravelMode('driving')}
                    >
                        Driving
                    </button>
                </div>

                {/* Embedded map of the final spot. */}
                <div className={styles.mapFrame}>
                    <iframe
                        title="Day route"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(finalSpot)}&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                    />
                </div>

                {/* Link to the full route in Google Maps (embed flag removed). */}
                <a
                    className={styles.link}
                    href={mapUrl.replace('&output=embed', '')}
                    target="_blank"
                    rel="noreferrer"
                >
                    <span>Open full route in Google Maps</span>
                    <span className={styles.linkArrow} aria-hidden="true">→</span>
                </a>
            </div>
        </section>
    );
}
