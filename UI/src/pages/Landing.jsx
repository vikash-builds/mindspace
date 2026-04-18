import { Box, Container, Typography, Button, Grid, Paper, AppBar, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import logo from '../assets/logos/logo.png';
import {
  AutoGraph as ChartIcon,
  NotificationsActive as BellIcon,
  DeviceHub as IntegrationIcon,
  Psychology as BrainIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

function Landing() {
  const features = [
    {
      icon: <BrainIcon sx={{ fontSize: 40, color: '#00e68a' }} />,
      title: 'Multimodal RAG Engine',
      description: 'Interact directly with your PDFs, Excel sheets, and Images. Our context-aware intelligence pulls exactly the knowledge you need.'
    },
    {
      icon: <ChartIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      title: 'Profession-Tuned Intelligence',
      description: 'Your workspace dynamically adapts variables like chunk size and temperature based on your role, ensuring hyper-accurate context.'
    },
    {
      icon: <BellIcon sx={{ fontSize: 40, color: '#00b8d9' }} />,
      title: 'Proactive Task Reminders',
      description: 'Never drop a thread. AI schedules and synchronizes alerts dynamically natively right inside your knowledge workspace.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#161c24', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', pt: 2 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img src={logo} alt="MindSpace" style={{ width: 52, height: 52, objectFit: 'cover', zoom: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>
                MindSpace
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button component={Link} to="/login" variant="text" sx={{ color: '#919eab', fontWeight: 600, '&:hover': { color: '#fff', bgcolor: 'transparent' }}}>
                Log In
              </Button>
              <Button component={Link} to="/register" variant="contained" sx={{ bgcolor: 'rgba(0, 230, 138, 0.16)', color: '#00e68a', boxShadow: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: 'rgba(0, 230, 138, 0.24)', boxShadow: 'none' }}}>
                Get Started
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pt: 8, pb: 12 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)', bgcolor: 'rgba(139, 92, 246, 0.08)', mb: 4 }}>
            <IntegrationIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
            <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 700, letterSpacing: '0.08em' }}>
              NEXT GEN KNOWLEDGE WORKSPACE
            </Typography>
          </Box>
          
          <Typography variant="h1" sx={{ 
            fontSize: { xs: '3rem', md: '4.5rem' }, 
            lineHeight: 1.1, 
            mb: 3,
            background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Your Digital Brain, <br />
            <Box component="span" sx={{ 
              background: 'linear-gradient(135deg, #00e68a 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Now Self-Aware.
            </Box>
          </Typography>
          
          <Typography variant="body1" sx={{ fontSize: '1.25rem', color: '#919eab', mb: 6, maxWidth: 640, mx: 'auto', lineHeight: 1.6 }}>
            MindSpace securely unifies your documents, tasks, and data inside a fully private, multimodal intelligent engine that dynamically adapts exactly to how you work.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button component={Link} to="/register" variant="contained" endIcon={<ArrowIcon />} sx={{ bgcolor: '#00e68a', color: '#161c24', fontSize: '1.1rem', fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#00ab66' }}}>
              Start Building Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ bgcolor: '#212b36', py: 10, borderTop: '1px dashed rgba(145, 158, 171, 0.2)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {features.map((feature, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper sx={{ 
                  p: 4, 
                  height: '100%', 
                  bgcolor: '#161c24', 
                  borderRadius: 3,
                  border: '1px solid rgba(145, 158, 171, 0.12)',
                  transition: 'transform 0.3s, border-color 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(0, 230, 138, 0.4)'
                  }
                }}>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, color: '#fff' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#919eab', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid rgba(145, 158, 171, 0.1)' }}>
        <Typography variant="body2" sx={{ color: '#637381' }}>
          © {new Date().getFullYear()} MindSpace Platform. All rights reserved.
        </Typography>
      </Box>

    </Box>
  );
}

export default Landing;
