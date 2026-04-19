import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  Article as WordIcon,
  CheckCircle as CheckIcon,
  Delete as TrashIcon,
  Description as FileIcon,
  Error as AlertIcon,
  Link as LinkIcon,
  Pending as ClockIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PptIcon,
  Sync as SyncIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';

function DocumentList({ documents, onDeleted, onSynced }) {
  const { getToken } = useAuth();
  const [selectedIds, setSelectedIds] = useState([]);
  const [syncingIds, setSyncingIds] = useState([]);
  const [candidateDialog, setCandidateDialog] = useState({ open: false, document: null, data: null });
  const [importingCandidates, setImportingCandidates] = useState(false);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(documents.map((document) => document.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} document(s)?`)) {
      return;
    }

    try {
      const token = await getToken();
      await Promise.all(selectedIds.map((id) => axios.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })));
      setSelectedIds([]);
      onDeleted?.();
    } catch (error) {
      alert('Failed to delete some documents');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = await getToken();
      await axios.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedIds((current) => current.filter((item) => item !== id));
      onDeleted?.();
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  const handleSyncHosted = async (id) => {
    try {
      setSyncingIds((current) => [...current, id]);
      const token = await getToken();
      await axios.post(`/api/documents/${id}/sync-hosted`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSynced?.();
    } catch (error) {
      alert('Failed to sync document to hosted vector storage');
    } finally {
      setSyncingIds((current) => current.filter((item) => item !== id));
    }
  };

  const handleViewActions = async (document) => {
    try {
      const token = await getToken();
      const response = await axios.get(`/api/documents/${document.id}/action-candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidateDialog({
        open: true,
        document,
        data: response.data,
      });
    } catch (error) {
      alert('Failed to load action candidates');
    }
  };

  const handleImportCandidates = async () => {
    if (!candidateDialog.data) {
      return;
    }

    try {
      setImportingCandidates(true);
      const token = await getToken();
      const reminders = (candidateDialog.data.reminders || []).map((reminder) => ({
        ...reminder,
        source_document_id: candidateDialog.document.id,
      }));
      const checklists = (candidateDialog.data.checklists || []).map((checklist) => ({
        ...checklist,
        source_document_id: candidateDialog.document.id,
      }));
      await axios.post('/api/reminders/import-candidates', {
        reminders,
        checklists,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidateDialog({ open: false, document: null, data: null });
    } catch (error) {
      alert('Failed to import action candidates');
    } finally {
      setImportingCandidates(false);
    }
  };

  const getFileIcon = (type) => {
    const normalized = type.toLowerCase();
    if (normalized === 'pdf') return <PdfIcon sx={{ color: '#ff5630' }} />;
    if (normalized === 'xlsx' || normalized === 'xls') return <ExcelIcon sx={{ color: '#22c55e' }} />;
    if (normalized === 'pptx' || normalized === 'ppt') return <PptIcon sx={{ color: '#ffab00' }} />;
    if (normalized === 'docx' || normalized === 'doc') return <WordIcon sx={{ color: '#00b8d9' }} />;
    return <FileIcon sx={{ color: '#637381' }} />;
  };

  const renderStatus = (document) => {
    if (document.status === 'ready') {
      return <Chip size="small" icon={<CheckIcon />} label="Ready" sx={{ fontWeight: 600, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#77ed8b', '& .MuiChip-icon': { color: '#22c55e' } }} />;
    }
    if (document.status === 'processing') {
      return <Chip size="small" icon={<ClockIcon />} label="Analyzing..." sx={{ fontWeight: 600, bgcolor: 'rgba(0, 184, 217, 0.12)', color: '#61f3f3', '& .MuiChip-icon': { color: '#00b8d9' } }} />;
    }
    return (
      <Tooltip title={document.error_message || 'Ingestion process encountered a critical error.'} arrow placement="top">
        <Chip size="small" icon={<AlertIcon />} label="Error" sx={{ fontWeight: 600, cursor: 'help', bgcolor: 'rgba(255, 86, 48, 0.12)', color: '#ffac82', '& .MuiChip-icon': { color: '#ff5630' } }} />
      </Tooltip>
    );
  };

  const renderSyncStatus = (document) => {
    const labelMap = {
      'local-only': 'Local',
      syncing: 'Syncing',
      synced: 'Hosted',
      error: 'Sync Error',
    };
    return (
      <Chip
        size="small"
        label={labelMap[document.sync_status] || document.sync_status || 'Local'}
        variant={document.sync_status === 'synced' ? 'filled' : 'outlined'}
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  return (
    <Box>
      {selectedIds.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(0, 230, 138, 0.08)', p: 2, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottom: '1px solid rgba(145, 158, 171, 0.16)' }}>
          <Typography variant="subtitle2" sx={{ color: '#00e68a' }}>{selectedIds.length} selected</Typography>
          <Button size="small" variant="contained" color="error" startIcon={<TrashIcon />} onClick={handleBulkDelete} sx={{ bgcolor: 'rgba(255, 86, 48, 0.16)', color: '#ff5630', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.32)', boxShadow: 'none' } }}>Delete Selected</Button>
        </Box>
      )}
      <TableContainer component={Paper} elevation={0} sx={{ overflow: 'hidden', borderTopLeftRadius: selectedIds.length > 0 ? 0 : 12, borderTopRightRadius: selectedIds.length > 0 ? 0 : 12 }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < documents.length}
                  checked={documents.length > 0 && selectedIds.length === documents.length}
                  onChange={handleSelectAll}
                  sx={{ color: '#637381', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#00e68a' } }}
                />
              </TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Sync</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedIds.includes(document.id)} onChange={() => handleSelectOne(document.id)} sx={{ color: '#637381', '&.Mui-checked': { color: '#00e68a' } }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar variant="rounded" sx={{ bgcolor: '#2a3544', color: 'inherit' }}>
                      {getFileIcon(document.file_type)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{document.filename}</Typography>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#637381' }}>{document.file_type}</Typography>
                      {document.external_url && (
                        <Box>
                          <Link href={document.external_url} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center', fontSize: '0.75rem', mt: 0.5 }}>
                            <LinkIcon sx={{ fontSize: 14 }} />
                            Open source
                          </Link>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{renderStatus(document)}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#919eab', textTransform: 'capitalize' }}>
                    {document.source_type || 'local'}
                  </Typography>
                </TableCell>
                <TableCell>{renderSyncStatus(document)}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#919eab' }}>
                    {new Date(document.uploaded_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Review extracted actions">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleViewActions(document)}
                        disabled={document.status !== 'ready'}
                        sx={{ color: '#637381', '&:hover': { color: '#8b5cf6', bgcolor: 'rgba(139, 92, 246, 0.08)' } }}
                      >
                        <MagicIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={document.sync_status === 'synced' ? 'Re-sync hosted index' : 'Sync to hosted vector DB'}>
                    <span>
                      <IconButton size="small" onClick={() => handleSyncHosted(document.id)} disabled={syncingIds.includes(document.id) || document.status !== 'ready'} sx={{ color: '#637381', '&:hover': { color: '#00e68a', bgcolor: 'rgba(0, 230, 138, 0.08)' } }}>
                        <SyncIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton size="small" onClick={() => handleDelete(document.id)} sx={{ color: '#637381', '&:hover': { color: '#ff5630', bgcolor: 'rgba(255, 86, 48, 0.08)' } }}>
                    <TrashIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ color: '#637381' }}>
                    <FileIcon sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
                    <Typography variant="body2">No documents found in your library.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={candidateDialog.open} onClose={() => setCandidateDialog({ open: false, document: null, data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Imported Action Candidates</DialogTitle>
        <DialogContent dividers>
          {!candidateDialog.data && (
            <Typography variant="body2" sx={{ color: '#919eab' }}>
              No action candidates found yet.
            </Typography>
          )}
          {candidateDialog.data && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Reminders
                </Typography>
                {(candidateDialog.data.reminders || []).length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#919eab' }}>No reminder candidates detected.</Typography>
                ) : (
                  <List dense disablePadding>
                    {candidateDialog.data.reminders.map((item, index) => (
                      <ListItem key={`${item.title}-${index}`} disableGutters>
                        <ListItemText
                          primary={item.title}
                          secondary={item.remind_at ? new Date(item.remind_at).toLocaleString() : item.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Checklists
                </Typography>
                {(candidateDialog.data.checklists || []).length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#919eab' }}>No checklist candidates detected.</Typography>
                ) : (
                  <List dense disablePadding>
                    {candidateDialog.data.checklists.map((checklist, index) => (
                      <ListItem key={`${checklist.title}-${index}`} disableGutters sx={{ alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={checklist.title}
                          secondary={(checklist.items || []).map((item) => item.item_text || item).join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCandidateDialog({ open: false, document: null, data: null })}>Close</Button>
          <Button
            variant="contained"
            onClick={handleImportCandidates}
            disabled={importingCandidates || !candidateDialog.data || (((candidateDialog.data.reminders || []).length + (candidateDialog.data.checklists || []).length) === 0)}
          >
            {importingCandidates ? 'Importing...' : 'Import To Reminders'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DocumentList;
