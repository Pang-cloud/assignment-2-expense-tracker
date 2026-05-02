# Expense Tracker

A single-page application (SPA) for monitoring and categorizing personal spending, built with React, Node.js, Express, and MongoDB.

## Problem Statement

Managing daily expenses manually is tedious and error-prone. This app provides a streamlined interface for logging, editing, and analyzing spending habits — giving users a clear view of where their money goes without leaving a single page.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Ant Design 6 |
| HTTP Client | Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (via Mongoose) |
| Deployment | Local (development) |

## Features

- Add, edit, and delete expense records (title, category, amount, date, description)
- View all expenses in a sortable and filterable table
- Filter expenses by category using column filters
- Category breakdown tab with percentage share visualization
- Monthly spending trends tab grouped by year-month
- Total and current-month summary statistics
- Confirmation prompt before deleting a record
- Error banner displayed when the backend is unreachable
- Color-coded category tags for quick visual scanning
- Dropdown category selector with predefined options

## Folder Structure

```
expense-tracker-assignment/
├── client/                  # React frontend (Create React App)
│   ├── public/
│   └── src/
│       ├── App.js           # Root component — all UI and business logic
│       ├── App.css
│       └── index.js         # React entry point
└── server/
    ├── index.js             # Express server, Mongoose schema, and API routes
    └── package.json
```

## How to Run

### Prerequisites
- Node.js installed
- MongoDB Atlas account with network access configured (allow your IP or `0.0.0.0/0`)

### 1. Start the Backend
```bash
cd server
npm install
node index.js
```
Server runs on `http://localhost:5001`. You should see `DB Connected! 🎉` in the terminal.

### 2. Start the Frontend
```bash
cd client
npm install
npm start
```
App opens at `http://localhost:3000`.

> Both must run simultaneously. The frontend connects to the backend at `localhost:5001`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | Fetch all expense records |
| POST | `/expenses` | Create a new expense |
| PUT | `/expenses/:id` | Update an expense by ID |
| DELETE | `/expenses/:id` | Delete an expense by ID |

## Challenges

Integrating Ant Design 6 with `moment.js` for the `DatePicker` required careful handling of date format conversions between the picker's internal object and the plain string stored in MongoDB. Managing multiple tab views (all expenses, by category, monthly trends) cleanly required computing all derived data from a single shared `expenses` state array rather than separate API calls. The MongoDB Atlas IP whitelist presented an unexpected hurdle during local development, highlighting the importance of documenting network configuration requirements. Migrating to Ant Design 6's updated API conventions (e.g., `variant` replacing `bordered`, `App.useApp()` replacing static `message`) required adapting patterns that differ from most available tutorials written for earlier versions.
