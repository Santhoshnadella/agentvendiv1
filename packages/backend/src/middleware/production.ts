import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/production-audit.log' }),
  ]
});

// Production-grade audit logger
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('API Call Audit', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
      user: (req as any).user?.id || 'anonymous'
    });
  });
  next();
};

// Rate limiting by user/tier
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => {
    if ((req as any).user?.tier === 'enterprise') return 1000;
    return 100;
  },
  message: { error: 'Rate limit exceeded. Please upgrade for more throughput.' }
});

// Token & Cost Management logic (simplified)
export const costManager = {
  logTokenUsage: (userId: string, tokens: number, model: string) => {
    const costPer1k = model.includes('gpt-4') ? 0.03 : 0.002;
    const estCost = (tokens / 1000) * costPer1k;
    logger.info('Usage Cost Report', { userId, tokens, model, estCost });
  }
};
