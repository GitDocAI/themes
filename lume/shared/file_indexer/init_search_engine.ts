import {loadDocuments} from './content_reader'
import {loadTfIdfIndex,saveTfIdfIndex} from './buildIndex'
import {buildTfIdf} from './content_processor'



export const init = async ()=>{
    console.log('Regenerating search index...')
    const docs = await loadDocuments('content')
    const {vocabulary,tfidf,idf} = buildTfIdf(docs.map(doc=>doc.chunk.text))
    saveTfIdfIndex('static/static_data.json',docs,{vocabulary,tfidf,idf})
    console.log('Search index regenerated successfully')
    return {docs,vocabulary,idf,tfidf}
}


init()
