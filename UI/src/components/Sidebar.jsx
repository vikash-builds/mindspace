import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Avatar,
  Divider
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Description as DocsIcon, 
  Notifications as BellIcon, 
  Psychology as BrainIcon 
} from '@mui/icons-material';

const drawerWidth = 280;

function Sidebar() {
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { label: 'Chat', icon: <ChatIcon />, path: '/' },
    { label: 'Documents', icon: <DocsIcon />, path: '/documents' },
    { label: 'Reminders', icon: <BellIcon />, path: '/reminders' },
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
          backgroundColor: '#fff',
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
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          MindSpace
        </Typography>
      </Box>

      <List sx={{ px: 2, flexGrow: 1 }}>
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

      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ 
          display: 'flex', 
          itemsCenter: 'center', 
          gap: 2, 
          p: 1, 
          borderRadius: 2,
          '&:hover': { bgcolor: 'action.hover' } 
        }}>
          <UserButton afterSignOutUrl="/login" />
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
