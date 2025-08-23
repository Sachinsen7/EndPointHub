# EndpointHub: API Marketplace

## Overview

EndpointHub is a free-first, lightweight API marketplace designed for developers to publish, discover, and consume APIs easily. It features user authentication, API key management, request proxying with rate limiting, and interactive documentation. Ideal for students and hobby projects, EndpointHub uses only free and open-source technologies so you can build, deploy, and scale without paying.

## Technologies Used

### Frontend

- React.js (Vite for fast builds)
- Tailwind CSS (utility-first styling)
- Redux Toolkit + RTK Query (state management & API caching)
- Swagger UI (interactive API docs)

### Backend

- Node.js + Express.js (REST API server)
- PostgreSQL (free tier on Supabase or local via Docker)
- Redis (optional for caching & rate limiting; free tiers available)
- JWT (authentication)
- bcrypt (password hashing)

### DevOps & Deployment

- Docker & Docker Compose (local development)
- GitHub Actions (CI/CD)
- Render / Railway / Vercel / Netlify (free hosting tiers)
- Supabase / MongoDB Atlas (free database hosting)
- Nginx (optional reverse proxy)

## Features (MVP)

- User registration and login with JWT
- Publish APIs with OpenAPI/Swagger docs
- Generate and revoke API keys per user and API
- Proxy API requests with key validation and rate limiting
- Interactive API documentation viewer
- Usage analytics dashboard (requests, errors, latency)
- Responsive, clean UI with light/dark mode

## Getting Started

### Prerequisites

- Node.js v18+
- Docker & Docker Compose (for local Postgres + Redis)
- Git

### Environment Variables (.env)

Create a `.env` file in the `server/` directory with the following:

```env
PORT=4000
DATABASE_URL=postgres://dev:dev@localhost:5432/endpointhub
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

### Running Locally

1. Clone the repository:

   ```bash
   git clone <your-repo-url> endpointhub
   cd endpointhub
   ```

2. Start Docker services:

   ```bash
   docker-compose up -d
   ```

3. Install and run the backend:

   ```bash
   cd server
   npm install
   npm run dev
   ```

4. Install and run the frontend:

   ```bash
   cd client
   npm install
   npm run dev
   ```

5. Open the app:

   Open your browser and navigate to `http://localhost:5173` to see the EndpointHub application running.

## API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `GET /api/auth/me` — Get current user profile

### APIs

- `POST /api/apis` — Publish new API
- `GET /api/apis` — List public APIs
- `GET /api/apis/:id` — API details
- `PUT /api/apis/:id` — Update API (owner only)
- `DELETE /api/apis/:id` — Delete API (owner only)

### API Keys

- `POST /api/apis/:id/keys` — Generate API key
- `GET /api/keys` — List my API keys
- `DELETE /api/keys/:id` — Revoke API key

### Proxy

- `ALL /proxy/:apiId/*` — Proxy requests to target API with API key validation

## Roadmap

- Week 1: Setup auth, DB, and user management
- Week 2: API publishing and listing UI + backend
- Week 3: API key generation and proxy endpoint
- Week 4: Usage analytics and rate limiting
- Week 5: UI polish, testing, and deployment

## Backend Skeleton (Node.js + Express)

```javascript
// server/src/index.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/apis.js';
import keyRoutes from './routes/keys.js';
import proxyRoutes from './routes/proxy.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/keys', keyRoutes);
app.use('/proxy', proxyRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Frontend Skeleton (React + Vite + Redux Toolkit)

```javascript
// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

```javascript
// client/src/App.jsx
import React from 'react';

function App() {
  return (
    <div>
      <h1>EndpointHub</h1>
      <p>Welcome to your API Marketplace!</p>
    </div>
  );
}

export default App;
```

```javascript
// client/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // add slices here
  },
});

export default store;
```
