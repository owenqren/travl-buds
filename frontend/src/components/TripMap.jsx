/**
 * TripMap renders an embedded Google Map for a trip destination.
 *
 * It converts the destination string into a Google Maps embed URL and displays
 * the map without requiring a backend endpoint or API key.
 */
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

export default function TripMap({ destination, mapProvider }) {
    if (!destination) return null;

    const mapUrl = mapProvider === 'baidu'
        ? `https://map.baidu.com/?latlng=&title=${encodeURIComponent(destination)}&content=${encodeURIComponent(destination)}&output=embed&src=travlbuds`
        : `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;

    return (
        <section className={dash.section}>
            <div className={dash.rail}>
                <span className={dash.caption}>Place</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Map</h2>
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
