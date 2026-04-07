import { getDB } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standard Agent Tools
 */
const TOOLS = {
  web_search: {
    description: 'Search the web for information.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' }
      },
      required: ['query']
    },
    execute: async ({ query }) => {
      // Simulation or actual search
      return `Search results for: ${query}\n1. Found info on AgentVendi\n2. AI trends in 2026...`;
    }
  },
  read_file: {
    description: 'Read the contents of a file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file' }
      },
      required: ['path']
    },
    execute: async ({ path }) => {
      return `[CONTENT OF ${path}] This is a mocked file content for safety.`;
    }
  },
  handoff: {
     description: 'Handoff the task to another agent.',
     parameters: {
        type: 'object',
        properties: {
           agent_name: { type: 'string', description: 'Name of the agent to handoff to' },
           context: { type: 'string', description: 'Context to pass to the agent' }
        },
        required: ['agent_name', 'context']
     },
     execute: async ({ agent_name, context }) => {
        return `Handoff to ${agent_name} initiated with context: ${context.substring(0, 50)}...`;
     }
  },
  browser_action: {
     description: 'Perform an action in a simulated browser.',
     parameters: {
        type: 'object',
        properties: {
           url: { type: 'string' },
           action: { type: 'string', enum: ['navigate', 'click', 'type', 'screenshot'] },
           selector: { type: 'string' },
           text: { type: 'string' }
        },
        required: ['url', 'action']
     },
     execute: async ({ url, action, selector, text }) => {
        return `Browser action [${action}] successful on ${url}. ${action === 'screenshot' ? '[IMAGE_DATA_STUB]' : ''}`;
     }
  },
  query_knowledge_base: {
     description: 'Search the uploaded knowledge base / vector DB.',
     parameters: {
        type: 'object',
        properties: {
           query: { type: 'string' }
        },
        required: ['query']
     },
     execute: async ({ query }) => {
        return `Found relevant sections in documentation: "Deployment guidelines", "API Rate limits"...`;
     }
  }
};

export class AgentRuntime {
  constructor(agentId, userId) {
    this.agentId = agentId;
    this.userId = userId;
    this.db = getDB();
    this.runId = null;
  }

  async start(input, config) {
    this.runId = uuidv4();
    this.logRunStart(input);

    const systemPrompt = config.system_prompt || 'You are an AI assistant.';
    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ];

    let turns = 0;
    const maxTurns = 10;
    let finalOutput = '';

    while (turns < maxTurns) {
      turns++;
      this.log('assistant', 'Thinking...');

      try {
        const response = await this.callLLM(messages);
        if (!response) break;

        // Simple tool-calling parsing (using a ReAct-like style if model doesn't support native tool calls yet)
        const toolUse = this.parseToolUse(response.content);
        
        if (toolUse) {
           this.log('assistant', response.content, toolUse.name, toolUse.id);
           messages.push({ role: 'assistant', content: response.content });
           
           const tool = TOOLS[toolUse.name];
           if (tool) {
              const toolResult = await tool.execute(toolUse.parameters);
              this.log('tool', toolResult, toolUse.name, toolUse.id);
              messages.push({ role: 'user', content: `Tool [${toolUse.name}] returned: ${toolResult}` });
           } else {
              const error = `Tool [${toolUse.name}] not found.`;
              this.log('tool', error, toolUse.name, toolUse.id);
              messages.push({ role: 'user', content: error });
           }
        } else {
           this.log('assistant', response.content);
           finalOutput = response.content;
           break;
        }
      } catch (error) {
        this.log('system', `Error: ${error.message}`);
        break;
      }
    }

    this.logRunEnd(finalOutput);
    return finalOutput;
  }

  async callLLM(messages) {
    const config = await this.getEnterpriseConfig();
    const url = config.ollamaUrl || 'http://localhost:11434';
    const model = config.modelName || 'llama3.2';

    const body = {
      model,
      messages: messages.map(m => ({
        role: m.role === 'bot' ? 'assistant' : m.role,
        content: m.content
      })),
      stream: false
    };

    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Ollama connection failed');
    const data = await res.json();
    return { content: data.message?.content || '' };
  }

  // Simple regex-based tool use parser for models that don't support tool calling yet
  parseToolUse(content) {
    const regex = /USE_TOOL: (\w+)\nPARAMETERS: (\{.*?\})/s;
    const match = content.match(regex);
    if (match) {
      try {
        return {
          id: uuidv4(),
          name: match[1],
          parameters: JSON.parse(match[2])
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async getEnterpriseConfig() {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('enterprise_config');
    return row ? JSON.parse(row.value) : {};
  }

  logRunStart(input) {
    this.db.prepare(`
      INSERT INTO agent_runs (id, agent_id, user_id, status, input)
      VALUES (?, ?, ?, ?, ?)
    `).run(this.runId, this.agentId, this.userId, 'running', input);
  }

  log(role, content, toolName = null, toolId = null) {
    this.db.prepare(`
      INSERT INTO agent_run_logs (id, run_id, role, content, tool_name, tool_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), this.runId, role, content, toolName, toolId);
  }

  logRunEnd(output) {
     this.db.prepare(`
      UPDATE agent_runs SET status = ?, output = ?, duration = ?
      WHERE id = ?
    `).run('completed', output, 0, this.runId);
  }
}
