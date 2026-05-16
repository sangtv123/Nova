import { compile } from './packages/compiler/src/index';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  const code = fs.readFileSync('./my-app/src/components/Header.tsx', 'utf8');
  const result = await compile(code, { filename: 'Header.tsx' });
  console.log('--- COMPILED CODE ---');
  console.log(result.code);
  console.log('--- HOISTED ---');
  console.log(result.hoistedCount);
}

test();
