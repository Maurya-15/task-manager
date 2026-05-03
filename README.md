# Task Manager REST API

A production-oriented **Task Management REST API** built with **Node.js**, **Express**, **MongoDB Atlas** (via **Mongoose**), and **express-validator**. It exposes versioned JSON endpoints under `/api/v1/tasks` with consistent success/error payloads, pagination, filtering, and global error handling.

---

## 📸 Screenshots

### 🖥️ Application Dashboard

![TaskFlow Dashboard](./screenshots/dashboard.png)

*Full dashboard showing task cards with categories, sidebar filters, stats bar, and completed/pending states*

---

### 🗄️ MongoDB Atlas — Database

**taskflow_db Collections**

![MongoDB Collections](./screenshots/mongodb-collections.png)

*The `taskflow_db` database with two collections — `tasks` and `users`*

**Users Collection**

![MongoDB Users](./screenshots/mongodb-users.png)

*Passwords are securely hashed using bcryptjs — never stored as plain text*

**Tasks Collection**

![MongoDB Tasks](./screenshots/mongodb-tasks.png)

*Each task is linked to its owner via a `user` ObjectId reference to the Users collection*

---

## ✨ Features

- CRUD operations for tasks with MongoDB persistence
- Query filtering by `category` and `isCompleted`, plus `page` / `limit` pagination
- Dedicated `PATCH .../complete` endpoint for completion status
- Request validation with **express-validator** (422 for body/query issues, 400 for invalid `id`)
- Centralized error handling for Mongoose **CastError**, **ValidationError**, and duplicate key (**11000**)
- **Jest** + **Supertest** integration tests using **mongodb-memory-server** for isolation
- **ESLint** with **Airbnb base** configuration for consistent code style

---

## Prerequisites

- **Node.js** v18 or newer
- **npm** (bundled with Node)
- A **MongoDB Atlas** account and cluster (for local development against the cloud)

---

## 🛠️ Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Runtime    | Node.js 18+                            |
| HTTP       | Express.js                             |
| Database   | MongoDB (Atlas) + Mongoose             |
| Validation | express-validator                      |
| Config     | dotenv                                 |
| Dev        | nodemon, ESLint (Airbnb base)          |
| Testing    | Jest, Supertest, mongodb-memory-server |

---

## 🚀 Setup & Installation

1. **Clone or copy** this project into your workspace:
   ```bash
   cd task-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env` (or create `.env` manually).
   - Set `MONGODB_URI` to your Atlas connection string.
   - Adjust `PORT` and `NODE_ENV` as needed.

   Example `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
   NODE_ENV=development
   ```

4. **Run in development** (auto-restart with nodemon):
   ```bash
   npm run dev
   ```

5. **Run in production**:
   ```bash
   npm start
   ```

The server listens on the port defined by `PORT` (default **5000**).

---

## 🍃 MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a **free cluster** (M0) or use an existing one.
3. Create a **database user** with read/write access; note the username and password.
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for broad access during development only).
5. In **Database** → **Connect**, choose **Connect your application** and copy the **connection string**.
6. Replace `<username>`, `<password>`, and the cluster host in the URI. Append a database name (e.g. `taskmanager`) in the path if desired:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
7. Paste the final URI into `MONGODB_URI` in `.env`.

---

## 🔌 API Endpoints

Base path for task routes: **`/api/v1/tasks`**

| Method | Endpoint                     | Description                                     | Body / Query                                                              |
| ------ | ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| POST   | `/api/v1/tasks`              | Create a new task                               | JSON: `title` (required), `description`, `category`, `dueDate` (optional) |
| GET    | `/api/v1/tasks`              | List tasks with optional filters and pagination | Query: `category`, `isCompleted`, `page`, `limit`                         |
| GET    | `/api/v1/tasks/:id`          | Get one task by ID                              | —                                                                         |
| PUT    | `/api/v1/tasks/:id`          | Update a task (cannot set `isCompleted` here)   | JSON: optional `title`, `description`, `category`, `dueDate`              |
| PATCH  | `/api/v1/tasks/:id/complete` | Mark task as completed                          | —                                                                         |
| DELETE | `/api/v1/tasks/:id`          | Delete a task                                   | —                                                                         |

### Success response shape
```json
{
  "success": true,
  "message": "…",
  "data": {}
}
```

`data` may be a single task, `null`, or (for list) an object:
```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "tasks": []
}
```

### Error response shape
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title must not be empty" }
  ]
}
```

Other examples:
```json
{ "success": false, "message": "Invalid task ID format" }
```
```json
{ "success": false, "message": "Task not found" }
```

In **development** (`NODE_ENV=development`), some server errors may also include a `stack` field for debugging.

---

## 🧪 Running Tests

Tests use an **in-memory MongoDB** instance so your Atlas database is not touched.

```bash
npm test
```

The `test` script runs: `jest --runInBand --forceExit`.

---

## 📁 Project Structure

```
task-manager/
├── src/
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # HTTP handlers (async/await + asyncHandler)
│   ├── middlewares/            # validate.js, errorHandler.js
│   ├── models/Task.js          # Mongoose schema
│   ├── routes/taskRoutes.js    # Router mounted at /api/v1/tasks
│   ├── validators/             # express-validator chains
│   └── app.js                  # Express app (no listen)
├── tests/task.test.js          # Jest + Supertest
├── screenshots/                # README screenshots
│   ├── dashboard.png
│   ├── mongodb-collections.png
│   ├── mongodb-users.png
│   └── mongodb-tasks.png
├── server.js                   # connectDB + listen
├── package.json
├── .env.example
└── README.md
```

- **`server.js`** loads environment variables, connects to MongoDB, then starts listening.
- **`src/app.js`** configures middleware, mounts routes, defines a 404 handler, and registers the global error handler.
- **Routes** only wire validators and controllers; business rules live in controllers and the model.
