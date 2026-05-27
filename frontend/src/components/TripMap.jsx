/**
 * TripMap renders an embedded Google Map for a trip destination.
 *
 * It converts the destination string into a Google Maps embed URL and displays
 * the map without requiring a backend endpoint or API key.
 */

export default function TripMap({ destination }) {
    if (!destination) return null;

    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;

    return (
        <section style={{ margin: '20px 0' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Map</h3>

            <div
                style={{
                    width: '100%',
                    height: '280px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    backgroundColor: '#f0f0f0'
                }}
            >
                <iframe
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
        </section>
    );
}