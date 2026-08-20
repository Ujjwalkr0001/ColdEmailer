import { Request, Response } from 'express';
import { getDashboardStats } from '../services/stats.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};