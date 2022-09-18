import { DateFromUnixTime } from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import * as getCandles from '../../src/handlers/getCandlesHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as E from 'fp-ts-std/Either'
import * as t from 'io-ts'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'

const mockDateTime = pipe(DateFromUnixTime.decode(1663358405), E.unsafeUnwrap)
const mockCandlesOK: t.TypeOf<typeof getCandles.FinnhubCandleResponse> = {
  c: [1],
  h: [1],
  l: [1],
  o: [1],
  t: [mockDateTime],
  v: [1],
  s: 'ok',
}
const mockCandlesFail: t.TypeOf<typeof getCandles.FinnhubCandleResponse> = {
  s: 'no_data',
}

const spyCandlesRequest = jest.spyOn(getCandles, 'getCandlesFromFinnhub')

describe('Get Candles from Finnhub', () => {
  test('GET /candle?symbol=IBM&timeframe=D&from=166198320&to=166362480', async () => {
    spyCandlesRequest.mockImplementation(() => RTE.right(mockCandlesOK))
    const res = await request(testServer)
      .get('/candle?symbol=IBM&timeframe=D&from=166198320&to=166362480')
      .expect(200)
    expect(res.body).toEqual({
      closePrices: mockCandlesOK.c,
      highPrices: mockCandlesOK.h,
      lowPrices: mockCandlesOK.l,
      openPrices: mockCandlesOK.o,
      timestamps: t.readonlyArray(DateFromUnixTime).encode(mockCandlesOK.t),
      volumes: mockCandlesOK.v,
    })
  })

  test('No data from finhub should result in NotFound', async () => {
    spyCandlesRequest.mockImplementation(() => RTE.right(mockCandlesFail))
    await request(testServer)
      .get('/candle?symbol=IBM&timeframe=D&from=166198320&to=166362480')
      .expect(404)
  })
})
