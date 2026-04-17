import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  IconButton,
  Card,
  CardContent,
  Chip,
  Divider,
  Collapse
} from '@mui/material';
import { 
  Notifications as BellIcon, 
  Add as PlusIcon, 
  Delete as TrashIcon, 
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as CircleIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', description: '', remind_at: '', recurrence: '', email_notify: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const { getToken } = useAuth();

  const fetchData = async () => {
    try {
      const token = await getToken();
      const r = await axios.get('/api/reminders', { headers: { Authorization: `Bearer ${token}` } });
      const c = await axios.get('/api/reminders/checklists', { headers: { Authorization: `Bearer ${token}` } });
      setReminders(r.data);
      setChecklists(c.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post('/api/reminders', newReminder, { headers: { Authorization: `Bearer ${token}` } });
      setNewReminder({ title: '', description: '', remind_at: '', recurrence: '', email_notify: false });
      setShowAddForm(false);
      fetchData();
    } catch (err) { alert('Error adding reminder'); }
  };

  const deleteReminder = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`/api/reminders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Error deleting'); }
  };

  const toggleChecklistItem = async (id, isDone) => {
    try {
      const token = await getToken();
      await axios.patch(`/api/reminders/checklists/items/${id}`, { is_done: !isDone }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Error updating item'); }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3, 
          borderBottom: '1px dashed rgba(145, 158, 171, 0.2)',
          bgcolor: '#212b36',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Reminders</Typography>
          <Button 
            variant="contained" 
            startIcon={<PlusIcon />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'New Reminder'}
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            
            {/* Add Form */}
            <Collapse in={showAddForm}>
              <Paper sx={{ p: 3.5, mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Create New Reminder</Typography>
                <Box component="form" onSubmit={handleAddReminder}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="What should I remind you about?" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} label="Additional notes (optional)" value={newReminder.description} onChange={e => setNewReminder({...newReminder, description: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth type="datetime-local" label="When" InputLabelProps={{ shrink: true }} value={newReminder.remind_at} onChange={e => setNewReminder({...newReminder, remind_at: e.target.value})} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Select fullWidth value={newReminder.recurrence} onChange={e => setNewReminder({...newReminder, recurrence: e.target.value})} displayEmpty>
                        <MenuItem value="">No Recurrence</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel 
                        control={<Checkbox checked={newReminder.email_notify} onChange={e => setNewReminder({...newReminder, email_notify: e.target.checked})} />}
                        label="Send me an email notification"
                        sx={{ color: '#919eab' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" size="large" sx={{ px: 4 }}>Save Reminder</Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Collapse>

            <Grid container spacing={3.5}>
              {/* Upcoming Alerts */}
              <Grid item xs={12} lg={7}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2, display: 'block' }}>
                  Upcoming Alerts
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {reminders.map(r => (
                    <Card key={r.id} sx={{ '&:hover': { borderColor: 'rgba(0, 230, 138, 0.3)' } }}>
                      <CardContent sx={{ p: '16px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{r.title}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#919eab' }}>{r.description}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                              <Chip 
                                size="small" 
                                label={new Date(r.remind_at).toLocaleString()} 
                                icon={<CalendarIcon fontSize="small" />} 
                                sx={{ fontWeight: 600, bgcolor: 'rgba(0, 230, 138, 0.08)', color: '#5be49b', '& .MuiChip-icon': { color: '#00e68a' } }} 
                              />
                              {r.recurrence && (
                                <Chip size="small" label={r.recurrence} variant="outlined" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          </Box>
                          <IconButton size="small" onClick={() => deleteReminder(r.id)} sx={{ color: '#637381', opacity: 0.6, '&:hover': { opacity: 1, color: '#ff5630' } }}>
                            <TrashIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {reminders.length === 0 && (
                    <Paper sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" sx={{ color: '#637381' }}>No upcoming reminders.</Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>

              {/* Checklists */}
              <Grid item xs={12} lg={5}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2, display: 'block' }}>
                  Checklists
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {checklists.map(c => (
                    <Paper key={c.id} sx={{ p: 2.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>{c.title}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {c.items.map(item => (
                          <Box 
                            key={item.id} 
                            onClick={() => toggleChecklistItem(item.id, item.is_done)}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5, 
                              cursor: 'pointer', 
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              transition: 'background-color 0.15s',
                              '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.06)' },
                            }}
                          >
                            {item.is_done 
                              ? <CheckIcon fontSize="small" sx={{ color: '#00e68a' }} /> 
                              : <CircleIcon sx={{ color: 'rgba(145, 158, 171, 0.3)' }} fontSize="small" />
                            }
                            <Typography variant="body2" sx={{ 
                              textDecoration: item.is_done ? 'line-through' : 'none',
                              color: item.is_done ? '#637381' : '#fff',
                              fontWeight: 500
                            }}>
                              {item.item_text}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                  {checklists.length === 0 && (
                    <Paper sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" sx={{ color: '#637381' }}>No checklists yet.</Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Reminders;
