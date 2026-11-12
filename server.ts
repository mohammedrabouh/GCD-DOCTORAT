import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { USMBA_ESTABLISHMENTS, USMBA_LABORATORIES, USMBA_THESIS_SUBJECTS } from './src/data/usmbaSubjects.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection (PostgreSQL with graceful fallback)
let pgPool: pg.Pool | null = null;
let pgConnected = false;

if (process.env.DATABASE_URL || process.env.PGHOST) {
  try {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
    });

    pgPool.query('SELECT NOW()', (err) => {
      if (err) {
        console.warn('⚠️  [PostgreSQL] Connexion échouée, basculement automatique vers stockage mémoire:', err.message);
        pgConnected = false;
      } else {
        console.log('✅ [PostgreSQL] Connexion établie avec succès à la base de données DOCTORIA.');
        pgConnected = true;
      }
    });
  } catch (err: any) {
    console.warn('⚠️  [PostgreSQL] Initialisation impossible:', err.message);
  }
} else {
  console.log('ℹ️  [DOCTORIA Backend] Mode autonome actif. Prêt avec catalogue USMBA et endpoints REST.');
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'DOCTORIA - Plateforme du Cycle Doctoral (USMBA Fès)',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    database: pgConnected ? 'postgresql-connected' : 'in-memory-ready',
    academicYear: '2026-2027',
  });
});

app.get('/api/establishments', (_req, res) => {
  res.json({ success: true, count: USMBA_ESTABLISHMENTS.length, data: USMBA_ESTABLISHMENTS });
});

app.get('/api/laboratories', (_req, res) => {
  res.json({ success: true, count: USMBA_LABORATORIES.length, data: USMBA_LABORATORIES });
});

app.get('/api/campaigns', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'camp_usmba_2026',
        code: 'DOC-USMBA-2026-2027',
        title: 'Campagne Doctorale USMBA 2026-2027',
        academicYear: '2026-2027',
        startDate: '2026-09-15',
        endDate: '2026-12-20',
        registrationDeadline: '2027-01-15',
        isActive: true,
        description: 'Campagne officielle pour les centres d’études doctorales de l’Université Sidi Mohamed Ben Abdellah.',
        maxCandidaturesPerCandidate: 3,
        allowWaitlistPromotion: true,
      },
    ],
  });
});

app.get('/api/subjects', (req, res) => {
  const { discipline, establishmentId, q } = req.query;
  let results = [...USMBA_THESIS_SUBJECTS];

  if (discipline && typeof discipline === 'string') {
    results = results.filter((s) => s.discipline.toLowerCase().includes(discipline.toLowerCase()));
  }
  if (establishmentId && typeof establishmentId === 'string') {
    results = results.filter((s) => s.establishmentId === establishmentId);
  }
  if (q && typeof q === 'string') {
    const cleanQ = q.toLowerCase();
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(cleanQ) ||
        s.supervisorName.toLowerCase().includes(cleanQ) ||
        s.keywords.some((k) => k.toLowerCase().includes(cleanQ))
    );
  }

  res.json({
    success: true,
    total: results.length,
    data: results,
  });
});

app.get('/api/subjects/:id', (req, res) => {
  const subject = USMBA_THESIS_SUBJECTS.find((s) => s.id === req.params.id || s.code === req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, error: 'Sujet introuvable' });
  }
  res.json({ success: true, data: subject });
});

app.get('/api/stats', (_req, res) => {
  res.json({
    success: true,
    stats: {
      totalSubjects: USMBA_THESIS_SUBJECTS.length,
      publishedSubjects: USMBA_THESIS_SUBJECTS.filter((s) => s.status === 'PUBLIE').length,
      establishmentsCount: USMBA_ESTABLISHMENTS.length,
      laboratoriesCount: USMBA_LABORATORIES.length,
      disciplinesCount: 17,
      openSeats: USMBA_THESIS_SUBJECTS.reduce((acc, s) => acc + s.availableSeats, 0),
    },
  });
});

// -------------------------------------------------------------
// FRONTEND SERVING (VITE MIDDLEWARE IN DEV / STATIC IN PROD)
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur DOCTORIA opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur démarrage serveur:', err);
  process.exit(1);
});
