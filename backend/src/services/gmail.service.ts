import { gmail, senderEmail } from '../config/gmail';
import { encode } from 'base64-arraybuffer'; // we'll install this

// Install: npm install base64-arraybuffer

export async function sendEmail(recipient: string, subject: string, body: string): Promise<string> {
  // Build MIME message
  const message = [
    `From: ${senderEmail}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data.id; // Gmail message ID
}