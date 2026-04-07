import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
    constructor() {
        this.client = null;
        this.pub = null;
        this.sub = null;
    }

    init() {
        if (!this.client) {
            this.client = new Redis(REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => Math.min(times * 50, 2000)
            });
            this.pub = new Redis(REDIS_URL);
            this.sub = new Redis(REDIS_URL);

            this.client.on('error', (err) => console.error('Redis Client Error:', err));
            console.log('📡 Redis connection initialized');
        }
    }

    async get(key) {
        return await this.client.get(key);
    }

    async set(key, value, expiry = 3600) {
        return await this.client.set(key, JSON.stringify(value), 'EX', expiry);
    }

    async publish(channel, message) {
        return await this.pub.publish(channel, JSON.stringify(message));
    }

    subscribe(channel, callback) {
        this.sub.subscribe(channel);
        this.sub.on('message', (chan, msg) => {
            if (chan === channel) {
                callback(JSON.parse(msg));
            }
        });
    }
}

export const redis = new RedisManager();
