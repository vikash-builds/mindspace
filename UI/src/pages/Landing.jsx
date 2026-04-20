import { Box, Container, Typography, Button, Grid, Paper, AppBar, Toolbar, Stack, Chip } from '@mui/material';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import logo from '../assets/logos/logo.png';
import {
  ArrowForward as ArrowIcon,
  AutoGraph as ChartIcon,
  Checklist as ChecklistIcon,
  DeviceHub as IntegrationIcon,
  Description as DocsIcon,
  NotificationsActive as BellIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';

function Landing() {
  const features = [
    {
      icon: <DocsIcon sx={{ fontSize: 34, color: '#00e68a' }} />,
      title: 'Grounded Over Real Work',
      description: 'Upload policies, decks, spreadsheets, handbooks, and image-based documents, then answer from your own source material with citations.',
    },
    {
      icon: <ChecklistIcon sx={{ fontSize: 34, color: '#ffab00' }} />,
      title: 'From Answers To Actions',
      description: 'Convert knowledge into reminders, tasks, and checklists inside the same workspace instead of losing momentum across tools.',
    },
    {
      icon: <IntegrationIcon sx={{ fontSize: 34, color: '#8b5cf6' }} />,
      title: 'Built For Connected Work',
      description: 'Bring in Google Drive content, inspect Gmail messages, and turn email context into drafts and follow-up workflows.',
    },
  ];

  const demoHighlights = [
    'Policy Q&A with citations',
    'Onboarding and offboarding checklists',
    'Email draft generation',
    'Reminder creation from chat',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#161c24', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', pt: 2 }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img src={logo} alt="MindSpace" style={{ width: 52, height: 52, objectFit: 'cover', zoom: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                MindSpace
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <SignInButton mode="redirect">
                <Button variant="text" sx={{ color: '#919eab', '&:hover': { color: '#fff', bgcolor: 'transparent' } }}>
                  Log In
                </Button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <Button variant="contained" sx={{ bgcolor: '#00e68a', color: '#161c24', '&:hover': { bgcolor: '#00ab66' } }}>
                  Launch Workspace
                </Button>
              </SignUpButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ flexGrow: 1, pt: { xs: 6, md: 9 }, pb: { xs: 7, md: 10 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} lg={7}>
              <Stack spacing={3}>
                <Chip
                  icon={<BrainIcon />}
                  label="AI Knowledge Workspace For Execution"
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'rgba(139, 92, 246, 0.14)',
                    color: '#c4b5fd',
                    border: '1px solid rgba(139, 92, 246, 0.28)',
                    '& .MuiChip-icon': { color: '#a78bfa' },
                  }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: '3.2rem', md: '5.1rem' }, lineHeight: 0.98, maxWidth: 900 }}>
                  Turn company knowledge into
                  <Box component="span" sx={{ display: 'block', background: 'linear-gradient(135deg, #00e68a 0%, #00b8d9 45%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    answers, actions, and momentum.
                  </Box>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.15rem', maxWidth: 700, color: '#b7c0cd' }}>
                  MindSpace combines grounded document chat, reminders, checklists, Google integrations, and action extraction so teams can move from buried information to visible execution in one place.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <SignUpButton mode="redirect">
                    <Button variant="contained" size="large" endIcon={<ArrowIcon />} sx={{ px: 4, py: 1.5, bgcolor: '#00e68a', color: '#161c24', '&:hover': { bgcolor: '#00ab66' } }}>
                      Start Building
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="redirect">
                    <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5 }}>
                      Open Existing Workspace
                    </Button>
                  </SignInButton>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {demoHighlights.map((item) => (
                    <Chip key={item} label={item} sx={{ bgcolor: 'rgba(145, 158, 171, 0.1)', color: '#fff' }} />
                  ))}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(180deg, rgba(33, 43, 54, 0.96) 0%, rgba(22, 28, 36, 0.96) 100%)',
                  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                    Live Demo Story
                  </Typography>
                  <Paper sx={{ p: 2.25, bgcolor: '#1a222c' }}>
                    <Typography variant="subtitle2" sx={{ color: '#00e68a', fontWeight: 800, mb: 0.5 }}>
                      HR Operations Copilot
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                      Upload employee policies, onboarding docs, offboarding SOPs, and template emails. Then ask operational questions, generate follow-up actions, and draft HR communication instantly.
                    </Typography>
                  </Paper>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c', height: '100%' }}>
                        <ChartIcon sx={{ color: '#00b8d9', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Grounded Retrieval</Typography>
                        <Typography variant="caption" sx={{ color: '#919eab' }}>Cited answers from uploaded docs</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c', height: '100%' }}>
                        <BellIcon sx={{ color: '#ffab00', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Follow-Up Ready</Typography>
                        <Typography variant="caption" sx={{ color: '#919eab' }}>Reminders and checklists from chat</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 9, borderTop: '1px dashed rgba(145, 158, 171, 0.2)', bgcolor: '#1a222c' }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <Paper sx={{ p: 3.5, height: '100%', bgcolor: '#161c24', borderColor: 'rgba(145, 158, 171, 0.16)' }}>
                  <Box sx={{ mb: 2.5 }}>{feature.icon}</Box>
                  <Typography variant="h5" sx={{ mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#919eab' }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid rgba(145, 158, 171, 0.08)' }}>
        <Typography variant="body2" sx={{ color: '#637381' }}>
          © {new Date().getFullYear()} MindSpace. Built for knowledge that needs to turn into action.
        </Typography>
      </Box>
    </Box>
  );
}

export default Landing;
