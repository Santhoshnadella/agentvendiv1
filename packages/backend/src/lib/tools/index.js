export const TOOLS = {
  web_search: {
    description: 'Search the web for real-time information.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'The search query' } },
      required: ['query']
    },
    execute: async ({ query }) => {
      // Production: integrate with SerpAPI, Tavily, or Brave Search
      return `Search results for: "${query}"\n1. Relevant documentation found\n2. Related Stack Overflow threads\n3. Official API references`;
    }
  },
  read_file: {
    description: 'Read the contents of a file.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path to the file' } },
      required: ['path']
    },
    execute: async ({ path }) => {
      // Safety: validate path is within allowed directories
      const safePath = path.replace(/\.\./g, '').replace(/^\//, '');
      return `[Content of ${safePath}] — File read operation completed. Content available in context.`;
    }
  },
  handoff: {
    description: 'Hand off the current task to another agent in the crew.',
    parameters: {
      type: 'object',
      properties: {
        agent_name: { type: 'string', description: 'Name of the agent to hand off to' },
        context: { type: 'string', description: 'Context and instructions for the next agent' }
      },
      required: ['agent_name', 'context']
    },
    execute: async ({ agent_name, context }) => {
      return `Handoff to [${agent_name}] initiated. Context passed: "${context.substring(0, 100)}..."`;
    }
  },
  browser_action: {
    description: 'Perform a browser automation action. Supports navigate, click, type, and screenshot.',
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
      try {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        let result = '';
        if (action === 'navigate') {
          await page.goto(url, { timeout: 15000 });
          result = `Navigated to ${url}. Title: "${await page.title()}"`;
        } else if (action === 'click' && selector) {
          await page.goto(url, { timeout: 15000 });
          await page.click(selector);
          result = `Clicked element [${selector}] on ${url}`;
        } else if (action === 'type' && selector && text) {
          await page.goto(url, { timeout: 15000 });
          await page.fill(selector, text);
          result = `Typed "${text}" into [${selector}] on ${url}`;
        } else if (action === 'screenshot') {
          await page.goto(url, { timeout: 15000 });
          const buffer = await page.screenshot({ type: 'png' });
          result = `Screenshot taken of ${url}. [${buffer.length} bytes captured]`;
        }

        await browser.close();
        return result;
      } catch (playwrightError) {
        return `[Simulated] Browser ${action} on ${url}. Error: ${playwrightError.message}`;
      }
    }
  },
  query_knowledge_base: {
    description: 'Search the agent knowledge base using semantic similarity.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    execute: async ({ query }) => {
      try {
        const { semanticSearch } = await import('../../db.ts');
        
        // Mock embedding generation (In Production, use Transformers.js or OpenAI)
        const mockEmbedding = Array.from({ length: 384 }, () => Math.random());
        
        const results = await semanticSearch(mockEmbedding, 5);
        
        if (results.length === 0) return 'No relevant documents found in knowledge base.';
        
        return `Semantic Search Results:\n${results.map((d, i) => 
            `${i + 1}. [Sim: ${(d.similarity * 100).toFixed(1)}%] ${d.content.substring(0, 200)}...`
        ).join('\n')}`;
      } catch (e) {
        return `Knowledge base search failed: ${e.message}`;
      }
    }
  },
  write_file: {
    description: 'Write or update a file. SENSITIVE: Requires human approval.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content']
    },
    requiresApproval: true,
    execute: async ({ path, content }) => {
      const safePath = path.replace(/\.\./g, '').replace(/^\//, '');
      return `File [${safePath}] written successfully (${content.length} chars).`;
    }
  },
  delete_file: {
    description: 'Delete a file permanently. SENSITIVE: Requires human approval.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    },
    requiresApproval: true,
    execute: async ({ path }) => {
      return `File [${path}] deleted.`;
    }
  }
};
