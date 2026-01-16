# Biodiversity Farm Project - Frontend

Next.js frontend application for the Biodiversity Farm tracking platform.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts, react-circular-progressbar
- **Node Version**: 18.x or higher

## Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)

## Installation & Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

## Running the Frontend

### Start the Development Server
```bash
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:3000

### Other Available Scripts
```bash
npm run build    # Build production bundle
npm run start    # Run production server (requires build first)
npm run lint     # Run ESLint
```

## Project Structure
```
frontend/
├── app/
│   ├── page.tsx                    # Landing/home page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles and animations
│   ├── register/
│   │   └── page.tsx               # User registration page
│   ├── login/
│   │   └── page.tsx               # User login page
│   ├── dashboard/
│   │   └── page.tsx               # Main dashboard with metrics
│   ├── settings/
│   │   └── page.tsx               # Account settings page
│   └── data-upload/
│       └── page.tsx               # Data upload page
├── lib/
│   └── api.ts                     # API utility functions
├── public/                        # Static assets
├── node_modules/                  # Dependencies (not in git)
├── .next/                         # Build output (not in git)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Pages & Features

### Public Pages
- `/` - Landing page with links to login/register
- `/register` - User registration with validation
- `/login` - User login with email and password

### Protected Pages (require authentication)
- `/dashboard` - Main dashboard with:
  - Biodiversity Credits card with trend modal
  - Income card with trend modal
  - Reliability Score gauge with trend modal
  - Map placeholder
- `/settings` - Account settings:
  - View profile information
  - Change password with animated form
- `/data-upload` - Upload interface for farm data

## Authentication

The app uses JWT token authentication stored in localStorage:
```typescript
// Login stores token
localStorage.setItem('token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));

// Protected pages check for token
const token = localStorage.getItem('token');
if (!token) {
  router.push('/login');
}

// Logout removes token
localStorage.removeItem('token');
localStorage.removeItem('user');
```

## Environment Variables

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

## Styling

### Tailwind CSS
The project uses Tailwind CSS for styling. Custom configurations are in `tailwind.config.ts`.

### Custom Animations
Defined in `app/globals.css`:
- `slideDown` - Smooth expand animation
- `slideUp` - Smooth collapse animation

### Color Scheme
- Primary green: `#77E6B4` (biodiversity/positive metrics)
- Warning yellow: `#FFD221` (medium scores)
- Alert red: `#FF5353` (low scores)
- Background: Blue gradient (`from-blue-50 to-indigo-100`)

## API Integration

All API calls go through `lib/api.ts`:
```typescript
// Available functions
register(username, email, password)
login(email, password)
changePassword(currentPassword, newPassword)
```

API requests automatically include:
- `Content-Type: application/json` header
- `Authorization: Bearer <token>` header (for authenticated requests)

## Common Issues

### Port Already in Use
If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

Then update the backend CORS settings to include the new port.

### API Connection Failed
1. Ensure backend is running on http://localhost:8000
2. Check CORS configuration in backend
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Build Errors
Clear Next.js cache and rebuild:
```bash
rm -rf .next
npm run build
```

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Notes

### TypeScript
- Strict mode enabled
- Type checking on build
- Use `any` sparingly (currently used for user objects)

### Protected Routes
Pages check authentication in `useEffect`:
```typescript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
  }
}, [router]);
```