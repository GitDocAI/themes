import fs from "fs";
import natural from "natural";
import { tokenize } from "./content_processor"; // tu función con stemmer

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function vectorizeQuery(query: string, vocabulary: string[], idf: number[]): number[] {
  const tokens = tokenize(query);
  const counts = new Map<string, number>();
  tokens.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));

  return vocabulary.map((term, i) => {
    const tf = counts.get(term) || 0;
    return (tf/tokens.length) * idf[i];
  });
}

export function search(query: string, docs: string[], index: any, topK = 5) {
  const { vocabulary, idf, tfidf } = index;

  const queryVec = vectorizeQuery(query, vocabulary, idf);

  const scores = docs.map((doc, i) => {
    return { doc, score: cosineSimilarity(queryVec, tfidf[i]) };
  });

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
