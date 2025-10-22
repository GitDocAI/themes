import {loadDocuments} from './content_reader'
import {loadTfIdfIndex,saveTfIdfIndex} from './buildIndex'
import {buildTfIdf} from './content_processor'



export const init = async ()=>{
    const docs = await loadDocuments('content')
    const {vocabulary,tfidf,idf} = buildTfIdf(docs.map(doc=>doc.chunk.text))
    saveTfIdfIndex('public/static_data.json',docs,{vocabulary,tfidf,idf})
    return {docs,vocabulary,idf,tfidf}
}


init()
