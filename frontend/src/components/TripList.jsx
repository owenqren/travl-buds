// 1. Accept 'trips' directly as a prop from App.jsx
export default function TripList({ trips }) {
  
  // Handle the initial state before any data has loaded over the network
  if (!trips || trips.length === 0) {
    return (
      <div>
        <h2>Upcoming Vacations</h2>
        <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No trips planned yet. Use the form above to start one!</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Upcoming Vacations</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {trips.map(trip => (
          <div 
            key={trip.id} 
            style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff' }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{trip.name}</h3>
            <p style={{ margin: '4px 0' }}><strong>Destination:</strong> {trip.destination}</p>
            <p style={{ margin: '4px 0', color: '#555', fontSize: '0.9em' }}>
              <strong>Dates:</strong> {trip.startDate} to {trip.endDate}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}