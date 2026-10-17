// React hooks plus the shared CSS modules.
import { useState, useEffect } from 'react';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/**
 * WeatherForecast shows forecast data for the trip destination and dates.
 *
 * It geocodes the destination with Open-Meteo, fetches daily weather, converts
 * temperatures based on user settings, and displays only relevant trip days.
 */

// Open-Meteo weather codes mapped to a label and emoji icon.
const weatherDescriptions = {
    0: { label: 'Clear Sky', icon: '☀️' },
    1: { label: 'Mainly Clear', icon: '🌤️' },
    2: { label: 'Partly Cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    48: { label: 'Foggy', icon: '🌫️' },
    51: { label: 'Light Drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Heavy Drizzle', icon: '🌧️' },
    61: { label: 'Light Rain', icon: '🌧️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy Rain', icon: '🌧️' },
    71: { label: 'Light Snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '❄️' },
    75: { label: 'Heavy Snow', icon: '❄️' },
    80: { label: 'Showers', icon: '🌦️' },
    81: { label: 'Showers', icon: '🌧️' },
    82: { label: 'Heavy Showers', icon: '🌧️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    99: { label: 'Thunderstorm', icon: '⛈️' },
};

// Props: destination text, the trip's days, and the units setting from App.jsx.
export default function WeatherForecast({ destination, tripDays, units }) {
    // Result of the latest fetch, tagged with the destination it was fetched for.
    const [result, setResult] = useState({ destination: null, weather: null, error: null });

    // Derived flags: ignore a result fetched for a previous destination; loading is true until the current destination has a result.
    const isCurrent = result.destination === destination;
    const loading = Boolean(destination) && !isCurrent;
    const weather = isCurrent ? result.weather : null;
    const error = isCurrent ? result.error : null;

    // Converts Celsius to Fahrenheit when units.temperature is 'F'.
    const displayTemp = (tempC) => {
        if (units?.temperature === 'F') {
            return Math.round((tempC * 9) / 5 + 32);
        }

        return tempC;
    };

    // Fetches coordinates then the forecast whenever the destination changes.
    useEffect(() => {
        if (!destination) return;

        // Guards against setting state after the effect was cleaned up.
        let cancelled = false;

        // Step 1: geocode the destination with Open-Meteo (browser call, no backend).
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`)
            .then(res => res.json())
            .then(geoData => {
                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error('Could not find location.');
                }

                // Use the first geocoding match.
                const { latitude, longitude } = geoData.results[0];

                // Step 2: daily min/max temperature and weather code for ~16 days.
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&past_days=1&forecast_days=16`);
            })
            .then(res => res.json())
            .then(weatherData => {
                // Store the daily data with the destination it belongs to.
                if (!cancelled) setResult({ destination, weather: weatherData.daily, error: null });
            })
            .catch(err => {
                // Store the error with the destination it belongs to.
                console.error("Weather fetch failed:", err);
                if (!cancelled) setResult({ destination, weather: null, error: err.message || 'Failed to load weather.' });
            });

        // Cleanup: ignore any late response.
        return () => {
            cancelled = true;
        };
    }, [destination]);

    // body is the section content: loading, error, empty, or the per-day forecast list.
    let body;

    // Choose the body based on loading, error and data state.
    if (loading) {
        body = <p className={`${styles.note} ${styles.noteTop}`}>Loading weather...</p>;
    } else if (error) {
        body = <p className={`${styles.note} ${styles.noteTop} ${styles.noteError}`}>{error}</p>;
    } else if (!weather) {
        body = <p className={`${styles.note} ${styles.noteTop}`}>No weather data available.</p>;
    } else {
        // Filter weather to only show days that match trip days
        const relevantDays = tripDays
            .map(day => {
                const index = weather.time.indexOf(day.date);

                if (index === -1) {
                    return { date: day.date, noData: true };
                }

                return {
                    date: day.date,
                    max: Math.round(weather.temperature_2m_max[index]),
                    min: Math.round(weather.temperature_2m_min[index]),
                    code: weather.weathercode[index],
                    noData: false
                };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Empty message or one row per trip day.
        body = relevantDays.length === 0 ? (
            <p className={`${styles.note} ${styles.noteTop}`}>No weather data for trip dates.</p>
        ) : (
            <ul className={`${styles.rows} ${styles.rowsFirst}`}>
                {/* Days outside the forecast window show a no-data row. */}
                {relevantDays.map(day => {
                    if (day.noData) {
                        return (
                            <li key={day.date} className={styles.weatherRow}>
                                <span className={styles.weatherDate}>{day.date}</span>
                                <span className={styles.weatherNone}>
                                    No data. Forecasts are limited to 16 days ahead.
                                </span>
                            </li>
                        );
                    }

                    // Look up label/icon for the weather code, with a fallback for unknown codes.
                    const w = weatherDescriptions[day.code] || { label: 'Unknown', icon: '🌡️' };
                    return (
                        <li key={day.date} className={styles.weatherRow}>
                            <span className={styles.weatherDate}>{day.date}</span>
                            <span className={styles.weatherLabel}>
                                <span aria-hidden="true">{w.icon}</span> {w.label}
                            </span>
                            <span className={styles.weatherTemp}>
                                {displayTemp(day.max)}°
                                <span className={styles.weatherMin}> / {displayTemp(day.min)}°</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // Layout: caption rail, then title and body.
    return (
        <section className={dash.section}>
            {/* Caption rail. */}
            <div className={dash.rail}>
                <span className={dash.caption}>Forecast</span>
            </div>

            <div>
                <h2 className={dash.sectionTitle}>Weather</h2>
                {body}
            </div>
        </section>
    );
}
