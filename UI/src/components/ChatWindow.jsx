import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Box, TextField, IconButton, Typography, CircularProgress, Paper, Avatar } from '@mui/material';
import { Send as SendIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import { useParams, useNavigate } from 'react-router-dom';

function ChatWindow() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { getToken } = useAuth();

  const fetchHistory = async () => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    if (chatId === 'temp') {
      setMessages([]);
      return;
    }

    try {
      const token = await getToken();
      const res = await axios.get(`/api/chat/history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const res = await axios.post('/api/chat', { question: input, chatId: chatId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data.answer,
        source_chunks: JSON.stringify(res.data.sourceChunks)
      }]);
      
      // If it was a new chat, update URL with returned chatId
      if (!chatId && res.data.chatId && res.data.chatId !== 'temp') {
        navigate(`/chat/${res.data.chatId}`);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 4 }}>
        {messages.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            textAlign: 'center',
            px: 3
          }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mb: 3 }}>
              <SparklesIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {chatId === 'temp' ? 'Temporary Chat' : 'How can I help you today?'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
              {chatId === 'temp' 
                ? 'Messages in this session are not saved to history. Ask anything privately.'
                : "Ask anything about your documents or set reminders for your upcoming tasks."}
            </Typography>
          </Box>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        
        {loading && (
          <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
             <CircularProgress size={18} thickness={5} sx={{ color: 'primary.main' }} />
             <Typography variant="body2" sx={{ fontStyle: 'italic' }}>MindSpace is thinking...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
        <Paper 
          component="form" 
          onSubmit={handleSend}
          elevation={0}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            maxWidth: 800, 
            mx: 'auto',
            p: 0.5,
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            transition: 'border-color 0.2s',
            '&:focus-within': { borderColor: 'primary.main' }
          }}
        >
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            variant="standard"
            autoFocus
            sx={{ px: 2 }}
            InputProps={{ disableUnderline: true }}
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={!input.trim() || loading}
            sx={{ 
              bgcolor: input.trim() ? 'primary.main' : 'transparent',
              color: input.trim() ? '#fff' : 'inherit',
              '&:hover': { bgcolor: 'primary.dark' },
              p: 1.5,
              borderRadius: 3
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Paper>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: 'text.disabled', fontWeight: 600, letterSpacing: 0.5 }}>
          AI-GENERATED RESPONSES. PLEASE VERIFY IMPORTANT INFORMATION.
        </Typography>
      </Box>
    </Box>
  );
}

export default ChatWindow;
