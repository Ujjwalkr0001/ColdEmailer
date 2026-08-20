import { Request, Response } from 'express';
import { getTemplate, updateTemplate } from '../services/template.service';

export const getTemplateHandler = async (req: Request, res: Response) => {
  try {
    const template = await getTemplate();
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTemplateHandler = async (req: Request, res: Response) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: 'subject and body are required' });
    }
    const template = await updateTemplate(subject, body);
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};