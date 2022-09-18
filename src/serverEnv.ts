import { flow } from 'fp-ts/function'
import * as _nonemptyString from 'fp-ts-std/NonEmptyString'
import type { PrismaClient } from '@prisma/client'
import { iso, Newtype } from 'newtype-ts'
import { NonEmptyString } from 'io-ts-types'

export interface FinnhubApiKey
  extends Newtype<{ readonly FinnhubApiKey: unique symbol }, NonEmptyString> {}
export const FinnhubApiKey = iso<FinnhubApiKey>()
export const unwrapFinnhubApiKey: (s: FinnhubApiKey) => string = flow(
  FinnhubApiKey.unwrap,
  (nonEmptyString) => nonEmptyString.toString(),
)

export interface FinnhubEnv {
  finnhubApiKey: FinnhubApiKey
  finnhubEndpoint: URL
}
export interface DBEnv {
  prismaClient: PrismaClient
}

export interface ExternalAPIsEnv extends FinnhubEnv {}

export interface ServerEnv extends DBEnv, ExternalAPIsEnv {}
