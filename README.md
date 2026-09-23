# 🎓 Campus Event Management Platform

A full-stack event management platform designed to simplify campus event registration, ticket management, and attendee check-in.

The platform focuses on two important real-world problems:

* Preventing registrations beyond an event's capacity
* Preventing duplicate ticket check-ins

---

## 🚀 Problem Statement

Managing registrations and attendees during campus events can become difficult when the number of participants increases.

Common problems include:

* Registrations exceeding the event capacity
* Duplicate or reused tickets
* Difficulty verifying attendees at entry
* Lack of real-time registration and check-in information

This project provides a centralized platform for organizers and attendees to manage the complete event lifecycle.

---

## 💡 Solution

The platform provides:

**Event Creation → Registration → Unique Ticket → Verification → Check-In → Live Dashboard**

The backend enforces important rules such as event capacity and duplicate check-in prevention, making the system more reliable than relying only on frontend validation.

---

## ✨ Key Features

### 👨‍💼 Organizer

* Create events with a strict capacity limit
* Edit and manage events
* View only their own created events
* View registered participants
* Check-in attendees
* View live registration and check-in statistics
* Bulk event creation

### 👨‍🎓 Attendee

* Register and login
* Browse available events
* Register for events
* Receive a unique Ticket ID
* View registered events
* Cancel registration
* Generate/download ticket PDF

### 🎟️ Ticket & Check-In

* Unique Ticket ID generated after successful registration
* Manual Ticket ID verification
* QR-based ticket scanning
* Duplicate check-in prevention
* Invalid ticket rejection
* Real-time attendance statistics

### 📊 Dashboard

Displays:

* Total Capacity
* Total Registered
* Total Checked-In
* Remaining Capacity
* Attendance Rate

---

## 🛡️ Important Backend Validations

### Strict Capacity

If an event has a capacity of `2`:

```text
Registration 1 → ✅ Accepted
Registration 2 → ✅ Accepted
Registration 3 → ❌ Rejected
```

The capacity rule is enforced by the backend.

### Single-Use Ticket

```text
Ticket TKT-XXXX

First Check-In  → ✅ Successful
Second Check-In → ❌ Already Checked-In
```

This prevents the same ticket from being used multiple times.

### Organizer Isolation

Organizers can access only the events that belong to their authenticated account.

```text
Organizer A
    ↓
Only Organizer A's Events

Organizer B
    ↓
Only Organizer B's Events
```

---

## 🏗️ Technology Stack

### Frontend

* React.js
* Vite
* Axios
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* REST APIs
* JWT Authentication

### Database

* MongoDB
* Mongoose

### Additional Technologies

* QR Code generation/scanning
* jsPDF for ticket generation
* Role-based access control

---

## 🏛️ System Architecture

```text
                ┌─────────────────────┐
                │       User          │
                │ Attendee / Organizer│
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   React Frontend    │
                │       + Vite        │
                └──────────┬──────────┘
                           │
                        REST API
                           │
                           ▼
                ┌─────────────────────┐
                │  Node.js + Express  │
                │                     │
                │ Auth / Events /     │
                │ Registration /      │
                │ Check-In            │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │      MongoDB        │
                │                     │
                │ Users / Events /    │
                │ Registrations       │
                └─────────────────────┘
```

---

## 📁 Project Structure

```text
Hackathon-project/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
│
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hackathon-project
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create `.env` files using the provided examples:

```text
server/.env.example
client/.env.example
```

Add your own configuration values.

**Do not commit actual `.env` files or secret credentials to GitHub.**

### 5. Start Backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 6. Start Frontend

Open another terminal:

```bash
cd client
npm run dev
```

---

## 🧪 Testing

The backend includes tests for:

* Authentication
* Role-based authorization
* Event management
* Registration
* Capacity validation
* Ticket check-in
* Duplicate check-in prevention
* Bulk event creation
* Multi-organizer event isolation

Run:

```bash
cd server
npm test
```

---

## 🎯 Demo Flow

For demonstrating the core problem statement:

```text
Organizer Login
      ↓
Create Event
Capacity = 2
      ↓
Attendee Registration #1
      ↓
Unique Ticket ID
      ↓
Attendee Registration #2
      ↓
Third Registration
      ↓
❌ Capacity Full
      ↓
Check-In Ticket #1
      ↓
✅ Check-In Successful
      ↓
Check-In Same Ticket Again
      ↓
❌ Already Checked-In
      ↓
Dashboard Statistics
```

---

## 🔮 Future Scope

Possible future improvements include:

* Dedicated mobile QR scanning application
* Email notifications
* Advanced event analytics
* College ID integration
* Automated attendance reports
* Push notifications
* Cloud deployment

---

## 👥 User Roles

| Role      | Capabilities                                                |
| --------- | ----------------------------------------------------------- |
| Attendee  | Browse events, register, manage tickets                     |
| Organizer | Create/manage events, view participants, check-in attendees |

---

## 📌 Project Objective

The primary objective of this project is to provide a reliable campus event management system where:

> **Registration capacity is strictly enforced and every ticket can be checked in only once.**

---

## 🏆 Hackathon Project

Built as a full-stack solution for a college hackathon using modern web technologies and backend-enforced validation.
