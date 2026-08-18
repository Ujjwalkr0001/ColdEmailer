import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import validationRoutes from './routes/validation.routes'; // <-- import

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount validation routes under /api
app.use('/api', validationRoutes); // <-- add this line

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});