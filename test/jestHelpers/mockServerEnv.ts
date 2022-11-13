import { PolygonApiKey } from './../../src/serverEnv'
import { makeServer } from '../../src/makeServer'
import * as _URL from 'fp-ts-std/URL'
import { NonEmptyString } from 'io-ts-types'
import pino from 'pino'

const mockPolygonApiKey: PolygonApiKey = PolygonApiKey.from(
  'hello' as NonEmptyString,
)
const mockPolygonEndpoint: URL = _URL.unsafeParse('http://localhost')

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
  polygonApiKey: { main: mockPolygonApiKey, backup: mockPolygonApiKey },
  polygonEndpoint: mockPolygonEndpoint,
  logger: pino(),
})
