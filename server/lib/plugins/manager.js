import fs from 'fs';
import path from 'path';
import ivm from 'isolated-vm';
import { TOOLS } from '../tools/index.js';
import { logAudit } from '../audit.js';

export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.isolate = new ivm.Isolate({ memoryLimit: 128 });
  }

  init() {
    this.scanAndLoad();
  }

  scanAndLoad() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) return;

    try {
      const dirs = fs.readdirSync(nodeModulesPath);
      for (const dir of dirs) {
        if (dir.startsWith('agentvendi-plugin-')) {
          this.loadPlugin(dir);
        }
      }
    } catch (e) {
      console.error('Error scanning plugins:', e.message);
    }
  }

  async loadPlugin(pluginName) {
    try {
      const pluginPath = path.join(process.cwd(), 'node_modules', pluginName);
      const pkgJson = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf8'));
      const indexCode = fs.readFileSync(path.join(pluginPath, pkgJson.main || 'index.js'), 'utf8');

      const context = await this.isolate.createContext();
      const jail = context.global;
      await jail.set('global', jail.derefInto());

      // Define internal tools inside the isolate
      const script = await this.isolate.compileScript(`
        const module = { exports: {} };
        const exports = module.exports;
        ${indexCode};
        module.exports;
      `);
      
      const pluginDef = await script.run(context);
      const metadata = await (await pluginDef.get('metadata')).copy();
      const toolsRaw = await pluginDef.get('tools');
      
      this.plugins.set(pluginName, { metadata, context, toolsRaw });

      // Expose to Global Tool Registry
      const toolCount = await toolsRaw.get('length');
      for (let i = 0; i < toolCount; i++) {
        const tool = await toolsRaw.get(i);
        const name = await tool.get('name');
        const description = await tool.get('description');
        const inputSchema = await (await tool.get('input_schema')).copy();

        TOOLS[name] = {
          name,
          description,
          inputSchema,
          requiresApproval: true,
          execute: async (params) => {
            await logAudit('system', 'PLUGIN_EXECUTE', 'plugin_tool', name, { params });
            // Invoke execute_fn in isolate
            const executeFn = await tool.get('execute_fn');
            return await executeFn.apply(undefined, [new ivm.ExternalCopy(params).copyInto()], { result: { copy: true }, promise: true });
          }
        };
      }

      console.log(`🔌 [Isolate] Loaded Plugin: ${metadata.name} v${metadata.version}`);
      await logAudit('system', 'PLUGIN_LOAD', 'plugin', pluginName, { metadata });
    } catch (e) {
      console.error(`Failed to load plugin ${pluginName}:`, e.message);
    }
  }

  getPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      metadata: p.metadata
    }));
  }
}

export const pluginManager = new PluginManager();
