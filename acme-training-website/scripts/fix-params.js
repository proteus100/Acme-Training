#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../src/app/api');

const files = [
  'customers/[id]/route.ts',
  'bookings/[id]/route.ts',
  'courses/[courseId]/route.ts',
  'sessions/[id]/route.ts'
];

function fixParams(filePath) {
  console.log(`Fixing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace params type declarations
  content = content.replace(
    /{ params }: { params: { (\w+): string } }/g,
    '{ params }: { params: Promise<{ $1: string }> }'
  );

  // Find and replace params usage within function bodies
  const lines = content.split('\n');
  const fixedLines = [];
  let inFunction = false;
  let needsAwait = false;
  let paramsVarName = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if we're entering a function with params
    if (line.includes('{ params }:')) {
      inFunction = true;
      needsAwait = true;

      // Extract the parameter name
      const match = line.match(/{ params }: { params: Promise<{ (\w+): string }> }/);
      if (match) {
        paramsVarName = match[1];
      }
    }

    // If we're in a function and need to await params
    if (inFunction && needsAwait && line.trim().includes('params.')) {
      // Replace the first usage with await destructuring
      line = line.replace(
        new RegExp(`params\\.${paramsVarName}`),
        `(await params).${paramsVarName}`
      );
      needsAwait = false; // Only fix the first occurrence
    }

    // Check if function ends
    if (line.includes('}') && inFunction) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (closeBraces >= openBraces && line.trim() === '}') {
        inFunction = false;
        needsAwait = false;
        paramsVarName = null;
      }
    }

    fixedLines.push(line);
  }

  // Additional pass to fix any remaining params. usage
  content = fixedLines.join('\n');
  content = content.replace(/params\.(\w+)/g, '(await params).$1');

  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

files.forEach(file => {
  const fullPath = path.join(apiDir, file);
  if (fs.existsSync(fullPath)) {
    fixParams(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('🎉 All params usage fixed!');