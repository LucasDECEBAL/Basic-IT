import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.DB_PATH=join(mkdtempSync(join(tmpdir(),'basic-it-browser-')),'browser.sqlite');
process.env.PORT='4173';
process.env.HOST='127.0.0.1';
await import('../server.mjs');
