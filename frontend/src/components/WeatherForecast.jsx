import { useState, useEffect } from 'react';

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
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const displayTemp = (tempC) => {
    if (units?.temperature === 'F') {
        return Math.round((tempC * 9) / 5 + 32);
    }

    return tempC;
};

    useEffect(() => {
        if (!destination) return;

        //Geocode the destination
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`)
            .then(res => res.json())
            .then(geoData => {
                if (!geoData.results || geoData.results.length === 0) {
                    setError('Could not find location.');
                    setLoading(false);
                    return;
                }

                const { latitude, longitude } = geoData.results[0];

                // Fetch weather forecast
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&past_days=1&forecast_days=16`);
            })
            .then(res => res.json())
            .then(weatherData => {
                setWeather(weatherData.daily);
                setLoading(false);
            })
            .catch(err => {
                console.error("Weather fetch failed:", err);
                setError('Failed to load weather.');
                setLoading(false);
            });
    }, [destination]);

    if (loading) return <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Loading weather...</p>;
    if (error) return <p style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</p>;
    if (!weather) return null;

    // Filter weather to only show days that match trip days
    const relevantDays = tripDays.map(day => {
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
    });

    if (relevantDays.length === 0) {
        return <p style={{ color: '#7f8c8d', fontSize: '14px' }}>No weather data for trip dates.</p>;
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>🌤 Weather Forecast</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {relevantDays.map(day => {
                    if (day.noData) {
                        return (
                            <div
                                key={day.date}
                                style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    textAlign: 'center',
                                    minWidth: '80px',
                                }}
                            >
                                <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 4px' }}>{day.date}</p>
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingTop: '-1px',
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            color: '#7f8c8d',
                                            margin: 0,
                                            maxWidth: '80px',
                                            lineHeight: '1.4',
                                            whiteSpace: 'normal',
                                        }}
                                    >
                                        No data.
                                        Forecasts are limited
                                        to 16 days ahead.
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    const w = weatherDescriptions[day.code] || { label: 'Unknown', icon: '🌡️' };
                    return (
                        <div
                            key={day.date}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                textAlign: 'center',
                                minWidth: '80px'
                            }}
                        >
                            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 4px' }}>{day.date}</p>
                            <p style={{ fontSize: '24px', margin: '0 0 4px' }}>{w.icon}</p>
                            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 4px' }}>{w.label}</p>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                                {displayTemp(day.max)}° / {displayTemp(day.min)}°
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}