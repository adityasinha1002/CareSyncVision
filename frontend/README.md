# CareSyncVision Frontend

Caregiver dashboard for patient health monitoring and medication tracking.

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - API client

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Full page components
│   ├── services/     # API integration
│   ├── hooks/        # Custom React hooks
│   ├── styles/       # Global styles
│   ├── App.jsx       # Main app component
│   └── main.jsx      # Entry point
├── vite.config.js    # Vite configuration
└── package.json      # Dependencies
```

## Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

## Components

- **HealthSummary** - Key metrics cards (risk score, alerts, adherence)
- **RiskScoreChart** - Time-series visualization of risk trends
- **MedicationTracker** - Schedule and administration status
- **AlertPanel** - Active system alerts and notifications

## Pages

- **Login** - Caregiver authentication
- **Dashboard** - Main monitoring interface
- **Reports** (TODO) - Historical analytics
- **Settings** (TODO) - User preferences

## Features

✅ Real-time patient monitoring  
✅ Medication tracking & adherence  
✅ Risk score visualization  
✅ Alert management  
⏳ Caregiver authentication (TODO)  
⏳ Multi-patient support (TODO)  
⏳ Report export (TODO)  

## Docker

```bash
# Build Docker image
docker build -t caresynvision-frontend:latest .

# Run container
docker run -p 3000:80 caresynvision-frontend:latest
```

## API Integration

All API calls go through `src/services/api.js` using Axios.

### Available Services

- `healthService` - Health check endpoints
- `patientService` - Patient data retrieval
- `medicationService` - Medication management

Example:

```javascript
import { patientService } from './services/api';

const data = await patientService.getPatientData(patientId);
```

## State Management

Uses Zustand for lightweight state:

- `useAuthStore` - Authentication state
- `usePatientStore` - Current patient data
- `useAlertStore` - Alert management

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push: `git push origin feature/name`
4. Submit PR

## Build Optimization

- Code splitting with Vite
- Lazy loading for routes
- Image optimization
- CSS minification
