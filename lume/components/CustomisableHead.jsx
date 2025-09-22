import { Head } from 'nextra/components'



export default function CustomHead({ colorscheme, favicon }) {
  const headProps = { ...colorscheme }
  return (
    <Head {...headProps} >
    </Head>
  )
}
