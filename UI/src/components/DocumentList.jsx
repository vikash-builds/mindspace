import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  IconButton, 
  Chip,
  Avatar
} from '@mui/material';
import { 
  Description as FileIcon, 
  Delete as TrashIcon, 
  CheckCircle as CheckIcon, 
  Pending as ClockIcon, 
  Error as AlertIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Slideshow as PptIcon,
  Article as WordIcon
} from '@mui/icons-material';

function DocumentList({ documents, onDeleted }) {
  const { getToken } = useAuth();

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onDeleted) onDeleted();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const getFileIcon = (type) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <PdfIcon sx={{ color: '#ef4444' }} />;
    if (t === 'xlsx' || t === 'xls') return <ExcelIcon sx={{ color: '#166534' }} />;
    if (t === 'pptx' || t === 'ppt') return <PptIcon sx={{ color: '#f97316' }} />;
    if (t === 'docx' || t === 'doc') return <WordIcon sx={{ color: '#2563eb' }} />;
    return <FileIcon sx={{ color: '#64748b' }} />;
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Document</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Chunks</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Date</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar variant="rounded" sx={{ bgcolor: 'rgba(0,0,0,0.04)', color: 'inherit' }}>
                    {getFileIcon(doc.file_type)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.filename}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{doc.file_type}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                {doc.status === 'ready' ? (
                  <Chip size="small" icon={<CheckIcon />} label="Ready" color="success" variant="soft" sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }} />
                ) : doc.status === 'processing' ? (
                  <Chip size="small" icon={<ClockIcon />} label="Analyzing..." color="info" sx={{ fontWeight: 700, bgcolor: '#dbeafe', color: '#1e40af' }} />
                ) : (
                  <Chip size="small" icon={<AlertIcon />} label="Error" color="error" sx={{ fontWeight: 700, bgcolor: '#fee2e2', color: '#991b1b' }} />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.chunk_count || 0}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                  <TrashIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <Box sx={{ color: 'text.disabled' }}>
                  <FileIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2">No documents found in your library.</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DocumentList;
