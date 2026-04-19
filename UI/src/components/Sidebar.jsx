import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import logo from '../assets/logos/logo.png';
import {
  Alert,
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
  Button,
  Snackbar,
  listItemTextClasses
} from '@mui/material';
import {
  Description as DocsIcon,
  Notifications as BellIcon,
  Settings as SettingsIcon,
  Hub as IntegrationsIcon,
  Campaign as DemoIcon,
  Add as AddChatIcon,
  ChatBubble as ChatIcon,
  Timer as TempIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { demoModeEnabled } from '../demo/demoConfig';

const drawerWidth = 280;

function Sidebar() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [activeNotification, setActiveNotification] = useState(null);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const res = await axios.get('/api/reminders/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const reminders = res.data || [];
        if (!reminders.length) {
          return;
        }

        setNotificationQueue((current) => {
          const existingIds = new Set([
            ...current.map((item) => item.id),
            ...(activeNotification ? [activeNotification.id] : []),
          ]);
          const next = reminders.filter((item) => !existingIds.has(item.id));
          return next.length ? [...current, ...next] : current;
        });

        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to fetch reminder notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [getToken, activeNotification]);

  useEffect(() => {
    if (!activeNotification && notificationQueue.length > 0) {
      setActiveNotification(notificationQueue[0]);
      setNotificationQueue((current) => current.slice(1));
    }
  }, [notificationQueue, activeNotification]);

  useEffect(() => {
    if (!activeNotification) {
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Reminder: ${activeNotification.title}`, {
        body: activeNotification.description || `Scheduled for ${new Date(activeNotification.remind_at).toLocaleString()}`,
      });
      notification.onclick = () => {
        window.focus();
        navigate('/reminders');
      };
    }
  }, [activeNotification, navigate]);

  const acknowledgeNotification = async () => {
    if (!activeNotification) {
      return;
    }

    try {
      const token = await getToken();
      await axios.post(`/api/reminders/notifications/${activeNotification.id}/ack`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to acknowledge reminder notification', err);
    } finally {
      setActiveNotification(null);
    }
  };

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
    { label: 'Integrations', icon: <IntegrationsIcon />, path: '/integrations' },
    { label: 'Reminders', icon: <BellIcon />, path: '/reminders' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  if (demoModeEnabled) {
    navItems.splice(1, 0, { label: 'Demo Mode', icon: <DemoIcon />, path: '/demo-mode' });
  }

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src={logo} alt="MindSpace" style={{ width: 52, height: 52, objectFit: 'cover', zoom: 1.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
          MindSpace
        </Typography>
      </Box>

      {/* New Chat */}
      <Box sx={{ px: 2, mb: 1, display: 'flex', gap: 1 }}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          fullWidth
          startIcon={<AddChatIcon />}
          sx={{ justifyContent: 'flex-start', px: 2 }}
        >
          New Chat
        </Button>
        <Button
          component={Link}
          to="/chat/temp"
          variant="outlined"
          sx={{ minWidth: '42px', px: 1 }}
          title="Temporary Chat (Not saved)"
        >
          <TempIcon fontSize="small" />
        </Button>
      </Box>

      {/* Middle Section: Chats & Navigation */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mt: 1, overflow: 'hidden' }}>

        {/* Chat Sessions (Max 50% Height, independently scrollable) */}
        <Box sx={{
          maxHeight: '50%',
          overflowY: 'auto',
          flexShrink: 0,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(145, 158, 171, 0.24)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0, 230, 138, 0.48)' }
        }}>
          <List sx={{ px: 1.5, pt: 0 }}>
            {sessions.map((session) => {
              const isActive = location.pathname === `/chat/${session.id}`;
              return (
                <ListItem key={session.id} disablePadding sx={{ mb: 0.2 }}>
                  <ListItemButton
                    component={Link}
                    to={`/chat/${session.id}`}
                    selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      minHeight: '32px',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 230, 138, 0.08)',
                        '& .MuiListItemIcon-root': { color: '#00e68a' },
                        '& .MuiListItemText-primary': { color: '#fff' },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(145, 158, 171, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: '#637381' }}>
                      <ChatIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={session.title}
                      sx={{
                        [`& .${listItemTextClasses.primary}`]: {
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '0.8rem',
                          lineHeight: 1.2,
                          noWrap: true,
                          color: isActive ? '#fff' : '#919eab',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      sx={{
                        p: 0.4,
                        ml: 0.5,
                        opacity: 0,
                        transition: 'opacity 0.15s',
                        '.MuiListItemButton-root:hover &': { opacity: 0.5 },
                        '&:hover': { opacity: 1, color: '#ff5630' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ mx: 2, my: 1.5 }} />

        {/* Navigation */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          <List sx={{ px: 1.5 }}>
            <Typography variant="overline" sx={{ px: 1.5, color: '#637381', fontWeight: 700, fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
              Menu
            </Typography>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0, 230, 138, 0.08)',
                        '& .MuiListItemIcon-root': { color: '#00e68a' },
                        '& .MuiListItemText-primary': { color: '#fff', fontWeight: 600 },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(145, 158, 171, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: '#637381' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.875rem',
                        color: isActive ? '#fff' : '#919eab',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(145, 158, 171, 0.06)',
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
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {user?.fullName || 'User'}
            </Typography>
            <Typography variant="caption" noWrap display="block" sx={{ color: '#637381', fontSize: '0.75rem' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </Typography>
          </Box>
        </Box>
      </Box>
      </Drawer>
      <Snackbar
        open={Boolean(activeNotification)}
        autoHideDuration={8000}
        onClose={acknowledgeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={acknowledgeNotification} severity="info" variant="filled" sx={{ width: '100%' }}>
          <strong>{activeNotification?.title}</strong>
          {activeNotification?.description ? ` — ${activeNotification.description}` : ''}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Sidebar;
