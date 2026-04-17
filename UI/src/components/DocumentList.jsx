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
    if (t === 'pdf') return <PdfIcon sx={{ color: '#ff5630' }} />;
    if (t === 'xlsx' || t === 'xls') return <ExcelIcon sx={{ color: '#22c55e' }} />;
    if (t === 'pptx' || t === 'ppt') return <PptIcon sx={{ color: '#ffab00' }} />;
    if (t === 'docx' || t === 'doc') return <WordIcon sx={{ color: '#00b8d9' }} />;
    return <FileIcon sx={{ color: '#637381' }} />;
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ overflow: 'hidden' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Document</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Chunks</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#2a3544', color: 'inherit' }}>
                    {getFileIcon(doc.file_type)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.filename}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#637381' }}>{doc.file_type}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                {doc.status === 'ready' ? (
                  <Chip size="small" icon={<CheckIcon />} label="Ready" sx={{ fontWeight: 600, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#77ed8b', '& .MuiChip-icon': { color: '#22c55e' } }} />
                ) : doc.status === 'processing' ? (
                  <Chip size="small" icon={<ClockIcon />} label="Analyzing..." sx={{ fontWeight: 600, bgcolor: 'rgba(0, 184, 217, 0.12)', color: '#61f3f3', '& .MuiChip-icon': { color: '#00b8d9' } }} />
                ) : (
                  <Chip size="small" icon={<AlertIcon />} label="Error" sx={{ fontWeight: 600, bgcolor: 'rgba(255, 86, 48, 0.12)', color: '#ffac82', '& .MuiChip-icon': { color: '#ff5630' } }} />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.chunk_count || 0}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: '#919eab' }}>
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleDelete(doc.id)} sx={{ color: '#637381', '&:hover': { color: '#ff5630', bgcolor: 'rgba(255, 86, 48, 0.08)' } }}>
                  <TrashIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
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
  );
}

export default DocumentList;
