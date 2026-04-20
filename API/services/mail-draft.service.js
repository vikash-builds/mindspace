const db = require('../database');
const googleService = require('./google.service');

async function getGoogleAccount(userId) {
  const result = await db.query(
    'SELECT * FROM integration_accounts WHERE user_id = $1 AND provider = $2',
    [userId, 'google'],
  );
  return result.rows[0] || null;
}

async function createGoogleDraftForUser(userId, { recipient, subject, body, metadata = {} }) {
  const account = await getGoogleAccount(userId);
  if (!account) {
    const error = new Error('Google is not connected');
    error.code = 'GOOGLE_NOT_CONNECTED';
    throw error;
  }

  const draft = await googleService.createGmailDraft(account.tokens, {
    to: recipient,
    subject,
    body,
  });

  const result = await db.query(`
    INSERT INTO mail_drafts (user_id, provider, external_draft_id, recipient, subject, body, status, metadata)
    VALUES ($1, 'gmail', $2, $3, $4, $5, 'draft', $6::jsonb)
    RETURNING id, external_draft_id, recipient, subject, body, created_at
  `, [
    userId,
    draft.id || null,
    recipient,
    subject,
    body,
    JSON.stringify({
      ...draft,
      ...metadata,
    }),
  ]);

  return result.rows[0];
}

module.exports = {
  getGoogleAccount,
  createGoogleDraftForUser,
};
