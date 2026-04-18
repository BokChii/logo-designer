import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import generateRouter from './routes/generate.js';
import editRouter from './routes/edit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API routes (must be BEFORE static serving)
app.use('/api', generateRouter);
app.use('/api', editRouter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎨 Logo Designer running at http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set. Create a .env file with your API key.');
    }
  });
}

// Export for Vercel Serverless Function
export default app;
