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
- 🔒 **Secure authentication** — JWT-based signup and login, plus emailed password reset, to keep your trips, groups, and votes completely private
- 👥 **Trip membership** — request access to a trip; the owner approves or rejects
- 🗓 **Day-by-day itinerary** — activities and voted locations seamlessly organized by day
- 🗳 **Anonymous voting** — suggest restaurants/spots, vote blindly, results revealed after everyone votes
- 🎯 **Activity opt-in** — suggest activities, group members join the ones they want
- 🗺 **Map integration** — driving route for each day (Nominatim + OSRM), with Google or Baidu map embeds
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
        ├── components/       # TripDetails, TripForm, TripList, maps, weather, voting UI
        ├── utils/            # authFetch (authenticated API wrapper)
        └── App.jsx
```

## API Endpoints
All routes except `/api/auth/**` require an `Authorization: Bearer <token>` header. The token is returned by register/login, and the current user is always taken from it (never from a query param).

### Auth (public)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| POST | `/api/auth/forgot-password` | Email a password reset link |
| POST | `/api/auth/reset-password` | Set a new password using the emailed token |

### Trips
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips` | Get the current user's trips |
| GET | `/api/trips/{tripId}` | Get a single trip |
| POST | `/api/trips` | Create a new trip |

### Trip Days
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days` | Get all days for a trip |
| POST | `/api/trips/{tripId}/days` | Add a day to a trip |

### Activities
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days/{dayId}/activities` | Get activities for a day |
| POST | `/api/trips/{tripId}/days/{dayId}/activities` | Add an activity |
| POST | `/api/trips/{tripId}/days/{dayId}/activities/{activityId}/join` | Join an activity |
| DELETE | `/api/trips/{tripId}/days/{dayId}/activities/{activityId}/leave` | Leave an activity |

### Voting
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/days/{dayId}/destinations` | Get voted locations (vote counts hidden until you've voted) |
| POST | `/api/trips/{tripId}/days/{dayId}/destinations` | Suggest a location |
| POST | `/api/trips/{tripId}/days/{dayId}/vote` | Cast a vote |

### Members
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/{tripId}/members` | List trip members |
| GET | `/api/trips/{tripId}/members/me` | Get your membership status |
| POST | `/api/trips/{tripId}/members/request` | Request access to a trip |
| POST | `/api/trips/{tripId}/members` | Add a member |
| POST | `/api/trips/{tripId}/members/{memberId}/approve` | Approve a pending member (owner) |
| POST | `/api/trips/{tripId}/members/{memberId}/reject` | Reject a pending member (owner) |
| DELETE | `/api/trips/{tripId}/members` | Remove a member |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/suggestions` | Get activity suggestions from Groq |

## Getting Started

### Prerequisites
- Java 25
- PostgreSQL 18
- Node.js + [pnpm](https://pnpm.io)

### Database
The app uses `spring.jpa.hibernate.ddl-auto=update` so tables are created automatically on first run.

### Configuration
Backend environment variables (required):
`SPRING_DATASOURCE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `GROQ_API_KEY`, `JWT_SECRET`

Backend environment variables (optional, needed for password-reset emails):
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_FRONTEND_URL`

Frontend: create `frontend/.env` with `VITE_API_URL` pointing at the backend (e.g. `http://localhost:8080`).

### Run
```
# backend (http://localhost:8080)
cd backend && ./mvnw spring-boot:run

# frontend (http://localhost:5173)
cd frontend && pnpm install && pnpm dev
```

## Roadmap
- **Trip Invitations:** Invite friends via email or shareable link (access requests and owner approval already work).
- **Real-time Updates:** WebSockets for live syncing votes and itinerary changes.
- **Notifications:** Alerts for new activity suggestions and voting deadlines.
- **Route Optimization:** Automatically sort daily activities by geographic proximity.

## License
[MIT](LICENSE) © 2026 Owen Ren
