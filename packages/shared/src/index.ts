import { z } from 'zod';

export const AgentRoleSchema = z.object({
  title: z.string(),
  persona: z.string(),
  tone: z.enum(['direct', 'professional', 'mentor', 'creative', 'friendly', 'technical']),
  objectives: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
});

export const AgentConfigSchema = z.object({
  mode: z.enum(['single', 'multi']),
  behavior: z.object({
    responseStyle: z.string(),
    autonomy: z.number().min(0).max(100),
    toolUse: z.boolean(),
    errorHandling: z.string().optional(),
    creativity: z.number().optional(),
    verbosity: z.string().optional(),
  }),
  knowledge: z.object({
    domains: z.array(z.string()),
    customText: z.string().optional(),
    urls: z.array(z.string()).optional(),
    fileRefs: z.array(z.string()).optional(),
  }),
  role: AgentRoleSchema,
  guardrails: z.object({
    safetyRules: z.array(z.string()),
    contentPolicies: z.array(z.string()),
    outputFormat: z.string().optional(),
    prohibitedTopics: z.string().optional(),
    qualityThreshold: z.string().optional(),
    customRules: z.string().optional(),
  }),
  skills: z.object({
    selected: z.array(z.string()),
    custom: z.array(z.object({
      name: z.string(),
      desc: z.string()
    })).optional(),
  }),
  cognitive: z.object({
    answers: z.record(z.string(), z.any()).optional(),
    chatHistory: z.array(z.any()).optional(),
    profile: z.any().optional(),
  }).optional(),
});

export type AgentRole = z.infer<typeof AgentRoleSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const AgentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  config: AgentConfigSchema,
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
