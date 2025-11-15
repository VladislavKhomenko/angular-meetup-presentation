#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const docsPath = join(process.cwd(), '..', 'docs');
const basePath = '/angular-meetup-presentation';

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions) {
  let results = [];
  const list = readdirSync(dir);
  
  list.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Исправляем HTML файлы
const htmlFiles = ['index.html', '404.html'];
htmlFiles.forEach(file => {
  const filePath = join(docsPath, file);
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Заменяем пути /assets/ и /backgrounds/ на правильные
    content = content.replace(
      /(href|src|content)=["']\/assets\//g,
      `$1="${basePath}/assets/`
    );
    content = content.replace(
      /(href|src|content)=["']\/backgrounds\//g,
      `$1="${basePath}/backgrounds/`
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed paths in ${file}`);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

// Исправляем JS файлы
const assetsPath = join(docsPath, 'assets');
if (statSync(assetsPath).isDirectory()) {
  const jsFiles = findFiles(assetsPath, ['.js']);
  
  jsFiles.forEach(filePath => {
    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      
      // Заменяем строки "/assets/" и "/backgrounds/" на правильные пути
      // Обрабатываем одинарные, двойные кавычки и template literals
      const before1 = content;
      content = content.replace(/(["'`])\/assets\//g, `$1${basePath}/assets/`);
      content = content.replace(/(["'`])\/backgrounds\//g, `$1${basePath}/backgrounds/`);
      modified = before1 !== content;
      
      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        const relativePath = filePath.replace(docsPath + '/', '');
        console.log(`✓ Fixed paths in ${relativePath}`);
      }
    } catch (error) {
      console.error(`✗ Error fixing ${filePath}:`, error.message);
    }
  });
}

console.log('✓ All paths fixed!');

