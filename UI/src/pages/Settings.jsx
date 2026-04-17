import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import Sidebar from '../components/Sidebar';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  Slider,
  Divider,
  Alert,
  Stack,
  Snackbar,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AutoFixHigh as MagicIcon,
  Tune as TuningIcon,
  InfoOutlined as InfoIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { PROFESSIONS, BOUNDARIES } from '../professions';
import axios from 'axios';

function Settings() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if the profession from DB is one of our presets
      const isPredefined = PROFESSIONS.some(p => p.id === res.data.profession);

      setFormData({
        ...res.data,
        profession: isPredefined ? res.data.profession : 'custom',
        customProfession: isPredefined ? '' : res.data.profession
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
    setSaveLoading(true);
    try {
      const token = await getToken();
      await axios.post('/api/profile', {
        ...formData,
        profession: formData.profession === 'custom' ? formData.customProfession : formData.profession
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#fff',
          zIndex: 10
        }}>
          <SettingsIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile & AI Settings</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#f9fafb' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {/* Profession Card */}
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                    Professional Identity
                  </Typography>
                  <Stack spacing={3}>
                    <TextField fullWidth label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <TextField
                      fullWidth
                      select
                      label="Current Profession"
                      value={formData.profession}
                      onChange={handleProfessionChange}
                      required
                    >
                      {PROFESSIONS.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                      ))}
                    </TextField>
                    {formData.profession === 'custom' && (
                      <TextField fullWidth label="Specify your role" value={formData.customProfession} onChange={e => setFormData({ ...formData, customProfession: e.target.value })} required />
                    )}
                  </Stack>
                </Paper>

                {/* AI Tuning Card */}
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                      RAG Engine Configuration
                    </Typography>
                    {formData.profession !== 'custom' && (
                      <Chip icon={<MagicIcon />} label="Auto-Optimized" color="primary" variant="soft" size="small" sx={{ fontWeight: 700 }} />
                    )}
                  </Stack>

                  <Alert
                    severity="info"
                    icon={<InfoIcon />}
                    sx={{ mb: 4, borderRadius: 3 }}
                  >
                    <strong>Note:</strong> Changes to <em>Chunk Size</em> will only apply to <strong>new documents</strong> uploaded after this point. Existing documents will retain their current structure.
                  </Alert>

                  {formData.profession === 'custom' ? (
                    <Stack spacing={5} sx={{ px: 1 }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Chunk Size</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.chunk_size} chars</Typography>
                        </Stack>
                        <Slider value={formData.chunk_size} onChange={(e, v) => setFormData({ ...formData, chunk_size: v })} {...BOUNDARIES.chunk_size} />
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Temperature</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.temperature}</Typography>
                        </Stack>
                        <Slider value={formData.temperature} onChange={(e, v) => setFormData({ ...formData, temperature: v })} {...BOUNDARIES.temperature} />
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Top K (Context)</Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>{formData.top_k} sources</Typography>
                        </Stack>
                        <Slider value={formData.top_k} onChange={(e, v) => setFormData({ ...formData, top_k: v })} {...BOUNDARIES.top_k} />
                      </Box>
                    </Stack>
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #e2e8f0' }}>
                      <Typography variant="body2" color="text.secondary">
                        Parameters are being handled automatically for the <strong>{formData.profession}</strong> workflow.<br />
                        Switch to <strong>Custom Profession</strong> to unlock manual tuning.
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                    sx={{ px: 6, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        message="Profile updated successfully"
      />
    </Box>
  );
}

export default Settings;
