import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vitest/config'

const fileExists = (filePath: string): boolean => fs.existsSync(filePath)

const resolveJsToTs = (source: string, importer: string | undefined): string | null => {
  if (!importer || !source.endsWith('.js')) return null

  const jsFilePath = path.resolve(path.dirname(importer), source)
  const tsFilePath = jsFilePath.replace(/\.js$/, '.ts')

  // If the .js file doesn't exist but the .ts file does, resolve to the .ts file.
  return !fileExists(jsFilePath) && fileExists(tsFilePath) ? tsFilePath : null
}

const jsToTsResolver = {
  name: 'jsToTsResolver',
  resolveId(source: string, importer: string | undefined) {
    return resolveJsToTs(source, importer)
  },
}

export default defineConfig({
  test: { retry: 0, reporters: ['basic'], testTimeout: process.env.CI ? 10_000 : 5_000 },
  plugins: [jsToTsResolver],
})
