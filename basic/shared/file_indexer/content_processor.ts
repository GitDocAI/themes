import natural from "natural";

export function tokenize(text: string): string[] {
  const tokenizer = new natural.WordTokenizer();
  const stemmer = natural.PorterStemmer; // también está LancasterStemmer o stemmers para otros idiomas

  return tokenizer
    .tokenize(text.toLowerCase())
    .map((t) => t.replace(/[^a-z0-9]/gi, ""))
    .filter((t) => t.length > 2)
    .map((t) => stemmer.stem(t));
}


function calculateTf(docTokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  const totalTerms = docTokens.length;

  docTokens.forEach(term => {
    tf[term] = (tf[term] || 0) + 1;
  });

  Object.keys(tf).forEach(term => {
    tf[term] = tf[term];
  });

  return tf;
}

export function buildTfIdf(docs: string[]): {vocabulary:string[],tfidf:number[][],idf:number[]} {
  const tfidf = new natural.TfIdf();

  const vocabulary_set= new Set<string>()
  docs.forEach((doc) => {
    const tokens = tokenize(doc);
    tokens.forEach(token=>vocabulary_set.add(token))
    tfidf.addDocument(tokens.join(" "));
  });

  const vocabulary = [...vocabulary_set]

  const idf_list:any=[];
  vocabulary.forEach(term=>{
    const term_idf=tfidf.idf(term)
    idf_list.push(term_idf)
  })

  const document_vectors:number[][]=[]

  docs.forEach((doc,index) => {
    const vector = new Array(vocabulary.length).fill(0);
    vocabulary.forEach((term,i)=>{
      vector[i]=tfidf.tfidf(term,index)
    })
    document_vectors.push(vector)
  })


  return {vocabulary,tfidf:document_vectors,idf:idf_list};
}

export function searchTfIdf(
  tfidf: natural.TfIdf,
  query: string,
  topN: number = 5
): { docIndex: number; score: number }[] {
  const results: { docIndex: number; score: number }[] = [];

  tfidf.tfidfs(query, (i, measure) => {
    results.push({ docIndex: i, score: measure });
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
