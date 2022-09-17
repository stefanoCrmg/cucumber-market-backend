import { NonEmptyString } from 'io-ts-types'
import type { PrismaClient } from '@prisma/client'
import { iso, Newtype } from 'newtype-ts'
export interface FinnhubApiKey
  extends Newtype<{ readonly OnfidoApiToken: unique symbol }, NonEmptyString> {}
export const FinnhubApiKey = iso<FinnhubApiKey>()

export interface Finnhub {
  finnhubApiKey: FinnhubApiKey
  finnhubEndpoint: URL
}
export interface DBEnv {
  prismaClient: PrismaClient
}

export interface ExternalAPIsEnv extends Finnhub {}

export interface ServerEnv extends DBEnv, ExternalAPIsEnv {}
