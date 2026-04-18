import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Checkbox,
} from '@mui/material';
import {
  Add as PlusIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Delete as TrashIcon,
  History as HistoryIcon,
  RadioButtonUnchecked as CircleIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';

import Sidebar from '../components/Sidebar';

const emptyReminder = {
  title: '',
  description: '',
  remind_at: '',
  recurrence: '',
  email_notify: false,
  priority: 'medium',
  category: 'general',
  notes: '',
};

const emptyChecklist = {
  title: '',
  description: '',
  due_date: '',
  items: [{ item_text: '', priority: 'medium' }],
};

function isChecklistComplete(checklist) {
  return checklist.status === 'completed' || (checklist.items?.length > 0 && checklist.items.every((item) => item.is_done));
}

function Reminders() {
  const { getToken } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [newReminder, setNewReminder] = useState(emptyReminder);
  const [newChecklist, setNewChecklist] = useState(emptyChecklist);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [viewMode, setViewMode] = useState('active');

  const fetchData = async () => {
    try {
      const token = await getToken();
      const [reminderResponse, checklistResponse] = await Promise.all([
        axios.get('/api/reminders', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/reminders/checklists', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setReminders(reminderResponse.data);
      setChecklists(checklistResponse.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const visibleReminders = useMemo(
    () => reminders.filter((reminder) => (viewMode === 'history'
      ? ['completed', 'fired'].includes(reminder.status)
      : !['completed', 'fired'].includes(reminder.status))),
    [reminders, viewMode],
  );

  const visibleChecklists = useMemo(
    () => checklists.filter((checklist) => (viewMode === 'history' ? isChecklistComplete(checklist) : !isChecklistComplete(checklist))),
    [checklists, viewMode],
  );

  const handleAddReminder = async (event) => {
    event.preventDefault();
    try {
      const token = await getToken();
      await axios.post('/api/reminders', newReminder, { headers: { Authorization: `Bearer ${token}` } });
      setNewReminder(emptyReminder);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Error adding reminder');
    }
  };

  const handleAddChecklist = async (event) => {
    event.preventDefault();
    try {
      const token = await getToken();
      await axios.post('/api/reminders/checklists', newChecklist, { headers: { Authorization: `Bearer ${token}` } });
      setNewChecklist(emptyChecklist);
      setShowChecklistForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating checklist');
    }
  };

  const updateReminderStatus = async (reminder, status) => {
    try {
      const token = await getToken();
      await axios.patch(`/api/reminders/${reminder.id}`, { ...reminder, status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Error updating reminder');
    }
  };

  const deleteReminder = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`/api/reminders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Error deleting reminder');
    }
  };

  const deleteChecklist = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`/api/reminders/checklists/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Error deleting checklist');
    }
  };

  const toggleChecklistItem = async (id, item) => {
    try {
      const token = await getToken();
      await axios.patch(`/api/reminders/checklists/items/${id}`, { ...item, is_done: !item.is_done }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Error updating item');
    }
  };

  const restoreChecklist = async (checklist) => {
    try {
      const token = await getToken();
      if (checklist.items?.length > 0) {
        await Promise.all(checklist.items.map((item) => (
          item.is_done
            ? axios.patch(`/api/reminders/checklists/items/${item.id}`, { ...item, is_done: false }, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve()
        )));
      }
      await axios.patch(`/api/reminders/checklists/${checklist.id}`, { ...checklist, status: 'active' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      alert('Error restoring checklist');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, borderBottom: '1px dashed rgba(145, 158, 171, 0.2)', bgcolor: '#212b36', zIndex: 10 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Reminders & Checklists</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_, value) => value && setViewMode(value)}
              sx={{ mr: 1 }}
            >
              <ToggleButton value="active">Active</ToggleButton>
              <ToggleButton value="history"><HistoryIcon sx={{ fontSize: 16, mr: 0.75 }} />History</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" startIcon={<PlusIcon />} onClick={() => setShowChecklistForm((current) => !current)}>
              {showChecklistForm ? 'Close Checklist' : 'New Checklist'}
            </Button>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setShowAddForm((current) => !current)}>
              {showAddForm ? 'Cancel' : 'New Reminder'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5, bgcolor: '#161c24' }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Collapse in={showAddForm}>
              <Paper sx={{ p: 3.5, mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Create New Reminder</Typography>
                <Box component="form" onSubmit={handleAddReminder} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 2.5 }}>
                  <TextField fullWidth label="Title" value={newReminder.title} onChange={(event) => setNewReminder({ ...newReminder, title: event.target.value })} required />
                  <TextField select fullWidth label="Priority" value={newReminder.priority} onChange={(event) => setNewReminder({ ...newReminder, priority: event.target.value })}>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </TextField>
                  <TextField select fullWidth label="Category" value={newReminder.category} onChange={(event) => setNewReminder({ ...newReminder, category: event.target.value })}>
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="follow-up">Follow-up</MenuItem>
                    <MenuItem value="deadline">Deadline</MenuItem>
                    <MenuItem value="imported">Imported</MenuItem>
                  </TextField>
                  <TextField fullWidth type="datetime-local" label="When" InputLabelProps={{ shrink: true }} value={newReminder.remind_at} onChange={(event) => setNewReminder({ ...newReminder, remind_at: event.target.value })} required />
                  <TextField sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }} fullWidth multiline rows={2} label="Description" value={newReminder.description} onChange={(event) => setNewReminder({ ...newReminder, description: event.target.value })} />
                  <TextField select fullWidth label="Recurrence" value={newReminder.recurrence} onChange={(event) => setNewReminder({ ...newReminder, recurrence: event.target.value })}>
                    <MenuItem value="">No Recurrence</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                  </TextField>
                  <TextField sx={{ gridColumn: { xs: 'auto', md: 'span 2' } }} fullWidth multiline rows={2} label="Notes" value={newReminder.notes} onChange={(event) => setNewReminder({ ...newReminder, notes: event.target.value })} />
                  <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={<Checkbox checked={newReminder.email_notify} onChange={(event) => setNewReminder({ ...newReminder, email_notify: event.target.checked })} />}
                      label="Send me an email notification"
                      sx={{ color: '#919eab' }}
                    />
                    <Button type="submit" variant="contained" size="large" sx={{ px: 4 }}>Save Reminder</Button>
                  </Box>
                </Box>
              </Paper>
            </Collapse>

            <Collapse in={showChecklistForm}>
              <Paper sx={{ p: 3.5, mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Create Checklist</Typography>
                <Box component="form" onSubmit={handleAddChecklist} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
                    <TextField fullWidth label="Checklist Title" value={newChecklist.title} onChange={(event) => setNewChecklist({ ...newChecklist, title: event.target.value })} required />
                    <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={newChecklist.due_date} onChange={(event) => setNewChecklist({ ...newChecklist, due_date: event.target.value })} />
                  </Box>
                  <TextField fullWidth multiline rows={2} label="Description" value={newChecklist.description} onChange={(event) => setNewChecklist({ ...newChecklist, description: event.target.value })} />
                  {newChecklist.items.map((item, index) => (
                    <Box key={`checklist-item-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                      <TextField
                        fullWidth
                        label={`Item ${index + 1}`}
                        value={item.item_text}
                        onChange={(event) => {
                          const nextItems = [...newChecklist.items];
                          nextItems[index] = { ...nextItems[index], item_text: event.target.value };
                          setNewChecklist({ ...newChecklist, items: nextItems });
                        }}
                      />
                      <TextField
                        select
                        fullWidth
                        label="Priority"
                        value={item.priority}
                        onChange={(event) => {
                          const nextItems = [...newChecklist.items];
                          nextItems[index] = { ...nextItems[index], priority: event.target.value };
                          setNewChecklist({ ...newChecklist, items: nextItems });
                        }}
                      >
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </TextField>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button type="button" variant="outlined" onClick={() => setNewChecklist({ ...newChecklist, items: [...newChecklist.items, { item_text: '', priority: 'medium' }] })}>
                      Add Item
                    </Button>
                    <Button type="submit" variant="contained" size="large">Save Checklist</Button>
                  </Box>
                </Box>
              </Paper>
            </Collapse>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3.5 }}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2, display: 'block' }}>
                  {viewMode === 'history' ? 'Reminder History' : 'Upcoming Alerts'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {visibleReminders.map((reminder) => (
                    <Card key={reminder.id} sx={{ '&:hover': { borderColor: 'rgba(0, 230, 138, 0.3)' } }}>
                      <CardContent sx={{ p: '16px !important' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{reminder.title}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#919eab' }}>{reminder.description}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                              <Chip size="small" label={new Date(reminder.remind_at).toLocaleString()} icon={<CalendarIcon fontSize="small" />} sx={{ fontWeight: 600, bgcolor: 'rgba(0, 230, 138, 0.08)', color: '#5be49b', '& .MuiChip-icon': { color: '#00e68a' } }} />
                              <Chip size="small" label={reminder.priority} variant="outlined" />
                              <Chip size="small" label={reminder.category} variant="outlined" />
                              <Chip size="small" label={reminder.status} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                            </Box>
                            {reminder.notes && (
                              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#637381' }}>
                                {reminder.notes}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {viewMode === 'history' ? (
                              <IconButton size="small" onClick={() => updateReminderStatus(reminder, 'pending')} sx={{ color: '#00b8d9' }}>
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton size="small" onClick={() => updateReminderStatus(reminder, 'completed')} sx={{ color: '#22c55e' }}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" onClick={() => deleteReminder(reminder.id)} sx={{ color: '#637381', opacity: 0.6, '&:hover': { opacity: 1, color: '#ff5630' } }}>
                              <TrashIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {visibleReminders.length === 0 && (
                    <Paper sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" sx={{ color: '#637381' }}>
                        {viewMode === 'history' ? 'No reminder history yet.' : 'No upcoming reminders.'}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#637381', letterSpacing: '0.08em', mb: 2, display: 'block' }}>
                  {viewMode === 'history' ? 'Checklist History' : 'Checklists'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {visibleChecklists.map((checklist) => {
                    const doneItems = checklist.items.filter((item) => item.is_done);
                    const openItems = checklist.items.filter((item) => !item.is_done);
                    const displayedItems = viewMode === 'history' ? doneItems : openItems;

                    return (
                      <Paper key={checklist.id} sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>{checklist.title}</Typography>
                            {checklist.description && (
                              <Typography variant="body2" sx={{ color: '#919eab', mb: 1.5 }}>{checklist.description}</Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip size="small" label={`${openItems.length} open`} variant="outlined" />
                              <Chip size="small" label={`${doneItems.length} done`} variant="outlined" />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {viewMode === 'history' && (
                              <IconButton size="small" onClick={() => restoreChecklist(checklist)} sx={{ color: '#00b8d9' }}>
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" onClick={() => deleteChecklist(checklist.id)} sx={{ color: '#637381', '&:hover': { color: '#ff5630' } }}>
                              <TrashIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {displayedItems.map((item) => (
                            <Box
                              key={item.id}
                              onClick={() => toggleChecklistItem(item.id, item)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                py: 0.75,
                                px: 1,
                                borderRadius: 1,
                                transition: 'background-color 0.15s',
                                '&:hover': { bgcolor: 'rgba(145, 158, 171, 0.06)' },
                              }}
                            >
                              {item.is_done ? <CheckIcon fontSize="small" sx={{ color: '#00e68a' }} /> : <CircleIcon sx={{ color: 'rgba(145, 158, 171, 0.3)' }} fontSize="small" />}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ textDecoration: item.is_done ? 'line-through' : 'none', color: item.is_done ? '#637381' : '#fff', fontWeight: 500 }}>
                                  {item.item_text}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#637381' }}>
                                  {item.priority}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {displayedItems.length === 0 && (
                          <Typography variant="body2" sx={{ color: '#637381', mt: 1 }}>
                            {viewMode === 'history' ? 'No completed tasks in this checklist yet.' : 'No open tasks left in this checklist.'}
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}

                  {visibleChecklists.length === 0 && (
                    <Paper sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" sx={{ color: '#637381' }}>
                        {viewMode === 'history' ? 'No checklist history yet.' : 'No checklists yet.'}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Reminders;
