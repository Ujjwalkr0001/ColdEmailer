import { Request, Response } from 'express';
import { addEmailsToQueue } from '../services/queue.service';

export const addToQueue = async (req: Request, res: Response) => {
  try {
    const { emails, subject, body } = req.body;

    // Validate required fields
    if (!emails) {
      return res.status(400).json({ error: 'emails field is required' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'subject field is required' });
    }
    if (!body) {
      return res.status(400).json({ error: 'body field is required' });
    }

    const result = await addEmailsToQueue(emails, subject, body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Queue creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};