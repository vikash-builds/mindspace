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
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3, 
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#fff',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Knowledge Base</Typography>
          <Button 
            variant="contained" 
            startIcon={<PlusIcon />}
            onClick={() => setIsUploading(!isUploading)}
            sx={{ borderRadius: 2 }}
          >
            {isUploading ? 'Close' : 'Add Document'}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#f9fafb' }}>
          <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            <Collapse in={isUploading}>
              <Box sx={{ mb: 4 }}>
                <FileUploader onUploadSuccess={() => {
                  fetchDocuments();
                  setIsUploading(false);
                }} />
              </Box>
            </Collapse>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fff', borderRadius: 3 }}>
                   <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: '#fff' }}>
                     <DbIcon fontSize="small" />
                   </Box>
                   <Box>
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Total Docs</Typography>
                     <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{documents.length}</Typography>
                   </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fff', borderRadius: 3 }}>
                   <Box sx={{ p: 1, bgcolor: '#10b981', borderRadius: 2, color: '#fff' }}>
                     <LockIcon fontSize="small" />
                   </Box>
                   <Box>
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Privacy</Typography>
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
