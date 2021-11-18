import { createServer, build, normalizePath } from 'vite';
import { join, relative } from 'path';

const ROOT_DIR = process.cwd();

const mode = process.env.MODE || 'development';

const startElectron = () => {
  const { spawn } = require('child_process');

  const electronPath = require('electron');

  return spawn(electronPath, ['--inspect', join(ROOT_DIR, 'dist/source/main/index.cjs.js')]);
};

// Build preload entrypoint
const buildPreload = () =>
  build({
    mode,
    configFile: join(ROOT_DIR, 'config/preload.vite.ts'),
  });

const buildMain = () =>
  build({
    mode,
    configFile: join(process.cwd(), 'config/main.vite.ts'),
  });

async function run() {
  // Create Vite dev server
  const server = await createServer({
    mode,
    configFile: join(ROOT_DIR, 'config/renderer.vite.ts'),
  });

  await buildPreload();

  // Watch `src/preload` and rebuild preload entrypoint
  server.watcher.add(join(ROOT_DIR, 'src/preload/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/src/preload/')) {
      return;
    }

    return buildPreload();
  });

  // Reload page on preload script change
  server.watcher.add(join(ROOT_DIR, 'dist/source/preload/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/dist/source/preload/')) {
      return;
    }

    server.ws.send({
      type: 'full-reload',
      path: '/' + relative(server.config.root, file),
    });
  });

  // Run Vite server
  await server.listen();

  {
    const protocol = `http${server.config.server.https ? 's' : ''}:`;
    const host = server.config.server.host || 'localhost';
    const port = server.config.server.port; // Vite searches for and occupies the first free port: 3000, 3001, 3002 and so on
    const path = '/';
    process.env.VITE_DEV_SERVER_URL = `${protocol}//${host}:${port}${path}`;
  }

  await buildMain();

  // Watch `src/main` and rebuild main entrypoint
  server.watcher.add(join(process.cwd(), 'src/main/**'));
  server.watcher.on('change', (file) => {
    file = normalizePath(file);

    if (!file.includes('/src/main/')) {
      return;
    }

    return buildMain();
  });

  // Run electron app
  startElectron();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
