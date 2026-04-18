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
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AutoFixHigh as MagicIcon,
  Tune as TuningIcon,
  InfoOutlined as InfoIcon,
  Save as SaveIcon,
  HelpOutlined as HelpIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { PROFESSIONS, BOUNDARIES } from '../professions';
import axios from 'axios';

function Settings() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaveLoading] = useState(false);
  const [redigesting, setRedigesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Profile updated successfully');

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
      setSnackbarMessage('Profile updated successfully');
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRedigest = async () => {
    if (!window.confirm("This will erase and recalculate your entire vector database utilizing your active parameters. Proceed?")) return;
    setRedigesting(true);
    try {
      const token = await getToken();
      await axios.post('/api/documents/redigest', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Re-digestion initiated successfully! Check Dashboard for chunking progress.');
      setSuccess(true);
    } catch(err) {
      console.error(err);
      alert('Failed to initiate re-digestion.');
    } finally {
      setRedigesting(false);
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
        {/* Toolbar */}
        <Box sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
          bgcolor: '#212b36',
          zIndex: 10
        }}>
          <SettingsIcon sx={{ mr: 1.5, color: '#637381' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile & AI Settings</Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Profession Card */}
                <Paper sx={{ p: 3.5 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2.5, display: 'block' }}>
                    Professional Identity
                  </Typography>
                  <Stack spacing={2.5}>
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
                <Paper sx={{ p: 3.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em' }}>
                      RAG Engine Configuration
                    </Typography>
                    {formData.profession !== 'custom' && (
                      <Chip
                        icon={<MagicIcon />}
                        label="Auto-Optimized"
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: 'rgba(0, 230, 138, 0.12)', color: '#5be49b', '& .MuiChip-icon': { color: '#00e68a' } }}
                      />
                    )}
                  </Stack>

                  <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                    <strong>Note:</strong> Changes to <em>Chunk Size</em> will only apply to <strong>new documents</strong> uploaded after this point. Existing documents will retain their current structure.
                  </Alert>

                  {formData.profession === 'custom' ? (
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
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Temperature</Typography>
                            <Tooltip title="Controls the randomness of AI responses. Lower values (0.1–0.3) produce focused, factual answers. Higher values (0.7–1.0) make responses more creative and varied." arrow placement="top">
                              <IconButton size="small" sx={{ ml: '1rem', color: '#637381', '&:hover': { color: '#00e68a' } }}>
                                <HelpIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e68a' }}>{formData.temperature}</Typography>
                        </Stack>
                        <Slider value={formData.temperature} onChange={(e, v) => setFormData({ ...formData, temperature: v })} {...BOUNDARIES.temperature} />
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, display: "flex", alignItems: "center" }}>
                          <Stack direction="row" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Top K (Context)</Typography>
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
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#1a222c', borderRadius: 2, border: '1px dashed rgba(145, 158, 171, 0.16)' }}>
                      <Typography variant="body2" sx={{ color: '#919eab' }}>
                        Parameters are being handled automatically for the <strong style={{ color: '#fff' }}>{formData.profession}</strong> workflow.<br />
                        Switch to <strong style={{ color: '#00e68a' }}>Custom Profession</strong> to unlock manual tuning.
                      </Typography>
                    </Box>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, pb: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving || redigesting}
                    sx={{ px: 5, py: 1.5, fontWeight: 700 }}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    type="button"
                    variant="outlined" 
                    size="large"
                    startIcon={redigesting ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                    disabled={saving || redigesting}
                    onClick={handleRedigest}
                    sx={{ 
                      px: 4, 
                      color: '#00e68a', 
                      borderColor: 'rgba(0, 230, 138, 0.5)',
                      '&:hover': { borderColor: '#00e68a', bgcolor: 'rgba(0, 230, 138, 0.08)' }
                    }}
                  >
                    {redigesting ? 'Syncing...' : 'Re-digest Library'}
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
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}

export default Settings;
