import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
    name: "Mock-MCP",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});

server.setRequestHandler('tools/list', async () => {
    return {
        tools: [
            {
                name: "mock_calculate",
                description: "Calculates the sum of two numbers",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number" },
                        b: { type: "number" }
                    },
                    required: ["a", "b"]
                }
            }
        ]
    };
});

server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === "mock_calculate") {
        return {
            content: [{ type: "text", text: `The sum is ${args.a + args.b}` }]
        };
    }
    
    throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
