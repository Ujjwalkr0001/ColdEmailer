import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Authorize by visiting this URL:', authUrl);
rl.question('Enter the code from that page: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh Token:', tokens.refresh_token);
  console.log('Access Token:', tokens.access_token);
  rl.close();
});