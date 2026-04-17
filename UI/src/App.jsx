import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Reminders from './pages/Reminders';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import { Box, CircularProgress } from '@mui/material';

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
          element={
            <div className="auth-page">
              <SignIn routing="path" path="/login" signUpUrl="/register" />
            </div>
          } 
        />
        <Route 
          path="/register" 
          element={
            <div className="auth-page">
              <SignUp routing="path" path="/register" signInUrl="/login" />
            </div>
          } 
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
            <SignedIn>
              <EnsureProfile><Dashboard /></EnsureProfile>
            </SignedIn>
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
