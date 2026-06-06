# 🎨 Clarifact Frontend

The React frontend for the Clarifact AI Fake News Detector platform. Built with modern web technologies for a responsive, user-friendly experience.

## 🛠️ Tech Stack

- ⚛️ **React 18** with TypeScript
- ⚡ **Vite** for fast development and building
- 🎨 **Tailwind CSS** for styling
- 🧭 **React Router** for navigation
- 📊 **Recharts** for data visualization
- 🎭 **Framer Motion** for animations
- 🔄 **Zustand** for state management
- 🌐 **Axios** for API calls
- 🎯 **Lucide React** for icons
- 🍞 **React Hot Toast** for notifications

## 📁 Project Structure

```
frontend/
├─ .env.example          # Environment variables template
├─ index.html            # Main HTML template
├─ package.json          # Dependencies and scripts
├─ postcss.config.js     # PostCSS configuration
├─ tailwind.config.js    # Tailwind CSS configuration
├─ tsconfig.json         # TypeScript configuration
├─ tsconfig.node.json    # Node.js TypeScript config
├─ vite.config.ts        # Vite build configuration
└─ src/
   ├─ App.tsx            # Main app component
   ├─ main.tsx           # App entry point
   ├─ router.tsx         # Route definitions
   ├─ vite-env.d.ts      # Vite environment types
   ├─ components/        # Reusable UI components
   │  ├─ auth/          # Authentication components
   │  ├─ common/        # Shared components
   │  ├─ community/     # Community-related components
   │  ├─ dashboard/     # Dashboard components
   │  ├─ inputs/        # Form input components
   │  ├─ layout/        # Layout components
   │  └─ results/       # Result display components
   ├─ hooks/            # Custom React hooks
   ├─ i18n/             # Internationalization
   ├─ lib/              # Utility libraries
   ├─ pages/            # Page components
   │  ├─ AdminReview.tsx
   │  ├─ AuthorityDashboard.tsx
   │  ├─ Check.tsx
   │  ├─ Community.tsx
   │  ├─ Dashboard.tsx
   │  ├─ ExpertApply.tsx
   │  ├─ Home.tsx
   │  ├─ Leaderboard.tsx
   │  ├─ Login.tsx
   │  ├─ Notifications.tsx
   │  ├─ Profile.tsx
   │  ├─ Register.tsx
   │  ├─ Result.tsx
   ├─ services/         # API service functions
   ├─ store/            # Zustand state stores
   ├─ styles/           # Global styles
   └─ types/            # TypeScript type definitions
```

## 📋 Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**

## 🚀 Quick Start

### 1. 📦 Install Dependencies
```bash
cd frontend
npm install
```

### 2. ⚙️ Setup Environment
Copy the environment template:
```bash
cp .env.example .env
```

The default `.env` should work for local development:
```env
# Backend URL — in dev, Vite proxy handles /api → localhost:4000
# Only set this for production or if not using the proxy
VITE_API_URL=/api
```

### 3. ▶️ Start Development Server
```bash
npm run dev
```

🎉 **Frontend runs at: http://localhost:5173**

The Vite dev server includes:
- Hot module replacement (HMR)
- API proxy to backend at `/api` → `http://localhost:4000`
- Automatic browser refresh on changes

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview production build locally |

## 🔧 Development Notes

### 🏗️ Build Configuration
- **Port**: 5173 (configurable in `vite.config.ts`)
- **API Proxy**: `/api` routes proxy to `http://localhost:4000`
- **Path Aliases**: `@/` resolves to `./src/`

### 🎨 Styling
- Uses **Tailwind CSS** with custom configuration
- **PostCSS** for processing
- Utility-first approach with `clsx` and `tailwind-merge` for conditional classes

### 🔄 State Management
- **Zustand** stores for global state
- React hooks for local component state
- Context providers for shared data

### 🌐 API Integration
- **Axios** for HTTP requests
- Centralized in `services/` directory
- Automatic proxy handling in development

### 🧭 Routing
- **React Router v6** with nested routes
- Route definitions in `router.tsx`
- Protected routes for authenticated users

### 📱 Responsive Design
- Mobile-first approach
- Tailwind responsive utilities
- Component-based architecture

## 🏗️ Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for better performance
- Asset optimization
- Service worker support (if configured)

## 🚀 Deployment

The built files in `dist/` can be deployed to any static hosting service:

- **Netlify**
- **Vercel**
- **GitHub Pages**
- **AWS S3 + CloudFront**
- **Traditional web servers**

Make sure to set the `VITE_API_URL` environment variable to point to your deployed backend API.

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new code
3. Follow React best practices
4. Test components and functionality
5. Update this README if you add new features or change structure</content>
<parameter name="filePath">c:\Users\Ranjit\Documents\GitHub\Clarifact\frontend\README.md