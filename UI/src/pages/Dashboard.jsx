import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { Box, Typography } from '@mui/material';

function Dashboard() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          px: 3, 
          borderBottom: '1px solid #e5e7eb',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Assistant Chat</Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ChatWindow />
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
