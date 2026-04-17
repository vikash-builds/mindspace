import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import FileUploader from '../components/FileUploader';
import DocumentList from '../components/DocumentList';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Collapse,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  Add as PlusIcon, 
  Description as DocsIcon, 
  Storage as DbIcon, 
  Security as LockIcon 
} from '@mui/icons-material';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { getToken } = useAuth();

  const fetchDocuments = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error('Fetch docs error:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3, 
          borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
          bgcolor: '#212b36',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Knowledge Base</Typography>
          <Button 
            variant="contained" 
            startIcon={<PlusIcon />}
            onClick={() => setIsUploading(!isUploading)}
          >
            {isUploading ? 'Close' : 'Add Document'}
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            <Collapse in={isUploading}>
              <Box sx={{ mb: 3 }}>
                <FileUploader onUploadSuccess={() => {
                  fetchDocuments();
                  setIsUploading(false);
                }} />
              </Box>
            </Collapse>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(0, 230, 138, 0.12)', borderRadius: 2, display: 'flex' }}>
                    <DbIcon fontSize="small" sx={{ color: '#00e68a' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#919eab' }}>Total Docs</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{documents.length}</Typography>
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
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>100% Local</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <DocumentList documents={documents} onDeleted={fetchDocuments} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Documents;
