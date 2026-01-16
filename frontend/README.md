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

This will install all required packages including:
- Next.js and React
- TypeScript
- Tailwind CSS
- Recharts (for line charts)
- react-circular-progressbar (for gauge chart)

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
│       └── page.tsx               # CSV file upload page
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
  - Username (min 3 characters, alphanumeric + underscores)
  - Email validation
  - Password requirements (8+ chars, uppercase, lowercase, number, special char)
  - Password confirmation
- `/login` - User login with email and password

### Protected Pages (require authentication)
- `/dashboard` - Main dashboard with:
  - Welcome message
  - Map placeholder (for future implementation)
  - Biodiversity Credits card with clickable trend modal
  - Income card with clickable trend modal
  - Reliability Score gauge with clickable trend modal
  - Each card displays historical data, current month (marked with blue dot), and projected future values
  
- `/settings` - Account settings:
  - View profile information (username, email, account creation date)
  - Change password with animated slide-down/slide-up form
  - Back button to dashboard
  
- `/data-upload` - CSV file upload interface:
  - Three upload zones: Hedgerows, Waterways, Soil
  - Drag & drop functionality
  - Click to browse files
  - CSV validation
  - Upload progress animation
  - Success/error feedback
  - Hover effects on mouse and drag

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

**Token Expiration**: JWT tokens expire after 30 minutes. When this happens:
1. You'll get "Invalid token" errors
2. Simply log out and log back in to get a fresh token

## File Upload

The data upload page allows users to upload CSV files for three categories:

### Supported Categories
- **Hedgerows**: Data about hedgerow biodiversity
- **Waterways**: Data about water quality and riparian zones
- **Soil**: Data about soil health and composition

### Upload Methods
1. **Drag & Drop**: Drag a CSV file onto any upload zone
2. **Click to Browse**: Click on an upload zone to open file browser

### Upload States
- **Idle**: Ready to accept files (gray dashed border)
- **Drag Hover**: File being dragged over zone (blue border and background)
- **Uploading**: Animated spinner while file uploads
- **Success**: Green checkmark for 3 seconds
- **Error**: Red X with error message for 3 seconds

### File Requirements
- Must be CSV format (`.csv` extension)
- Files are uploaded to backend at `/api/upload/{category}`
- Requires authentication (JWT token)

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
- `slideDown` - Smooth expand animation (password change form)
- `slideUp` - Smooth collapse animation (password change form)
- Spinner animation for file uploads
- Hover effects on interactive elements

### Color Scheme
- **Primary green**: `#77E6B4` (biodiversity/positive metrics)
- **Warning yellow**: `#FFD221` (medium scores)
- **Alert red**: `#FF5353` (low scores)
- **Background**: Blue gradient (`from-blue-50 to-indigo-100`)
- **Cards**: White with shadow

## API Integration

All API calls go through `lib/api.ts`:
```typescript
// Available functions
register(username, email, password)
login(email, password)
changePassword(currentPassword, newPassword)
uploadFile(file, category)
```

API requests automatically include:
- `Content-Type: application/json` header (except file uploads)
- `Authorization: Bearer <token>` header (for authenticated requests)
- FormData for file uploads

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
4. Check browser console for detailed error messages

### File Upload Issues

**401 Unauthorized Error:**
- Token may have expired (tokens last 30 minutes)
- Log out and log back in to get a fresh token

**File Type Error:**
- Only CSV files (`.csv` extension) are accepted
- Check that your file has the correct extension

**Upload Hangs:**
- Check backend console for errors
- Verify backend is running
- Check file size (default max is 16MB)

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
