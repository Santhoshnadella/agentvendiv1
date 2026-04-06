// ============================================================
// Suggestions AI — In-browser semantic intelligence
// ============================================================

import { pipeline } from '@xenova/transformers';

let extractor = null;

// Load the model lazily
async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

/**
 * Calculates cosine similarity between two embeddings
 */
function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Suggests skills based on agent description
 */
export async function suggestSkills(description, allSkills) {
  if (!description) return [];
  
  const extractor = await getExtractor();
  const descEmbedding = await extractor(description, { pooling: 'mean', normalize: true });
  
  const results = [];
  for (const skill of allSkills) {
    const skillEmbedding = await extractor(skill.name + " " + skill.description, { pooling: 'mean', normalize: true });
    const score = cosineSimilarity(descEmbedding.data, skillEmbedding.data);
    results.push({ ...skill, score });
  }
  
  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Validates if the selected role matches the guardrails
 */
export async function crossValidate(role, guards) {
  const extractor = await getExtractor();
  // Simplified logic for brevity: checks if guardrails are "relevant" to role
  const roleEmb = await extractor(role, { pooling: 'mean', normalize: true });
  const guardEmb = await extractor(guards.join(' '), { pooling: 'mean', normalize: true });
  
  return cosineSimilarity(roleEmb.data, guardEmb.data);
}
