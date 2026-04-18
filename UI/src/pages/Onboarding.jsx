import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  Slider,
  Divider,
  Container,
  Alert,
  Avatar,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Psychology as BrainIcon,
  AutoFixHigh as MagicIcon,
  Tune as SettingsIcon,
  HelpOutlined as HelpIcon
} from '@mui/icons-material';
import { PROFESSIONS, BOUNDARIES } from '../professions';
import axios from 'axios';

function Onboarding() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profession: '',
    customProfession: '',
    chunk_size: 500,
    chunk_overlap: 100,
    top_k: 5,
    temperature: 0.7,
    similarity_threshold: 0.5
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);

  const handleProfessionChange = (e) => {
    const profId = e.target.value;
    const selected = PROFESSIONS.find(p => p.id === profId);

    setFormData(prev => ({
      ...prev,
      profession: profId,
      ...selected.params
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post('/api/profile', {
        ...formData,
        profession: formData.profession === 'custom' ? formData.customProfession : formData.profession
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: '#161c24' }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
          }}
        >
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(0, 230, 138, 0.12)',
                mx: 'auto',
                mb: 2.5,
              }}>
                <BrainIcon sx={{ fontSize: 36, color: '#00e68a' }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                Setup MindSpace
              </Typography>
              <Typography variant="body1" sx={{ color: '#919eab' }}>
                Let's tailor your AI assistant to your workflow.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {/* Basic Section */}
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2.5, display: 'block' }}>
                    Personal Details
                  </Typography>
                  <Stack spacing={2.5}>
                    <TextField fullWidth label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <TextField fullWidth label="Email Address" value={formData.email} disabled />
                    <TextField
                      fullWidth select label="Your Profession"
                      value={formData.profession}
                      onChange={handleProfessionChange}
                      required
                    >
                      {PROFESSIONS.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                      ))}
                    </TextField>
                    {formData.profession === 'custom' && (
                      <TextField fullWidth label="Enter your specific role" value={formData.customProfession} onChange={e => setFormData({ ...formData, customProfession: e.target.value })} required />
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* AI Section - Only visible for custom */}
                {formData.profession === 'custom' && (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                      <SettingsIcon sx={{ color: '#00e68a' }} fontSize="small" />
                      <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em' }}>
                        Advanced RAG Configuration
                      </Typography>
                    </Stack>

                    <Alert severity="warning" variant="outlined" sx={{ mb: 4, '& .MuiAlert-message': { fontSize: '0.85rem', lineHeight: 1.6 } }}>
                      <strong>Professional Guidance Recommended:</strong> Manual tuning of RAG parameters should only be performed by advanced users. Incorrect configurations may significantly degrade the accuracy and relevance of AI responses. Proceed with caution.
                    </Alert>

                    <Stack spacing={5} sx={{ px: 0.5 }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Chunk Size</Typography>
                            <Tooltip title="The number of characters each document segment is split into. Smaller chunks give more precise results, larger chunks preserve more context." arrow placement="top">
                              <IconButton size="small" sx={{ ml: '1rem', color: '#637381', '&:hover': { color: '#00e68a' } }}>
                                <HelpIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e68a', mr: 1 }}>{formData.chunk_size} chars</Typography>
                        </Stack>
                        <Slider value={formData.chunk_size} onChange={(e, v) => setFormData({ ...formData, chunk_size: v })} {...BOUNDARIES.chunk_size} />
                        <Typography variant="caption" sx={{ color: '#637381' }}>Optimal for processing long documents into smaller segments.</Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>AI Creativity (Temperature)</Typography>
                            <Tooltip title="Controls the randomness of AI responses. Lower values (0.1–0.3) produce focused, factual answers. Higher values (0.7–1.0) make responses more creative and varied." arrow placement="top">
                              <IconButton size="small" sx={{ ml: '1rem', color: '#637381', '&:hover': { color: '#00e68a' } }}>
                                <HelpIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e68a' }}>{formData.temperature}</Typography>
                        </Stack>
                        <Slider value={formData.temperature} onChange={(e, v) => setFormData({ ...formData, temperature: v })} {...BOUNDARIES.temperature} />
                        <Typography variant="caption" sx={{ color: '#637381' }}>Lower is precise/factual, higher is creative.</Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Context Window (Top K)</Typography>
                            <Tooltip title="The number of most relevant document chunks retrieved to answer each query. More sources provide broader context but may introduce noise." arrow placement="top">
                              <IconButton size="small" sx={{ ml: '1rem', color: '#637381', '&:hover': { color: '#00e68a' } }}>
                                <HelpIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e68a' }}>{formData.top_k} sources</Typography>
                        </Stack>
                        <Slider value={formData.top_k} onChange={(e, v) => setFormData({ ...formData, top_k: v })} {...BOUNDARIES.top_k} />
                      </Box>
                    </Stack>
                  </Box>
                )}

                {formData.profession && formData.profession !== 'custom' && (
                  <Alert
                    severity="success"
                    variant="outlined"
                    icon={<MagicIcon fontSize="inherit" />}
                    sx={{ '& .MuiAlert-message': { fontSize: '0.85rem' } }}
                  >
                    AI parameters have been <strong>automatically optimized</strong> for the {formData.profession} workflow.
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    py: 2,
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(0, 230, 138, 0.24)',
                    },
                  }}
                >
                  Save Profile & Get Started
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default Onboarding;
