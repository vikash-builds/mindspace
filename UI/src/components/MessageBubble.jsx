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
      mb: 2.5,
      px: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        maxWidth: '80%',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <Avatar sx={{ 
          bgcolor: isUser ? 'rgba(0, 230, 138, 0.16)' : '#2a3544',
          color: isUser ? '#00e68a' : '#8b5cf6',
          width: 32,
          height: 32,
        }}>
          {isUser ? <UserIcon sx={{ fontSize: 18 }} /> : <SparklesIcon sx={{ fontSize: 18 }} />}
        </Avatar>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2.5,
            borderBottomRightRadius: isUser ? 4 : 20,
            borderBottomLeftRadius: isUser ? 20 : 4,
            bgcolor: isUser ? 'rgba(0, 230, 138, 0.12)' : '#2a3544',
            border: isUser ? '1px solid rgba(0, 230, 138, 0.16)' : '1px solid rgba(145, 158, 171, 0.12)',
            boxShadow: 'none',
          }}>
            <Box className="markdown-content" sx={{ '& p:last-child': { mb: 0 } }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          </Paper>
          
          {!isUser && message.source_chunks && (
            <Box sx={{ mt: 0.5 }}>
              <Box 
                onClick={() => setShowSources(!showSources)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  cursor: 'pointer',
                  color: '#637381',
                  transition: 'color 0.15s',
                  '&:hover': { color: '#00e68a' }
                }}
              >
                {showSources ? <ChevronUp sx={{ fontSize: 16 }} /> : <ChevronDown sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
                  {showSources ? 'Hide Sources' : 'View Sources'}
                </Typography>
              </Box>
              
              <Collapse in={showSources}>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {JSON.parse(message.source_chunks).map((chunk, i) => (
                    <Paper 
                      key={i} 
                      sx={{ 
                        p: 1.5, 
                        fontSize: '0.75rem', 
                        bgcolor: '#1a222c',
                        border: '1px solid rgba(145, 158, 171, 0.08)',
                        color: '#919eab',
                        borderRadius: 1.5,
                        boxShadow: 'none',
                      }}
                    >
                      <Typography component="span" sx={{ fontWeight: 800, color: '#00e68a', mr: 0.5, fontSize: '0.75rem' }}>
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
