import { zodToJsonSchema } from 'zod-to-json-schema';
import { AgentDefinitionSchema } from './index.js';
import fs from 'fs';
import path from 'path';

const schema = zodToJsonSchema(AgentDefinitionSchema, 'AgentDefinition');

const outputPath = path.join(process.cwd(), 'schema.json');
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));

console.log('✅ Agent Definition JSON Schema generated at:', outputPath);
