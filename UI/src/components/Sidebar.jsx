import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider,
  IconButton,
  Button
} from '@mui/material';
import { 
  Description as DocsIcon, 
  Notifications as BellIcon, 
  Psychology as BrainIcon,
  Settings as SettingsIcon,
  Add as AddChatIcon,
  ChatBubble as ChatIcon,
  Timer as TempIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const drawerWidth = 280;

function Sidebar() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch chat sessions', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Poll for new sessions created (e.g. from ChatWindow)
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteSession = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(`/api/chat/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSessions();
      if (location.pathname === `/chat/${id}`) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Documents', icon: <DocsIcon />, path: '/documents' },
    { label: 'Reminders', icon: <BellIcon />, path: '/reminders' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          bgcolor: 'primary.main', 
          p: 1, 
          borderRadius: 1, 
          display: 'flex', 
          color: '#fff' 
        }}>
          <BrainIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.025em' }}>
          MindSpace
        </Typography>
      </Box>

      <Box sx={{ px: 2, mb: 1, display: 'flex', gap: 1 }}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          fullWidth
          startIcon={<AddChatIcon />}
          sx={{ borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
        >
          New Chat
        </Button>
        <Button
          component={Link}
          to="/chat/temp"
          variant="outlined"
          sx={{ minWidth: '40px', px: 1, borderRadius: 2 }}
          title="Temporary Chat (Not saved)"
        >
          <TempIcon />
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ px: 2, pt: 0 }}>
          {sessions.map((session) => {
            const isActive = location.pathname === `/chat/${session.id}`;
            return (
              <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={`/chat/${session.id}`}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: '#eef2ff',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ChatIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={session.title} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 600 : 500, 
                      fontSize: '0.85rem',
                      noWrap: true 
                    }} 
                  />
                  <IconButton size="small" onClick={(e) => handleDeleteSession(e, session.id)} sx={{ p: 0.5, ml: 1, opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1, mx: 2 }} />

        <List sx={{ px: 2 }}>
          <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 700 }}>Menu</Typography>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: '#eef2ff',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 1, 
          borderRadius: 2,
          '&:hover': { bgcolor: 'action.hover' } 
        }}>
          <UserButton 
            afterSignOutUrl="/login" 
            appearance={{
              elements: {
                userButtonPopoverActionButton__manageAccount: { display: 'none' }
              }
            }}
          />
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {user?.fullName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.primaryEmailAddress?.emailAddress}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
