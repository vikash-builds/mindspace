import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Autorenew as RefreshIcon,
  CloudSync as ConnectIcon,
  Drafts as DraftIcon,
  Email as MailIcon,
  Folder as DriveIcon,
  AutoAwesome as MagicIcon,
} from '@mui/icons-material';

import Sidebar from '../components/Sidebar';

function Integrations() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState('drive');
  const [loading, setLoading] = useState(true);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: null, scopes: [] });
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveNextPageToken, setDriveNextPageToken] = useState(null);
  const [includeSharedDrives, setIncludeSharedDrives] = useState(true);
  const [gmailMessages, setGmailMessages] = useState([]);
  const [gmailSearch, setGmailSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageActions, setMessageActions] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [draftSaving, setDraftSaving] = useState(false);
  const [importingDriveId, setImportingDriveId] = useState(null);
  const [notice, setNotice] = useState('');
  const [draftForm, setDraftForm] = useState({ recipient: '', subject: '', body: '' });

  const authHeaders = async () => ({ Authorization: `Bearer ${await getToken()}` });

  const fetchDriveFiles = async ({ append = false, pageToken = null, search = driveSearch, shared = includeSharedDrives } = {}) => {
    const response = await axios.get('/api/integrations/google/drive/files', {
      headers: await authHeaders(),
      params: {
        search,
        includeSharedDrives: shared,
        pageToken: pageToken || undefined,
        pageSize: 20,
      },
    });
    const files = response.data?.files || [];
    setDriveFiles((current) => (append ? [...current, ...files] : files));
    setDriveNextPageToken(response.data?.nextPageToken || null);
  };

  const fetchMail = async ({ preserveSelection = false } = {}) => {
    const [messagesRes, draftsRes] = await Promise.all([
      axios.get('/api/integrations/google/gmail/messages', {
        headers: await authHeaders(),
        params: gmailSearch ? { search: gmailSearch } : undefined,
      }),
      axios.get('/api/integrations/google/gmail/drafts', { headers: await authHeaders() }).catch(() => ({ data: [] })),
    ]);
    setGmailMessages(messagesRes.data || []);
    setDrafts(draftsRes.data || []);

    if (!preserveSelection || !selectedMessage) {
      setSelectedMessage(null);
      setMessageActions(null);
    }
  };

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const statusRes = await axios.get('/api/integrations/google/status', { headers: await authHeaders() });
      setGoogleStatus(statusRes.data);

      if (statusRes.data.connected) {
        await Promise.all([
          fetchDriveFiles({ append: false, pageToken: null }),
          fetchMail(),
        ]);
      } else {
        setDriveFiles([]);
        setDriveNextPageToken(null);
        setGmailMessages([]);
        setDrafts([]);
      }
    } catch (error) {
      console.error('Failed to fetch integrations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    const handleMessage = (event) => {
      if (event.data?.type === 'google-connected') {
        fetchIntegrations();
        setNotice('Google account connected successfully.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (googleStatus.connected) {
      fetchDriveFiles({ append: false, pageToken: null }).catch(() => {});
    }
  }, [driveSearch, includeSharedDrives]);

  useEffect(() => {
    if (googleStatus.connected) {
      fetchMail({ preserveSelection: true }).catch(() => {});
    }
  }, [gmailSearch]);

  const handleConnectGoogle = async () => {
    const res = await axios.get('/api/integrations/google/start', { headers: await authHeaders() });
    window.open(res.data.url, '_blank', 'popup,width=520,height=720');
  };

  const handleImportDriveFile = async (file) => {
    try {
      setImportingDriveId(file.id);
      await axios.post('/api/integrations/google/drive/import', {
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
      }, {
        headers: await authHeaders(),
      });
      setNotice(`Imported ${file.name} successfully.`);
    } catch (error) {
      alert(`Failed to import Drive file: ${error.response?.data?.error || error.message}`);
    } finally {
      setImportingDriveId(null);
    }
  };

  const handleLoadMessageDetails = async (messageId) => {
    try {
      const [messageRes, actionRes] = await Promise.all([
        axios.get(`/api/integrations/google/gmail/messages/${messageId}`, { headers: await authHeaders() }),
        axios.get(`/api/integrations/google/gmail/messages/${messageId}/actions`, { headers: await authHeaders() }),
      ]);
      setSelectedMessage(messageRes.data);
      setMessageActions(actionRes.data?.actionCandidates || { reminders: [], checklists: [] });
    } catch (error) {
      alert(`Failed to load email: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleImportEmailActions = async () => {
    if (!selectedMessage || !messageActions) {
      return;
    }

    try {
      await axios.post('/api/reminders/import-candidates', {
        reminders: (messageActions.reminders || []).map((reminder) => ({
          ...reminder,
          notes: `Imported from email: ${selectedMessage.subject}`,
        })),
        checklists: messageActions.checklists || [],
      }, {
        headers: await authHeaders(),
      });
      setNotice(`Imported action candidates from "${selectedMessage.subject}".`);
    } catch (error) {
      alert(`Failed to import email actions: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCreateDraft = async () => {
    try {
      setDraftSaving(true);
      await axios.post('/api/integrations/google/gmail/drafts', draftForm, {
        headers: await authHeaders(),
      });
      setDraftForm({ recipient: '', subject: '', body: '' });
      await fetchMail({ preserveSelection: true });
      setNotice('Gmail draft created successfully.');
    } catch (error) {
      alert(`Failed to create Gmail draft: ${error.response?.data?.error || error.message}`);
    } finally {
      setDraftSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, borderBottom: '1px dashed rgba(145, 158, 171, 0.2)', bgcolor: '#212b36', zIndex: 10 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Integrations & Mail</Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {googleStatus.connected ? (
              <Chip size="small" icon={<ConnectIcon />} label={`Connected: ${googleStatus.email || 'Google'}`} color="success" />
            ) : (
              <Chip size="small" label="Google not connected" />
            )}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchIntegrations}>Refresh</Button>
            <Button variant="contained" startIcon={<ConnectIcon />} onClick={handleConnectGoogle}>
              {googleStatus.connected ? 'Reconnect Google' : 'Connect Google'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
            {notice && <Alert sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
              <>
                <Paper sx={{ mb: 3 }}>
                  <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ px: 2 }}>
                    <Tab value="drive" icon={<DriveIcon fontSize="small" />} iconPosition="start" label="Google Drive" />
                    <Tab value="mail" icon={<MailIcon fontSize="small" />} iconPosition="start" label="Mail Workspace" />
                  </Tabs>
                </Paper>

                {tab === 'drive' && (
                  <Paper sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                      <TextField fullWidth label="Search Drive" value={driveSearch} onChange={(event) => setDriveSearch(event.target.value)} />
                      <TextField
                        select
                        label="Browse Scope"
                        value={includeSharedDrives ? 'all' : 'mine'}
                        onChange={(event) => setIncludeSharedDrives(event.target.value === 'all')}
                        sx={{ minWidth: 220 }}
                      >
                        <MenuItem value="all">My Drive + Shared Drives</MenuItem>
                        <MenuItem value="mine">My Drive only</MenuItem>
                      </TextField>
                    </Stack>
                    <Stack spacing={1.5}>
                      {driveFiles.map((file) => (
                        <Paper key={file.id} sx={{ p: 2, bgcolor: '#1a222c' }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{file.name}</Typography>
                              <Typography variant="caption" sx={{ color: '#919eab' }}>
                                {file.mimeType} · {file.owners?.map((owner) => owner.displayName).join(', ') || 'Unknown owner'}
                                {file.driveId ? ' · Shared Drive' : ' · My Drive'}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              {file.webViewLink && (
                                <Button component="a" href={file.webViewLink} target="_blank" rel="noreferrer" variant="text">
                                  Open
                                </Button>
                              )}
                              <Button variant="contained" onClick={() => handleImportDriveFile(file)} disabled={importingDriveId === file.id}>
                                {importingDriveId === file.id ? 'Importing...' : 'Import'}
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                      {driveNextPageToken && (
                        <Button variant="outlined" onClick={() => fetchDriveFiles({ append: true, pageToken: driveNextPageToken })}>
                          Load More
                        </Button>
                      )}
                      {!driveFiles.length && (
                        <Typography variant="body2" sx={{ color: '#919eab' }}>No Drive files found for the current filters.</Typography>
                      )}
                    </Stack>
                  </Paper>
                )}

                {tab === 'mail' && (
                  <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3}>
                    <Paper sx={{ p: 3, flex: 1.1 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                        <TextField fullWidth label="Search Inbox Preview" value={gmailSearch} onChange={(event) => setGmailSearch(event.target.value)} />
                        <Button variant="outlined" onClick={() => fetchMail({ preserveSelection: true })}>Refresh Inbox</Button>
                      </Stack>
                      <List disablePadding>
                        {gmailMessages.map((message) => (
                          <ListItemButton
                            key={message.id}
                            selected={selectedMessage?.id === message.id}
                            onClick={() => handleLoadMessageDetails(message.id)}
                            sx={{ borderRadius: 2, mb: 1, bgcolor: selectedMessage?.id === message.id ? 'rgba(0, 230, 138, 0.08)' : 'transparent' }}
                          >
                            <ListItemText
                              primary={message.subject}
                              secondary={`${message.from} · ${message.date}\n${message.snippet}`}
                              secondaryTypographyProps={{ sx: { whiteSpace: 'pre-line' } }}
                            />
                          </ListItemButton>
                        ))}
                        {!gmailMessages.length && <Typography variant="body2" sx={{ color: '#919eab' }}>No inbox messages matched this view yet.</Typography>}
                      </List>
                    </Paper>

                    <Stack sx={{ flex: 1 }} spacing={3}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Selected Email</Typography>
                        {!selectedMessage ? (
                          <Typography variant="body2" sx={{ color: '#919eab' }}>Choose an inbox message to preview it and extract actions.</Typography>
                        ) : (
                          <Stack spacing={1.25}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedMessage.subject}</Typography>
                            <Typography variant="caption" sx={{ color: '#919eab' }}>
                              {selectedMessage.from} · {selectedMessage.date}
                            </Typography>
                            <Divider />
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#dfe3e8' }}>
                              {selectedMessage.body || selectedMessage.snippet}
                            </Typography>
                            <Divider />
                            <Stack direction="row" spacing={1} alignItems="center">
                              <MagicIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Detected Actions</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#919eab' }}>
                              Reminders: {(messageActions?.reminders || []).length} · Checklists: {(messageActions?.checklists || []).length}
                            </Typography>
                            <Button variant="contained" onClick={handleImportEmailActions} disabled={!messageActions || (((messageActions.reminders || []).length + (messageActions.checklists || []).length) === 0)}>
                              Import Actions To Workspace
                            </Button>
                          </Stack>
                        )}
                      </Paper>

                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Create Gmail Draft</Typography>
                        <Stack spacing={2}>
                          <TextField label="Recipient" value={draftForm.recipient} onChange={(event) => setDraftForm((current) => ({ ...current, recipient: event.target.value }))} />
                          <TextField label="Subject" value={draftForm.subject} onChange={(event) => setDraftForm((current) => ({ ...current, subject: event.target.value }))} />
                          <TextField label="Body" multiline minRows={5} value={draftForm.body} onChange={(event) => setDraftForm((current) => ({ ...current, body: event.target.value }))} />
                          <Button variant="contained" startIcon={<DraftIcon />} onClick={handleCreateDraft} disabled={draftSaving}>
                            {draftSaving ? 'Saving draft...' : 'Create Draft'}
                          </Button>
                        </Stack>
                        <Divider sx={{ my: 2.5 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Saved Gmail Drafts</Typography>
                        <Stack spacing={1}>
                          {drafts.map((draft) => (
                            <Paper key={draft.id} sx={{ p: 1.5, bgcolor: '#1a222c' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{draft.subject}</Typography>
                              <Typography variant="caption" sx={{ color: '#919eab' }}>{draft.recipient}</Typography>
                            </Paper>
                          ))}
                          {!drafts.length && <Typography variant="body2" sx={{ color: '#919eab' }}>No Gmail drafts saved yet.</Typography>}
                        </Stack>
                      </Paper>
                    </Stack>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Integrations;
