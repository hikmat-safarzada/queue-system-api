# Smart Queue API

A RESTful API for managing a customer queue using Node.js, Express, MongoDB and Mongoose.

The system allows customers to join a queue, view waiting customers, check individual customers, call the next customer and remove customers from the queue.

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* dotenv

---

## Project Structure

```text
src/
├── config/
│   ├── config.js
│   └── database.js
│
├── controller/
│   └── queue.controller.js
│
├── models/
│   └── User.js
│
└── routes/
    ├── app.js
    └── queue.route.js
│
server.js
package.json
.gitignore
README.md
```

---

# How the Queue Works

The queue is implemented using the `User` collection.

There is no separate `Queue` collection.

Each customer has a `status`:

```text
Waiting
Serving
Completed
```

The normal lifecycle is:

```text
Customer joins
      │
      ▼
  Waiting
      │
      │ POST /api/queue/next
      ▼
  Serving
      │
      ▼
 Completed
```

The current task does not require an endpoint for changing `Serving` to `Completed`, so that part of the lifecycle is not implemented as an API endpoint.

---

# Customer Model

A customer contains:

```js
{
    name: String,
    status: String,
    createdAt: Date,
    updatedAt: Date
}
```

`status` can have one of the following values:

```text
Waiting
Serving
Completed
```

New customers automatically receive:

```text
status: "Waiting"
```

`createdAt` and `updatedAt` are generated automatically by Mongoose using:

```js
timestamps: true
```

---

# API Endpoints

Base URL:

```text
http://localhost:8080/api/queue
```

---

## 1. Add Customer

### POST `/api/queue`

Adds a new customer to the queue.

### Request

```json
{
    "name": "Ali"
}
```

### Flow

```text
POST /api/queue
       │
       ▼
createUser()
       │
       ▼
User.create()
       │
       ▼
status = Waiting
       │
       ▼
MongoDB
```

### Example Response

```json
{
    "user": {
        "_id": "...",
        "name": "Ali",
        "status": "Waiting",
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```

---

# 2. Get Waiting Customers

### GET `/api/queue`

Returns customers currently waiting in the queue.

Only customers with:

```text
status = Waiting
```

are returned.

They are sorted by `createdAt` in ascending order.

This creates a FIFO queue:

```text
First customer added
        ↓
First customer served
```

Example:

```text
Ali    → 10:00
Veli   → 10:02
Murad  → 10:05
```

Response order:

```text
Ali
Veli
Murad
```

The sorting is:

```js
.sort({
    createdAt: 1
})
```

`1` means ascending order.

---

# 3. Get Customer By ID

### GET `/api/queue/:id`

Returns a specific customer using their MongoDB `_id`.

Example:

```text
GET /api/queue/64abc123...
```

If the customer does not exist:

```http
404 Not Found
```

---

# 4. Get All Customers

### GET `/api/queue/all`

This is an additional endpoint added for development and monitoring purposes.

Unlike:

```text
GET /api/queue
```

which only returns `Waiting` customers, this endpoint returns all customers regardless of their status.

For example:

```text
Ali     → Serving
Veli    → Serving
Murad   → Waiting
```

This endpoint can be useful for observing the complete customer lifecycle.

---

# 5. Remove Customer From Queue

### DELETE `/api/queue/:id`

Removes a customer from the queue.

Only customers whose status is:

```text
Waiting
```

can be removed.

This prevents already-serving customers from being accidentally removed from the queue.

The operation uses:

```js
findOneAndDelete({
    _id: id,
    status: "Waiting"
})
```

---

# 6. Call Next Customer

### POST `/api/queue/next`

This endpoint is responsible for calling the next customer.

The queue follows FIFO (First In, First Out).

The oldest customer with:

```text
status = Waiting
```

is selected.

Their status is then changed to:

```text
Serving
```

---

## `/next` Flow

```text
POST /api/queue/next
          │
          ▼
Find Waiting customers
          │
          ▼
Sort by createdAt ASC
          │
          ▼
Take the oldest customer
          │
          ▼
Change status
Waiting → Serving
          │
          ▼
Return customer
```

For example:

```text
Ali     → Waiting  → 10:00
Veli    → Waiting  → 10:02
Murad   → Waiting  → 10:05
```

First request:

```text
POST /api/queue/next
```

Result:

```text
Ali → Serving
```

Queue becomes:

```text
Veli  → Waiting
Murad → Waiting
```

Second request:

```text
POST /api/queue/next
```

Result:

```text
Veli → Serving
```

Queue becomes:

```text
Murad → Waiting
```

---

# Concurrency Handling

One of the important parts of the `/next` endpoint is handling multiple requests at approximately the same time.

A problematic approach would be:

```js
const user = await User.findOne({
    status: "Waiting"
});

user.status = "Serving";

await user.save();
```

The problem is that two requests could potentially find the same waiting customer before either request updates the document.

For example:

```text
Request A ──┐
            ├── find oldest Waiting → Ali
Request B ──┘
            └── find oldest Waiting → Ali
```

Both requests could attempt to serve the same customer.

To avoid this, the application uses an atomic MongoDB operation:

```js
User.findOneAndUpdate(
    {
        status: "Waiting"
    },
    {
        status: "Serving"
    },
    {
        sort: {
            createdAt: 1
        },
        new: true
    }
)
```

The important part is that finding the oldest waiting customer and updating their status are performed as one database operation.

Conceptually:

```text
Request A
    │
    ▼
Atomic operation
    │
    └── Ali → Serving

Request B
    │
    ▼
Atomic operation
    │
    └── Veli → Serving
```

Therefore, the same customer is not intentionally selected by both successful `/next` operations.

---

# Request Flow

The general application flow is:

```text
Client
  │
  │ HTTP Request
  ▼
Express Router
  │
  ▼
Controller
  │
  ▼
Mongoose Model
  │
  ▼
MongoDB
  │
  ▼
Controller
  │
  ▼
HTTP Response
  │
  ▼
Client
```

For example:

```text
POST /api/queue/next
        │
        ▼
queue.route.js
        │
        ▼
nextUser()
        │
        ▼
User.findOneAndUpdate()
        │
        ▼
MongoDB
        │
        ▼
Serving customer
        │
        ▼
JSON Response
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
```

Go to the project directory:

```bash
cd smart-queue-api
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the root directory.

Example:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
```

Do not commit `.env` to Git.

It is already included in `.gitignore`.

---

# Running the Application

Start the server:

```bash
npm start
```

For development, if a development script is configured:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:8080
```

---

# Example Workflow

A typical queue workflow can look like this:

### Step 1 — Add customers

```http
POST /api/queue
```

```json
{
    "name": "Ali"
}
```

```http
POST /api/queue
```

```json
{
    "name": "Veli"
}
```

```http
POST /api/queue
```

```json
{
    "name": "Murad"
}
```

Database:

```text
Ali     → Waiting
Veli    → Waiting
Murad   → Waiting
```

---

### Step 2 — View the queue

```http
GET /api/queue
```

Result:

```text
Ali
Veli
Murad
```

---

### Step 3 — Call next customer

```http
POST /api/queue/next
```

Result:

```text
Ali → Serving
```

---

### Step 4 — View waiting queue again

```http
GET /api/queue
```

Result:

```text
Veli
Murad
```

---

### Step 5 — View all customers

```http
GET /api/queue/all
```

Result conceptually:

```text
Ali     → Serving
Veli    → Waiting
Murad   → Waiting
```

This demonstrates the difference between the queue view and the complete customer collection.

---

# Error Handling

The API uses HTTP status codes to indicate the result of requests.

Common responses:

```text
200 OK
201 Created
404 Not Found
500 Internal Server Error
```

Examples:

### Customer not found

```json
{
    "message": "User not found"
}
```

### Empty queue

```json
{
    "message": "No customers waiting in queue"
}
```

---

# Design Decisions

### Why no separate Queue collection?

The queue is a logical representation of customers whose status is `Waiting`.

Therefore, a separate queue collection is unnecessary for this project.

Instead:

```text
User collection
      │
      ├── Waiting   → current queue
      ├── Serving   → currently being served
      └── Completed → completed customers
```

This keeps the data model simple and avoids duplicating customer information.

---

# Future Improvements

Possible future improvements include:

* Customer completion endpoint
* Queue position in `GET /api/queue/:id`
* Request validation
* Centralized error-handling middleware
* Authentication and authorization
* Pagination for large queues
* Database indexes for queue queries
* Automated tests
* API documentation with Swagger/OpenAPI
* Docker support
* Logging and monitoring

---

# Summary

Smart Queue API provides a simple REST API for managing a FIFO customer queue.

The main business logic is based on customer status:

```text
Waiting → Serving → Completed
```

The `/next` endpoint selects the oldest waiting customer and atomically changes their status to `Serving`, helping prevent duplicate selection when multiple requests arrive concurrently.
