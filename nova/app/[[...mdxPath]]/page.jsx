import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props) {
  const params = await props.params
  try {
    const mdxPath = params.mdxPath || []
    // Ignore Chrome DevTools requests
    if (mdxPath[0] === '.well-known') {
      return {}
    }
    const { metadata } = await importPage(mdxPath)
    return metadata || {}
  } catch (error) {
    // Only log non-404 errors
    if (!error.message?.includes('404') && !error.message?.includes('MODULE_NOT_FOUND')) {
      console.error('Error loading metadata:', error)
    }
    return {}
  }
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
  const params = await props.params
  try {
    const mdxPath = params.mdxPath || []
    // Ignore Chrome DevTools requests
    if (mdxPath[0] === '.well-known') {
      return (
        <>
          <article id="mdx-content" className=" [grid-area:content] p-3 h-full flex-1 min-h-[60dvh]  ">
            <div className="h-full flex items-center justify-center">
              <h3 className="text-2xl">Page not found</h3>
            </div>
          </article>
          <aside className="hidden xl:block sidebar w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6  [grid-area:toc]">
          </aside>
        </>
      )
    }
    const result = await importPage(mdxPath)
    const { default: MDXContent, toc, metadata } = result
    return (
      <Wrapper toc={toc} metadata={metadata}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    )
  } catch (error) {
    // Only log non-404 errors
    if (!error.message?.includes('404') && !error.message?.includes('MODULE_NOT_FOUND')) {
      console.error('Error loading page:', error)
    }

    return (
        <>
         <article id="mdx-content" className=" [grid-area:content] p-3 h-full flex-1 min-h-[60dvh]  ">

            <div className="h-full flex items-center justify-center">
            <h3 className="text-2xl">Page not found</h3>
          </div>
         </article>
        <aside className="hidden xl:block sidebar w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6  [grid-area:toc]">
        </aside>
        </>
    )
   }
}
