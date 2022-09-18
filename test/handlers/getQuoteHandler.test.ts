import { DateFromUnixTime } from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import * as getQuote from '../../src/handlers/getQuoteHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as E from 'fp-ts-std/Either'
import { genOne } from 'mock-data-gen'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'

const mockDateTime = pipe(DateFromUnixTime.decode(1663358405), E.unsafeUnwrap)
const mockFinnhubQuote = genOne(getQuote.FinnhubBody, {
  namedTypeGens: { DateFromUnixTime: (_r) => mockDateTime },
})
const expectedQuoteResponse = pipe(
  getQuote.mapFinnhubBodyToQuote(mockFinnhubQuote),
  getQuote.Quote.encode,
)

jest
  .spyOn(getQuote, 'getQuoteFromFinnhub')
  .mockImplementation(() => RTE.right(mockFinnhubQuote))

describe('Get Quote from Finnhub', () => {
  test('GET /quote?symbol=AAPL', async () => {
    const res = await request(testServer).get('/quote?symbol=AAPL').expect(200)
    expect(res.body).toEqual(expectedQuoteResponse)
  })
})
