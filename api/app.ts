import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import guildRoutes from './routes/guild.js';
import membersRoutes from './routes/members.js';
import activitiesRoutes from './routes/activities.js';
import warehouseRoutes from './routes/warehouse.js';
import contributionsRoutes from './routes/contributions.js';
import announcementsRoutes from './routes/announcements.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDatabase();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/guild', guildRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/contributions', contributionsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/stats', statsRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

export default app;
