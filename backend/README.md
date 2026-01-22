# Biodiversity Farm Project - Backend

FastAPI backend for the Biodiversity Farm tracking application.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (with SQLAlchemy ORM)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local filesystem for CSV uploads
- **Python Version**: 3.8+

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Docker and Docker Compose (for PostgreSQL)

## Installation & Setup

### 1. Start PostgreSQL Database

From the project root directory:
```bash
docker-compose up -d
```

This will start PostgreSQL in a Docker container on port 5433.

To stop the database:
```bash
docker-compose down
```

**Note**: The database uses port 5433 instead of the default 5432 to avoid conflicts with other PostgreSQL installations.

### 2. Navigate to Backend Directory
```bash
cd backend
```

### 3. Create Virtual Environment
```bash
python -m venv venv
```

### 4. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 5. Install Dependencies
```bash
pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart email-validator psycopg2-binary python-dotenv
```

### 6. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

The `.env.example` contains a development secret key and database URL that's safe to use locally.

**⚠️ IMPORTANT**: In production, generate a new secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

And never commit production keys to the repository!

Your `.env` file should look like:
```env
DATABASE_URL=postgresql://biodiversity_user:biodiversity_password@127.0.0.1:5433/biodiversity_db
SECRET_KEY=dev_secret_key_change_in_production_xK9mP2wQ5rN8sL1tY4uZ7aB3cD6eF9gH
```

## Running the Backend

### Start the Development Server
```bash
uvicorn app.main:app --reload
```

The backend will be available at:
- **API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc

**Note**: Database tables are created automatically when you first start the backend.

### Server Options

- `--reload`: Auto-restart on code changes (development only)
- `--host 0.0.0.0`: Make server accessible from other devices on network
- `--port 8000`: Specify port (default is 8000)

Example with custom host and port:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app and CORS configuration
│   ├── database.py          # Database connection and session management
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # User database model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py          # Pydantic schemas for validation
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   └── upload.py        # File upload endpoints
│   └── utils/
│       ├── __init__.py
│       └── security.py      # Password hashing and JWT utilities
├── uploads/                 # Uploaded CSV files (not in git)
│   ├── hedgerows/
│   ├── waterways/
│   └── soil/
├── venv/                    # Virtual environment (not in git)
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template (in git)
└── README.md
```

## Database

### PostgreSQL in Docker

The project uses PostgreSQL running in Docker. Connection details:

- **Host**: `127.0.0.1`
- **Port**: `5433`
- **Database**: `biodiversity_db`
- **Username**: `biodiversity_user`
- **Password**: `biodiversity_password`

### Database Tables

Currently includes:
- **users**: User credentials and profile information

Tables are created automatically when you first start the backend via SQLAlchemy's `Base.metadata.create_all()`.

### Connecting to Database

**Using psql:**
```bash
docker exec -it biodiversity_postgres psql -U biodiversity_user -d biodiversity_db
```

**Using DBeaver or pgAdmin:**
- Host: `127.0.0.1`
- Port: `5433`
- Database: `biodiversity_db`
- Username: `biodiversity_user`
- Password: `biodiversity_password`

### Resetting Database

To completely reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

The `-v` flag removes the volume, giving you a fresh database. Tables will be recreated when you start the backend.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
  - Body: `{ username, email, password }`
  - Returns: JWT token and user info
  
- `POST /api/auth/login` - Login with email and password
  - Body: `{ email, password }`
  - Returns: JWT token and user info
  
- `POST /api/auth/change-password` - Change user password
  - Requires: Authorization header with JWT token
  - Body: `{ current_password, new_password }`

### File Upload

- `POST /api/upload/{category}` - Upload CSV file
  - Categories: `hedgerows`, `waterways`, `soil`
  - Requires: Authorization header with JWT token
  - Body: Form data with file field
  - Accepts: CSV files only
  - Returns: Upload confirmation with filename and file size

## File Storage

Uploaded files are stored in the `uploads/` directory, organized by category:
```
uploads/
├── hedgerows/
│   └── {user_id}_{timestamp}_{original_filename}.csv
├── waterways/
│   └── {user_id}_{timestamp}_{original_filename}.csv
└── soil/
    └── {user_id}_{timestamp}_{original_filename}.csv
```

Files are automatically named with:
- User ID (from JWT token)
- Timestamp (YYYYMMDD_HHMMSS)
- Original filename

Example: `5_20260116_143022_hedgerow_data.csv`

The `uploads/` directory is created automatically if it doesn't exist.

## Testing with Swagger UI

1. Start the backend server
2. Navigate to http://localhost:8000/docs
3. Use the "Try it out" feature to test endpoints
4. For authenticated endpoints:
   - First, register or login to get a JWT token
   - Click "Authorize" button at the top
   - Enter: `Bearer {your-token}`
   - Click "Authorize"
   - Now you can test protected endpoints

### Testing File Upload

1. Click on `POST /api/upload/{category}`
2. Click "Try it out"
3. Enter category: `hedgerows`, `waterways`, or `soil`
4. Click "Choose File" and select a CSV file
5. Click "Execute"

## Common Issues

### Database Connection Failed

**Make sure Docker is running:**
```bash
docker ps
```

You should see `biodiversity_postgres` in the list.

**If not, start it:**
```bash
docker-compose up -d
```

**Wait 10 seconds** for PostgreSQL to fully initialize before starting the backend.

### Port Already in Use

**Backend port (8000) in use:**
```bash
uvicorn app.main:app --reload --port 8001
```

**Database port (5433) in use:**
Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "5433:5432"  # Change external port
```

Then update `DATABASE_URL` in `.env` to use the new port.

### Module Not Found Errors

Make sure you're in the `backend` directory and the virtual environment is activated.

### CORS Errors

The backend is configured to accept requests from `http://localhost:3000` (frontend). If your frontend runs on a different port, update `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:YOUR_PORT"],
    ...
)
```

### File Upload Fails

- Ensure the file is a CSV (`.csv` extension)
- Check that you're authenticated (valid JWT token)
- The `uploads/` directory is created automatically
- Check backend console for detailed error messages

### Token Expired

JWT tokens expire after 30 minutes. If you get "Invalid token" errors:
1. Log out
2. Log back in to get a fresh token
3. Try again

### Environment Variables Not Loading

Make sure:
- `.env` file exists in the `backend/` directory
- `python-dotenv` is installed
- No syntax errors in `.env` (no quotes, no spaces around `=`)

## Development Notes

- Password requirements: Minimum 8 characters, must include uppercase, lowercase, number, and special character
- JWT tokens expire after 30 minutes
- All passwords are hashed using bcrypt before storage
- CSV files are validated by extension only (`.csv`)
- Maximum file size is limited by FastAPI defaults (16MB)
- Files are stored on local filesystem (not in database)
- Database tables are created automatically via SQLAlchemy ORM
- For production, use environment-specific secret keys and never commit them to Git