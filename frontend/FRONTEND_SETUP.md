# CareSyncVision Frontend

A modern, classic health monitoring dashboard built with **React 18**, **Tailwind CSS**, and **Vite**.

## 🎯 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Zustand** - State management
- **Date-fns** - Date utilities

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Hero.jsx
│   │   ├── CommandInput.jsx
│   │   ├── FilePreview.jsx
│   │   ├── Sidebar.jsx
│   │   ├── HealthSummary.jsx
│   │   ├── RiskScoreChart.jsx
│   │   ├── MedicationTracker.jsx
│   │   └── AlertPanel.jsx
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── services/            # API services
│   │   └── api.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useAI.js
│   │   ├── useStore.js
│   │   └── usePatient.js
│   ├── styles/
│   │   └── index.css        # Tailwind CSS setup
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.js           # Vite configuration
├── package.json
└── index.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend API running (see main README)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your backend API URL:
```env
VITE_API_URL=https://localhost/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` with hot module reloading enabled.

### Building

Build for production:
```bash
npm run build
```

Output files will be in the `dist/` directory.

Preview production build:
```bash
npm run preview
```

## 🎨 Styling with Tailwind CSS

### Custom Configuration

All custom colors, fonts, and utilities are defined in `tailwind.config.js`:

- **Primary Color**: Sky blue (customizable)
- **Accent Color**: Pink
- **Custom Components**: `.card`, `.btn-primary`, `.input-field`, `.label`

### Key Tailwind Features Used

- Utility classes for styling
- Custom component layers
- Responsive design (`md:`, `lg:` prefixes)
- Gradient backgrounds
- Shadow utilities
- Custom animations

### Example Component

```jsx
import { Heart } from 'lucide-react';

export default function Feature() {
  return (
    <div className="card hover:shadow-medium transition-shadow">
      <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Heart className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Feature Title</h3>
      <p className="text-gray-600">Feature description</p>
    </div>
  );
}
```

## 🔗 API Integration

The frontend communicates with the backend through:

### Services (`src/services/api.js`)

- `patientService` - Patient data
- `medicationService` - Medication tracking
- `healthService` - Health analysis

### Custom Hooks (`src/hooks/useAI.js`)

```javascript
import { useAI } from './hooks/useAI';

function MyComponent() {
  const { analyze, predict, loading, error } = useAI();
  
  const handleAnalyze = async () => {
    const result = await analyze({ data: 'health metrics' });
  };
}
```

## 🔐 Authentication

Authentication is handled through Zustand store (`src/hooks/useStore.js`):

```javascript
import { useAuthStore } from './hooks/useStore';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
}
```

## 📱 Responsive Design

The application is fully responsive using Tailwind's breakpoints:

- **Mobile**: < 640px
- **Tablet**: >= 768px (md:)
- **Desktop**: >= 1024px (lg:)

## 🎯 Modern Design Features

- **Gradient backgrounds** for visual appeal
- **Smooth animations** with Tailwind animations
- **Shadow effects** with custom shadow utilities
- **Icon integration** with Lucide React
- **Accessible components** with proper ARIA labels
- **Dark mode ready** (can be enabled via Tailwind config)

## 🛠️ Development Workflow

### Adding a New Component

1. Create component in `src/components/ComponentName.jsx`
2. Use Tailwind classes for styling
3. Export and import in parent components

### Adding a New Page

1. Create page in `src/pages/PageName.jsx`
2. Add route to `src/App.jsx`
3. Link from navigation components

### Custom Tailwind Utilities

Add to `tailwind.config.js` theme.extend:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        'custom': '#...'
      }
    }
  }
}
```

## 📊 Performance

- **Code splitting** via Vite
- **Tree shaking** for unused CSS
- **Lazy loading** routes with React Router
- **Optimized images** in public folder

## 🧪 Testing

Testing can be added with:
```bash
npm install --save-dev vitest @testing-library/react
```

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Lucide React Icons](https://lucide.dev/)

## 🐛 Troubleshooting

### Styles not appearing
1. Ensure `src/styles/index.css` is imported in `main.jsx`
2. Check that Tailwind classes are spelled correctly
3. Verify `tailwind.config.js` content paths are correct

### Build issues
1. Clear `node_modules/` and `package-lock.json`
2. Run `npm install` again
3. Check Node version (18+)

## 📝 License

See main project LICENSE file.
