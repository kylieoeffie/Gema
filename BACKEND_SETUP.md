# SameWave Backend Setup

## Quick Start

1. **Install backend dependencies:**
   ```bash
   npm run setup
   ```

2. **Start both frontend and backend:**
   ```bash
   npm run dev:full
   ```

   This will start:
   - Frontend on http://localhost:5173
   - Backend API on http://localhost:3001

## Manual Setup

If you prefer to run them separately:

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the backend:**
   ```bash
   cd server
   npm run dev
   ```

3. **In another terminal, start the frontend:**
   ```bash
   npm run dev
   ```

## What's Included

### Backend Features:
- ✅ **Persistent Storage**: Threads and suggestions saved to JSON files
- ✅ **Real-time Sharing**: All users see the same threads
- ✅ **RESTful API**: Clean endpoints for all operations
- ✅ **Error Handling**: Graceful fallbacks if backend is down
- ✅ **CORS Enabled**: Frontend can communicate with backend

### API Endpoints:
- `GET /api/threads` - Get all threads
- `POST /api/threads` - Create a new thread
- `GET /api/suggestions` - Get all suggestions
- `POST /api/suggestions` - Create a new suggestion
- `PATCH /api/suggestions/:id/upvote` - Upvote a suggestion
- `GET /api/health` - Health check

### Data Storage:
- `server/data/threads.json` - All threads
- `server/data/suggestions.json` - All suggestions

## Testing Multi-User Experience

1. Open the app in multiple browser windows/tabs
2. Create threads in one window
3. See them appear in other windows (refresh to see updates)
4. Add suggestions from different "users"
5. Upvote suggestions and see vote counts update

## Upgrading to Production

To make this production-ready, you could:

1. **Replace JSON files with a real database:**
   - PostgreSQL with Supabase
   - MongoDB with MongoDB Atlas
   - MySQL with PlanetScale

2. **Add real-time updates:**
   - WebSockets for live updates
   - Server-Sent Events (SSE)

3. **Add authentication:**
   - User accounts and login
   - JWT tokens for security

4. **Deploy to cloud:**
   - Backend: Railway, Render, or Vercel
   - Frontend: Vercel, Netlify, or GitHub Pages

## Troubleshooting

**Backend won't start?**
- Make sure you ran `npm run setup` first
- Check if port 3001 is available

**Frontend can't connect to backend?**
- Make sure backend is running on port 3001
- Check browser console for CORS errors

**Data not persisting?**
- Check if `server/data/` directory exists
- Make sure the server has write permissions