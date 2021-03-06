import { build } from 'vite';
import { join } from 'path';
import { default as external } from '../config/external-packages';

const mode = process.env.MODE || 'production';

const configs = [
  join(process.cwd(), 'config/main.vite.ts'),
  join(process.cwd(), 'config/preload.vite.ts'),
  join(process.cwd(), 'config/renderer.vite.ts'),
];

/**
 * Run `vite build` for config file
 * @param {string} configFile
 * @return {Promise<RollupOutput | RollupOutput[]>}
 */
const buildByConfig = (configFile: string) => build({configFile, mode});

/**
 * Creates a separate package.json in which:
 * - The version number is set based on the current date in the format yy.mm.dd
 * - Removed all dependencies except those marked as "external".
 *   @see /config/external-packages.js
 *
 * @return {Promise<void>}
 */
const generatePackageJson = () => {
  // Get project package.json
  const packageJson = require(join(process.cwd(), 'package.json'));

  // Cleanup
  delete packageJson.scripts;

  {
    // Remove all bundled dependencies
    // Keep only `external` dependencies
    delete packageJson.devDependencies;

    for (const type of ['dependencies', 'optionalDependencies']) {
      if (packageJson[type] === undefined) {
        continue;
      }

      for (const key of Object.keys(packageJson[type])) {
        if (external.includes(key)) {
          delete packageJson[type][key];
        }
      }
    }
  }

  {
    // Set version based on current date in yy.mm.dd format
    // The year is calculated on the principle of a `getFullYear() - 2000`, so that in 2120 the version was `120` and not `20` 😅
    // const now = new Date;
    // packageJson.version = `${now.getFullYear() - 2000}.${now.getMonth() + 1}.${now.getDate()}`;
  }

  // Create new package.json
  const { writeFile } = require('fs/promises');
  return writeFile(join(process.cwd(), 'dist/source/package.json'), JSON.stringify(packageJson, undefined, 2));
};


Promise.all(configs.map(buildByConfig))
  .then(generatePackageJson)
  .then(() => console.timeEnd('Bundling time'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
