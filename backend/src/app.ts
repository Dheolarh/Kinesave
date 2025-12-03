import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import devicesRouter from './routes/devices.routes';
import surveyRouter from './routes/survey.routes';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/devices', devicesRouter);
app.use('/api/devices', surveyRouter); // Survey routes under /api/devices/:id/survey

// Start server
app.listen(PORT, () => {
    console.log(`✅ KineSave backend running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

export default app;
