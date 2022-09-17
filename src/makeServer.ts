import {
  readEnvVar,
  EnvVarErrors,
  observeEnvVarErrors,
  readURLFromEnvVar,
} from './utils/readEnvVar'
import express from 'express'
import * as IOE from 'fp-ts/IOEither'
import * as TE from 'fp-ts/TaskEither'
import * as C from 'fp-ts/Console'
import { toRequestHandler } from 'hyper-ts/lib/express'
import { routerMiddleware } from './hyper-ts-routing/routing'
import { handlers, router } from './routes'
import { defaultErrorHandler } from './hyper-ts-routing/defaultErrorHandler'
import { PrismaClient } from '@prisma/client'
import { pipe } from 'fp-ts/lib/function'
import { makeStandardError } from './hyper-ts-routing/routeError'
import bodyParser from 'body-parser'
import { ServerEnv, FinnhubApiKey } from './serverEnv'
import { fromNewtype, NonEmptyString } from 'io-ts-types'
import { Member, create, _ } from '@unsplash/sum-types'
import * as pc from 'picocolors'

export type StartupServerErrors =
  | Member<'GenericError', { error: Error }>
  | EnvVarErrors

const startupServerErrors = create<StartupServerErrors>()

export const observeStartupServerErrors = (e: StartupServerErrors) =>
  startupServerErrors.match({
    GenericError: ({ error }) =>
      C.error(`Generic error: ${pc.yellow(JSON.stringify(error))}`),
    /* TODO ~~ forgive me for my sins: is there a way of setting up a default handler? */
    [_]: () => observeEnvVarErrors(e as EnvVarErrors),
  })(e)

export const makeServer = (env: ServerEnv) =>
  express()
    .use(bodyParser.json())
    .use(
      toRequestHandler(
        routerMiddleware(router, handlers, defaultErrorHandler)(env),
      ),
    )

export const makeServerEnv: TE.TaskEither<StartupServerErrors, ServerEnv> =
  pipe(
    IOE.Do,
    IOE.apS(
      'finnhubApiKey',
      readEnvVar(fromNewtype<FinnhubApiKey>(NonEmptyString))('FINNHUB_API_KEY'),
    ),
    IOE.apS('finnhubEndpoint', readURLFromEnvVar('FINNHUB_ENDPOINT')),
    TE.fromIOEither,
    TE.apSW(
      'prismaClient',
      TE.tryCatch(
        async () => {
          const prismaClient = new PrismaClient()
          await prismaClient.$connect()
          return prismaClient
        },
        (reason) =>
          startupServerErrors.mk.GenericError({
            error: makeStandardError(reason),
          }),
      ),
    ),
  )
