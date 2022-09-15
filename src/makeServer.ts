import express from 'express'
import * as TE from 'fp-ts/TaskEither'
import { toRequestHandler } from 'hyper-ts/lib/express'
import { routerMiddleware } from './hyper-ts-routing/routing'
import { handlers, router } from './routes'
import { defaultErrorHandler } from './hyper-ts-routing/defaultErrorHandler'
import { PrismaClient } from '@prisma/client'
import { pipe } from 'fp-ts/lib/function'
import { makeStandardError } from './hyper-ts-routing/routeError'
import bodyParser from 'body-parser'
import { ServerEnv } from './serverEnv'

export const makeServer = (env: ServerEnv) =>
  express()
    .use(bodyParser.json())
    .use(
      toRequestHandler(
        routerMiddleware(router, handlers, defaultErrorHandler)(env),
      ),
    )

export const makeServerEnv: TE.TaskEither<Error, ServerEnv> = pipe(
  TE.tryCatch(
    async () => {
      const prismaClient = new PrismaClient()
      await prismaClient.$connect()
      return prismaClient
    },
    (reason) => makeStandardError(reason),
  ),
  TE.bindTo('prismaClient'),
)
