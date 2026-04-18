import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

function LoginForm() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMissingAccountModal, setShowMissingAccountModal] = useState(false);

  const helperText = useMemo(
    () => errorMessage || 'Use the email address associated with your registered MindSpace account.',
    [errorMessage],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isLoaded || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = await signIn.create({
        identifier,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
        return;
      }

      setErrorMessage('Sign-in needs additional verification. Please use your registered account flow.');
    } catch (error) {
      const firstError = error?.errors?.[0];
      const code = firstError?.code || '';
      const message = firstError?.message || 'Unable to sign in. Please use a registered account.';

      if (code.includes('identifier') || /find your account|not found|does not exist/i.test(message)) {
        setShowMissingAccountModal(true);
        setErrorMessage('Account not found. Please register before signing in.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Paper sx={{ width: 420, maxWidth: '90vw', p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Sign In
        </Typography>
        <Typography variant="body2" sx={{ color: '#919eab', mb: 3 }}>
          Sign in with your registered MindSpace account to continue.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email address"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="email"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            margin="normal"
            helperText={helperText}
            error={Boolean(errorMessage)}
          />

          {errorMessage && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={!isLoaded || submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: '#919eab' }}>
            Need an account?{' '}
            <Link component={RouterLink} to="/register" sx={{ color: '#00e68a' }}>
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>

      <Dialog open={showMissingAccountModal} onClose={() => setShowMissingAccountModal(false)}>
        <DialogTitle>Account Not Found</DialogTitle>
        <DialogContent>
          <Typography>Account does not exist, please register...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMissingAccountModal(false)}>Close</Button>
          <Button component={RouterLink} to="/register" variant="contained" onClick={() => setShowMissingAccountModal(false)}>
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LoginForm;
