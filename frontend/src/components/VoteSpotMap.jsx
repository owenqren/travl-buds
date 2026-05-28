/**
 * VoteSpotMap builds a Google Maps route from the user's current location
 * through the suggested vote spots for the selected trip day.
 */
import { useEffect, useMemo, useState } from 'react';

export default function VoteSpotMap({ locations = [], destination }) {
    const [travelMode, setTravelMode] = useState('walking');
    const [currentPosition, setCurrentPosition] = useState(null);

    const spots = useMemo(() => {
        return locations
            .map(location => location.address?.trim() || location.name?.trim())
            .filter(Boolean);
    }, [locations]);

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

    if (spots.length === 0) return null;

    const origin = currentPosition
        ? `${currentPosition.lat},${currentPosition.lng}`
        : destination;

    const finalSpot = spots[spots.length - 1];
    const waypointSpots = spots.slice(0, -1);

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
        <section style={{ margin: '20px 0' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Day Route</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                    type="button"
                    onClick={() => setTravelMode('walking')}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        backgroundColor: travelMode === 'walking' ? '#2c3e50' : '#fff',
                        color: travelMode === 'walking' ? '#fff' : '#2c3e50',
                        cursor: 'pointer',
                    }}
                >
                    Walking
                </button>

                <button
                    type="button"
                    onClick={() => setTravelMode('driving')}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        backgroundColor: travelMode === 'driving' ? '#2c3e50' : '#fff',
                        color: travelMode === 'driving' ? '#fff' : '#2c3e50',
                        cursor: 'pointer',
                    }}
                >
                    Driving
                </button>
            </div>

            <div
                style={{
                    height: '300px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    backgroundColor: '#f0f0f0',
                }}
            >
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
            <a
                href={mapUrl.replace('&output=embed', '')}
                target="_blank"
                rel="noreferrer"
                style={{
                    display: 'block',
                    marginTop: '10px',
                    padding: '10px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: '#fff',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                }}
            >
                Open full route in Google Maps
            </a>
        </section>
    );
}