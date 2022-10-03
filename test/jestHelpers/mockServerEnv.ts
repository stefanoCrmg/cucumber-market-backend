import { FinnhubApiKey } from './../../src/serverEnv'
import { prismaMock } from '../jestHelpers/prismaSingleton'
import { makeServer } from '../../src/makeServer'
import * as _URL from 'fp-ts-std/URL'
import { NonEmptyString } from 'io-ts-types'
import pino from 'pino'

const mockFinnhubApiKey: FinnhubApiKey = FinnhubApiKey.from(
  'hello' as NonEmptyString,
)
const mockFinnhubEndpoint: URL = _URL.unsafeParse('http://localhost')

const fakePino = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

const fakePinoFunc = () => {
  return fakePino
}
fakePinoFunc.destination = jest.fn()

jest.doMock('pino', () => {
  return fakePinoFunc
})

export const testServer = makeServer({
  prismaClient: prismaMock,
  finnhubApiKey: mockFinnhubApiKey,
  finnhubEndpoint: mockFinnhubEndpoint,
  logger: pino(),
})
