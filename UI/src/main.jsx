import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#02e88b',
      light: '#c2f2f4',
      dark: '#00926c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#cdde0c',
      light: '#d8e377',
      dark: '#c9bd00',
      contrastText: '#0c0c0c',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#000000',
    },
    info: {
      main: '#6c55d0',
      light: '#aa8eea',
      dark: '#5e28ae',
      contrastText: '#000000',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontSize: 16,
    fontFamily: "'Mulish', sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
