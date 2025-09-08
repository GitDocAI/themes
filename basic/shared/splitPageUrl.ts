
  export const splitPageUrl = (page:string)=>{
    const chunks = page.split('/')
    chunks[chunks.length-1] = chunks[chunks.length-1].split('.')[0]
    console.log(chunks.join('/'))
    return chunks.join('/')
  }
