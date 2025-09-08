import natural from "natural";

export class Chunk {
  path: string;
  lineStart: number;
  lineEnd: number;
  vector: number[];
  processedText: string;

  constructor(path: string, lineStart: number, lineEnd: number) {
    this.path = path;
    this.lineStart = lineStart;
    this.lineEnd = lineEnd;
    this.vector = [];
    this.processedText = "";
  }

  /**
   * Process the text by tokenizing, cleaning, stemming, and calculating term frequency (TF).
   * @param text - The slice of text to process.
   */
  processText(text: string): void {
    // Import the tokenizeCleanStem function
    const { tokenizeCleanStem } = require("../tokenizer/tokenizer");

    // Tokenize, clean, and stem the text
    const tokens = tokenizeCleanStem(text);

    // Store the processed text for IDF computation
    this.processedText = tokens.join(" ");

    // Calculate term frequency (TF)
    const termFrequency = new Map<string, number>();
    tokens.forEach(token => {
      termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
    });

    // Store TF values in a vector
    this.vector = Array.from(termFrequency.values());
  }
}
