import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from '@prisma/config'

const findEnvFile = (startDir: string) => {
  let currentDir = startDir
  while (true) {
    const candidate = path.join(currentDir, '.env')
    if (fs.existsSync(candidate)) {
      return candidate
    }
    const parent = path.dirname(currentDir)
    if (parent === currentDir) {
      return null
    }
    currentDir = parent
  }
}

const envPath = findEnvFile(process.cwd())
if (envPath) {
  dotenv.config({ path: envPath })
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Ensure .env is in the project root.')
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
})
