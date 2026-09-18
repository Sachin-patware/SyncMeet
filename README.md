# SyncMeet

SyncMeet is a real-time communication platform built for video meetings, instant collaboration, and seamless meeting management. It combines modern web technologies with secure authentication, room-based communication, and a polished user experience for both personal and professional use.

## Overview

SyncMeet enables users to:
- Sign up and log in securely
- Join meeting rooms instantly
- Schedule and manage meetings
- Access recent meeting history
- Collaborate in real-time through live communication channels
- Manage profile and account settings

The application is split into a Node.js backend and a React frontend, connected through a real-time Socket.IO layer and powered by modern frontend tooling.

## Features

- Secure authentication with JWT, refresh tokens, and password recovery
- Google sign-in support
- OTP-based verification and email-based password reset
- Meeting room creation and joining flow
- Real-time peer communication using WebRTC and Socket.IO
- Dashboard for meeting activity and access
- Recent meeting history tracking
- User profile and settings management
- Responsive UI designed for desktop and mobile users

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Socket.IO Client
- simple-peer
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT
- bcrypt
- nodemailer
- rate limiting and middleware-based security

## Project Structure

```bash
SyncMeet/
├── backend/
│   ├── Routes/
│   │   ├── auth.js
│   │   └── meeting.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── utils/
│   ├── app.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json
├── .gitignore
├── README.md
└── ...
Prerequisites
Before running the application, make sure you have:

Node.js 18 or newer
npm or yarn
MongoDB running locally or remotely
A valid Google OAuth client configuration (optional, for Google login)
SMTP email credentials for password reset / OTP email flows
Environment Variables
Create a .env file inside the backend directory with the following variables:

env
PORT=3000
MONGODB_URL=mongodb://localhost:27017/syncmeet
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
FRONTEND_URL=http://localhost:5174

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
Update the values according to your local setup and deployment environment.

Installation
1. Clone the repository
bash
git clone https://github.com/Sachin-patware/SyncMeet.git
cd SyncMeet
2. Install backend dependencies
bash
cd backend
npm install
3. Install frontend dependencies
bash
cd ../frontend
npm install
Running the App
Start the backend
bash
cd backend
npm run dev
Backend server will run on:

bash
http://localhost:3000
Start the frontend
bash
cd frontend
npm run dev
Frontend app will run on:

bash
http://localhost:5174
API Endpoints
Authentication
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/google
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh-token
POST /api/auth/logout
GET /api/auth/me
PUT /api/auth/update-profile
Meeting Management
POST /api/meetings/save
GET /api/meetings/list/:user_id
GET /api/meetings/details/:meeting_id
How It Works
Users sign up or log in securely.
The app authenticates users using JWT and refresh tokens.
Users can join or create a meeting room.
Socket.IO manages live signaling and real-time updates.
WebRTC handles peer-to-peer audio/video communication.
Recent meetings are saved and retrieved for user access.
Application Flow
Landing page for product introduction
Login and signup pages
OTP verification and password recovery flow
Dashboard for meeting navigation
Join room page for live sessions
Schedule page for upcoming meetings
History page to track previous sessions
Settings page for user profile management
Full-screen room page for live collaboration
