const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://samewave.vercel.app', 'https://samewave-git-main.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Data file paths
const THREADS_FILE = path.join(__dirname, 'data', 'threads.json');
const SUGGESTIONS_FILE = path.join(__dirname, 'data', 'suggestions.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Helper functions to read/write data
const readThreads = async () => {
  try {
    const data = await fs.readFile(THREADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeThreads = async (threads) => {
  await fs.writeFile(THREADS_FILE, JSON.stringify(threads, null, 2));
};

const readSuggestions = async () => {
  try {
    const data = await fs.readFile(SUGGESTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeSuggestions = async (suggestions) => {
  await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
};

const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

// Routes

// Get all threads
app.get('/api/threads', async (req, res) => {
  try {
    const threads = await readThreads();
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
  try {
    const { seedTrackId, tags, createdBy, trackData } = req.body;
    
    const newThread = {
      id: `thr_${Math.random().toString(36).slice(2, 7)}`,
      seedTrackId,
      tags,
      createdBy,
      createdAt: Date.now(),
      trackData // Store the full track data
    };

    const threads = await readThreads();
    threads.unshift(newThread); // Add to beginning
    await writeThreads(threads);

    res.json(newThread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Get all suggestions
app.get('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await readSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Create a new suggestion
app.post('/api/suggestions', async (req, res) => {
  try {
    const { threadId, trackId, reason, tags, createdBy, trackData } = req.body;
    
    const newSuggestion = {
      id: `s_${Math.random().toString(36).slice(2, 7)}`,
      threadId,
      trackId,
      reason,
      tags,
      createdBy,
      createdAt: Date.now(),
      votes: 0,
      trackData // Store the full track data
    };

    const suggestions = await readSuggestions();
    suggestions.unshift(newSuggestion); // Add to beginning
    await writeSuggestions(suggestions);

    res.json(newSuggestion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

// Upvote a suggestion
app.patch('/api/suggestions/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    const suggestions = await readSuggestions();
    
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    suggestion.votes += 1;
    await writeSuggestions(suggestions);

    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote suggestion' });
  }
});

// Authentication routes

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const users = await readUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create new user (in production, hash the password!)
    const newUser = {
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      username,
      email,
      password, // In production: await bcrypt.hash(password, 10)
      createdAt: Date.now(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };

    users.push(newUser);
    await writeUsers(users);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || user.password !== password) { // In production: await bcrypt.compare(password, user.password)
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user (for session validation)
app.get('/api/auth/me', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize demo users
const initializeDemoUsers = async () => {
  const users = await readUsers();
  
  // Add demo users if they don't exist
  const demoUsers = [
    {
      id: 'user_demo1',
      username: 'demo',
      email: 'demo@samewave.com',
      password: 'demo123',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    },
    {
      id: 'user_test1',
      username: 'test',
      email: 'test@samewave.com',
      password: 'test123',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
    }
  ];

  let updated = false;
  for (const demoUser of demoUsers) {
    if (!users.find(u => u.email === demoUser.email)) {
      users.push(demoUser);
      updated = true;
    }
  }

  if (updated) {
    await writeUsers(users);
    console.log('📝 Demo users initialized');
  }
};

// Initialize and start server
const startServer = async () => {
  await ensureDataDir();
  await initializeDemoUsers();
  app.listen(PORT, () => {
    console.log(`🎵 SameWave API server running on port ${PORT}`);
    console.log(`📁 Data stored in: ${path.join(__dirname, 'data')}`);
    console.log(`👤 Demo accounts: demo@samewave.com (demo123), test@samewave.com (test123)`);
  });
};

startServer().catch(console.error);