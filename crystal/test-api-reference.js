// Quick test of API reference utilities
import { isApiReferencePath, getApiReferenceJsonPath } from './src/utils/apiReferenceUtils.ts'

const testPaths = [
  'v1.0.0/api_reference/applications/create_application.mdx',
  '/v1.0.0/api_reference/authentication/validate_token.mdx',
  'v1.0.0/documentation/getting_started/installation.mdx',
  '/v1.0.0/api_reference/system/get_all_logs.mdx'
]

console.log('Testing API Reference Path Detection:')
console.log('=' .repeat(50))

testPaths.forEach(path => {
  const isApiRef = isApiReferencePath(path)
  const jsonPath = getApiReferenceJsonPath(path)
  console.log(`\nPath: ${path}`)
  console.log(`Is API Reference: ${isApiRef}`)
  console.log(`JSON Path: ${jsonPath}`)
})
