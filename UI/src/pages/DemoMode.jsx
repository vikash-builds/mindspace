import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as SparklesIcon,
  Description as DocsIcon,
  Forum as ChatIcon,
  RocketLaunch as LaunchIcon,
  TaskAlt as CheckIcon,
  CloudDone as ReadyIcon,
} from '@mui/icons-material';

import Sidebar from '../components/Sidebar';
import { getActiveDemoConfig } from '../demo/demoConfig';

function DemoMode() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const config = useMemo(() => getActiveDemoConfig(), []);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  useEffect(() => {
    let intervalId;

    const fetchDocuments = async () => {
      try {
        const token = await getToken();
        const response = await axios.get('/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(response.data || []);
      } catch (error) {
        console.error('Failed to fetch demo documents', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
    intervalId = setInterval(fetchDocuments, 5000);

    return () => clearInterval(intervalId);
  }, [getToken]);

  const progress = useMemo(() => {
    const uploaded = config.targetFiles.filter((targetFile) => (
      documents.some((document) => document.filename === targetFile || document.source_name === targetFile)
    ));
    const ready = uploaded.filter((targetFile) => (
      documents.some((document) => (
        (document.filename === targetFile || document.source_name === targetFile) && document.status === 'ready'
      ))
    ));

    return {
      uploadedCount: uploaded.length,
      readyCount: ready.length,
      uploadedFiles: uploaded,
      readyFiles: ready,
    };
  }, [config.targetFiles, documents]);

  const openPromptInChat = (prompt) => {
    navigate(`/?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, borderBottom: '1px dashed rgba(145, 158, 171, 0.2)', bgcolor: '#212b36', zIndex: 10 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Demo Mode</Typography>
          <Chip icon={<SparklesIcon />} label="Judge-Ready Storyline" sx={{ bgcolor: 'rgba(0, 230, 138, 0.12)', color: '#00e68a', '& .MuiChip-icon': { color: '#00e68a' } }} />
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                mb: 3,
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(0, 230, 138, 0.14) 0%, rgba(139, 92, 246, 0.14) 100%)',
              }}
            >
              <Box sx={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 35%)',
                pointerEvents: 'none',
              }} />
              <Stack spacing={2} sx={{ position: 'relative' }}>
                <Chip label="HR Showcase" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(22, 28, 36, 0.55)', color: '#fff' }} />
                <Typography variant="h3" sx={{ maxWidth: 700 }}>
                  {config.title}
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 720, color: '#dfe3e8' }}>
                  {config.subtitle}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button variant="contained" startIcon={<DocsIcon />} onClick={() => navigate('/documents')}>
                    Upload Demo Files
                  </Button>
                  <Button variant="outlined" startIcon={<ChatIcon />} onClick={() => openPromptInChat(config.prompts[0])}>
                    Start Guided Demo
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={5}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                    Demo Inputs
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                    Files to feed before the pitch
                  </Typography>
                  <List disablePadding>
                    {config.targetFiles.map((item) => (
                      <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start', py: 0.8 }}>
                        <CheckIcon sx={{ color: '#00e68a', fontSize: 18, mr: 1.5, mt: 0.4 }} />
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" sx={{ mt: 2.5, color: '#919eab' }}>
                    When you share the real HR files, we can tune the prompt pack and narrative around the exact clauses, templates, and workflows inside them.
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                    Judge Flow
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                    Strongest live sequence
                  </Typography>
                  <Stack spacing={2}>
                    {config.judgeFlow.map((item, index) => (
                      <Paper key={item.step} sx={{ p: 2.25, bgcolor: '#1a222c' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.6 }}>
                          {index + 1}. {item.step}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#919eab' }}>
                          {item.detail}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                    Prompt Pack
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                    Click a prompt to jump straight into chat
                  </Typography>
                  <Stack spacing={1.5}>
                    {config.prompts.map((prompt) => (
                      <Paper key={prompt} sx={{ p: 2, bgcolor: '#1a222c', display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ pr: 2 }}>{prompt}</Typography>
                        <Button variant="outlined" size="small" onClick={() => openPromptInChat(prompt)}>
                          Use Prompt
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Stack spacing={3}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                      Demo Readiness
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                      Documents Uploaded / Ready
                    </Typography>

                    {loadingDocuments ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#919eab' }}>
                        <CircularProgress size={18} />
                        <Typography variant="body2">Checking document library...</Typography>
                      </Box>
                    ) : (
                      <>
                        <Stack direction="row" spacing={1.2} sx={{ mb: 2 }}>
                          <Chip label={`${progress.uploadedCount}/${config.targetFiles.length} uploaded`} sx={{ bgcolor: 'rgba(0, 184, 217, 0.12)', color: '#61f3f3' }} />
                          <Chip icon={<ReadyIcon />} label={`${progress.readyCount}/${config.targetFiles.length} ready`} sx={{ bgcolor: 'rgba(0, 230, 138, 0.12)', color: '#00e68a', '& .MuiChip-icon': { color: '#00e68a' } }} />
                        </Stack>

                        {progress.readyCount === config.targetFiles.length ? (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            All target demo documents are uploaded and retrieval-ready.
                          </Alert>
                        ) : (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Upload the missing files in Documents and wait for them to reach <strong>Ready</strong> before the live demo.
                          </Alert>
                        )}

                        <Stack spacing={1}>
                          {config.targetFiles.map((fileName) => {
                            const document = documents.find((item) => item.filename === fileName || item.source_name === fileName);
                            const status = document?.status || 'missing';
                            const color = status === 'ready' ? '#00e68a' : status === 'processing' ? '#00b8d9' : '#919eab';
                            const label = status === 'missing' ? 'Not uploaded' : status === 'ready' ? 'Ready' : status === 'error' ? 'Error' : 'Processing';

                            return (
                              <Paper key={fileName} sx={{ p: 1.5, bgcolor: '#1a222c', display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                                  {fileName}
                                </Typography>
                                <Chip size="small" label={label} sx={{ bgcolor: `${color}1f`, color }} />
                              </Paper>
                            );
                          })}
                        </Stack>
                      </>
                    )}
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                      Wow Factor
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                      Moments to emphasize live
                    </Typography>
                    <Stack spacing={1.2}>
                      {config.wowMoments.map((moment) => (
                        <Chip
                          key={moment}
                          label={moment}
                          sx={{
                            height: 'auto',
                            justifyContent: 'flex-start',
                            py: 1.2,
                            px: 1,
                            bgcolor: 'rgba(145, 158, 171, 0.08)',
                            color: '#fff',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              display: 'block',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="overline" sx={{ color: '#637381', fontWeight: 700, letterSpacing: '0.08em' }}>
                      Judge Pitch
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, mb: 2, fontWeight: 700 }}>
                      Short GyanMatrix-branded pitch script
                    </Typography>
                    <Stack spacing={1.5}>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c' }}>
                        <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                          "This is <strong>MindSpace for GyanMatrix</strong>, an AI workspace that turns company policies and operational knowledge into grounded answers and real follow-through."
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c' }}>
                        <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                          "Instead of searching through separate PDFs for leave rules, WFH protocols, IT policy, and HR templates, teams can ask one question and get a cited answer from the actual company documents."
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c' }}>
                        <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                          "What makes MindSpace powerful is that it does not stop at retrieval. The assistant can immediately convert policy knowledge into reminders, checklists, and next-step actions inside the same workspace."
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: '#1a222c' }}>
                        <Typography variant="body2" sx={{ color: '#dfe3e8' }}>
                          "For GyanMatrix, that means faster HR operations, more consistent compliance, and less manual back-and-forth across documents, chat, and follow-up systems."
                        </Typography>
                      </Paper>
                      {config.talkTrack.map((line) => (
                        <Typography key={line} variant="body2" sx={{ color: '#dfe3e8' }}>
                          {line}
                        </Typography>
                      ))}
                    </Stack>
                    <Button sx={{ mt: 2.5 }} variant="contained" startIcon={<LaunchIcon />} onClick={() => navigate('/integrations')}>
                      Show Integrations Next
                    </Button>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default DemoMode;
