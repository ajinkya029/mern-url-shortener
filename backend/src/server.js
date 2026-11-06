import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import apiRoutes from './routes.js';
import Link from './models/Link.js';

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRoutes);

app.get('/:code', async (req, res, next) => {
  try {
    const link = await Link.findOneAndUpdate(
      { shortCode: req.params.code },
      { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } },
      { new: true }
    );
    if (!link) return res.status(404).send('This short link does not exist.');
    return res.redirect(302, link.originalUrl);
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: 'Short code collision. Please retry.' });
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener')
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
