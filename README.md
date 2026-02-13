# Gema - Music Discovery Community

I created Gema because I wanted a place where music lovers could discover new songs through community recommendations. Instead of relying on algorithms, Gema lets real people share why they think certain songs are similar - creating more meaningful musical connections.

## Quick Start

```bash
# Install dependencies
npm install

# Start the frontend
npm run dev
```

Visit `http://localhost:5173` to start discovering music!

## Run Frontend + Backend

### Option 1: Run both with one command

```bash
# from project root
npm run dev:full
```

This starts:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:5173`

### Option 2: Run in separate terminals

Terminal 1 (backend):

```bash
# from project root
npm run setup
npm run backend
```

Terminal 2 (frontend):

```bash
# from project root
npm run dev
```

## How It Works

1. **Search** for any song using the Deezer catalog
2. **Create threads** around songs you love  
3. **Add recommendations** with reasons why they're similar
4. **Vote** on the best suggestions
5. **Discover** new music through community wisdom
