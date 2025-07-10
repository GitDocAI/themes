import Head from 'next/head'

export default function InvalidConfigPage() {
  return (
    <html lang="en" className="h-full">
      <Head>
        <title>Invalid Configuration</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body className="h-full bg-background text-primary">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold">
            Invalid Configuration
          </h1>
          <p className="mt-4 text-sm md:text-base text-secondary max-w-md">
            Please check your configuration settings and try again.
          </p>
        </div>
      </body>
    </html>
  )
}
