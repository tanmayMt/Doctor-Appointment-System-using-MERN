# Doctor Appointment System

A MERN stack application with a clean separated architecture: **Backend (server)** and **Frontend (client)**.

## Project Structure

```
├── server/          # Backend (Node.js + Express)
│   ├── config/      # Database configuration
│   ├── controllers/ # Route handlers
│   ├── middlewares/ # Auth, etc.
│   ├── models/      # Mongoose models
│   ├── routes/      # API routes
│   ├── server.js    # Entry point
│   └── package.json
│
├── client/          # Frontend (React)
│   ├── src/
│   └── package.json
│
└── package.json     # Root - run both
```

## Setup

### 1. Backend (Server)

```bash
cd server
cp .env.example .env    # Copy and fill in your values
npm install
```

**Important:** Copy the root `.env` to `server/.env` (or create from `server/.env.example`). Remove `REACT_APP_*` vars—those belong in `client/.env`.

Create `server/.env` with:
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 8080)
- `SENDER_GMAIL`, `SENDER_GMAIL_PASSCODE` - For email (optional)

### 2. Frontend (Client)

```bash
cd client
cp .env.example .env    # Set REACT_APP_API_BASE_URL to your backend URL
npm install
```

### 3. Run Development

From project root:

```bash
npm install
npm run dev
```

This starts:
- **Server** on http://localhost:8080
- **Client** on http://localhost:3000

### Run Separately

```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
npm run client
```

## Deployment

- **Backend**: Deploy `server/` to Render, Railway, Heroku, etc.
- **Frontend**: Deploy `client/` to Vercel, Netlify, etc. Set `REACT_APP_API_BASE_URL` to your backend URL.
