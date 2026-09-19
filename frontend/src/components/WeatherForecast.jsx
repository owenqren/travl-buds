import { useState, useEffect } from 'react';
import dash from './Dashboard.module.css';
import styles from './TripPage.module.css';

/**
 * WeatherForecast shows forecast data for the trip destination and dates.
 *
 * It geocodes the destination with Open-Meteo, fetches daily weather, converts
 * temperatures based on user settings, and displays only relevant trip days.
 */

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

export default function WeatherForecast({ destination, tripDays, units }) {
    // Result of the latest fetch, tagged with the destination it was fetched for.
    const [result, setResult] = useState({ destination: null, weather: null, error: null });

    const isCurrent = result.destination === destination;
    const loading = Boolean(destination) && !isCurrent;
    const weather = isCurrent ? result.weather : null;
    const error = isCurrent ? result.error : null;

    const displayTemp = (tempC) => {
        if (units?.temperature === 'F') {
            return Math.round((tempC * 9) / 5 + 32);
        }

        return tempC;
    };

    useEffect(() => {
        if (!destination) return;

        let cancelled = false;

        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`)
            .then(res => res.json())
            .then(geoData => {
                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error('Could not find location.');
                }

                const { latitude, longitude } = geoData.results[0];

                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&past_days=1&forecast_days=16`);
            })
            .then(res => res.json())
            .then(weatherData => {
                if (!cancelled) setResult({ destination, weather: weatherData.daily, error: null });
            })
            .catch(err => {
                console.error("Weather fetch failed:", err);
                if (!cancelled) setResult({ destination, weather: null, error: err.message || 'Failed to load weather.' });
            });

        return () => {
            cancelled = true;
        };
    }, [destination]);

    let body;

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

        body = relevantDays.length === 0 ? (
            <p className={`${styles.note} ${styles.noteTop}`}>No weather data for trip dates.</p>
        ) : (
            <ul className={`${styles.rows} ${styles.rowsFirst}`}>
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

    return (
        <section className={dash.section}>
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
