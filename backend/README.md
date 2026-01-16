# Biodiversity Farm Project - Backend

FastAPI backend for the Biodiversity Farm tracking application.

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite (with SQLAlchemy ORM)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Python Version**: 3.8+

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation & Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment

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

### 4. Install Dependencies
```bash
pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart email-validator
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
│   │   └── auth.py          # Authentication endpoints
│   └── utils/
│       ├── __init__.py
│       └── security.py      # Password hashing and JWT utilities
├── venv/                    # Virtual environment (not in git)
├── app.db                   # SQLite database (auto-created, not in git)
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
  - Returns: JWT token and user info
  
- `POST /api/auth/login` - Login with email and password
  - Returns: JWT token and user info
  
- `POST /api/auth/change-password` - Change user password
  - Requires: Authorization header with JWT token

## Database

The SQLite database (`app.db`) is automatically created on first run. The database includes:

- **Users table**: Stores user credentials and profile information

To reset the database, simply delete `app.db` and restart the server.

## Environment Variables (Future)

Currently using hardcoded values. In production, create a `.env` file:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./app.db
```

## Testing with Swagger UI

1. Start the backend server
2. Navigate to http://localhost:8000/docs
3. Use the "Try it out" feature to test endpoints
4. For authenticated endpoints, click "Authorize" and enter the JWT token

## Common Issues

### Port Already in Use
If port 8000 is already in use:
```bash
uvicorn app.main:app --reload --port 8001
```

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

## Development Notes

- Password requirements: Minimum 8 characters, must include uppercase, lowercase, number, and special character
- JWT tokens expire after 30 minutes
- All passwords are hashed using bcrypt before storage