import express from 'express';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Real VPS Terminal execution endpoint
  app.post('/api/terminal/exec', (req, res) => {
    const { command, cwd } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    const trimmed = command.trim();
    const workDir = cwd || '/app/applet';

    // Execute real command in Debian GNU/Linux VPS environment
    exec(
      trimmed,
      {
        timeout: 25000,
        maxBuffer: 2 * 1024 * 1024,
        cwd: workDir,
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
          PATH: `${process.env.PATH}:/usr/sbin:/sbin:/usr/bin:/bin:/usr/local/bin:/usr/local/sbin`
        }
      },
      (error, stdout, stderr) => {
        res.json({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? (error.code ?? 1) : 0
        });
      }
    );
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', vps: 'Debian GNU/Linux 12 (bookworm)', time: new Date().toISOString() });
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VPS Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
