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
        <Box sx={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3, 
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#fff',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Reminders</Typography>
          <Button 
            variant="contained" 
            startIcon={<PlusIcon />}
            onClick={() => setShowAddForm(!showAddForm)}
            sx={{ borderRadius: 2 }}
          >
            {showAddForm ? 'Cancel' : 'New Reminder'}
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#f9fafb' }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            
            <Collapse in={showAddForm}>
              <Paper variant="outlined" sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: '#fff' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Create New Reminder</Typography>
                <Box component="form" onSubmit={handleAddReminder}>
                  <Grid container spacing={3}>
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
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" size="large" sx={{ px: 4 }}>Save Reminder</Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Collapse>

            <Grid container spacing={4}>
              <Grid item xs={12} lg={7}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, letterSpacing: 1 }}>Upcoming Alerts</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reminders.map(r => (
                    <Card key={r.id} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, '&:hover': { borderColor: 'primary.light' } }}>
                      <CardContent sx={{ p: '16px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>{r.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{r.description}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                              <Chip size="small" label={new Date(r.remind_at).toLocaleString()} icon={<CalendarIcon fontSize="small" />} sx={{ fontWeight: 600, bgcolor: '#eef2ff', color: 'primary.main' }} />
                              {r.recurrence && <Chip size="small" label={r.recurrence} variant="outlined" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem' }} />}
                            </Box>
                          </Box>
                          <IconButton color="error" size="small" onClick={() => deleteReminder(r.id)} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                            <TrashIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {reminders.length === 0 && (
                    <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.disabled">No upcoming reminders.</Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, letterSpacing: 1 }}>Checklists</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {checklists.map(c => (
                    <Paper key={c.id} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, mb: 2 }}>{c.title}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {c.items.map(item => (
                          <Box 
                            key={item.id} 
                            onClick={() => toggleChecklistItem(item.id, item.is_done)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover color': 'primary.main' }}
                          >
                            {item.is_done ? <CheckIcon color="primary" fontSize="small" /> : <CircleIcon sx={{ color: 'divider' }} fontSize="small" />}
                            <Typography variant="body2" sx={{ 
                              textDecoration: item.is_done ? 'line-through' : 'none',
                              color: item.is_done ? 'text.disabled' : 'text.primary',
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
                    <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.disabled">No checklists yet.</Typography>
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
