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
  Stack
} from '@mui/material';
import { 
  Psychology as BrainIcon, 
  AutoFixHigh as MagicIcon,
  Tune as SettingsIcon
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
    <Box sx={{ minHeight: '100vh', py: 10, bgcolor: '#f9fafb' }}>
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 4, md: 8 }, 
            borderRadius: 6, 
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)'
          }}
        >
          <Stack spacing={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ 
                width: 72, 
                height: 72, 
                bgcolor: 'primary.main', 
                mx: 'auto', 
                mb: 3,
                boxShadow: '0 0 0 8px #eef2ff'
              }}>
                <BrainIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.025em' }}>
                Setup MindSpace
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Let's tailor your AI assistant to your workflow.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={5}>
                {/* Basic Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                    Personal Details
                  </Typography>
                  <Stack spacing={3}>
                    <TextField 
                      fullWidth 
                      label="Full Name" 
                      variant="outlined"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                      InputProps={{ sx: { borderRadius: 3 } }}
                    />
                    <TextField 
                      fullWidth 
                      label="Email Address" 
                      variant="outlined"
                      value={formData.email} 
                      disabled 
                      InputProps={{ sx: { borderRadius: 3 } }}
                    />
                    <TextField 
                      fullWidth 
                      select 
                      label="Your Profession" 
                      value={formData.profession} 
                      onChange={handleProfessionChange}
                      required
                      InputProps={{ sx: { borderRadius: 3 } }}
                    >
                      {PROFESSIONS.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                      ))}
                    </TextField>
                    {formData.profession === 'custom' && (
                      <TextField 
                        fullWidth 
                        label="Enter your specific role" 
                        value={formData.customProfession} 
                        onChange={e => setFormData({...formData, customProfession: e.target.value})} 
                        required 
                        InputProps={{ sx: { borderRadius: 3 } }}
                      />
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* AI Section - Only visible for custom */}
                {formData.profession === 'custom' && (
                  <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
                      <SettingsIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                        Advanced RAG Configuration
                      </Typography>
                    </Stack>
                    
                    <Alert 
                      severity="warning" 
                      variant="outlined"
                      sx={{ 
                        mb: 5,
                        borderRadius: 3, 
                        border: '1px solid #fff7ed', 
                        bgcolor: '#fff7ed',
                        '& .MuiAlert-message': { fontSize: '0.85rem', color: '#9a3412', lineHeight: 1.6 } 
                      }}
                    >
                      <strong>Professional Guidance Recommended:</strong> Manual tuning of RAG parameters should only be performed by advanced users. Incorrect configurations may significantly degrade the accuracy and relevance of AI responses. Proceed with caution.
                    </Alert>
                    
                    <Stack spacing={5} sx={{ px: 1 }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Chunk Size</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.chunk_size} chars</Typography>
                        </Stack>
                        <Slider 
                          value={formData.chunk_size} 
                          onChange={(e, v) => setFormData({...formData, chunk_size: v})}
                          {...BOUNDARIES.chunk_size}
                          sx={{ height: 6 }}
                        />
                        <Typography variant="caption" color="text.secondary">Optimal for processing long documents into smaller segments.</Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>AI Creativity (Temperature)</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.temperature}</Typography>
                        </Stack>
                        <Slider 
                          value={formData.temperature} 
                          onChange={(e, v) => setFormData({...formData, temperature: v})}
                          {...BOUNDARIES.temperature}
                          sx={{ height: 6 }}
                        />
                        <Typography variant="caption" color="text.secondary">Lower is precise/factual, higher is creative.</Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Context Window (Top K)</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.top_k} sources</Typography>
                        </Stack>
                        <Slider 
                          value={formData.top_k} 
                          onChange={(e, v) => setFormData({...formData, top_k: v})}
                          {...BOUNDARIES.top_k}
                          sx={{ height: 6 }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                )}

                {formData.profession && formData.profession !== 'custom' && (
                  <Alert 
                    severity="success" 
                    variant="outlined"
                    icon={<MagicIcon fontSize="inherit" />}
                    sx={{ 
                      borderRadius: 3, 
                      border: '1px solid #f0fdf4', 
                      bgcolor: '#f0fdf4',
                      '& .MuiAlert-message': { fontSize: '0.85rem', color: '#166534' } 
                    }}
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
                    py: 2.5, 
                    borderRadius: 4, 
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
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
