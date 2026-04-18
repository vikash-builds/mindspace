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
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');
  const { getToken } = useAuth();

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) {
      setFiles(selected);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return;

    setUploading(true);
    let successCount = 0;

    try {
      const token = await getToken();
      
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post('/api/documents/upload', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}` 
          }
        }).then(() => successCount++);
      });

      await Promise.all(uploadPromises);

      setStatus('success');
      setMessage(`Successfully uploaded ${successCount} file(s)`);
      setFiles([]);
      e.target.reset();
      if (onUploadSuccess) setTimeout(onUploadSuccess, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || `Upload failed. ${successCount} of ${files.length} uploaded successfully.`);
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
              PDF, Word, Excel, PowerPoint, Text, or Images (JPG, PNG, WEBP)
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto', position: 'relative' }}>
            <input 
              type="file" 
              multiple
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
              color: files.length ? '#fff' : '#637381',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: 'rgba(145, 158, 171, 0.32)' },
            }}>
              <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                {files.length > 0 ? (files.length === 1 ? files[0].name : `${files.length} files selected`) : "Select files..."}
              </Typography>
              {files.length > 0 && !uploading && (
                <IconButton size="small" onClick={(e) => { e.preventDefault(); setFiles([]); e.stopPropagation(); }} sx={{ color: '#637381', zIndex: 1, position: 'relative' }}>
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
            disabled={files.length === 0 || uploading}
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
