#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const docsPath = join(process.cwd(), '..', 'docs');
const filesToFix = ['index.html', '404.html'];

filesToFix.forEach(file => {
  const filePath = join(docsPath, file);
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Заменяем пути /assets/ на /angular-meetup-presentation/assets/
    content = content.replace(
      /(href|src|content)=["']\/assets\//g,
      '$1="/angular-meetup-presentation/assets/'
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed paths in ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log('✓ All paths fixed!');

