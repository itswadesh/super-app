import { apiReference } from '@scalar/hono-api-reference'

import type { AppOpenAPI } from './types'

import packageJSON from '../../../package.json' with { type: 'json' }

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: packageJSON.version,
      title: 'Township API',
    },
  })

  app.get(
    '/docs',
    apiReference({
      theme: 'kepler',
      defaultHttpClient: {
        targetKey: 'javascript',
        clientKey: 'fetch',
      },
      spec: {
        url: '/api/doc',
      },
    })
  )
}
