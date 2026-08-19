import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import validationRoutes from './routes/validation.routes';
import queueRoutes from './routes/queue.routes'; // <-- new import

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api', validationRoutes);
app.use('/api', queueRoutes); // <-- new route

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});