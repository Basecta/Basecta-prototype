# Biodiversity Farm Project

A web application for tracking and monitoring agricultural biodiversity metrics including hedgerows, waterways, and soil data.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts, react-circular-progressbar
- **Node Version**: 20.x

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **Authentication**: JWT with bcrypt

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL in Docker

## Prerequisites

- **Docker Desktop** (includes Docker and Docker Compose)
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - macOS: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/

That's it! Everything else runs in Docker containers.

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Biodiversity-Farm-Project/webapp.git
cd webapp
```

### 2. Start the Application
```bash
docker-compose up --build
```

This will:
- Build the frontend and backend containers
- Start PostgreSQL database
- Initialize database tables
- Start all services

**First-time startup takes 2-5 minutes** to download images and build containers.

### 3. Access the Application

Once you see these messages:
```
biodiversity_frontend  | ✓ Ready in ...
biodiversity_backend   | INFO:     Application startup complete.
biodiversity_postgres  | database system is ready to accept connections
```

The application is ready:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Stopping the Application

### Safe Shutdown (Keeps Your Data)
```bash
docker-compose down
```

Press `Ctrl+C` if running in the foreground, then run the above command.

This stops all containers while preserving:
- Database data
- Uploaded files
- User accounts

### Complete Reset (Deletes All Data)
```bash
docker-compose down -v
```

⚠️ **Warning**: The `-v` flag deletes all volumes including database data and uploads!

## Development Workflow

### Starting the Application

**First time or after code changes:**
```bash
docker-compose up --build
```

**Subsequent starts (no code changes):**
```bash
docker-compose up
```

**Run in background (detached mode):**
```bash
docker-compose up -d
```

### Viewing Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**Exit logs:** Press `Ctrl+C`

### Restarting Services

**Restart all:**
```bash
docker-compose restart
```

**Restart specific service:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuilding After Code Changes
```bash
docker-compose up --build
```

Or rebuild specific service:
```bash
docker-compose build backend
docker-compose up
```

## Project Structure
```
webapp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utilities
│   ├── uploads/            # User uploaded files
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── lib/               # Utilities
│   ├── public/            # Static assets
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## Database Access

### PostgreSQL Connection Details

From your local machine (for tools like DBeaver, pgAdmin):

- **Host**: `127.0.0.1`
- **Port**: `5433`
- **Database**: `biodiversity_db`
- **Username**: `biodiversity_user`
- **Password**: `biodiversity_password`

### Using psql
```bash
docker exec -it biodiversity_postgres psql -U biodiversity_user -d biodiversity_db
```

Common commands:
```sql
\dt              -- List tables
\d users         -- Describe users table
SELECT * FROM users;
\q               -- Quit
```

### Reset Database

To completely reset the database:
```bash
docker-compose down -v
docker-compose up --build
```

## Common Issues

### Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: Stop the conflicting service or change the port in `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Changed external port
```

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop

### Out of Disk Space

**Error**: `no space left on device`

**Solution**: Clean up Docker resources:
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes (⚠️ deletes data)
docker volume prune
```

### Build Fails

**Solution**: Clean build with no cache:
```bash
docker-compose build --no-cache
docker-compose up
```

### Database Connection Errors

**Check if database is healthy:**
```bash
docker-compose ps
```

The postgres service should show "healthy" status.

**If not healthy, restart:**
```bash
docker-compose restart postgres
```

Wait 10 seconds for it to initialize, then restart backend:
```bash
docker-compose restart backend
```

## Local Development (Without Docker)

If you prefer to run services locally for faster development:

### Database Only (Docker)
```bash
docker-compose up postgres
```

### Backend (Local)
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env to use localhost:5433
# DATABASE_URL=postgresql://biodiversity_user:biodiversity_password@127.0.0.1:5433/biodiversity_db

uvicorn app.main:app --reload
```

### Frontend (Local)
```bash
cd frontend
npm install
npm run dev
```

See individual README files in `backend/` and `frontend/` for detailed local setup instructions.

## Environment Variables

### Backend (.env)

Development defaults are in `backend/.env.example`:
```env
DATABASE_URL=postgresql://biodiversity_user:biodiversity_password@postgres:5432/biodiversity_db
SECRET_KEY=dev_secret_key_change_in_production_xK9mP2wQ5rN8sL1tY4uZ7aB3cD6eF9gH
```

**Note**: Inside Docker, the database host is `postgres` (service name), not `127.0.0.1`.

### Production Deployment

For production:
1. Generate a new secret key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
2. Use environment-specific configuration
3. Never commit production secrets to Git

## Features

### Authentication
- User registration with email validation
- Secure login with JWT tokens
- Password change functionality
- Auto-login after registration

### Dashboard
- Biodiversity Credits tracking
- Income monitoring (€/month)
- Reliability Score gauge
- Interactive trend charts with historical and projected data
- Clickable cards with detailed modal views

### Data Upload
- CSV file upload for three categories:
  - Hedgerows
  - Waterways
  - Soil
- Drag & drop support
- File validation
- Upload progress indication

### Account Management
- View profile information
- Change password with validation
- Secure session management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature-name`
6. Open a Pull Request

## License

[Your License Here]

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation in `/backend/README.md` and `/frontend/README.md`