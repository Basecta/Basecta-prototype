# Biodiversity Farm Project - Backend

FastAPI backend for the Biodiversity Farm tracking application.

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite (with SQLAlchemy ORM)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local filesystem for CSV uploads
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
├── app.db                   # SQLite database (auto-created, not in git)
└── README.md
```

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

## Database

The SQLite database (`app.db`) is automatically created on first run. The database includes:

- **Users table**: Stores user credentials and profile information

To reset the database, simply delete `app.db` and restart the server.

## Environment Variables (Future)

Currently using hardcoded values. In production, create a `.env` file:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./app.db
UPLOAD_DIR=uploads
```

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

### File Upload Fails
- Ensure the file is a CSV (`.csv` extension)
- Check that you're authenticated (valid JWT token)
- Verify the `uploads/` directory exists and has write permissions
- Check backend console for detailed error messages

### Token Expired
JWT tokens expire after 30 minutes. If you get "Invalid token" errors:
1. Log out
2. Log back in to get a fresh token
3. Try again

## Development Notes

- Password requirements: Minimum 8 characters, must include uppercase, lowercase, number, and special character
- JWT tokens expire after 30 minutes
- All passwords are hashed using bcrypt before storage
- CSV files are validated by extension only (`.csv`)
- Maximum file size is limited by FastAPI defaults (16MB)
- Files are stored on local filesystem (not in database)