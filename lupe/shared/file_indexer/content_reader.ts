import fs from "fs";
import path from "path";
import { DocumentData,Chunk } from "./model/DocumentData";
import { chunkText } from "./textChunker";

export async function loadDocuments(folderPath: string): Promise<DocumentData[]> {
  const docs: DocumentData[] = [];

  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const content = await fs.promises.readFile(fullPath, "utf-8");

        const chunks = chunkText(content, 10, 30); // maxWords=120, overlap=30

        chunks.forEach((chunk:Chunk, index:number) => {
          docs.push({
            path: path.relative(folderPath, fullPath),
            chunk: chunk,
          });
        });
      }
    }
  }

  await walk(folderPath);
  return docs;
}

