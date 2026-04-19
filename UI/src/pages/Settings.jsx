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
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: null, scopes: [] });
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveNextPageToken, setDriveNextPageToken] = useState(null);
  const [includeSharedDrives, setIncludeSharedDrives] = useState(true);
  const [gmailMessages, setGmailMessages] = useState([]);
  const [gmailDrafts, setGmailDrafts] = useState([]);
  const [draftForm, setDraftForm] = useState({ recipient: '', subject: '', body: '' });
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);

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

  const fetchDriveFiles = async ({ append = false, pageToken = null, search = driveSearch, shared = includeSharedDrives } = {}) => {
    const token = await getToken();
    const driveRes = await axios.get('/api/integrations/google/drive/files', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        search,
        includeSharedDrives: shared,
        pageToken: pageToken || undefined,
        pageSize: 20,
      },
    }).catch(() => ({ data: { files: [], nextPageToken: null } }));

    const files = driveRes.data?.files || [];
    setDriveFiles((current) => (append ? [...current, ...files] : files));
    setDriveNextPageToken(driveRes.data?.nextPageToken || null);
  };

  const fetchIntegrations = async () => {
    try {
      setIntegrationsLoading(true);
      const token = await getToken();
      const [statusRes, draftsRes] = await Promise.all([
        axios.get('/api/integrations/google/status', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/integrations/google/gmail/drafts', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      setGoogleStatus(statusRes.data);
      setGmailDrafts(draftsRes.data || []);

      if (statusRes.data.connected) {
        const [gmailRes] = await Promise.all([
          axios.get('/api/integrations/google/gmail/messages', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        ]);
        await fetchDriveFiles({ append: false, pageToken: null, search: driveSearch, shared: includeSharedDrives });
        setGmailMessages(gmailRes.data || []);
      } else {
        setDriveFiles([]);
        setDriveNextPageToken(null);
        setGmailMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch integrations', err);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchIntegrations();
    const handleMessage = (event) => {
      if (event.data?.type === 'google-connected') {
        fetchIntegrations();
        setSnackbarMessage('Google account connected successfully');
        setSuccess(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (googleStatus.connected) {
      fetchDriveFiles({ append: false, pageToken: null, search: driveSearch, shared: includeSharedDrives });
    }
  }, [driveSearch, includeSharedDrives, googleStatus.connected]);

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
    e?.preventDefault?.();
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

  const handleConnectGoogle = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/integrations/google/start', {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(res.data.url, '_blank', 'popup,width=520,height=720');
    } catch (err) {
      console.error(err);
      alert('Failed to start Google connection');
    }
  };

  const handleImportDriveFile = async (file) => {
    try {
      const token = await getToken();
      await axios.post('/api/integrations/google/drive/import', {
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage(`Imported ${file.name} from Google Drive`);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to import Drive file';
      alert(`Failed to import Drive file: ${serverMessage}`);
    }
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    try {
      setDraftSaving(true);
      const token = await getToken();
      await axios.post('/api/integrations/google/gmail/drafts', draftForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDraftForm({ recipient: '', subject: '', body: '' });
      await fetchIntegrations();
      setSnackbarMessage('Gmail draft created successfully');
      setSuccess(true);
    } catch (err) {
      console.error(err);
      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create Gmail draft';
      alert(`Failed to create Gmail draft: ${serverMessage}`);
    } finally {
      setDraftSaving(false);
    }
  };

  const handleLoadMoreDriveFiles = async () => {
    if (!driveNextPageToken) {
      return;
    }
    try {
      await fetchDriveFiles({ append: true, pageToken: driveNextPageToken, search: driveSearch, shared: includeSharedDrives });
    } catch (err) {
      console.error(err);
      alert('Failed to load more Drive files');
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
            <Box component="div">
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
                    <strong>Note:</strong> Changes to your retrieval settings apply immediately to new uploads. Use <strong>Re-digest Library</strong> below if you want existing documents reprocessed with the new configuration.
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

                <Paper sx={{ p: 3.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em' }}>
                      Google Integrations
                    </Typography>
                    <Chip
                      label={googleStatus.connected ? `Connected${googleStatus.email ? ` · ${googleStatus.email}` : ''}` : 'Not Connected'}
                      color={googleStatus.connected ? 'success' : 'default'}
                      variant={googleStatus.connected ? 'filled' : 'outlined'}
                    />
                  </Stack>

                  {!googleStatus.connected && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Connect your Google account to import Drive files, read inbox metadata, and create Gmail drafts.
                    </Alert>
                  )}

                  <Button variant="contained" onClick={handleConnectGoogle} disabled={integrationsLoading}>
                    {googleStatus.connected ? 'Reconnect Google' : 'Connect Google'}
                  </Button>

                  {googleStatus.connected && (
                    <Stack spacing={3} sx={{ mt: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Google Drive Files</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Search Drive"
                            value={driveSearch}
                            onChange={(event) => setDriveSearch(event.target.value)}
                          />
                          <Button
                            variant={includeSharedDrives ? 'contained' : 'outlined'}
                            onClick={() => setIncludeSharedDrives((current) => !current)}
                          >
                            {includeSharedDrives ? 'Shared Drives On' : 'Shared Drives Off'}
                          </Button>
                        </Stack>
                        <Stack spacing={1.5}>
                          {driveFiles.map((file) => (
                            <Paper key={file.id} sx={{ p: 2, bgcolor: '#1a222c' }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{file.name}</Typography>
                                  <Typography variant="caption" sx={{ color: '#637381' }}>
                                    {file.mimeType}
                                    {file.owners?.[0]?.displayName ? ` · ${file.owners[0].displayName}` : ''}
                                    {file.driveId ? ' · Shared Drive' : ''}
                                  </Typography>
                                </Box>
                                <Button variant="outlined" size="small" onClick={() => handleImportDriveFile(file)}>Import</Button>
                              </Stack>
                            </Paper>
                          ))}
                          {driveFiles.length === 0 && <Typography variant="body2" sx={{ color: '#637381' }}>No Drive files loaded yet.</Typography>}
                          {driveNextPageToken && (
                            <Button variant="outlined" onClick={handleLoadMoreDriveFiles}>
                              Load More
                            </Button>
                          )}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Gmail Inbox Preview</Typography>
                        <Stack spacing={1.5}>
                          {gmailMessages.slice(0, 6).map((message) => (
                            <Paper key={message.id} sx={{ p: 2, bgcolor: '#1a222c' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{message.subject}</Typography>
                              <Typography variant="caption" sx={{ color: '#919eab', display: 'block' }}>{message.from}</Typography>
                              <Typography variant="caption" sx={{ color: '#637381', display: 'block', mt: 0.5 }}>{message.snippet}</Typography>
                            </Paper>
                          ))}
                          {gmailMessages.length === 0 && <Typography variant="body2" sx={{ color: '#637381' }}>No inbox messages loaded yet.</Typography>}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Create Gmail Draft</Typography>
                        <Stack spacing={2}>
                          <TextField fullWidth label="Recipient" value={draftForm.recipient} onChange={(e) => setDraftForm({ ...draftForm, recipient: e.target.value })} required />
                          <TextField fullWidth label="Subject" value={draftForm.subject} onChange={(e) => setDraftForm({ ...draftForm, subject: e.target.value })} required />
                          <TextField fullWidth label="Body" multiline rows={4} value={draftForm.body} onChange={(e) => setDraftForm({ ...draftForm, body: e.target.value })} required />
                          <Button type="button" variant="contained" disabled={draftSaving} onClick={handleCreateDraft}>
                            {draftSaving ? 'Saving Draft...' : 'Create Draft'}
                          </Button>
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Saved Gmail Drafts</Typography>
                        <Stack spacing={1.5}>
                          {gmailDrafts.slice(0, 8).map((draft) => (
                            <Paper key={draft.id} sx={{ p: 2, bgcolor: '#1a222c' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{draft.subject}</Typography>
                              <Typography variant="caption" sx={{ color: '#919eab', display: 'block' }}>To: {draft.recipient}</Typography>
                            </Paper>
                          ))}
                          {gmailDrafts.length === 0 && <Typography variant="body2" sx={{ color: '#637381' }}>No Gmail drafts saved yet.</Typography>}
                        </Stack>
                      </Box>
                    </Stack>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, pb: 4 }}>
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
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
            </Box>
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
