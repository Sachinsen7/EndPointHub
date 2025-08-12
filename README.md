# EndpointHub: API Marketplace

Welcome to EndpointHub, a free-first, lightweight API marketplace designed for developers to publish, discover, and consume APIs easily.

## Overview

EndpointHub features user authentication, API key management, request proxying with rate limiting, and interactive documentation. It's built with free and open-source technologies, making it ideal for students, hobbyists, and developers looking to build and deploy projects without cost.

## Technologies

- **Frontend:** React, Vite, Tailwind CSS, Redux Toolkit
- **Backend:** Node.js, Express, PostgreSQL, Redis
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Features (MVP)

-   User registration and login (JWT)
-   Publish APIs with OpenAPI/Swagger docs
-   Generate and revoke API keys
-   Proxy API requests with key validation and rate limiting
-   Interactive API documentation viewer
-   Usage analytics dashboard
-   Responsive, clean UI with light/dark mode

## Getting Started

### Prerequisites

-   Node.js v18+
-   Docker & Docker Compose
-   Git

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url> endpointhub
    cd endpointhub
    ```

2.  **Setup Environment Variables:**

    Create a `.env` file in the `server/` directory and add the following:

    ```env
    # server/.env
    PORT=4000
    DATABASE_URL=postgres://dev:dev@postgres:5432/endpointhub
    JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random
    REDIS_URL=redis://redis:6379
    FRONTEND_URL=http://localhost:5173
    ```
    **Note:** We use service names (`postgres`, `redis`) in the URLs because Docker Compose will resolve them within its internal network.

3.  **Launch Services with Docker:**

    From the root `endpointhub` directory, start the PostgreSQL and Redis containers:
    ```bash
    docker-compose up -d
    ```
    This will run the databases in the background.

4.  **Install Backend Dependencies & Run Server:**
    ```bash
    cd server
    npm install
    npm run dev
    ```
    The server will be running on `http://localhost:4000`.

5.  **Install Frontend Dependencies & Run Client:**

    Open a **new terminal window**, navigate to the `client` directory:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    The React development server will start on `http://localhost:5173`.

6.  **Open The App:**

    Open your browser and navigate to `http://localhost:5173`. You should see the EndpointHub application running!

## Project Structure

```
endpointhub/
├── client/       # React Frontend
├── server/       # Node.js Backend
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Available Scripts

### Backend (`server/`)

-   `npm run dev`: Starts the server with Nodemon for auto-reloading.
-   `npm start`: Starts the server in production mode.

### Frontend (`client/`)

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Builds the app for production.
-   `npm run preview`: Serves the production build locally.

---

# ==============================================================================
# docker-compose.yml
# ==============================================================================

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: endpointhub_postgres
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: endpointhub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: endpointhub_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:

---

# ==============================================================================
# server/package.json
# ==============================================================================
{
  "name": "endpointhub-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pg": "^8.11.5",
    "redis": "^4.6.13"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}

---

# ==============================================================================
# server/src/server.js
# ==============================================================================
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware ---

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json({ limit: '10kb' }));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Basic rate limiting to prevent abuse
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7',
	legacyHeaders: false,
});
app.use('/api', limiter);


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/proxy', proxyRoutes);

// --- Health Check Endpoint ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'EndpointHub server is running!' });
});

// --- Error Handling ---
// Handle 404 Not Found
app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server!' });
});


// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

---

# ==============================================================================
# server/src/routes/authRoutes.js
# ==============================================================================
import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;

---

# ==============================================================================
# server/src/controllers/authController.js
# ==============================================================================
// Placeholder functions for authentication logic

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  // TODO: Hashing password with bcrypt
  // TODO: Saving user to PostgreSQL database
  console.log('Registering user:', { username, email });
  res.status(201).json({ message: "User registered successfully. (Placeholder)", token: "jwt.token.here" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  // TODO: Find user in DB
  // TODO: Compare password with bcrypt
  // TODO: Generate JWT
  console.log('Logging in user:', { email });
  res.status(200).json({ message: "User logged in successfully. (Placeholder)", token: "jwt.token.here" });
};

export const getMe = async (req, res) => {
  // The 'protect' middleware will have already added the user to the request object
  console.log('Fetching profile for user:', req.user);
  res.status(200).json({ message: "User profile data. (Placeholder)", user: req.user });
};

---

# ==============================================================================
# server/src/middleware/authMiddleware.js
# ==============================================================================
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // TODO: Get user from the token (payload) and attach to request
            // For now, we'll just attach the decoded payload
            req.user = decoded; // In a real app, you'd fetch the user from DB to ensure they still exist

            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

---

# ==============================================================================
# server/src/routes/apiRoutes.js, apiKeyRoutes.js, proxyRoutes.js (Skeletons)
# ==============================================================================
// server/src/routes/apiRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
// TODO: Import controllers

// Public route
router.get('/', (req, res) => res.json({ message: "List of public APIs" }));
router.get('/:id', (req, res) => res.json({ message: `Details for API ${req.params.id}`}));

// Protected routes
router.post('/', protect, (req, res) => res.status(201).json({ message: "New API published" }));
router.put('/:id', protect, (req, res) => res.json({ message: `API ${req.params.id} updated` }));
router.delete('/:id', protect, (req, res) => res.json({ message: `API ${req.params.id} deleted` }));

export default router;


// server/src/routes/apiKeyRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
// TODO: Import controllers

router.get('/', protect, (req, res) => res.json({ message: "List of my API keys" }));
router.post('/apis/:id/keys', protect, (req, res) => res.status(201).json({ message: `Key generated for API ${req.params.id}` }));
router.delete('/:id', protect, (req, res) => res.json({ message: `Key ${req.params.id} revoked` }));

export default router;


// server/src/routes/proxyRoutes.js
import express from 'express';
import axios from 'axios';
const router = express.Router();
// TODO: Add API key validation middleware

router.all('/:apiId/*', async (req, res) => {
    console.log(`Proxying request for API: ${req.params.apiId}`);
    console.log(`Original URL: ${req.originalUrl}`);
    
    // In a real implementation:
    // 1. Get apiId from params.
    // 2. Look up the target API's base URL from the database.
    // 3. Validate the 'x-api-key' header.
    // 4. Forward the request.

    res.status(501).json({ message: "Proxy endpoint not implemented yet." });
});

export default router;

---

# ==============================================================================
# client/package.json
# ==============================================================================
{
  "name": "endpointhub-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.1.2",
    "react-router-dom": "^6.23.1",
    "swagger-ui-react": "^5.17.14"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.2.0"
  }
}

---

# ==============================================================================
# client/src/main.jsx
# ==============================================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { store } from './app/store.js';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

---

# ==============================================================================
# client/src/App.jsx
# ==============================================================================
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ApiDetailsPage from './pages/ApiDetailsPage';
import Login from './features/auth/Login';
import Register from './features/auth/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="api/:id" element={<ApiDetailsPage />} />

        {/* Protected Routes */}
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;

---

# ==============================================================================
# client/src/components/Layout.jsx
# ==============================================================================
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

---

# =================================com=============================================
# client/src/components/Header.jsx
# ==============================================================================
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  // TODO: Add logic to show different links based on auth state
  const isAuthenticated = false; 

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          EndpointHub
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-blue-500">Marketplace</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-500">Dashboard</Link>
              <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-500">Login</Link>
              <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

---

# ==============================================================================
# client/src/pages/HomePage.jsx
# ==============================================================================
import React from 'react';

const HomePage = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to EndpointHub</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300">
        The lightweight, developer-first API Marketplace.
      </p>
      {/* TODO: Add ApiList component here */}
    </div>
  );
};

export default HomePage;

---

# ==============================================================================
# client/src/app/store.js
# ==============================================================================
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

---

# ==============================================================================
# client/src/api/apiSlice.js
# ==============================================================================
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:4000/api', // Your backend URL
  prepareHeaders: (headers, { getState }) => {
    // TODO: Get token from auth state and add to headers
    // const token = getState().auth.token;
    // if (token) {
    //   headers.set('authorization', `Bearer ${token}`);
    // }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['User', 'Api', 'ApiKey'],
  endpoints: (builder) => ({}), // Endpoints will be injected from feature slices
});

