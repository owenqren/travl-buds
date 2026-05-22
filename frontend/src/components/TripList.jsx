// 1. Accept 'trips' directly as a prop from App.jsx
export default function TripList({ trips, onViewDetails }) {

    // Handle the initial state before any data has loaded over the network
    if (trips.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h2 style={{ color: '#7f8c8d' }}>No trips yet!</h2>
                <p style={{ color: '#95a5a6' }}>Use the form above to start planning your first vacation.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '20px' }}>Your Itineraries</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {trips.map((trip) => (
                    <div
                        key={trip.id}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#fff',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                        }}
                    >
                        <h3 style={{ marginTop: 0, color: '#2980b9' }}>{trip.name}</h3>
                        <p style={{ margin: '8px 0', fontWeight: 'bold', color: '#2c3e50' }}>
                            📍 {trip.destination}
                        </p>
                        <p style={{ margin: '8px 0', fontSize: '14px', color: '#7f8c8d' }}>
                            📅 {trip.startDate} to {trip.endDate}
                        </p>

                        <button
                            onClick={() => onViewDetails(trip.id)}
                            style={{
                                width: '100%',
                                marginTop: '15px',
                                padding: '10px',
                                backgroundColor: '#34495e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            View Details
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}