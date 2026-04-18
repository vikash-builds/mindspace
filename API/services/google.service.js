const crypto = require('crypto');
const { google } = require('googleapis');

const config = require('../config');

const IDENTITY_SCOPES = [
  'openid',
  'email',
  'profile',
];

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
];

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

const ALL_SCOPES = [...IDENTITY_SCOPES, ...DRIVE_SCOPES, ...GMAIL_SCOPES];

function createOAuthClient() {
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI,
  );
}

function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', config.CLERK_SECRET_KEY).update(body).digest('hex');
  return `${body}.${signature}`;
}

function verifyState(state) {
  const [body, signature] = (state || '').split('.');
  if (!body || !signature) {
    throw new Error('Missing OAuth state');
  }
  const expected = crypto.createHmac('sha256', config.CLERK_SECRET_KEY).update(body).digest('hex');
  if (expected !== signature) {
    throw new Error('Invalid OAuth state');
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

function getAuthUrl(userId) {
  const client = createOAuthClient();
  const state = signState({ userId, timestamp: Date.now() });
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ALL_SCOPES,
    state,
  });
}

async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const profile = await oauth2.userinfo.get();
  return {
    tokens,
    email: profile.data.email,
  };
}

function getAuthorizedClient(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);
  return client;
}

async function listDriveFiles(tokens, options = {}) {
  const auth = getAuthorizedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });
  const {
    pageToken = undefined,
    search = '',
    includeSharedDrives = false,
    pageSize = 20,
  } = options;

  const queryParts = ['trashed = false'];
  if (search) {
    const escaped = search.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  const response = await drive.files.list({
    pageSize,
    pageToken,
    fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,webViewLink,driveId,owners(displayName))',
    q: queryParts.join(' and '),
    orderBy: 'modifiedTime desc',
    includeItemsFromAllDrives: includeSharedDrives,
    supportsAllDrives: includeSharedDrives,
    corpora: includeSharedDrives ? 'allDrives' : 'user',
  });
  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken || null,
  };
}

async function downloadDriveFile(tokens, fileId, mimeType) {
  const auth = getAuthorizedClient(tokens);
  const drive = google.drive({ version: 'v3', auth });

  const exportMap = {
    'application/vnd.google-apps.document': {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    },
    'application/vnd.google-apps.spreadsheet': {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    },
    'application/vnd.google-apps.presentation': {
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
    },
  };

  if (exportMap[mimeType]) {
    const exportTarget = exportMap[mimeType];
    const response = await drive.files.export(
      { fileId, mimeType: exportTarget.mimeType },
      { responseType: 'arraybuffer' },
    );
    return {
      buffer: Buffer.from(response.data),
      mimeType: exportTarget.mimeType,
      extension: exportTarget.extension,
    };
  }

  const metadata = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,webViewLink,fileExtension',
  });
  const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return {
    buffer: Buffer.from(response.data),
    mimeType: metadata.data.mimeType,
    extension: metadata.data.fileExtension || 'bin',
    metadata: metadata.data,
  };
}

async function listInboxMessages(tokens) {
  const auth = getAuthorizedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const messageList = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 10,
  });
  const messages = [];
  for (const message of messageList.data.messages || []) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });
    const headers = Object.fromEntries((detail.data.payload.headers || []).map((header) => [header.name, header.value]));
    messages.push({
      id: message.id,
      threadId: detail.data.threadId,
      snippet: detail.data.snippet,
      subject: headers.Subject || '(No subject)',
      from: headers.From || '',
      date: headers.Date || '',
    });
  }
  return messages;
}

function decodeBase64Url(value) {
  return Buffer.from((value || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractMessageBody(payload) {
  if (!payload) {
    return '';
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const plainPart = (payload.parts || []).find((part) => part.mimeType === 'text/plain' && part.body?.data);
  if (plainPart?.body?.data) {
    return decodeBase64Url(plainPart.body.data);
  }

  const htmlPart = (payload.parts || []).find((part) => part.mimeType === 'text/html' && part.body?.data);
  if (htmlPart?.body?.data) {
    return decodeBase64Url(htmlPart.body.data).replace(/<[^>]+>/g, ' ');
  }

  for (const part of payload.parts || []) {
    const nested = extractMessageBody(part);
    if (nested) {
      return nested;
    }
  }

  return '';
}

async function getInboxMessage(tokens, messageId) {
  const auth = getAuthorizedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const detail = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const headers = Object.fromEntries((detail.data.payload?.headers || []).map((header) => [header.name, header.value]));
  const body = extractMessageBody(detail.data.payload).trim();

  return {
    id: detail.data.id,
    threadId: detail.data.threadId,
    snippet: detail.data.snippet,
    subject: headers.Subject || '(No subject)',
    from: headers.From || '',
    to: headers.To || '',
    date: headers.Date || '',
    body,
    labelIds: detail.data.labelIds || [],
  };
}

async function createGmailDraft(tokens, { to, subject, body }) {
  const auth = getAuthorizedClient(tokens);
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: { raw },
    },
  });
  return response.data;
}

module.exports = {
  ALL_SCOPES,
  getAuthUrl,
  verifyState,
  exchangeCodeForTokens,
  listDriveFiles,
  downloadDriveFile,
  listInboxMessages,
  getInboxMessage,
  createGmailDraft,
};
