import {loadDocuments} from './content_reader'
import {loadTfIdfIndex,saveTfIdfIndex} from './buildIndex'
import {buildTfIdf} from './content_processor'



export const init = async ()=>{
    try{
      const tf_idf_index =loadTfIdfIndex('public/static_data.json')
      return tf_idf_index
    }
    catch(e){
      const docs = await loadDocuments('content')
      const {vocabulary,tfidf,idf} = buildTfIdf(docs.map(doc=>doc.chunk.text))
      saveTfIdfIndex('public/static_data.json',docs,{vocabulary,tfidf,idf})
      return {docs,vocabulary,idf,tfidf}
    }
}


init()
