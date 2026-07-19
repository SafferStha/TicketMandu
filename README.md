# TicketMandu

TicketMandu is a full-stack event ticket booking platform designed to make discovering and booking events simple, convenient, and accessible. The platform allows users to browse events, view event details, select tickets, and manage their bookings through a centralized digital system.

## Features

- User registration and login
- Secure JWT authentication
- User profile management
- Event discovery and browsing
- Event details and categories
- Ticket booking and management
- Order management
- Payment processing
- Reviews and ratings
- Notifications
- Admin management features
- Responsive user interface
- RESTful backend API
- PostgreSQL database integration

## Technologies Used

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt

### Database

- PostgreSQL
- pgAdmin

### Testing

- Jest
- Supertest

## Project Structure

```text
TicketMandu/
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── test/
│   ├── server.js
│   └── package.json
│
└── README.md
