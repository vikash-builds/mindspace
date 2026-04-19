import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachIcon,
  AutoAwesome as SparklesIcon,
  Close as CloseIcon,
  PushPin as PinIcon,
  Send as SendIcon,
} from '@mui/icons-material';

import MessageBubble from './MessageBubble';

function ChatWindow() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchPins = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('/api/chat/pins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPinnedMessages(response.data);
    } catch (error) {
      console.error('Pinned fetch error:', error);
    }
  };

  const fetchHistory = async () => {
    if (!chatId || chatId === 'temp') {
      setMessages([]);
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.get(`/api/chat/history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('History fetch error:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchPins();
  }, [chatId]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (!prompt) {
      return;
    }

    setInput(prompt);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('prompt');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pinnedMessages]);

  const handleAttachmentSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await axios.post('/api/chat/attachments', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPendingAttachments((current) => [...current, ...(response.data.attachments || [])]);
      event.target.value = '';
    } catch (error) {
      console.error('Attachment upload error:', error);
    }
  };

  const handleTogglePin = async (messageId, isPinned) => {
    try {
      const token = await getToken();
      await axios.patch(`/api/chat/messages/${messageId}/pin`, { isPinned }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? { ...message, is_pinned: isPinned ? 1 : 0, pinned_at: isPinned ? new Date().toISOString() : null }
          : message
      )));
      fetchPins();
    } catch (error) {
      console.error('Pin toggle error:', error);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading) {
      return;
    }

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: input || 'Attached files',
      attachments: pendingAttachments,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const response = await axios.post('/api/chat', {
        question: input || 'Please review the attached files.',
        chatId,
        attachments: pendingAttachments,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessage.id),
        optimisticMessage,
        {
          id: response.data.assistantMessageId,
          role: 'assistant',
          content: response.data.answer,
          source_chunks: JSON.stringify(response.data.sourceChunks),
          attachments: [],
          is_pinned: 0,
        },
      ]);
      setPendingAttachments([]);

      if (!chatId && response.data.chatId && response.data.chatId !== 'temp') {
        navigate(`/chat/${response.data.chatId}`);
      }
      fetchPins();
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#161c24' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 3 }}>
        {pinnedMessages.length > 0 && (
          <Box sx={{ px: 4, mb: 2 }}>
            <Paper sx={{ p: 2.5, borderStyle: 'dashed' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PinIcon sx={{ color: '#00e68a', fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Pinned Messages
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pinnedMessages.slice(0, 5).map((message) => (
                  <Paper key={message.id} sx={{ p: 1.5, bgcolor: '#1a222c' }}>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {messages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              px: 3,
            }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(0, 230, 138, 0.12)', mb: 3 }}>
              <SparklesIcon sx={{ fontSize: 32, color: '#00e68a' }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {chatId === 'temp' ? 'Temporary Chat' : 'How can I help you today?'}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 400, color: '#919eab' }}>
              {chatId === 'temp'
                ? 'Messages in this session are not saved to history. Assistant actions can still update your workspace.'
                : 'Ask about your documents, attach files, or turn imported content into action items.'}
            </Typography>
          </Box>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id || `${message.role}-${message.content}`} message={message} onTogglePin={handleTogglePin} />
        ))}

        {loading && (
          <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={16} thickness={5} />
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#919eab' }}>
              MindSpace is thinking...
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2.5, borderTop: '1px dashed rgba(145, 158, 171, 0.2)' }}>
        <Paper
          component="form"
          onSubmit={handleSend}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 800,
            mx: 'auto',
            p: 0.5,
            bgcolor: '#212b36',
            border: '1px solid rgba(145, 158, 171, 0.16)',
            borderRadius: 3,
            transition: 'border-color 0.2s',
            '&:focus-within': { borderColor: '#00e68a' },
          }}
        >
          {pendingAttachments.length > 0 && (
            <>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 2, pt: 1.5 }}>
                {pendingAttachments.map((attachment) => (
                  <Chip
                    key={attachment.id}
                    icon={<AttachIcon />}
                    label={attachment.name}
                    onDelete={() => setPendingAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                    deleteIcon={<CloseIcon />}
                    sx={{ bgcolor: 'rgba(145, 158, 171, 0.12)', color: '#fff' }}
                  />
                ))}
              </Box>
              <Divider sx={{ mx: 1, my: 1 }} />
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{ ml: 1, color: '#919eab' }}
              type="button"
            >
              <AttachIcon />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleAttachmentSelection}
            />
            <TextField
              fullWidth
              placeholder="Type your message or attach files..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
              variant="standard"
              autoFocus
              sx={{
                px: 1,
                '& .MuiInputBase-input': {
                  '&::placeholder': { color: '#637381', opacity: 1 },
                },
              }}
              InputProps={{ disableUnderline: true }}
            />
            <IconButton
              type="submit"
              disabled={(!input.trim() && pendingAttachments.length === 0) || loading}
              sx={{
                bgcolor: input.trim() || pendingAttachments.length ? '#00e68a' : 'rgba(145, 158, 171, 0.12)',
                color: input.trim() || pendingAttachments.length ? '#161c24' : '#637381',
                '&:hover': { bgcolor: input.trim() || pendingAttachments.length ? '#00ab66' : 'rgba(145, 158, 171, 0.2)' },
                p: 1.2,
                borderRadius: 2,
                transition: 'all 0.2s',
                mr: 0.5,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Paper>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1.5,
            color: '#637381',
            fontWeight: 600,
            letterSpacing: '0.06em',
            fontSize: '0.625rem',
          }}
        >
          AI-GENERATED RESPONSES · ATTACHED FILES ARE USED AS LIVE CONTEXT · VERIFY IMPORTANT INFORMATION
        </Typography>
      </Box>
    </Box>
  );
}

export default ChatWindow;
