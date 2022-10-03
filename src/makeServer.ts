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
import { pipe } from 'fp-ts/lib/function'
import bodyParser from 'body-parser'
import { ServerEnv, PolygonApiKey, PolygonEnv } from './serverEnv'
import { fromNewtype, NonEmptyString } from 'io-ts-types'
import { Member, create, _ } from '@unsplash/sum-types'
import * as pc from 'picocolors'
import pino from 'pino'
import cors from 'cors'
import { sequenceS } from 'fp-ts/lib/Apply'

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
    .use(cors())
    .use(
      toRequestHandler(
        routerMiddleware(router, handlers, defaultErrorHandler)(env),
      ),
    )

const readAllPolygonKeys: IOE.IOEither<
  EnvVarErrors,
  PolygonEnv['polygonApiKey']
> = sequenceS(IOE.ApplyPar)({
  main: readEnvVar(fromNewtype<PolygonApiKey>(NonEmptyString))(
    'POLYGON_API_KEY',
  ),
  backup: readEnvVar(fromNewtype<PolygonApiKey>(NonEmptyString))(
    'POLYGON_BACKUP_API_KEY',
  ),
})

export const makeServerEnv: TE.TaskEither<StartupServerErrors, ServerEnv> =
  pipe(
    IOE.Do,
    IOE.apS('polygonApiKey', readAllPolygonKeys),
    IOE.apS('polygonEndpoint', readURLFromEnvVar('POLYGON_ENDPOINT')),
    IOE.apS(
      'logger',
      IOE.fromIO(() => pino()),
    ),
    TE.fromIOEither,
    // TE.apSW(
    // 'prismaClient',
    // TE.tryCatch(
    // async () => {
    // const prismaClient = new PrismaClient()
    // await prismaClient.$connect()
    // return prismaClient
    // },
    // (reason) =>
    // startupServerErrors.mk.GenericError({
    // error: makeStandardError(reason),
    // }),
    // ),
    // ),
  )
