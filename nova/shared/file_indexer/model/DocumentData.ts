
export interface DocumentData {
  path: string;
  chunk:Chunk ;
}

export interface Chunk {
  text: string;
  headingPath: string[];
  startLine?: number;
  endLine?: number;
}

