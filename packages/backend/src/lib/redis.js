import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
    constructor() {
        this.client = null;
        this.pub = null;
        this.sub = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            const redisConfig = {
                maxRetriesPerRequest: null,
                retryStrategy: (times) => Math.min(times * 50, 2000)
            };
            this.client = new Redis(REDIS_URL, redisConfig);
            this.pub = new Redis(REDIS_URL, redisConfig);
            this.sub = new Redis(REDIS_URL, redisConfig);

            this.client.on('error', (err) => console.error('Redis Client Error:', err));
            this.pub.on('error', (err) => console.error('Redis Pub Error:', err));
            this.sub.on('error', (err) => console.error('Redis Sub Error:', err));

            this.initialized = true;
            console.log('📡 Redis connection initialized');
        } catch (err) {
            console.error('Failed to initialize Redis:', err);
        }
    }

    async get(key) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
    }

    async set(key, value, expiry = 3600) {
        return await this.client.set(key, JSON.stringify(value), 'EX', expiry);
    }

    async hset(key, field, value) {
        return await this.client.hset(key, field, JSON.stringify(value));
    }

    async hget(key, field) {
        const val = await this.client.hget(key, field);
        return val ? JSON.parse(val) : null;
    }

    async hgetall(key) {
        const data = await this.client.hgetall(key);
        const parsed = {};
        for (const [k, v] of Object.entries(data)) {
            try {
                parsed[k] = JSON.parse(v);
            } catch {
                parsed[k] = v;
            }
        }
        return parsed;
    }

    async publish(channel, message) {
        return await this.pub.publish(channel, JSON.stringify(message));
    }

    subscribe(channel, callback) {
        this.sub.subscribe(channel);
        this.sub.on('message', (chan, msg) => {
            if (chan === channel) {
                try {
                    callback(JSON.parse(msg));
                } catch {
                    callback(msg);
                }
            }
        });
    }
}

export const redis = new RedisManager();
