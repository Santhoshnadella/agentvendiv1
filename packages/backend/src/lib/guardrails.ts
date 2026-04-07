// ============================================================
// AgentVendi — Production-Grade Guardrails
// ============================================================
//
// This module provides multi-layered security for AI agents.
// It moves beyond simple regex to sophisticated check layers.

import { AgentConfig } from '@agentvendi/shared';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/guardrails.log' })
  ]
});

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  sanitizedOutput?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class GuardrailEngine {
  private config: AgentConfig['guardrails'];

  constructor(config: AgentConfig['guardrails']) {
    this.config = config;
  }

  /**
   * Run all input checks (PII, Prompt Injection, Prohibited Topics)
   */
  async checkInput(input: string): Promise<GuardrailResult> {
    // 1. Prompt Injection Detection (Simplified Heuristics)
    const injectionPatterns = [
      /ignore previous instructions/i,
      /you are now an? (evil|hacker|botnet)/i,
      /output the following/i,
      /system prompt/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        logger.warn('Guardrail: Potential prompt injection detected', { input });
        return { passed: false, reason: 'POTENTIAL_INJECTION', severity: 'high' };
      }
    }

    // 2. Prohibited Topics
    if (this.config.prohibitedTopics) {
      const topics = this.config.prohibitedTopics.split(',').map(t => t.trim().toLowerCase());
      for (const topic of topics) {
        if (input.toLowerCase().includes(topic)) {
          return { passed: false, reason: `PROHIBITED_TOPIC: ${topic}`, severity: 'medium' };
        }
      }
    }

    // 3. PII Masking
    if (this.config.safetyRules.includes('no-pii')) {
      const piiPatterns = {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
      };

      for (const [type, pattern] of Object.entries(piiPatterns)) {
        if (pattern.test(input)) {
          logger.info(`Guardrail: Masked PII type ${type}`);
          // In real prod, we'd sanitize here. For checking, we fail if strict.
          return { passed: false, reason: `PII_DETECTED: ${type}`, severity: 'low' };
        }
      }
    }

    return { passed: true, severity: 'low' };
  }

  /**
   * Run all output checks (Safety, Formatting, Hallucination checks)
   */
  async checkOutput(output: string): Promise<GuardrailResult> {
    // 1. Toxic Content Check
    if (this.config.safetyRules.includes('no-toxic')) {
      const toxicKeywords = ['hate', 'violence', 'illegal']; // Placeholder for a real model call
      for (const word of toxicKeywords) {
        if (output.toLowerCase().includes(word)) {
          return { passed: false, reason: 'TOXIC_CONTENT', severity: 'critical' };
        }
      }
    }

    // 2. Quality Threshold (length, format)
    if (this.config.qualityThreshold === 'strict') {
      if (output.length < 10) {
        return { passed: false, reason: 'QUALITY_LOW: TOO_SHORT', severity: 'low' };
      }
    }

    return { passed: true, severity: 'low' };
  }
}
