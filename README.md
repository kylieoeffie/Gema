# 🎵 SameWave - Music Discovery Community

A social music discovery platform where users create threads around songs and get community-driven recommendations.

## ✨ Features

- 🔐 **User Authentication** - Secure login/signup system
- 🎵 **Music Search** - Powered by Deezer API with 30-second previews
- 🧵 **Thread Creation** - Start discussions around any song
- 💬 **Community Suggestions** - Get recommendations from other users
- ⬆️ **Voting System** - Upvote the best suggestions
- 👤 **User Profiles** - Track your threads and activity
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Dark/Light Mode** - Beautiful UI with theme support

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev:full
```

Visit `http://localhost:5173` to see the app!

### Production Build

```bash
# Build frontend
npm run build

# Start backend
cd server && npm start
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Deezer API** for music data

### Backend
- **Node.js** with Express
- **JSON file storage** (easily upgradeable to database)
- **CORS enabled** for cross-origin requests
- **RESTful API** design

## 📁 Project Structure

```
samewave/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── lib/               # API integrations
│   └── App.tsx            # Main app component
├── server/                # Backend API
│   ├── index.js          # Express server
│   ├── data/             # JSON data storage
│   └── package.json      # Backend dependencies
├── dist/                 # Built frontend
└── README.md
```

## 🌐 Deployment

Ready to deploy to production! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
- Frontend: Deploy to [Vercel](https://vercel.com) 
- Backend: Deploy to [Railway](https://railway.app)
- Cost: **Free** with generous limits

## 🎯 How It Works

1. **Search** for any song using the Deezer catalog
2. **Create threads** around songs you love
3. **Add suggestions** for similar tracks with reasons
4. **Vote** on the best recommendations
5. **Discover** new music through community wisdom

## 🔧 Environment Variables

Create `.env` file:
```bash
VITE_API_BASE=http://localhost:3001/api
```

For production, update to your deployed backend URL.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or building your own music discovery platform!

---

Built with ❤️ for music lovers and discovery enthusiasts