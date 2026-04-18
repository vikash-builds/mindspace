import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  IconButton,
  Link,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachIcon,
  AutoAwesome as SparklesIcon,
  KeyboardArrowDown as ChevronDown,
  KeyboardArrowUp as ChevronUp,
  Person as UserIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';

function normalizeSourceChunks(sourceChunks) {
  if (!sourceChunks) {
    return [];
  }

  if (Array.isArray(sourceChunks)) {
    return sourceChunks;
  }

  if (typeof sourceChunks === 'string') {
    try {
      const parsed = JSON.parse(sourceChunks);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse source chunks', error);
      return [];
    }
  }

  return [];
}

function MessageBubble({ message, onTogglePin }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const [hovered, setHovered] = useState(false);
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const sourceChunks = normalizeSourceChunks(message.source_chunks);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: 2.5,
        px: 2,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          maxWidth: '80%',
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'rgba(0, 230, 138, 0.16)' : '#2a3544',
            color: isUser ? '#00e68a' : '#8b5cf6',
            width: 32,
            height: 32,
          }}
        >
          {isUser ? <UserIcon sx={{ fontSize: 18 }} /> : <SparklesIcon sx={{ fontSize: 18 }} />}
        </Avatar>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', position: 'relative' }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2.5,
              borderBottomRightRadius: isUser ? 4 : 20,
              borderBottomLeftRadius: isUser ? 20 : 4,
              bgcolor: isUser ? 'rgba(0, 230, 138, 0.12)' : '#2a3544',
              border: isUser ? '1px solid rgba(0, 230, 138, 0.16)' : '1px solid rgba(145, 158, 171, 0.12)',
              boxShadow: 'none',
              position: 'relative',
            }}
          >
            {onTogglePin && message.id && (
              <Tooltip title={message.is_pinned ? 'Unpin message' : 'Pin message'}>
                <IconButton
                  size="small"
                  onClick={() => onTogglePin(message.id, !message.is_pinned)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: hovered || message.is_pinned ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                    color: message.is_pinned ? '#00e68a' : '#919eab',
                  }}
                >
                  <PinIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <Box className="markdown-content" sx={{ '& p:last-child': { mb: 0 }, pr: onTogglePin ? 3 : 0 }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          </Paper>

          {attachments.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {attachments.map((attachment) => (
                <Chip
                  key={attachment.id || attachment.name}
                  size="small"
                  icon={<AttachIcon />}
                  label={attachment.name}
                  sx={{
                    bgcolor: 'rgba(145, 158, 171, 0.12)',
                    color: '#fff',
                    maxWidth: 240,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {!isUser && sourceChunks.length > 0 && (
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
                  '&:hover': { color: '#00e68a' },
                }}
              >
                {showSources ? <ChevronUp sx={{ fontSize: 16 }} /> : <ChevronDown sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
                  {showSources ? 'Hide Sources' : 'View Sources'}
                </Typography>
              </Box>

              <Collapse in={showSources}>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {sourceChunks.map((chunk, index) => (
                    <Paper
                      key={`${chunk.doc_id}-${index}`}
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5, alignItems: 'flex-start' }}>
                        <Box>
                          <Typography component="span" sx={{ fontWeight: 800, color: '#00e68a', mr: 0.5, fontSize: '0.75rem' }}>
                            [{index + 1}]
                          </Typography>
                          <Typography component="span" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.75rem' }}>
                            {chunk.source_name || `Document ${chunk.doc_id}`}
                          </Typography>
                        </Box>
                        {chunk.score !== undefined && (
                          <Chip
                            size="small"
                            label={`${Math.round(Number(chunk.score || 0) * 100)}%`}
                            sx={{ height: 22, bgcolor: 'rgba(0, 230, 138, 0.12)', color: '#00e68a' }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: '#dfe3e8', mb: 0.75 }}>
                        {chunk.text?.substring(0, 220)}...
                      </Typography>
                      {chunk.external_url && (
                        <Link href={chunk.external_url} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: '0.75rem' }}>
                          Open source
                        </Link>
                      )}
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
