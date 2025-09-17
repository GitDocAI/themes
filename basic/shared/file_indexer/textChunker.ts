import natural from "natural";

const tokenizer = new natural.SentenceTokenizer([]);
import {Chunk} from './model/DocumentData'


interface HeadingInfo {
  level: number;
  text: string;
  line: number;
}

export function extractHeadingsFromMDX(content: string): HeadingInfo[] {
  const lines = content.split('\n');
  const headings: HeadingInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    //Detects headings #
    const hashMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hashMatch) {
      headings.push({
        level: hashMatch[1].length,
        text: hashMatch[2].trim(),
        line: i + 1
      });
      continue;
    }

    if (i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.match(/^=+$/)) {
        headings.push({
          level: 1,
          text: line,
          line: i + 1
        });
      } else if (nextLine.match(/^-+$/)) {
        headings.push({
          level: 2,
          text: line,
          line: i + 1
        });
      }
    }
  }

  return headings;
}

function buildHeadingHierarchy(headings: HeadingInfo[], targetLine: number): string[] {
  const hierarchy: string[] = [];
  const stack: HeadingInfo[] = [];

  for (const heading of headings) {
    if (heading.line > targetLine) break;

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    stack.push(heading);
  }

  return stack.map(h => h.text);
}

function cleanMDXContent(text: string): string {
  return text
    // Block codes
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // Remove JSX syntax
    .replace(/<[^>]+>/g, '')
    // Remove markdown formatting
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/[#`|>~\-!\[\]\(\)\{\}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function chunkText(
  content: string,
  maxWords = 300,
  overlap = 30
): Chunk[] {
  const lines = content.split('\n');
  const headings = extractHeadingsFromMDX(content);
  const cleanedContent = cleanMDXContent(content);

  const sentences = tokenizer.tokenize(cleanedContent);
  if (!sentences || sentences.length === 0) {
    return [];
  }

  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let sentenceIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;

    if (wordCount === 0) continue;

    if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
      const chunkText = currentChunk.join(" ");

      const estimatedLine = Math.floor((sentenceIndex / sentences.length) * lines.length);
      const headingPath = buildHeadingHierarchy(headings, estimatedLine);

      chunks.push({
        text: chunkText,
        headingPath: headingPath.length > 0 ? headingPath : [''],
        startLine: estimatedLine
      });

      const overlapWords = chunkText.split(/\s+/).slice(-overlap);
      currentChunk = overlapWords.length > 0 ? [overlapWords.join(" ")] : [];
      currentWordCount = overlapWords.length;
    }

    currentChunk.push(sentence);
    currentWordCount += wordCount;
    sentenceIndex++;
  }

  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(" ");
    const estimatedLine = Math.floor((sentenceIndex / sentences.length) * lines.length);
    const headingPath = buildHeadingHierarchy(headings, estimatedLine);

    chunks.push({
      text: chunkText,
      headingPath: headingPath.length > 0 ? headingPath : ['(Sin encabezado)'],
      startLine: estimatedLine
    });
  }

  return chunks;
}

