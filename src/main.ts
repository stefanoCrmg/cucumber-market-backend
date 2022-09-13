import express from 'express'
import * as C from 'fp-ts/Console'
import * as TE from 'fp-ts/TaskEither'
import { toRequestHandler } from 'hyper-ts/lib/express'
import { routerMiddleware } from './hyper-ts-utilities/routing'
import { handlers, router } from './routes'
import { defaultErrorHandler } from './hyper-ts-utilities/defaultErrorHandler'
import { PrismaClient } from '@prisma/client'
import { identity, pipe } from 'fp-ts/lib/function'
import { makeStandardError } from './hyper-ts-utilities/routeError'
import { exit } from 'process'
import bodyParser from 'body-parser'

pipe(
  TE.tryCatch(
    async () => {
      const prismaClient = new PrismaClient()
      await prismaClient.$connect()
      return prismaClient
    },
    (reason) => makeStandardError(reason),
  ),
  TE.bindTo('prismaClient'),
  TE.map((dbEnv) =>
    express()
      .use(bodyParser.json())
      .use(
        toRequestHandler(
          routerMiddleware(router, handlers, defaultErrorHandler)(dbEnv),
        ),
      )
      .listen(3000, () => console.log('Express listening on port 3000')),
  ),
  TE.orElseW((e) => pipe(C.error(`Error: ${JSON.stringify(e)}`), TE.fromIO)),
  TE.matchW(() => {
    exit(1)
  }, identity),
)()
