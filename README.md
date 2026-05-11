# My Expense Tracker

## Project Overview

My Expense Tracker is a full-stack single-page web application developed for Internet Programming Assignment 2.

The app helps users record personal expenses, manage monthly budgets, and view spending summaries. Users can register, log in, manage their own expenses and budgets, and update their profile.

The system also includes an admin panel. Admin users can manage normal user account status and view activity logs.

---

## Problem Solved

Many users find it hard to track daily spending and understand where their money goes each month. Notes or spreadsheets can become messy when there are many records.

This app solves the problem by giving users one place to save expenses, set budgets, and check their spending progress.

---

## Tech Stack

### Frontend

- React
- JavaScript
- Ant Design
- CSS
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- dotenv

### Data and Page Behaviour

- MongoDB stores users, expenses, budgets, and activity logs.
- The app behaves like a single-page application.
- React updates page content dynamically without loading a new HTML page from the server.

---

## Features

- User registration, login, and logout
- JWT authentication
- Profile view and profile update
- Avatar selection
- Account deactivation for normal users
- Full CRUD for expenses
- Full CRUD for monthly budgets
- Expense live search
- Budget progress and over-budget status
- Category summary and monthly trend view
- Admin panel for user management
- Admin can activate or deactivate normal users
- Activity logs with live search
- Form validation and error messages
- Responsive dashboard design

---

## CRUD Entities

| Entity  | Create           | Read                            | Update                  | Delete             |
| ------- | ---------------- | ------------------------------- | ----------------------- | ------------------ |
| User    | Register account | View profile / admin view users | Edit profile and avatar | Deactivate account |
| Expense | Add expense      | View expenses                   | Edit expense            | Delete expense     |
| Budget  | Add budget       | View budgets                    | Edit budget             | Delete budget      |

User delete is handled as account deactivation. The user record stays in the database, but the account cannot log in unless an admin activates it again.

---

## Folder Structure

```text
Assignment_2
├── client
│   ├── public
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── favicon.svg
│   └── src
│       ├── components
│       │   ├── AdminPanel.js
│       │   ├── BudgetPanel.js
│       │   ├── CategorySummary.js
│       │   ├── ExpenseForm.js
│       │   ├── ExpenseTable.js
│       │   ├── MonthlyTrend.js
│       │   └── ProfilePanel.js
│       ├── constants
│       │   └── avatarOptions.js
│       ├── services
│       │   └── api.js
│       ├── App.css
│       └── App.js
├── server
│   └── index.js
├── README.md
└── .gitignore
```

### Folder Explanation

- `client`: React frontend
- `client/public`: Main HTML file and website icon
- `client/src/components`: Frontend UI components
- `client/src/services`: API request functions
- `client/src/constants`: Avatar options
- `server`: Express backend and API routes

---

## Challenges Overcome

One challenge was connecting the backend to MongoDB correctly and keeping the connection string inside the `.env` file.

Another challenge was designing user and admin permissions. Normal users should only manage their own expenses and budgets, while admin users need extra permission to manage normal user accounts.

We also improved the interface several times to make the app cleaner and easier to use, especially the budget page, profile page, activity logs, and table layout.

GitHub was also important for this group project. We needed to make meaningful commits and avoid uploading sensitive files.

---

## Environment Variables

Create a `.env` file inside the `server` folder:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

The real `.env` file should not be uploaded to GitHub.

---

## How to Run

### Backend

```bash
cd server
npm install
node index.js
```

The backend runs on:

```text
http://localhost:5001
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm start
```

The frontend runs on:

```text
http://localhost:3000
```

---

## Admin Account

The first registered user becomes an admin account.

Later registered users become normal user accounts.

Admin users can view all users, activate or deactivate normal user accounts, and search activity logs. Normal users cannot access the admin panel.

---

## Validation and Error Handling

The app includes:

- Required field validation
- Positive amount validation
- Positive budget limit validation
- Duplicate monthly budget prevention
- Delete confirmation popups
- Disabled account login message
- Backend connection error message

---

## GitHub Practice

Git and GitHub were used to manage the project. The repository includes the source code and README file, but does not include `.env` or `node_modules`.
