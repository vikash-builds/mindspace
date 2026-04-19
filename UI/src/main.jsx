import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

axios.defaults.baseURL = API_BASE_URL || undefined;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e68a',
      light: '#5be49b',
      dark: '#00ab66',
      contrastText: '#0a0e1a',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff5630',
      light: '#ffac82',
      dark: '#b71d18',
    },
    warning: {
      main: '#ffab00',
      light: '#ffd666',
      dark: '#b76e00',
    },
    info: {
      main: '#00b8d9',
      light: '#61f3f3',
      dark: '#006c9c',
    },
    success: {
      main: '#22c55e',
      light: '#77ed8b',
      dark: '#118d57',
    },
    background: {
      default: '#161c24',
      paper: '#212b36',
    },
    text: {
      primary: '#ffffff',
      secondary: '#919eab',
      disabled: 'rgba(145, 158, 171, 0.5)',
    },
    divider: 'rgba(145, 158, 171, 0.2)',
    action: {
      hover: 'rgba(145, 158, 171, 0.08)',
      selected: 'rgba(0, 230, 138, 0.12)',
      focus: 'rgba(0, 230, 138, 0.16)',
      disabledBackground: 'rgba(145, 158, 171, 0.24)',
    },
  },
  typography: {
    fontSize: 16,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.015em' },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontFamily: "'Inter', sans-serif", fontWeight: 600 },
    subtitle2: { fontFamily: "'Inter', sans-serif", fontWeight: 600 },
    body1: { fontFamily: "'Inter', sans-serif", lineHeight: 1.6 },
    body2: { fontFamily: "'Inter', sans-serif", lineHeight: 1.57 },
    caption: { fontFamily: "'Inter', sans-serif", lineHeight: 1.5 },
    overline: { fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '0.08em' },
    button: { fontFamily: "'Inter', sans-serif", fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#212b36',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#212b36',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(145, 158, 171, 0.24)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1a222c',
          borderRight: '1px dashed rgba(145, 158, 171, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 10,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 230, 138, 0.24)',
          },
        },
        outlined: {
          borderColor: 'rgba(145, 158, 171, 0.32)',
          '&:hover': {
            borderColor: '#919eab',
            backgroundColor: 'rgba(145, 158, 171, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': {
              borderColor: 'rgba(145, 158, 171, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(145, 158, 171, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00e68a',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#919eab',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(145, 158, 171, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(145, 158, 171, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 184, 217, 0.08)',
          color: '#61f3f3',
          border: '1px solid rgba(0, 184, 217, 0.16)',
          '& .MuiAlert-icon': { color: '#00b8d9' },
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 171, 0, 0.08)',
          color: '#ffd666',
          border: '1px solid rgba(255, 171, 0, 0.16)',
          '& .MuiAlert-icon': { color: '#ffab00' },
        },
        standardSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          color: '#77ed8b',
          border: '1px solid rgba(34, 197, 94, 0.16)',
          '& .MuiAlert-icon': { color: '#22c55e' },
        },
        standardError: {
          backgroundColor: 'rgba(255, 86, 48, 0.08)',
          color: '#ffac82',
          border: '1px solid rgba(255, 86, 48, 0.16)',
          '& .MuiAlert-icon': { color: '#ff5630' },
        },
        outlinedWarning: {
          backgroundColor: 'rgba(255, 171, 0, 0.06)',
          borderColor: 'rgba(255, 171, 0, 0.2)',
          color: '#ffd666',
          '& .MuiAlert-icon': { color: '#ffab00' },
        },
        outlinedSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.06)',
          borderColor: 'rgba(34, 197, 94, 0.2)',
          color: '#77ed8b',
          '& .MuiAlert-icon': { color: '#22c55e' },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#212b36',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 16,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#2a3544',
            borderBottom: '1px solid rgba(145, 158, 171, 0.16)',
            color: '#919eab',
            fontWeight: 600,
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px dashed rgba(145, 158, 171, 0.12)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(145, 158, 171, 0.06) !important',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(145, 158, 171, 0.2)',
          borderStyle: 'dashed',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6,
          '& .MuiSlider-track': {
            border: 'none',
          },
          '& .MuiSlider-rail': {
            backgroundColor: 'rgba(145, 158, 171, 0.24)',
          },
          '& .MuiSlider-thumb': {
            width: 14,
            height: 14,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: '0 0 0 6px rgba(0, 230, 138, 0.16)',
            },
          },
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a222c',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 12,
          color: '#fff',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#2a3544',
          border: '1px solid rgba(145, 158, 171, 0.12)',
          borderRadius: 12,
          boxShadow: '0 20px 40px -4px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: 'rgba(145, 158, 171, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 230, 138, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 230, 138, 0.16)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#919eab',
          '&.Mui-checked': {
            color: '#00e68a',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00e68a',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: 'none',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/onboarding"
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
