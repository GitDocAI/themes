import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props) {
  const params = await props.params
  try {
    const mdxPath = params.mdxPath || []
    const { metadata } = await importPage(mdxPath)
    return metadata || {}
  } catch (error) {
    console.error('Error loading metadata:', error)
    return {}
  }
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props) {
  const params = await props.params
  try {
    const mdxPath = params.mdxPath || []
    const result = await importPage(mdxPath)
    const { default: MDXContent, toc, metadata } = result
    return (
      <Wrapper toc={toc} metadata={metadata}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    )
  } catch (error) {
    console.error('Error loading page:', error)

    return (
        <>
         <article id="mdx-content" className=" [grid-area:content] p-3 h-full flex-1 min-h-[60dvh]  ">

            <div className="h-full flex items-center justify-center">
            <h3 class="text-2xl">Page not found</h3>
          </div>
         </article>
        <aside className="hidden xl:block sidebar w-64 flex-shrink-0 sticky top-18 max-h-[90dvh] overflow-y-auto px-6 py-6  [grid-area:toc]">
        </aside>
        </>
    )
   }
}
