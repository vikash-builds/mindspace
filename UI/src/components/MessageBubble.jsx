import ReactMarkdown from 'react-markdown';
import { Box, Paper, Avatar, Typography, IconButton, Collapse } from '@mui/material';
import { 
  Person as UserIcon, 
  AutoAwesome as SparklesIcon, 
  KeyboardArrowDown as ChevronDown, 
  KeyboardArrowUp as ChevronUp 
} from '@mui/icons-material';
import { useState } from 'react';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: isUser ? 'flex-end' : 'flex-start',
      mb: 3,
      px: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        maxWidth: '85%',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <Avatar sx={{ 
          bgcolor: isUser ? 'primary.main' : 'indigo.100',
          color: isUser ? '#fff' : 'primary.main',
          width: 32,
          height: 32
        }}>
          {isUser ? <UserIcon fontSize="small" /> : <SparklesIcon fontSize="small" />}
        </Avatar>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 3,
            borderBottomRightRadius: isUser ? 1 : 12,
            borderBottomLeftRadius: isUser ? 12 : 1,
            bgcolor: isUser ? 'primary.main' : '#f3f4f6',
            color: isUser ? '#fff' : 'text.primary',
            boxShadow: 'none'
          }}>
            <Box className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          </Paper>
          
          {!isUser && message.source_chunks && (
            <Box sx={{ mt: 1 }}>
              <Box 
                onClick={() => setShowSources(!showSources)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {showSources ? <ChevronUp fontSize="small" /> : <ChevronDown fontSize="small" />}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {showSources ? 'Hide Sources' : 'View Sources'}
                </Typography>
              </Box>
              
              <Collapse in={showSources}>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {JSON.parse(message.source_chunks).map((chunk, i) => (
                    <Paper 
                      key={i} 
                      variant="outlined"
                      sx={{ 
                        p: 1.5, 
                        fontSize: '0.75rem', 
                        bgcolor: 'background.default', 
                        border: '1px solid #e5e7eb',
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mr: 1 }}>
                        [{i+1}]
                      </Typography>
                      {chunk.text.substring(0, 200)}...
                    </Paper>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default MessageBubble;
