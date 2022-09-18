import { FinnhubApiKey } from './../../src/serverEnv'
import { prismaMock } from '../jestHelpers/prismaSingleton'
import { makeServer } from '../../src/makeServer'
import * as _URL from 'fp-ts-std/URL'
import { NonEmptyString } from 'io-ts-types'

const mockFinnhubApiKey: FinnhubApiKey = FinnhubApiKey.from(
  'hello' as NonEmptyString,
)
const mockFinnhubEndpoint: URL = _URL.unsafeParse('http://localhost')

export const testServer = makeServer({
  prismaClient: prismaMock,
  finnhubApiKey: mockFinnhubApiKey,
  finnhubEndpoint: mockFinnhubEndpoint,
})
