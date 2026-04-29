# NeuroCare Platform MVP

## About
NeuroCare is a comprehensive web platform designed for monitoring, treating, and developing children with neurological conditions including intellectual disabilities, autism, cerebral palsy, and speech delays. The platform bridges the gap between doctors, parents, and children through a unified system.

## Installation
1. Clone the repository
2. Navigate to backend: `cd backend`
3. Install dependencies: `npm install`
4. Configure environment: Copy `.env.example` to `.env` and fill in your credentials
5. Start development server: `npm run dev`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

## Technology Stack

### Backend
- **Node.js** v20+ - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development
- **Supabase** - PostgreSQL database and authentication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Claude API** - AI analysis and assistance

### Frontend
- **React 18** - User interface library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router v6** - Client-side routing

### Database
- **PostgreSQL** - Relational database (via Supabase)
- **Row Level Security (RLS)** - Data access control

### AI Integration
- **Anthropic Claude** - AI-powered analysis and recommendations
- **Model**: claude-sonnet-4-20250514

## Architecture

The platform consists of 5 separate web applications sharing a single backend API and database:

1. **Doctor Panel** - Patient management and treatment planning
2. **Parent Panel** - Child progress tracking and reporting
3. **Child Games** - Therapeutic games and exercises
4. **Admin Panel** - Clinic-level administration
5. **Super Admin Panel** - System-wide administration

## Database Schema

The database includes the following main tables:
- `users` - All system users
- `children` - Child patient profiles
- `doctors` - Doctor profiles
- `parents` - Parent profiles
- `reports` - Daily progress reports
- `sessions` - Therapy sessions
- `messages` - Chat communications
- `game_sessions` - Game play results
- `games` - Game catalog
- `notifications` - System notifications
- `ai_analyses` - AI-generated insights

See `database/schema.sql` for complete SQL definitions.
