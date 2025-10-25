# 🚀 SameWave Deployment Guide

## Quick Deploy (Recommended)

### 1. Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your GitHub account
3. **Deploy Backend**:
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```
4. **Create New Project** on Railway
5. **Deploy from GitHub** - Select your repository
6. **Set Root Directory** to `server`
7. **Environment Variables**: Railway will auto-detect Node.js
8. **Get Your URL**: Copy the generated Railway URL (e.g., `https://your-app.railway.app`)

### 2. Deploy Frontend to Vercel

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com)
2. **Connect GitHub**: Link your GitHub account  
3. **Import Project**: Select your SameWave repository
4. **Configure Build**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave as root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   ```
   VITE_API_BASE=https://your-railway-url.railway.app/api
   ```
6. **Deploy**: Click "Deploy"

## Manual Deployment

### Backend (Railway/Render/Heroku)

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Set environment variables
export PORT=3001

# 4. Start server
npm start
```

### Frontend (Vercel/Netlify)

```bash
# 1. Install dependencies
npm install

# 2. Set environment variable
export VITE_API_BASE=https://your-backend-url.com/api

# 3. Build for production
npm run build

# 4. Deploy dist folder
```

## Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_BASE=https://your-backend-url.railway.app/api
```

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.railway.app/api/health`
- [ ] Frontend loads without errors
- [ ] Authentication works (login/signup)
- [ ] Music search works (Deezer API)
- [ ] Thread creation works
- [ ] Audio previews play
- [ ] Data persists between sessions

## Troubleshooting

### CORS Issues
- Make sure backend CORS is configured for your frontend domain
- Check that VITE_API_BASE points to correct backend URL

### API Connection Failed
- Verify backend is running: visit `/api/health` endpoint
- Check environment variables are set correctly
- Ensure Railway/Vercel deployments completed successfully

### Audio Not Playing
- Deezer API might be blocked - this is expected in some regions
- CORS proxy services might be rate-limited

## Production URLs

Once deployed, your app will be available at:
- **Frontend**: `https://samewave.vercel.app`
- **Backend**: `https://samewave-api.railway.app`

## Cost

- **Railway**: Free tier includes 500 hours/month
- **Vercel**: Free tier includes unlimited static deployments
- **Total**: $0/month for hobby projects

## Support

If you encounter issues:
1. Check the deployment logs in Railway/Vercel dashboards
2. Verify all environment variables are set
3. Test API endpoints directly
4. Check browser console for errors