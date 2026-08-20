import { Request, Response } from 'express';
import { processNextDueEmail } from '../services/queue.service';

export const processQueue = async (req: Request, res: Response) => {
  try {
    // Process one email per invocation (GitHub Actions will call every 5 minutes)
    // Optionally, you can process multiple in a loop, but we respect the interval.
    const result = await processNextDueEmail();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Queue processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};