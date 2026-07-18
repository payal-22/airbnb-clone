# Airbnb Clone

A full-stack Airbnb-inspired marketplace built using Next.js, TypeScript, FastAPI, SQLAlchemy, and SQLite.

The application allows guests to browse and search property listings, view listing details, select dates, create bookings, and view their trips. Hosts can create, edit, delete, and manage their listings through a dedicated dashboard.

## Live Links

- **Live Application:** https://airbnb-clone-chi-lac.vercel.app
- **GitHub Repository:** https://github.com/payal-22/airbnb-clone
- **Backend API:** https://airbnb-clone-production-c428.up.railway.app
- **Swagger API Documentation:** https://airbnb-clone-production-c428.up.railway.app/docs

## Features

### Guest Experience

- Airbnb-inspired responsive user interface
- Property listing grid with:
  - Property image
  - Name and location
  - Price per night
  - Ratings
  - Guest capacity
- Search listings by location, title, or country
- Filter listings by:
  - Category
  - Guest count
  - Price range through the API
  - Property type through the API
- Listing details page with:
  - Photo gallery
  - Property description
  - Host details
  - Amenities
  - Guest capacity
  - Bedrooms, beds, and bathrooms
  - Reviews section
- Date-range booking
- Guest-count validation
- Price breakdown
- Mocked checkout
- Booking confirmation
- Prevention of overlapping bookings
- Unavailable date display
- My Trips dashboard
- Persisted booking records

### Host Experience

- Host dashboard
- View active and deleted listings
- Create new listings
- Edit existing listings
- Soft-delete listings
- View reservations for host-owned properties
- View mock booking revenue
- Manage property information, including:
  - Title
  - Description
  - Location
  - Property type
  - Category
  - Price
  - Fees
  - Guest capacity
  - Bedrooms
  - Beds
  - Bathrooms
  - Images
  - Amenities

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- CSS
- Vercel

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- Render

### Database

- SQLite

## Project Structure

```text
airbnb-clone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   ├── .env.example
│   ├── .python-version
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── host/
│   │   │   └── page.tsx
│   │   ├── listings/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── trips/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── types/
│   │   ├── booking.ts
│   │   └── listing.ts
│   └── package.json
│
├── .gitignore
└── README.md
```

## Application Architecture

The project uses a client-server architecture.

```text
Next.js Frontend
        |
        | HTTP requests and JSON responses
        v
FastAPI REST Backend
        |
        | SQLAlchemy ORM
        v
SQLite Database
```

### Frontend Responsibilities

The Next.js frontend handles:

- User interface
- Search and filtering controls
- Listing cards
- Listing details
- Date and guest selection
- Booking requests
- Guest trips dashboard
- Host listing management

### Backend Responsibilities

The FastAPI backend handles:

- Listing retrieval
- Search and filtering
- Pagination
- Listing creation
- Listing updates
- Listing deletion
- Booking validation
- Date-overlap validation
- Price calculation
- Guest trip retrieval
- Host reservation retrieval
- SQLite persistence

## Database Schema

The database contains three primary tables:

1. Users
2. Listings
3. Bookings

### Users Table

| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `name` | String | User's name |
| `email` | String | Unique user email |
| `role` | String | Guest or host |
| `avatar_url` | String | Profile-image URL |
| `created_at` | DateTime | User creation timestamp |

### Listings Table

| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `host_id` | Integer | Foreign key referencing users |
| `title` | String | Listing title |
| `description` | Text | Property description |
| `location` | String | City or region |
| `country` | String | Country |
| `property_type` | String | Villa, apartment, cabin, etc. |
| `category` | String | Listing category |
| `price_per_night` | Float | Nightly price |
| `cleaning_fee` | Float | Cleaning charge |
| `service_fee` | Float | Service charge |
| `max_guests` | Integer | Maximum guest capacity |
| `bedrooms` | Integer | Number of bedrooms |
| `beds` | Integer | Number of beds |
| `bathrooms` | Float | Number of bathrooms |
| `rating` | Float | Listing rating |
| `review_count` | Integer | Number of reviews |
| `image_url` | String | Main property image |
| `image_urls` | Text | Additional comma-separated images |
| `amenities` | Text | Comma-separated amenities |
| `latitude` | Float | Property latitude |
| `longitude` | Float | Property longitude |
| `is_active` | Boolean | Active or soft-deleted status |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

### Bookings Table

| Field | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `listing_id` | Integer | Foreign key referencing listings |
| `guest_id` | Integer | Foreign key referencing users |
| `check_in` | Date | Check-in date |
| `check_out` | Date | Check-out date |
| `guests` | Integer | Number of guests |
| `nights` | Integer | Number of booked nights |
| `nightly_total` | Float | Nightly rate multiplied by nights |
| `cleaning_fee` | Float | Cleaning fee |
| `service_fee` | Float | Service fee |
| `total_price` | Float | Complete mocked booking total |
| `status` | String | Booking status |
| `created_at` | DateTime | Booking timestamp |

## Database Relationships

```text
User 1 -------- many Listings
User 1 -------- many Bookings
Listing 1 ----- many Bookings
```

A host can own multiple listings.

A guest can create multiple bookings.

A listing can have multiple bookings as long as the booking date ranges do not overlap.

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API welcome response |
| `GET` | `/health` | API health check |
| `GET` | `/listings` | Search, filter, and paginate listings |
| `GET` | `/listings/{listing_id}` | Retrieve one listing |
| `POST` | `/listings` | Create a new listing |
| `PUT` | `/listings/{listing_id}` | Update an existing listing |
| `DELETE` | `/listings/{listing_id}` | Soft-delete a listing |
| `GET` | `/hosts/{host_id}/listings` | Retrieve host-owned listings |
| `POST` | `/bookings` | Create a booking |
| `GET` | `/listings/{listing_id}/unavailable-dates` | Retrieve booked date ranges |
| `GET` | `/users/{user_id}/trips` | Retrieve guest bookings |
| `GET` | `/hosts/{host_id}/bookings` | Retrieve bookings for host properties |

Interactive Swagger documentation:

```text
https://airbnb-clone-production-c428.up.railway.app/docs
```

## Listing Search Parameters

The `GET /listings` endpoint supports:

| Parameter | Description |
|---|---|
| `search` | Search by title, location, or country |
| `category` | Filter by listing category |
| `property_type` | Filter by property type |
| `min_price` | Minimum nightly price |
| `max_price` | Maximum nightly price |
| `guests` | Minimum guest capacity |
| `page` | Current page |
| `page_size` | Number of listings per page |

Example:

```text
GET /listings?search=Goa&guests=2&page=1&page_size=12
```

## Booking Validation

The backend validates every booking request.

### Date Validation

- Check-in cannot be in the past.
- Check-out must be later than check-in.
- Both dates are required.

### Guest Validation

The selected guest count cannot exceed the listing's maximum capacity.

### Overlapping Booking Validation

A booking conflicts with an existing booking when:

```text
existing check-in < requested check-out
AND
existing check-out > requested check-in
```

When an overlap is found, the API returns:

```json
{
  "detail": "The listing is unavailable for the selected dates"
}
```

### Price Calculation

```text
Nightly total = price per night × number of nights

Final total =
nightly total
+ cleaning fee
+ service fee
```

Real payment processing is not included. Checkout and payment confirmation are mocked.

## Mock Users

Authentication is simplified using fixed user IDs.

| Role | User ID | Name |
|---|---:|---|
| Guest | 1 | Yash Raj |
| Host | 2 | Aarav Sharma |
| Host | 3 | Meera Kapoor |

The frontend currently uses:

```text
Guest ID: 1
Host ID: 2
```

These IDs represent mocked guest and host sessions.

## Seed Data

The database seed script creates:

- One guest user
- Two host users
- Four sample property listings
- One existing confirmed booking

The seed data allows the application to be used immediately after setup.

## Local Installation

### Prerequisites

Install:

- Git
- Node.js
- npm
- Python 3.11 or later

### Clone the Repository

```bash
git clone https://github.com/payal-22/airbnb-clone.git
cd airbnb-clone
```

## Backend Setup

Enter the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS or Linux:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
python -m pip install -r requirements.txt
```

Create and seed the database:

```bash
python -m app.seed
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

## Frontend Setup

Open another terminal and enter the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a file named:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start Next.js:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

To verify the frontend production build:

```bash
cd frontend
npm run build
```

To verify the Python files:

```bash
cd backend
source .venv/bin/activate
python -m py_compile app/*.py
```

## Deployment

### Frontend Deployment

The frontend is deployed on Vercel.

Vercel configuration:

```text
Root Directory: frontend
Framework: Next.js
Build Command: npm run build
Install Command: npm install
```

Environment variable:

```env
NEXT_PUBLIC_API_URL=https://airbnb-clone-production-c428.up.railway.app
```

### Backend Deployment

The backend is deployed on Render.

Render configuration:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Backend environment variable:

```env
FRONTEND_URL=https://airbnb-clone-chi-lac.vercel.app/
```

Optional database variable:

```env
DATABASE_URL=sqlite:///./airbnb.db
```

## Assumptions

- User authentication is mocked.
- Guest and host accounts are represented using fixed IDs.
- Checkout and payments are mocked.
- Listing images are loaded using external image URLs.
- Amenities are stored as comma-separated values.
- Additional gallery images are stored as comma-separated URLs.
- Reviews are placeholder data.
- Listing deletion is implemented as a soft delete.
- A basic location representation is used instead of a real-time map.
- Messaging and identity verification are outside the project scope.

## Known Limitations

- The Render free-tier filesystem is ephemeral.
- SQLite data may reset after a redeployment or service restart.
- The application does not contain real authentication.
- The application does not process real payments.
- Reviews cannot currently be submitted by users.
- Wishlists are not persisted.
- Image upload uses URLs instead of cloud-storage uploads.

## Future Improvements

- Real authentication and authorization
- PostgreSQL production database
- Persistent production database storage
- Cloud-based image uploads
- Interactive maps
- Wishlist persistence
- Review creation
- Host and guest messaging
- Email notifications
- Automated unit and integration tests
- Playwright end-to-end testing
- Improved availability calendar
- Pagination controls on the frontend

## Author

**Singh Payal**

GitHub: [payal-22](https://github.com/payal-22)

## License

This project was created as a full-stack development assignment and is intended for educational and evaluation purposes.
