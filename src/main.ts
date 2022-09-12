import express from 'express'
import { toRequestHandler } from 'hyper-ts/lib/express'
import { routerMiddleware } from './hyper-ts-utilities/routing'
import { handlers, router } from './routes'
import { defaultErrorHandler } from './hyper-ts-utilities/defaultErrorHandler'

express()
  .use(
    toRequestHandler(
      routerMiddleware(router, handlers, defaultErrorHandler)({}),
    ),
  )
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
