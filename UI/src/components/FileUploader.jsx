import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  IconButton,
  Alert,
  Avatar
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Close as XIcon, 
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

function FileUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');
  const { getToken } = useAuth();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getToken();
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      setStatus('success');
      setMessage(`Successfully uploaded ${res.data.filename}`);
      setFile(null);
      e.target.reset();
      if (onUploadSuccess) setTimeout(onUploadSuccess, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 4, 
        textAlign: 'center', 
        borderStyle: 'dashed', 
        borderWidth: 2,
        borderColor: status === 'error' ? 'rgba(255, 86, 48, 0.3)' : 'rgba(145, 158, 171, 0.2)',
        bgcolor: '#212b36',
        borderRadius: 3,
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: status === 'error' ? 'rgba(255, 86, 48, 0.5)' : 'rgba(0, 230, 138, 0.4)',
        },
      }}
    >
      {status === 'success' ? (
        <Box sx={{ py: 2 }}>
           <CheckIcon sx={{ fontSize: 48, mb: 2, color: '#22c55e' }} />
           <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
             {message}
           </Typography>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleUpload}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: 'rgba(0, 230, 138, 0.12)', 
              mx: 'auto', 
              mb: 2 
            }}>
              <UploadIcon sx={{ color: '#00e68a' }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Upload Knowledge</Typography>
            <Typography variant="body2" sx={{ color: '#919eab' }}>
              PDF, Word, Excel, PowerPoint or Text files
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto', position: 'relative' }}>
            <input 
              type="file" 
              onChange={handleFileChange} 
              disabled={uploading}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <Box sx={{ 
              py: 1.5, 
              px: 3, 
              bgcolor: '#1a222c', 
              border: '1px solid rgba(145, 158, 171, 0.16)', 
              borderRadius: 2,
              color: file ? '#fff' : '#637381',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: 'rgba(145, 158, 171, 0.32)' },
            }}>
              <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                {file ? file.name : "Select a file..."}
              </Typography>
              {file && !uploading && (
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFile(null); }} sx={{ color: '#637381' }}>
                  <XIcon fontSize="inherit" />
                </IconButton>
              )}
            </Box>
          </Box>

          {status === 'error' && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
              {message}
            </Alert>
          )}

          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ px: 5 }}
          >
            {uploading ? 'Processing...' : 'Begin Indexing'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default FileUploader;
