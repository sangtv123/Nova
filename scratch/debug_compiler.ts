import { compile } from '../packages/compiler/src/index';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  console.log('🔍 Testing Nova Compiler Transformation...');
  
  // Test code with n-router
  const code = `
    export function Header() {
      return (
        <nav>
          <a n-router="/home">Home</a>
          <a n-router="/about">About</a>
        </nav>
      );
    }
  `;

  console.log('\n--- INPUT CODE ---');
  console.log(code);

  const result = await compile(code, { filename: 'test.tsx' });
  
  console.log('\n--- COMPILED OUTPUT (ESM) ---');
  console.log(result.code);
  
  console.log('\n--- STATIC HOISTING CHECK ---');
  if (result.code.includes('createTemplate')) {
    console.log('❌ ERROR: Static hoisting should NOT happen on n-router elements!');
  } else if (result.code.includes('onClick') && result.code.includes('router.navigate')) {
    console.log('✅ SUCCESS: n-router transformed to reactive onClick.');
  } else {
    console.log('❓ UNKNOWN STATE: Check output above.');
  }
}

test().catch(console.error);
