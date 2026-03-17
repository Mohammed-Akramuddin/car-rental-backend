const app = require('./app');
const { initDb } = require('./config/db');

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_TRIES = Number(process.env.MAX_PORT_TRIES) || 10;

async function start() {
  try {
    await initDb();

    let port = BASE_PORT;
    let lastErr = null;

    for (let attempt = 0; attempt < MAX_PORT_TRIES; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const started = await new Promise(resolve => {
        const server = app.listen(port, () => {
          console.log(`DRIVE API running on port ${port}`);
          resolve({ ok: true, port, server });
        });

        server.on('error', err => {
          lastErr = err;
          if (err && err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is in use, trying ${port + 1}...`);
            resolve({ ok: false });
            return;
          }
          resolve({ ok: false, fatal: true, err });
        });
      });

      if (started.ok) return;
      if (started.fatal) throw started.err;
      port += 1;
    }

    throw lastErr || new Error('Unable to start server');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

