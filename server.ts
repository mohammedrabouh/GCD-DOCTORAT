import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { USMBA_ESTABLISHMENTS, USMBA_LABORATORIES, USMBA_THESIS_SUBJECTS } from './src/data/usmbaSubjects.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
const envPort = !isProduction && process.env.PORT === '8080' ? '3000' : process.env.PORT;
const PORT = parseInt(cliPort || envPort || '3000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'DOCTORIA - Plateforme du Cycle Doctoral (USMBA Fès)',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
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
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur DOCTORIA opérationnel sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur démarrage serveur:', err);
  process.exit(1);
});
