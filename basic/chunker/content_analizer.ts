import { promises as fs } from "fs";
import { tokenizeCleanStem, precomputeIdf, vectorizeDocument } from "./tokenizer";
import { Chunk } from "./models/Chunk";

/**
 * Reads and chunks the content of a file.
 * @param filePath The path to the file to read and chunk.
 * @param chunkSize The number of lines per chunk.
 * @returns An array of Chunk objects.
 */
async function chunkFile(filePath: string, chunkSize: number): Promise<Chunk[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const chunks: Chunk[] = [];

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunkLines = lines.slice(i, i + chunkSize);
    const chunk = new Chunk(filePath, i + 1, i + chunkLines.length);
    chunk.processText(chunkLines.join(" "));
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Indexes all content files in the "content" directory and calculates their TF-IDF vectors.
 */
export const index_content_files = async () => {
  try {
    const files = await readFilesFromDir("content");
    const allChunks: Chunk[] = [];

    for (const file of files) {
      const chunks = await chunkFile(file, 10); // Chunk files into pieces of 10 lines each
      allChunks.push(...chunks);
    }

    // Collect all chunk processed texts for IDF computation
    const allTexts = allChunks.map(chunk => chunk.processedText);
    const idfMap = precomputeIdf(allTexts);

    // Vectorize all chunks using the precomputed IDF
    allChunks.forEach(chunk => {
      chunk.vector = vectorizeDocument(chunk.processedText, idfMap);
    });

    return allChunks;
  } catch (error) {
    console.error("Error indexing content files:", error);
  }
};

import * as path from "path";

/**
 * Recursively reads all files from a directory.
 * @param dirPath The path to the directory to read files from.
 * @returns A promise that resolves with a list of file paths.
 */
async function readFilesFromDir(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // Recursive call for subdirectories
        return await readFilesFromDir(fullPath);
      } else if (entry.isFile()) {
        // Add file paths
        return fullPath;
      }
      return []; // Skip non-file and non-directory entries
    })
  );

  return files.flat(); // Flatten nested arrays of files
}

