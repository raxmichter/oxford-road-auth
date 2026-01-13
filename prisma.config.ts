import path from 'node:path'
import { config } from 'dotenv'

// Load .env.local
config({ path: path.resolve(__dirname, '.env.local') })

import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
