import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Reminders from './pages/Reminders';

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
          path="/" 
          element={
            <>
              <SignedIn><Dashboard /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } 
        />
        <Route 
          path="/documents" 
          element={
            <>
              <SignedIn><Documents /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } 
        />
        <Route 
          path="/reminders" 
          element={
            <>
              <SignedIn><Reminders /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
