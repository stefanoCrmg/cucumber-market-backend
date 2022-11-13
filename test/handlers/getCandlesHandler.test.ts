import { NonEmptyString } from 'io-ts-types'
import * as getCandles from '../../src/handlers/getCandlesHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as RA from 'fp-ts/ReadonlyArray'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'

const mockBaseCandlesOK: getCandles.PolygonCandleBar = {
  c: 1,
  h: 1,
  l: 1,
  o: 1,
  v: 1,
  n: 1,
  t: 1,
  vw: 1,
}

const mockPolygonTickerCandles_ResponseOK: getCandles.PolygonTickerCandles = {
  results: RA.of(mockBaseCandlesOK),
  ticker: 'IBM' as NonEmptyString,
  resultsCount: 1,
  queryCount: 1,
}

const mockPolygonTickerCandles_ResponseFail: getCandles.PolygonTickerCandles = {
  results: [],
  ticker: 'IBM' as NonEmptyString,
  resultsCount: 0,
  queryCount: 0,
}

const spyCandlesRequest = jest.spyOn(getCandles, 'getCandlesFromPolygon')

describe('Get Candles from Polygon', () => {
  test('GET /candle?symbol=IBM&timeframe=day&from=166198320&to=166362480', async () => {
    spyCandlesRequest.mockImplementation(() =>
      RTE.right(mockPolygonTickerCandles_ResponseOK),
    )
    const res = await request(testServer)
      .get('/candle?symbol=IBM&timeframe=day&from=166198320&to=166362480')
      .expect(200)
    expect(getCandles.CandlesResponse.is(res.body)).toBeTruthy()
  })

  test('No data from Polygon should result in NotFound', async () => {
    spyCandlesRequest.mockImplementation(() =>
      RTE.right(mockPolygonTickerCandles_ResponseFail),
    )
    const res = await request(testServer)
      .get('/candle?symbol=IBM&timeframe=day&from=166198320&to=166362480')
      .expect(200)
    expect(getCandles.CandlesResponse.is(res.body)).toBeTruthy()
  })
})
