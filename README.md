# Bandhive - Band Booking Management System

Bandhive is a Django and React-based web application developed as part of my Bachelor of Computer Applications (BCA) Final Year Project (2022–2025) at Rajagiri College of Management and Applied Sciences. It streamlines the connection between music bands and event organizers by providing a centralized platform for registration, booking, and management.

## About the Project

Bandhive is designed to simplify band booking and management with the following key objectives:
- **For Bands**: Register, create profiles (genre, pricing, availability, media), and manage bookings.
- **For Customers (Event Organizers)**: Browse verified bands, check availability, and book with transparent pricing and secure payments.
- **For Admins**: Manage user verification, oversee transactions, and resolve conflicts for smooth operations.

The system enhances traditional manual processes with real-time booking management, an integrated payment gateway, WhatsApp-based communication, and a feedback/review system to ensure trust and transparency.

## Features

- **Band Registration & Verification**: Bands create profiles, verified by admins to ensure authenticity.
- **Customer Registration**: Event organizers sign up and manage bookings.
- **Band Member Management**: Bands add and manage team member details.
- **Event Booking & Approval**: Customers send requests; bands accept or reject based on availability.
- **Secure Payment System**: Implements advance payment functionality via a dummy PhonePe gateway integration.
- **Notifications & Messaging**: Real-time updates and WhatsApp-based communication.
- **Feedback & Reviews**: Customers rate and review performances, moderated by admins.
- **Admin Dashboard**: Manage users, bookings, payments, and generate analytical reports (e.g., booking trends, payment summaries) to support data-driven decisions.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Django (Python) with Django REST Framework
- **Database**: SQLite3
- **Payment Integration**: PhonePe API (simulated)
- **Other Tools**: Bootstrap, REST APIs

## Installation & Setup

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Eldorado-369/bandhive.git
   cd bandhive
   ```   
2. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt 
   ```
3. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```
4. **Start the backend server**:
   ```bash
   python manage.py runserver
   ```
5. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   npm start
   ```
