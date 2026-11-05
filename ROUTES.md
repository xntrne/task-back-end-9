# Movie App API Documentation

Movie application with session-based authentication, movies, actors, and reviews using Express 5 and Mongoose (MongoDB). Includes a bespoke dark-mode frontend built with Tailwind CSS and DaisyUI 5.

## Project Structure

```
├── .env                       ← MONGODB_URI, PORT, SESSION_SECRET
├── .env.example
├── index.js                   ← Express app entry point (middleware, routes, error handling)
├── seed.js                    ← Demo users, actors, movies, reviews
├── db/
│   └── index.js               ← Mongoose connection + DNS config
├── models/                    ← Mongoose Schemas & Models (no indexes added)
│   ├── User.js                ← User model (pre-save bcrypt hook, comparePassword, OTP methods)
│   ├── Session.js             ← Manual sessions collection (createSession, validateSession)
│   ├── Actor.js               ← Actor model (movies virtual, searchByName static)
│   ├── Movie.js               ← Movie model (reviews virtual, searchMovies static, cascade delete hook)
│   └── Review.js              ← Review model (findByMovie, findByUser statics)
├── middleware/
│   ├── checkAuth.js           ← Session lookup → req.user
│   ├── validateBody.js        ← Zod validation middleware
│   ├── validateObjectId.js    ← Reusable Mongoose ObjectId validator
│   └── upload.js              ← Multer image upload (single & multiple)
├── routes/
│   ├── auth.routes.js         ← Register, login, logout, OTP, me
│   ├── movie.routes.js        ← Movies CRUD + reviews on movie
│   ├── actor.routes.js        ← Actors CRUD
│   ├── review.routes.js       ← Review CRUD + user reviews
│   └── pages.routes.js        ← Static HTML pages router (no auth middlewares)
├── validation-schemas/
│   ├── auth.schema.js         ← Zod schemas for auth
│   ├── movie.schema.js        ← Zod schemas for movies
│   ├── actor.schema.js        ← Zod schemas for actors
│   └── review.schema.js       ← Zod schemas for reviews
├── uploads/                   ← Uploaded images land here (served at /uploads)
└── pages/                     ← Dark theme DaisyUI + Tailwind frontend
    ├── css/
    │   └── index.css          ← Design tokens (CSS custom properties, glassmorphism, fonts)
    ├── js/
    │   ├── auth.js            ← Shared client helpers (auth check, toast, confirmAction, getActorImage)
    │   └── navbar.js          ← Responsive navigation bar & auth state
    ├── home.html              ← Movie browse, title search, actor filter, add movie modal
    ├── movie.html             ← Single movie, YouTube trailer embed, cast, reviews, edit cast
    ├── actors.html            ← Actors list & search, add actor modal
    ├── actor.html             ← Single actor profile & filmography, edit & delete
    ├── my-reviews.html        ← User review history (edit & delete)
    ├── login.html             ← User login form
    ├── register.html          ← User registration form (optional avatar upload)
    ├── forgot-password.html   ← OTP request & password reset flow
    └── 404.html               ← Error page
```

## Packages

```bash
npm install bcrypt cookie-parser express mongoose multer zod
```

---

## Models & Schemas

### User
- `username`: String (min 2 chars)
- `email`: String (valid email, lowercase, trimmed)
- `password`: String (bcrypt hashed via pre-save hook)
- `image`: String (optional, uploaded filename)
- `resetOtp`: String (optional 6-digit code)
- `resetOtpExpires`: Date (optional expiry)

### Session
- `sessionId`: String (random 32-byte hex)
- `user`: ObjectId → User
- `expiresAt`: Date (7 days default)

### Actor
- `name`: String
- `images`: [String] (uploaded filenames; fallback to default placeholder if empty)
- `birthdate`: Date (optional)
- *Virtual*: `movies` (referencing `Movie.actors`)

### Movie
- `title`: String
- `year`: Number
- `genres`: [String]
- `description`: String
- `trailerLink`: String (YouTube URL)
- `image`: String (uploaded filename)
- `director`: String
- `actors`: [ObjectId → Actor]
- *Virtual*: `reviews` (referencing `Review.movie`)

### Review
- `number`: Number (0 - 10)
- `comment`: String (optional)
- `movie`: ObjectId → Movie
- `user`: ObjectId → User

---

## Frontend Architecture & Conventions

- **Default Theme**: Dark mode enabled by default (`data-theme="dark"` via DaisyUI).
- **Design Tokens**: Stored in `pages/css/index.css` via CSS variables (`--font-display`, `--accent-gold`, etc.).
- **No Page Middlewares**: HTML page routes have no auth middlewares. All authorization checks (`requireAuth()`) and validations happen client-side and at the API level.
- **Auto-Refresh**: All user actions (creating/updating/deleting movies, actors, reviews, and authentication) refresh the page to keep displayed data fresh.
- **Confirmation Modals**: Deletions use a DaisyUI modal dialog (`confirmAction()`) instead of native browser `confirm()`.
- **Actor Image Fallback**: Default actor placeholder (`DEFAULT_ACTOR_IMAGE`) is automatically used whenever an actor has no uploaded image or image fails to load.
- **Review Form Layout**: Single-column layout (Rating 0-10 → Comment textarea → Submit button).

---

## Page Routes (`pages.routes.js`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/home.html` |
| `GET` | `/home.html` | Movie list with title search, actor filter, and Add Movie modal |
| `GET` | `/movie.html?id=:id` | Movie details, trailer embed, cast list, reviews, edit & delete |
| `GET` | `/actors.html` | Actor list with name search and Add Actor modal |
| `GET` | `/actor.html?id=:id` | Actor profile, photos, filmography, edit & delete |
| `GET` | `/my-reviews.html` | Current user's reviews with edit and delete modal |
| `GET` | `/login.html` | User sign-in form |
| `GET` | `/register.html` | User registration with optional avatar |
| `GET` | `/forgot-password.html` | Two-step OTP request and password reset |
| `GET` | `/404.html` | Custom 404 page |

---

## Detailed API Routes

---

### 1. Auth Routes (`/auth`)

#### POST `/auth/register`

Register a new user account. Supports optional avatar image upload. **Does not create a session** — user logs in afterwards.

- **Content-Type**: `multipart/form-data` or `application/json`
- **Auth**: None

**Request Body (Form Fields / JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | Yes | Min 2 characters |
| `email` | string | Yes | Valid email format (converted to lowercase) |
| `password` | string | Yes | Min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| `password_confirmation` | string | Yes | Must exactly match `password` |
| `image` | file | No | Image file (jpg, jpeg, png, webp, gif, max 5MB) |

**Success Response (201 Created):**

```json
{
  "message": "register successful, you can now login",
  "data": {
    "user": {
      "_id": "671ca614a92c4b817342df01",
      "username": "eyad",
      "email": "eyad@test.com",
      "image": "9809930f-b4b1-4c6e-be25-f761d7a96434.jpg",
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  }
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "errors": {
    "email": {
      "errors": ["email already in use"]
    },
    "password": {
      "errors": ["password must contain at least 1 capital letter, 1 small letter, 1 digit, and 1 special character"]
    }
  }
}
```

---

#### POST `/auth/login`

Authenticate with email and password. Sets an HTTP-only session cookie named `movie_session` valid for 7 days.

- **Content-Type**: `application/json`
- **Auth**: None

**Request Body:**

```json
{
  "email": "eyad@test.com",
  "password": "Password1!"
}
```

**Success Response (200 OK):**

*Sets Cookie: `movie_session=<32-byte-hex>; HttpOnly; SameSite=Lax; Max-Age=604800`*

```json
{
  "message": "login successful",
  "data": {
    "user": {
      "_id": "671ca614a92c4b817342df01",
      "username": "eyad",
      "email": "eyad@test.com",
      "image": null,
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "error": "invalid email or password"
}
```

---

#### POST `/auth/logout`

Destroy current session and clear `movie_session` cookie.

- **Content-Type**: Any
- **Auth**: None (clears cookie if present)

**Success Response (200 OK):**

*Clears Cookie: `movie_session`*

```json
{
  "message": "logout successful"
}
```

---

#### POST `/auth/forgot-password`

Request a 6-digit password reset OTP for a registered email. OTP expires in 15 minutes.

- **Content-Type**: `application/json`
- **Auth**: None

**Request Body:**

```json
{
  "email": "eyad@test.com"
}
```

**Success Response (200 OK):**

```json
{
  "message": "otp generated successfully",
  "otp": "482019"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "user with this email does not exist"
}
```

---

#### POST `/auth/reset-password`

Verify OTP and set a new password.

- **Content-Type**: `application/json`
- **Auth**: None

**Request Body:**

```json
{
  "email": "eyad@test.com",
  "otp": "482019",
  "new_password": "NewPassword1!",
  "new_password_confirmation": "NewPassword1!"
}
```

**Success Response (200 OK):**

```json
{
  "message": "password reset successful, you can now login"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "invalid or expired otp"
}
```

---

#### GET `/auth/me`

Fetch profile of current authenticated user from `movie_session` cookie.

- **Content-Type**: None
- **Auth**: Required (`movie_session` cookie)

**Success Response (200 OK):**

```json
{
  "data": {
    "user": {
      "_id": "671ca614a92c4b817342df01",
      "username": "eyad",
      "email": "eyad@test.com",
      "image": null,
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "error": "invalid session"
}
```

---

### 2. Movies Routes (`/api/movies`)

#### GET `/api/movies`

List all movies with populated actor details. Supports substring search on title and filtering by actor ID.

- **Query Parameters:**
  - `search` (optional): Substring to match against `title` (case-insensitive)
  - `actor` (optional): Actor ObjectId to filter movies where this actor appears
- **Auth**: None

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "_id": "671ca614a92c4b817342df10",
      "title": "Inception",
      "year": 2010,
      "genres": ["Action", "Sci-Fi", "Thriller"],
      "description": "A thief who steals corporate secrets...",
      "trailerLink": "https://www.youtube.com/watch?v=YoHD9XEInc0",
      "director": "Christopher Nolan",
      "image": "inception.jpg",
      "actors": [
        {
          "_id": "671ca614a92c4b817342df05",
          "name": "Leonardo DiCaprio",
          "images": ["leo.jpg"],
          "birthdate": "1974-11-11T00:00:00.000Z"
        }
      ],
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/movies/:id`

Retrieve a single movie with its populated cast members (`actors`) and community reviews (`reviews` populated with reviewer `user` info).

- **URL Params**: `id` (Mongoose ObjectId)
- **Auth**: None

**Success Response (200 OK):**

```json
{
  "data": {
    "_id": "671ca614a92c4b817342df10",
    "title": "Inception",
    "year": 2010,
    "genres": ["Action", "Sci-Fi", "Thriller"],
    "description": "A thief who steals corporate secrets...",
    "trailerLink": "https://www.youtube.com/watch?v=YoHD9XEInc0",
    "director": "Christopher Nolan",
    "image": "inception.jpg",
    "actors": [
      {
        "_id": "671ca614a92c4b817342df05",
        "name": "Leonardo DiCaprio",
        "images": ["leo.jpg"],
        "birthdate": "1974-11-11T00:00:00.000Z"
      }
    ],
    "reviews": [
      {
        "_id": "671ca614a92c4b817342df20",
        "number": 9,
        "comment": "One of the best sci-fi movies of the decade.",
        "movie": "671ca614a92c4b817342df10",
        "user": {
          "_id": "671ca614a92c4b817342df02",
          "username": "sarah",
          "image": null
        },
        "createdAt": "2026-10-26T01:00:00.000Z",
        "updatedAt": "2026-10-26T01:00:00.000Z"
      }
    ],
    "createdAt": "2026-10-26T01:00:00.000Z",
    "updatedAt": "2026-10-26T01:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "invalid id"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "movie not found"
}
```

---

#### POST `/api/movies`

Create a new movie record with an optional poster file.

- **Content-Type**: `multipart/form-data` or `application/json`
- **Auth**: Required (`movie_session` cookie)

**Request Body (Form Fields / JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Movie title |
| `year` | number | Yes | Min 1888, Max 2100 |
| `genres` | string / array | Yes | Comma-separated string or array of strings |
| `description` | string | Yes | Full synopsis / overview |
| `trailerLink` | string | Yes | Valid YouTube video URL |
| `director` | string | Yes | Director name |
| `actors` | array / string | No | Array of Actor ObjectIds (or JSON array string) |
| `image` | file | No | Poster file (jpg, jpeg, png, webp, gif, max 5MB) |

**Success Response (201 Created):**

```json
{
  "message": "movie created successfully",
  "data": {
    "_id": "671ca614a92c4b817342df15",
    "title": "Interstellar",
    "year": 2014,
    "genres": ["Adventure", "Drama", "Sci-Fi"],
    "description": "When Earth becomes uninhabitable...",
    "trailerLink": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    "director": "Christopher Nolan",
    "actors": ["671ca614a92c4b817342df05"],
    "image": "b786c527-5d2a-4df4-b3ff-2a06144e1f72.jpg",
    "createdAt": "2026-10-26T01:10:00.000Z",
    "updatedAt": "2026-10-26T01:10:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "error": "invalid session"
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "errors": {
    "title": { "errors": ["title is required"] },
    "year": { "errors": ["year must be 1888 or later"] }
  }
}
```

---

#### PATCH `/api/movies/:id`

Update fields of an existing movie, replace its poster image, or update its cast list.

- **Content-Type**: `multipart/form-data` or `application/json`
- **URL Params**: `id` (Mongoose ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Request Body (Form Fields / JSON - All Optional):**

| Field | Type | Description |
|---|---|---|
| `title` | string | New title |
| `year` | number | New release year |
| `genres` | string / array | New genres list |
| `description` | string | New synopsis |
| `trailerLink` | string | New YouTube link |
| `director` | string | New director name |
| `actors` | array / string | Updated array of Actor ObjectIds (replaces cast list) |
| `image` | file | New poster file (replaces current image) |

**Success Response (200 OK):**

```json
{
  "message": "movie updated successfully",
  "data": {
    "_id": "671ca614a92c4b817342df15",
    "title": "Interstellar (Expanded Edition)",
    "year": 2014,
    "genres": ["Adventure", "Sci-Fi"],
    "description": "Updated overview...",
    "trailerLink": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    "director": "Christopher Nolan",
    "actors": ["671ca614a92c4b817342df05"],
    "image": "new-poster-uuid.jpg",
    "createdAt": "2026-10-26T01:10:00.000Z",
    "updatedAt": "2026-10-26T01:15:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "movie not found"
}
```

---

#### DELETE `/api/movies/:id`

Delete a movie. Automatically deletes all associated reviews via Mongoose cascading hook.

- **URL Params**: `id` (Mongoose ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Success Response (200 OK):**

```json
{
  "message": "movie deleted successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "movie not found"
}
```

---

#### POST `/api/movies/:id/reviews`

Add a review to a movie. Reviewer is automatically attached from current session.

- **Content-Type**: `application/json`
- **URL Params**: `id` (Movie ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Request Body:**

```json
{
  "number": 9,
  "comment": "Incredible visuals and emotional ending."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `number` | number | Yes | Rating score between 0 and 10 |
| `comment` | string | No | Optional review commentary |

**Success Response (201 Created):**

```json
{
  "message": "review added successfully",
  "data": {
    "_id": "671ca614a92c4b817342df30",
    "number": 9,
    "comment": "Incredible visuals and emotional ending.",
    "movie": "671ca614a92c4b817342df15",
    "user": "671ca614a92c4b817342df01",
    "createdAt": "2026-10-26T01:20:00.000Z",
    "updatedAt": "2026-10-26T01:20:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "movie not found"
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "errors": {
    "number": { "errors": ["rating must be between 0 and 10"] }
  }
}
```

---

### 3. Actors Routes (`/api/actors`)

#### GET `/api/actors`

List all actors. Supports substring search on actor name.

- **Query Parameters:**
  - `search` (optional): Substring to match against `name` (case-insensitive regex)
- **Auth**: None

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "_id": "671ca614a92c4b817342df05",
      "name": "Cillian Murphy",
      "images": ["cillian.jpg"],
      "birthdate": "1976-05-25T00:00:00.000Z",
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/actors/:id`

Retrieve a single actor with their filmography (`movies` virtual).

- **URL Params**: `id` (Actor ObjectId)
- **Auth**: None

**Success Response (200 OK):**

```json
{
  "data": {
    "_id": "671ca614a92c4b817342df05",
    "name": "Cillian Murphy",
    "images": ["cillian.jpg"],
    "birthdate": "1976-05-25T00:00:00.000Z",
    "movies": [
      {
        "_id": "671ca614a92c4b817342df10",
        "title": "Oppenheimer",
        "year": 2023,
        "image": "oppenheimer.jpg"
      }
    ],
    "createdAt": "2026-10-26T01:00:00.000Z",
    "updatedAt": "2026-10-26T01:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "actor not found"
}
```

---

#### POST `/api/actors`

Create a new actor record. Supports uploading up to 5 photos.

- **Content-Type**: `multipart/form-data` or `application/json`
- **Auth**: Required (`movie_session` cookie)

**Request Body (Form Fields / JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Actor full name |
| `birthdate` | string / date | No | Birthdate (YYYY-MM-DD) |
| `images` | files | No | Up to 5 image files (jpg, jpeg, png, webp, gif, max 5MB each) |

**Success Response (201 Created):**

```json
{
  "message": "actor created successfully",
  "data": {
    "_id": "671ca614a92c4b817342df40",
    "name": "Florence Pugh",
    "birthdate": "1996-01-03T00:00:00.000Z",
    "images": ["e2786720-3129-4503-b0fc-fb9fcaae9d71.jpg"],
    "createdAt": "2026-10-26T01:30:00.000Z",
    "updatedAt": "2026-10-26T01:30:00.000Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "errors": {
    "name": { "errors": ["name is required"] }
  }
}
```

---

#### PATCH `/api/actors/:id`

Update actor details or upload new photos (replaces existing photo list).

- **Content-Type**: `multipart/form-data` or `application/json`
- **URL Params**: `id` (Actor ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Request Body (Form Fields / JSON - All Optional):**

| Field | Type | Description |
|---|---|---|
| `name` | string | Updated name |
| `birthdate` | string / date | Updated birthdate |
| `images` | files | New image files (replaces current photo array) |

**Success Response (200 OK):**

```json
{
  "message": "actor updated successfully",
  "data": {
    "_id": "671ca614a92c4b817342df40",
    "name": "Florence Pugh",
    "birthdate": "1996-01-03T00:00:00.000Z",
    "images": ["updated-image-uuid.jpg"],
    "createdAt": "2026-10-26T01:30:00.000Z",
    "updatedAt": "2026-10-26T01:35:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "actor not found"
}
```

---

#### DELETE `/api/actors/:id`

Delete an actor. Automatically pulls the actor's ID from all movies' `actors` array.

- **URL Params**: `id` (Actor ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Success Response (200 OK):**

```json
{
  "message": "actor deleted successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "actor not found"
}
```

---

### 4. Reviews Routes (`/api/reviews`)

#### GET `/api/reviews/my`

Get all reviews submitted by the current authenticated user, populated with the reviewed movie's details.

- **Content-Type**: None
- **Auth**: Required (`movie_session` cookie)

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "_id": "671ca614a92c4b817342df30",
      "number": 10,
      "comment": "Masterpiece of sound and tension.",
      "movie": {
        "_id": "671ca614a92c4b817342df10",
        "title": "Oppenheimer",
        "year": 2023,
        "image": "oppenheimer.jpg"
      },
      "user": "671ca614a92c4b817342df01",
      "createdAt": "2026-10-26T01:00:00.000Z",
      "updatedAt": "2026-10-26T01:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/reviews/:movieId`

Alternative route to add a review to a movie.

- **Content-Type**: `application/json`
- **URL Params**: `movieId` (Movie ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Request Body:**

```json
{
  "number": 8,
  "comment": "Great acting and pacing."
}
```

**Success Response (201 Created):**

```json
{
  "message": "review added successfully",
  "data": {
    "_id": "671ca614a92c4b817342df50",
    "number": 8,
    "comment": "Great acting and pacing.",
    "movie": "671ca614a92c4b817342df10",
    "user": "671ca614a92c4b817342df01",
    "createdAt": "2026-10-26T01:40:00.000Z",
    "updatedAt": "2026-10-26T01:40:00.000Z"
  }
}
```

---

#### PATCH `/api/reviews/:id`

Update rating number or commentary of a review. **Only the review author can update it.**

- **Content-Type**: `application/json`
- **URL Params**: `id` (Review ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Request Body (At least one field):**

```json
{
  "number": 10,
  "comment": "Updated comment: An absolute classic upon second viewing."
}
```

**Success Response (200 OK):**

```json
{
  "message": "review updated successfully",
  "data": {
    "_id": "671ca614a92c4b817342df50",
    "number": 10,
    "comment": "Updated comment: An absolute classic upon second viewing.",
    "movie": "671ca614a92c4b817342df10",
    "user": "671ca614a92c4b817342df01",
    "createdAt": "2026-10-26T01:40:00.000Z",
    "updatedAt": "2026-10-26T01:45:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "you are not authorized to update this review"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "review not found"
}
```

---

#### DELETE `/api/reviews/:id`

Delete a review. **Only the review author can delete it.**

- **URL Params**: `id` (Review ObjectId)
- **Auth**: Required (`movie_session` cookie)

**Success Response (200 OK):**

```json
{
  "message": "review deleted successfully"
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "you are not authorized to delete this review"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "review not found"
}
```
