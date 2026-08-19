import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:5000/oauth2callback' // not used for sending, only for token exchange
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
export const senderEmail = process.env.GMAIL_USER_EMAIL!;