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
      const {vocabulary,tfidf,idf} = buildTfIdf(docs.map(doc=>doc.content))
      saveTfIdfIndex('public/static_data.json',docs.map(doc=>({...doc,content:doc.content.slice(1,100)})),{vocabulary,tfidf,idf})
      return {vocabulary,idf,tfidf}
    }
}
