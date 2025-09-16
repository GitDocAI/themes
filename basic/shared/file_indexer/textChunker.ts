import natural from "natural";

const tokenizer = new natural.SentenceTokenizer([]);

export function chunkText(text: string, maxWords = 100, overlap = 20): string[] {
  const sentences = tokenizer.tokenize(text.replace(/[#`*_|>~\-!\[\]\(\)\{\}]/g, ""));

  if (!sentences || sentences.length === 0) {
      return [];
  }

  const chunks: string[] = [];

  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;

    if (wordCount === 0) {
        continue;
    }

    if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));

      const overlapWords = currentChunk.join(" ").split(/\s+/).slice(-overlap);
      currentChunk = overlapWords.length > 0 ? [overlapWords.join(" ")] : [];
      currentWordCount = overlapWords.length;
    }

    currentChunk.push(sentence);
    currentWordCount += wordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

