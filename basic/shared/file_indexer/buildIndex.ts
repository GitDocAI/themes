import fs from "fs";
import { DocumentData } from "./model/DocumentData";
export function saveTfIdfIndex(
  path: string,
  docs: DocumentData[],
  index: { vocabulary: string[]; tfidf: any,idf:number[] }
) {
  const data = {
    docs,
    vocabulary: index.vocabulary,
    idf:index.idf,
    tfidf: index.tfidf,
  };
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function loadTfIdfIndex(path: string): {
  docs: string[];
  vocabulary: string[];
  tfidf: number[][];
} {
  const raw = fs.readFileSync(path, "utf-8");
  return JSON.parse(raw);
}
