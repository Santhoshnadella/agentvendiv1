/**
 * WebAI — Transformers.js Integration
 * Runs AI models directly in the browser as a fallback or server-less mode.
 */

let pipeline = null;

export async function initWebAI() {
  if (pipeline) return;
  
  try {
     const { pipeline: loadPipeline } = await import('@xenova/transformers');
     // Using a super tiny model for demo/fallback efficiency: distilbert
     pipeline = await loadPipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
     console.log('✅ WebAI Pipeline Ready');
  } catch (err) {
     console.warn('WebAI initialization failed:', err);
  }
}

export async function runLocalLogic(text) {
  if (!pipeline) await initWebAI();
  if (!pipeline) return "Local AI not available.";
  
  try {
     const results = await pipeline(text);
     return `[WebAI Local Analysis]: This input seems to be ${results[0].label} (Confidence: ${Math.round(results[0].score * 100)}%)`;
  } catch (err) {
     return `Local AI Error: ${err.message}`;
  }
}

// Simple RAG simulation using keyword matching
export async function localRAGSearch(query, docs) {
  const words = query.toLowerCase().split(' ');
  const scored = docs.map(doc => {
     let score = 0;
     words.forEach(w => { if (doc.content.toLowerCase().includes(w)) score++; });
     return { ...doc, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}
