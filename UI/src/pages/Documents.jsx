import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as PlusIcon,
  FilterAlt as FilterIcon,
  Security as LockIcon,
  Storage as DbIcon,
} from '@mui/icons-material';

import Sidebar from '../components/Sidebar';
import FileUploader from '../components/FileUploader';
import DocumentList from '../components/DocumentList';
import { demoModeEnabled, getActiveDemoConfig } from '../demo/demoConfig';

const initialFilters = {
  query: '',
  fileType: '',
  name: '',
  dateFrom: '',
  dateTo: '',
  status: '',
  sourceType: '',
};

function Documents() {
  const { getToken } = useAuth();
  const demoConfig = getActiveDemoConfig();
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  const fetchDocuments = async () => {
    try {
      const token = await getToken();
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const response = await axios.get('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Fetch docs error:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const stats = useMemo(() => ({
    total: documents.length,
    hosted: documents.filter((document) => document.sync_status === 'synced').length,
  }), [documents]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, borderBottom: '1px dashed rgba(145, 158, 171, 0.2)', bgcolor: '#212b36', zIndex: 10 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Knowledge Base</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setShowFilters((current) => !current)}>
              Filters
            </Button>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setIsUploading((current) => !current)}>
              {isUploading ? 'Close' : 'Add Document'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
            {demoModeEnabled && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Demo mode is active. For the strongest HR walkthrough, upload files like: {demoConfig.targetFiles.slice(0, 3).join(', ')}.
              </Alert>
            )}
            <Collapse in={isUploading}>
              <Box sx={{ mb: 3 }}>
                <FileUploader onUploadSuccess={() => {
                  fetchDocuments();
                  setIsUploading(false);
                }} />
              </Box>
            </Collapse>

            <Collapse in={showFilters}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Filter Documents
                  </Typography>
                  <Button variant="text" onClick={() => setFilters(initialFilters)}>
                    Clear
                  </Button>
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                      xl: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                    alignItems: 'start',
                  }}
                >
                    <TextField fullWidth label="Search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} />
                    <TextField fullWidth label="Name" value={filters.name} onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))} />
                    <TextField select fullWidth label="File Type" value={filters.fileType} onChange={(event) => setFilters((current) => ({ ...current, fileType: event.target.value }))}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="docx">DOCX</MenuItem>
                      <MenuItem value="xlsx">XLSX</MenuItem>
                      <MenuItem value="pptx">PPTX</MenuItem>
                      <MenuItem value="txt">TXT</MenuItem>
                      <MenuItem value="jpg">Image</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date From"
                      value={filters.dateFrom}
                      onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Date To"
                      value={filters.dateTo}
                      onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField select fullWidth label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="ready">Ready</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="error">Failed</MenuItem>
                    </TextField>
                    <TextField select fullWidth label="Source" value={filters.sourceType} onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value }))}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="local">Local</MenuItem>
                      <MenuItem value="google_drive">Google Drive</MenuItem>
                    </TextField>
                </Box>
              </Paper>
            </Collapse>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(0, 230, 138, 0.12)', borderRadius: 2, display: 'flex' }}>
                    <DbIcon fontSize="small" sx={{ color: '#00e68a' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#919eab' }}>Total Docs</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{stats.total}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(34, 197, 94, 0.12)', borderRadius: 2, display: 'flex' }}>
                    <LockIcon fontSize="small" sx={{ color: '#22c55e' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#919eab' }}>Privacy</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>Dual Mode</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(0, 184, 217, 0.12)', borderRadius: 2, display: 'flex' }}>
                    <FilterIcon fontSize="small" sx={{ color: '#00b8d9' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#919eab' }}>Hosted Synced</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{stats.hosted}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <DocumentList documents={documents} onDeleted={fetchDocuments} onSynced={fetchDocuments} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Documents;
