# TravlBuds 🌍
> Collaborative vacation planning — plan trips together, vote on spots, and build a day-by-day itinerary with your group.

## What it does
TravlBuds lets a group of friends plan a trip together. Each person can suggest activities, vote anonymously on restaurants and spots, and see the full day-by-day itinerary with travel times and weather.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Spring Boot 4 (Java 25) |
| Database | PostgreSQL |
| ORM | Hibernate / Spring Data JPA |

## Features
- 🔒 **Secure authentication** — user signup and login to keep your trips, groups, and votes completely private
- 🗓 **Day-by-day itinerary** — activities and voted locations seamlessly organized by day
- 🗳 **Anonymous voting** — suggest restaurants/spots, vote blindly, results revealed after everyone votes
- 🎯 **Activity opt-in** — suggest activities, group members join the ones they want
- 🗺 **Map integration** — Google Maps route for each day
- 🌤 **Weather** — forecast for each day of the trip
- 🤖 **AI planner** — Groq suggests activities based on destination

## Project Structure
```
travlbuds/
├── backend/                  # Spring Boot API
│   └── src/main/java/com/travlbuds/api/
│       ├── controller/       # REST endpoints
│       ├── models/           # JPA entities
│       ├── repositories/     # Spring Data repositories
│       └── dto/              # Response objects
└── frontend/                 # React + Vite app
    └── src/
        ├── components/       # TripForm, TripList, TripDetails
        └── App.jsx
```

## API Endpoints
### Trips
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips?userId=1` | Get all trips for a user |
| POST | `/api/trips?userId=1` | Create a new trip |

### Trip Days
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days` | Get all days for a trip |
| POST | `/api/trips/{tripId}/days` | Add a day to a trip |

### Activities
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days/{dayId}/activities` | Get activities for a day |
| POST | `/api/trips/{tripId}/days/{dayId}/activities?userId=1` | Add an activity |
| POST | `/api/trips/{tripId}/days/{dayId}/activities/{activityId}/join?userId=1` | Join an activity |
| DELETE | `/api/trips/{tripId}/days/{dayId}/activities/{activityId}/leave?userId=1` | Leave an activity |

### Voting
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days/{dayId}/destinations?userId=1` | Get voted locations (blind until voted) |
| POST | `/api/trips/{tripId}/days/{dayId}/destinations?userId=1` | Suggest a location |
| POST | `/api/trips/{tripId}/days/{dayId}/vote?userId=1&votedLocationId=1` | Cast a vote |

## Getting Started

### Prerequisites
- Java 25
- PostgreSQL 18
- Node.js + npm

### Database
The app uses `spring.jpa.hibernate.ddl-auto=update` so tables are created automatically on first run.

## Roadmap## Roadmap
- **Trip Sharing & Invitations:** Allow users to invite friends via email or link.
- **Group Collaboration:** Shared permission models for editing the itinerary.
- **Real-time Updates:** WebSockets for live syncing votes and itinerary changes.
- **Notifications:** Alerts for new activity suggestions and voting deadlines.
- **Route Optimization:** Automatically sort daily activities by geographic proximity.