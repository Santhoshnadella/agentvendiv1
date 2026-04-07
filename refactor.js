import fs from 'fs';
import path from 'path';

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.js') && file !== 'db.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // 1. Add import for query, querySingle
      if (content.includes("from '../db.js'") || content.includes("from './db.js'")) {
        content = content.replace(/import\s+\{\s*getDB.*?\s*\}\s+from\s+['"]\.\.?\/db\.js['"];?/, "import { getDB, query, querySingle } from '../db.js';");
        // Also handle the edge case for files in server/ directly
        content = content.replace(/import\s+\{\s*getDB.*?\s*\}\s+from\s+['"]\.\/db\.js['"];?/, "import { getDB, query, querySingle } from './db.js';");
      }

      // 2. Change db.prepare("...").all() -> await query("...", [])
      // This regex handles arguments too
      content = content.replace(/db\.prepare\((.*?)\)\.all\((.*?)\)/gs, (match, sql, args) => {
        args = args.trim() ? `[${args}]` : `[]`;
        return `await query(${sql}, ${args})`;
      });

      // 3. Change db.prepare("...").get() -> await querySingle("...", [])
      content = content.replace(/db\.prepare\((.*?)\)\.get\((.*?)\)/gs, (match, sql, args) => {
        args = args.trim() ? `[${args}]` : `[]`;
        return `await querySingle(${sql}, ${args})`;
      });

      // 4. Change db.prepare("...").run() -> await query("...", [])
      content = content.replace(/db\.prepare\((.*?)\)\.run\((.*?)\)/gs, (match, sql, args) => {
        args = args.trim() ? `[${args}]` : `[]`;
        return `await query(${sql}, ${args})`;
      });

      // 5. Ensure routes that contain await are async
      // For routes: router.get('/path', (req, res) => ...
      content = content.replace(/router\.(get|post|put|delete)\((['"].*?['"]),\s*((authenticateToken|optionalAuth|authenticateApiKey|protectPrompt|requireRole\([^\)]+\))(,\s*)?)*\s*\(\s*req,\s*res/g, (match) => {
        return match.replace(/\(\s*req,\s*res/, "async (req, res");
      });
      // Handle the cases where req, res, next
      content = content.replace(/router\.(get|post|put|delete)\((['"].*?['"]),\s*((authenticateToken|optionalAuth|authenticateApiKey|protectPrompt|requireRole\([^\)]+\))(,\s*)?)*\s*\(\s*req,\s*res,\s*next/g, (match) => {
        return match.replace(/\(\s*req,\s*res,\s*next/, "async (req, res, next");
      });

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

traverse(path.join(process.cwd(), 'server'));
