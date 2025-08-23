---
# EndpointHub: API Marketplace

## Overview

EndpointHub is a lightweight and free-first API marketplace designed for developers to publish, discover, and consume APIs with ease. It features user authentication, API key management, secure request proxying with rate limiting, and interactive documentation. Built entirely with free and open-source technologies, EndpointHub is perfect for students, hobbyists, and developers wanting to build, deploy, and scale without cost.
---

## Technologies Used

## Frontend

- Next.js 13+ (React framework with built-in routing, SSR/SSG)

- Tailwind CSS (utility-first, responsive styling)

- Redux Toolkit + RTK Query (state management & API caching)

- Swagger UI / Redoc (interactive API documentation viewer)

## Backend

- Node.js + Express.js (REST API server)

- PostgreSQL (free tier on Supabase or local via Docker)

- Redis (optional caching & rate limiting; free tiers available)

- JWT (JSON Web Tokens for authentication)

- bcrypt (password hashing)

## DevOps & Deployment

- Docker & Docker Compose (for local development)

- GitHub Actions (CI/CD automation)

- Render / Railway / Vercel / Netlify (free hosting tiers)

- Nginx (optional reverse proxy for SSL and routing)

---

## Features (MVP)

- User registration/login with JWT authentication

- Publish APIs with OpenAPI/Swagger docs

- Generate and revoke API keys per user and API

- Proxy API requests with key validation and rate limiting

- Interactive API documentation viewer embedded in the frontend

- Usage analytics dashboard (requests, errors, latency)

- Responsive UI with light/dark mode support

---

## Project Structure

text

`endpointhub/ ├── frontend/                    # Next.js app (UI, dashboards, docs) │   ├── app/                     # Next.js 13 App Router routes (pages + API routes) │   │   ├── api/                 # Next.js API routes (optional backend logic) │   │   ├── dashboard/           # Publisher & analytics dashboard pages │   │   ├── apis/                # API listing & documentation viewer pages │   │   └── page.tsx             # Landing page │   ├── components/              # Reusable React components │   ├── styles/                  # Tailwind config and CSS files │   ├── utils/                   # Helper functions, api wrappers │   ├── public/                  # Static assets (images, favicon) │   ├── package.json │   └── next.config.js │ ├── backend/                     # Express.js REST API server │   ├── src/ │   │   ├── controllers/         # REST route handlers │   │   ├── middlewares/         # Auth, rate limit, validation middleware │   │   ├── models/              # DB schema/models │   │   ├── routes/              # API route definitions │   │   ├── services/            # Business logic like API key mgmt, analytics │   │   └── index.ts             # Server entry point │   ├── package.json │   └── Dockerfile │ ├── docker-compose.yml           # Compose file for backend, frontend, Postgres, Redis ├── nginx/ │   └── nginx.conf               # Optional reverse proxy and SSL config └── README.md `

---

## Getting Started

## Prerequisites

- Node.js v18 or higher

- Docker & Docker Compose (for running PostgreSQL, Redis, and services locally)

- Git

## Environment Variables (.env)

Create a `.env` file inside the `backend/` directory with the following variables:

text

`PORT=4000 DATABASE_URL=postgres://dev:dev@localhost:5432/endpointhub JWT_SECRET=your_jwt_secret_key REDIS_URL=redis://localhost:6379 FRONTEND_URL=http://localhost:3000 `

## Running Locally

1.  Clone the repository:

bash

`git clone <your-repo-url> endpointhub cd endpointhub `

1.  Start the Docker services:

bash

`docker-compose up -d `

1.  Install and run the backend server:

bash

`cd backend npm install npm run dev `

1.  Install and run the frontend:

bash

`cd frontend npm install npm run dev `

1.  Open your browser and navigate to:

text

`http://localhost:3000 `

---

## API Endpoints

## Authentication

- `POST /api/auth/register` - Register a new user

- `POST /api/auth/login` - Authenticate user and receive JWT

- `GET /api/auth/me` - Get info about the currently logged-in user

## APIs

- `POST /api/apis` - Publish a new API (OpenAPI spec upload)

- `GET /api/apis` - List all published APIs

- `GET /api/apis/:id` - Get details of a specific API

- `PUT /api/apis/:id` - Update API (owner only)

- `DELETE /api/apis/:id` - Delete API (owner only)

## API Keys

- `POST /api/apis/:id/keys` - Generate an API key for an API

- `GET /api/keys` - List all API keys for the user

- `DELETE /api/keys/:id` - Revoke an API key

## Proxy

- `ALL /proxy/:apiId/*` - Proxies requests to the target API with API key validation and rate limiting

---

## Roadmap

- Week 1: Setup authentication, database, and user management

- Week 2: Develop API publishing and listing UI + backend endpoints

- Week 3: Implement API key generation and request proxying

- Week 4: Add usage analytics, error tracking, and rate limiting middleware

- Week 5: Finalize UI polish, testing, and prepare deployment scripts

---

## Backend Server Skeleton (Express.js)

```typescript

`// backend/src/index.ts
// import express from 'express'; import cors from 'cors'; import morgan from 'morgan'; import authRoutes from './routes/auth'; import apiRoutes from './routes/apis'; import keyRoutes from './routes/keys'; import proxyRoutes from './routes/proxy';   const app = express();   app.use(cors()); app.use(express.json()); app.use(morgan('dev'));   app.use('/api/auth', authRoutes); app.use('/api/apis', apiRoutes); app.use('/api/keys', keyRoutes); app.use('/proxy', proxyRoutes);   const PORT = process.env.PORT || 4000; app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); `

```

---

## Frontend Skeleton (Next.js with Redux Toolkit)

tsx

`// frontend/src/pages/_app.tsx import { AppProps } from 'next/app'; import { Provider } from 'react-redux'; import store from '../redux/store'; import '../styles/globals.css';   function MyApp({ Component, pageProps }: AppProps) {
 return ( <Provider store={store}> <Component {...pageProps} /> </Provider> ); }   export default MyApp; `

---
