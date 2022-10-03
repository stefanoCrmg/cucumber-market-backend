import { flow } from 'fp-ts/function'
import * as _nonemptyString from 'fp-ts-std/NonEmptyString'
import type { PrismaClient } from '@prisma/client'
import { iso, Newtype } from 'newtype-ts'
import { NonEmptyString } from 'io-ts-types'
import { DestinationStream, Logger as _Logger, LoggerOptions } from 'pino'

export interface PolygonApiKey
  extends Newtype<{ readonly PolygonApiKey: unique symbol }, NonEmptyString> {}
export const PolygonApiKey = iso<PolygonApiKey>()
export const unwrapPolygonApiKey: (s: PolygonApiKey) => string = flow(
  PolygonApiKey.unwrap,
  (nonEmptyString) => nonEmptyString.toString(),
)

export interface PolygonEnv {
  polygonApiKey: {
    readonly main: PolygonApiKey
    readonly backup: PolygonApiKey
  }
  polygonEndpoint: URL
}
export interface DBEnv {
  prismaClient: PrismaClient
}

export interface LoggerEnv {
  logger: _Logger<LoggerOptions | DestinationStream>
}
export interface ExternalAPIsEnv extends PolygonEnv {}

export interface ServerEnv extends ExternalAPIsEnv, LoggerEnv {}
