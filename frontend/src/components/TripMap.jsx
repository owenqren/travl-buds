/**
 * TripMap renders an embedded Google Map for a trip destination.
 *
 * It converts the destination string into a Google Maps embed URL and displays
 * the map without requiring a backend endpoint or API key.
 */
// dash = shared dashboard styles, styles = trip page styles.
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

// Props: destination text and the mapProvider setting ('google' or 'baidu') from App.jsx units.
export default function TripMap({ destination, mapProvider }) {
    // Nothing to show without a destination.
    if (!destination) return null;

    // Builds the embed URL for the chosen provider; no API key needed.
    const mapUrl = mapProvider === 'baidu'
        ? `https://map.baidu.com/?latlng=&title=${encodeURIComponent(destination)}&content=${encodeURIComponent(destination)}&output=embed&src=travlbuds`
        : `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;

    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Place</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Map</h2>
                {/* Map iframe; key={mapUrl} reloads it when the provider or destination changes. */}
                <div className={styles.mapFrame}>
                    <iframe
                        key={mapUrl}
                        title={`Map of ${destination}`}
                        src={mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                    />
                </div>
            </div>
        </section>
    );
}
