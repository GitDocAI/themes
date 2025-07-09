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
    return <div>Page not found</div>
  }
}
