# Viazo Technologies Assessment

A full-stack **doctor appointment management system** built with **React, TypeScript, Express, MongoDB, and Socket.IO**. The application is organized as a client/server monorepo and supports role-based workflows for **Patients, Doctors, Receptionists, Admins, and Super Admins**.

## Live Demo

- **Deployed app:** https://medibook-gilt-woad.vercel.app

## Features

### Authentication & Access Control
- Register, login, forgot password, reset password, and change password flows
- JWT-based authentication with protected routes
- Role-based dashboards and navigation for each user type

### Patient Experience
- Search doctors and view doctor profiles
- Book, reschedule, and manage appointments
- View medical records and appointment history
- Submit and view doctor reviews
- Manage patient profile details

### Doctor Experience
- View upcoming and past appointments
- Inspect patient details
- Manage schedule and availability

### Receptionist Experience
- Handle queue management
- Manage walk-in patients
- Support billing workflows

### Admin Experience
- Manage doctors and patients
- View all appointments
- Access summary reports

### Backend Capabilities
- REST APIs for auth, dashboard, patient, doctor, receptionist, admin, review, report, upload, and payment modules
- File upload support via Multer
- Payment verification endpoints
- Email/notification service scaffolding
- Health check endpoint and static upload hosting
- Security hardening with Helmet, CORS, and rate limiting

## Tech Stack

### Frontend
- React 19
- Vite
- TypeScript
- React Router DOM
- Socket.IO Client
- Zod

### Backend
- Node.js
- Express 5
- TypeScript
- MongoDB + Mongoose
- JWT
- bcryptjs
- Multer
- Nodemailer
- Socket.IO
- Helmet
- CORS
- Express Rate Limit
- cookie-parser

## Project Structure

```text
Viazo_Technologies_Assessment/
├── Doctor-Appointment-Client/
└── Doctor-Appointment-Server/
```

## Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB running locally or a MongoDB Atlas connection string

### 1) Clone the repository

```bash
git clone https://github.com/Rinzlertron456/Viazo_Technologies_Assessment.git
cd Viazo_Technologies_Assessment
```

### 2) Install client dependencies

```bash
cd Doctor-Appointment-Client
npm install
```

### 3) Install server dependencies

```bash
cd ../Doctor-Appointment-Server
npm install
```

### 4) Configure server environment variables

Create a file named `.env` inside `Doctor-Appointment-Server/`.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/doctor-appointment
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@medibook.com
```

### 5) Run the backend

```bash
cd Doctor-Appointment-Server
npm run dev
```

### 6) Run the frontend

The client is configured to call the backend at `http://localhost:5000/api` from `src/services/api.ts`.

```bash
cd Doctor-Appointment-Client
npm run dev
```

## Available Scripts

### Client
- `npm run dev` — start the Vite dev server
- `npm run build` — create a production build
- `npm run preview` — preview the production build
- `npm run lint` — run Oxlint

### Server
- `npm run dev` — start the TypeScript server with Nodemon + ts-node
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server
- `npm test` — placeholder test command

## API Overview

The backend is split into modular route groups:
- `/api/auth`
- `/api/dashboard`
- `/api/patient`
- `/api/doctor`
- `/api/receptionist`
- `/api/admin`
- `/api/reviews`
- `/api/admin/reports`
- `/api/upload`
- `/api/payment`

## Notes

- The frontend uses protected routes to separate access by role.
- Uploads are served statically from the `/uploads` path.
- The client keeps the access token in `localStorage` and retries requests after token refresh.

## Resume Project Summary

- Built a full-stack doctor appointment platform with separate flows for patients, doctors, receptionists, and admins.
- Implemented secure authentication and role-based authorization using JWT, bcrypt, cookies, and protected routes.
- Developed appointment, queue, billing, review, medical record, and reporting modules across the client and server.
- Added backend support for uploads, payment verification, rate limiting, and real-time communication with Socket.IO.
