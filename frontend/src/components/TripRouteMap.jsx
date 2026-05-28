/**
 * TripRouteMap displays suggested locations and a route between them.
 *
 * It uses the browser's current location as the starting point, geocodes each
 * suggested location, draws markers, and fetches a driving or walking route through all
 * points in order.
 */
import { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function FitMapToRoute({ points }) {
    const map = useMap();

    useEffect(() => {
        if (points.length < 1) return;

        const bounds = L.latLngBounds(points.map(point => [point.lat, point.lng]));
        map.fitBounds(bounds, { padding: [30, 30] });
    }, [map, points]);

    return null;
}

export default function TripRouteMap({ locations }) {
    const [points, setPoints] = useState([]);
    const [route, setRoute] = useState([]);
    const [steps, setSteps] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!locations || locations.length === 0) {
            setPoints([]);
            setRoute([]);
            setSteps([]);
            return;
        }

        const loadRoute = async () => {
            setLoading(true);
            setError('');

            try {
                const currentPosition = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                    });
                });

                const currentPoint = {
                    name: 'Current location',
                    lat: currentPosition.coords.latitude,
                    lng: currentPosition.coords.longitude,
                };

                const geocodedLocations = await Promise.all(
                    locations.map(async location => {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location.name)}`
                        );

                        const results = await response.json();

                        if (!results.length) {
                            throw new Error(`Could not find ${location.name}`);
                        }

                        return {
                            name: location.name,
                            lat: Number(results[0].lat),
                            lng: Number(results[0].lon),
                        };
                    })
                );

                const routePoints = [currentPoint, ...geocodedLocations];
                setPoints(routePoints);

                if (routePoints.length < 2) {
                    setRoute([]);
                    setSteps([]);
                    return;
                }

                const coordinates = routePoints
                    .map(point => `${point.lng},${point.lat}`)
                    .join(';');

                const routeResponse = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
                );

                const routeData = await routeResponse.json();

                if (!routeData.routes?.length) {
                    throw new Error('Could not build route.');
                }

                const routeCoordinates = routeData.routes[0].geometry.coordinates.map(
                    ([lng, lat]) => [lat, lng]
                );

                const routeSteps = routeData.routes[0].legs.flatMap((leg, legIndex) =>
                    leg.steps.map(step => ({
                        id: `${legIndex}-${step.name}-${step.distance}`,
                        text: step.maneuver.instruction || `Continue on ${step.name || 'route'}`,
                        distance: `${Math.round(step.distance)} m`,
                    }))
                );

                setRoute(routeCoordinates);
                setSteps(routeSteps);
            } catch (err) {
                console.error('Route map failed:', err);
                setError('Could not load route. Allow location access and check location names.');
            } finally {
                setLoading(false);
            }
        };

        loadRoute();
    }, [locations]);

    if (!locations || locations.length === 0) return null;

    return (
        <section style={{ margin: '20px 0' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Route Map</h3>

            {loading && (
                <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Loading route...</p>
            )}

            {error && (
                <p style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</p>
            )}

            {points.length > 0 && (
                <div
                    style={{
                        height: '320px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #ddd',
                        marginBottom: '12px',
                    }}
                >
                    <MapContainer
                        center={[points[0].lat, points[0].lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <FitMapToRoute points={points} />

                        {points.map((point, index) => (
                            <Marker key={`${point.name}-${index}`} position={[point.lat, point.lng]}>
                                <Popup>
                                    {index === 0 ? 'Start: ' : `${index}. `}
                                    {point.name}
                                </Popup>
                            </Marker>
                        ))}

                        {route.length > 0 && (
                            <Polyline positions={route} pathOptions={{ color: '#2980b9', weight: 5 }} />
                        )}
                    </MapContainer>
                </div>
            )}

            {steps.length > 0 && (
                <ol style={{ paddingLeft: '20px', color: '#2c3e50', fontSize: '14px' }}>
                    {steps.slice(0, 12).map(step => (
                        <li key={step.id} style={{ marginBottom: '6px' }}>
                            {step.text} <span style={{ color: '#7f8c8d' }}>({step.distance})</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}