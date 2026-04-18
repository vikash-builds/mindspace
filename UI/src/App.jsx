import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Documents from './pages/Documents';
import Reminders from './pages/Reminders';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import logo from './assets/logos/logo.png';
import { Box, CircularProgress, Typography } from '@mui/material';

// Shared dark appearance config for all Clerk components
const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#00e68a',
    colorBackground: '#161c24',
    colorInputBackground: '#212b36',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#919eab',
    colorNeutral: '#919eab',
    colorAlphaShade: 'rgba(145, 158, 171, 0.16)',
    colorDanger: '#ff5630',
    colorSuccess: '#22c55e',
    borderRadius: '12px',
    fontFamily: `'Inter', -apple-system, sans-serif`,
    fontSize: '15px',
  },
  elements: {
    card: {
      background: '#212b36',
      border: '1px solid rgba(145, 158, 171, 0.16)',
      boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.6)',
      borderRadius: '16px',
    },
    headerTitle: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
    },
    formButtonPrimary: {
      background: '#00e68a',
      color: '#161c24',
      fontWeight: 700,
      '&:hover': { background: '#00ab66' },
    },
    socialButtonsBlockButton: {
      background: 'rgba(145, 158, 171, 0.08)',
      border: '1px solid rgba(145, 158, 171, 0.2)',
      color: '#fff',
      '&:hover': { background: 'rgba(145, 158, 171, 0.16)' }
    },
    dividerLine: { background: 'rgba(145, 158, 171, 0.2)' },
    dividerText: { color: '#637381' },
    formFieldInput: {
      background: '#2a3544',
      border: '1px solid rgba(145, 158, 171, 0.2)',
      color: '#fff',
      '&:focus': { borderColor: '#00e68a' },
    },
    footerActionLink: { color: '#00e68a' },
    identityPreviewText: { color: '#fff' },
    identityPreviewEditButton: { color: '#00e68a' },
  },
};

// Full-page branded wrapper for auth routes
const AuthPage = ({ children }) => (
  <Box sx={{
    minHeight: '100vh',
    bgcolor: '#161c24',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      background: `
        radial-gradient(ellipse 60% 50% at 5% 95%, rgba(0, 230, 138, 0.07) 0%, transparent 50%),
        radial-gradient(ellipse 50% 60% at 90% 10%, rgba(139, 92, 246, 0.06) 0%, transparent 45%)
      `,
      pointerEvents: 'none',
    }
  }}>
    {/* Logo strip at top */}
    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', mb: 4, textDecoration: 'none', zIndex: 1 }}>
      <img src={logo} alt="MindSpace" style={{ width: 52, height: 52, objectFit: 'cover', zoom: 1.5 }} />
      <Typography variant="h6" sx={{ fontFamily: `'Space Grotesk', sans-serif`, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
        MindSpace
      </Typography>
    </Box>
    <Box sx={{ zIndex: 1 }}>{children}</Box>
  </Box>
);

const EnsureProfile = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = await getToken();
        const res = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) setHasProfile(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setHasProfile(false);
        }
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [getToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasProfile) return <Navigate to="/onboarding" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<AuthPage><SignIn routing="path" path="/login" signUpUrl="/register" appearance={clerkAppearance} /></AuthPage>}
        />
        <Route
          path="/register"
          element={<AuthPage><SignUp routing="path" path="/register" signInUrl="/login" appearance={clerkAppearance} /></AuthPage>}
        />
        <Route
          path="/onboarding"
          element={
            <SignedIn>
              <Onboarding />
            </SignedIn>
          }
        />

        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <EnsureProfile><Dashboard /></EnsureProfile>
              </SignedIn>
              <SignedOut>
                <Landing />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <SignedIn>
              <EnsureProfile><Dashboard /></EnsureProfile>
            </SignedIn>
          }
        />
        <Route
          path="/documents"
          element={
            <SignedIn>
              <EnsureProfile><Documents /></EnsureProfile>
            </SignedIn>
          }
        />
        <Route
          path="/reminders"
          element={
            <SignedIn>
              <EnsureProfile><Reminders /></EnsureProfile>
            </SignedIn>
          }
        />
        <Route
          path="/settings"
          element={
            <SignedIn>
              <EnsureProfile><Settings /></EnsureProfile>
            </SignedIn>
          }
        />

        <Route path="*" element={<SignedOut><RedirectToSignIn /></SignedOut>} />
      </Routes>
    </Router>
  );
}

export default App;
