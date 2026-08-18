import { Request, Response } from 'express';
import { validateEmailList } from '../services/validation.service';

export const validateEmails = async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;

    if (!emails) {
      return res.status(400).json({ error: 'emails field is required' });
    }

    const result = await validateEmailList(emails);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};