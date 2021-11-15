import { createServer, build, normalizePath } from 'vite';
import { join, relative } from 'path';

async function run() {
  console.log('start');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
