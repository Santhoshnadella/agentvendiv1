import fetch from 'node-fetch'; // assuming node 18+ global fetch or configured node-fetch

export class A2AClient {
    constructor(agentBaseUrl, apiKey) {
        this.baseUrl = agentBaseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.endpoints = null;
    }

    async discover() {
        const res = await fetch(`${this.baseUrl}/.well-known/agent.json`);
        if (!res.ok) throw new Error('Failed to fetch AgentCard');
        const card = await res.json();
        this.endpoints = card.endpoints || {};
        return card;
    }

    async sendTask(agentId, payload) {
        if (!this.endpoints) await this.discover();
        if (!this.endpoints.send) throw new Error('Agent does not support /send endpoint');

        const res = await fetch(`${this.baseUrl}${this.endpoints.send}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ agent_id: agentId, payload })
        });
        
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`A2A Send failed: ${err}`);
        }
        
        return res.json(); // { task_id, status }
    }

    async getTaskResult(taskId) {
        if (!this.endpoints) await this.discover();
        if (!this.endpoints.get) throw new Error('Agent does not support /get endpoint');

        const res = await fetch(`${this.baseUrl}${this.endpoints.get}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ task_id: taskId })
        });
        
        if (!res.ok) throw new Error('A2A Get failed');
        return res.json();
    }
}
