import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { getDB, query, querySingle } from '../../db.js';
import { v4 as uuidv4 } from 'uuid';

export class MCPManager {
    constructor() {
        this.clients = new Map(); // serverId -> Client instance
    }

    async init() {
        // Load servers from DB
        const servers = await query("SELECT * FROM mcp_servers WHERE status != 'deleted'", []);
        for (const server of servers) {
            await this.connectToServer(server).catch(e => {
                console.error(`Failed to connect to MCP Server ${server.name}:`, e.message);
            });
        }
    }

    async connectToServer(serverConfig) {
        let transport;
        
        if (serverConfig.transport_type === 'stdio') {
            const parts = serverConfig.connection_string.split(' ');
            const command = parts[0];
            const args = parts.slice(1);
            transport = new StdioClientTransport({ command, args });
        } else if (serverConfig.transport_type === 'sse') {
            transport = new SSEClientTransport(new URL(serverConfig.connection_string));
        } else {
            throw new Error(`Unsupported transport type: ${serverConfig.transport_type}`);
        }

        const client = new Client({
            name: "AgentVendi-MCP-Client",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        });

        // Set up connection logic
        try {
            await client.connect(transport);
            this.clients.set(serverConfig.id, client);
            await query("UPDATE mcp_servers SET status = 'online' WHERE id = ?", [serverConfig.id]);
            
            // Sync tools
            await this.syncTools(serverConfig.id, client);
            return client;
        } catch (e) {
            await query("UPDATE mcp_servers SET status = 'offline' WHERE id = ?", [serverConfig.id]);
            throw e;
        }
    }

    async syncTools(serverId, client) {
        try {
            const toolsResponse = await client.request({ method: 'tools/list' });
            
            // Clear existing for this server
            await query('DELETE FROM mcp_tools WHERE server_id = ?', [serverId]);
            
            if (toolsResponse && toolsResponse.tools) {
                for (const tool of toolsResponse.tools) {
                    await query(`
                        INSERT INTO mcp_tools (id, server_id, name, description, schema)
                        VALUES (?, ?, ?, ?, ?)
                    `, [uuidv4(), serverId, tool.name, tool.description || '', JSON.stringify(tool.inputSchema)]);
                }
            }
        } catch (e) {
            console.error(`Failed to sync tools for server ${serverId}:`, e.message);
        }
    }

    async callTool(serverName, toolName, args) {
        // Find server
        const server = await querySingle('SELECT * FROM mcp_servers WHERE name = ?', [serverName]);
        if (!server) throw new Error(`MCP Server ${serverName} not found`);

        const client = this.clients.get(server.id);
        if (!client) throw new Error(`MCP Server ${serverName} is offline`);

        try {
            const response = await client.request(
                { method: 'tools/call', params: { name: toolName, arguments: args } }
            );
            return response;
        } catch (e) {
            if (e.message.includes('disconnected')) {
                await query("UPDATE mcp_servers SET status = 'offline' WHERE id = ?", [server.id]);
                this.clients.delete(server.id);
            }
            throw e;
        }
    }

    async removeServer(id) {
        const client = this.clients.get(id);
        if (client) {
            // No explicit disconnect in SDK without transport close, but we can clear ref
            this.clients.delete(id);
        }
        await query("DELETE FROM mcp_servers WHERE id = ?", [id]);
    }
}

// Singleton
export const mcpManager = new MCPManager();
