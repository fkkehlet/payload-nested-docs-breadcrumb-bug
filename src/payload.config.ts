import { postgresAdapter } from '@payloadcms/db-postgres'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Pages } from './collections/Pages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Pages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'test-secret-key-for-reproduction',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    nestedDocsPlugin({
      collections: ['pages'],
      generateURL: (docs) =>
        docs.reduce((url, doc) => `${url}/${doc.slug || ''}`, ''),
    }),
  ],
  localization: {
    defaultLocale: 'en',
    fallback: false,
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
    ],
  },
})
