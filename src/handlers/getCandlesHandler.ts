import { fetchFromPolygon } from './../utils/polygon'
import { PolygonEnv, LoggerEnv } from '../serverEnv'
import { FetchError } from '../utils/fetch'
import { matchFetchErrorToRouteError } from '../hyper-ts-routing/routeError'
import { fetchAndValidate } from '../utils/fetch'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe, flow } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import {
  DateFromUnixTime,
  NonEmptyString,
  NumberFromString,
  withFallback,
} from 'io-ts-types'
import * as RTE from 'fp-ts/ReaderTaskEither'

const UnixTimeFromString = NumberFromString.pipe(DateFromUnixTime)
type UnixTimeFromString = t.TypeOf<typeof UnixTimeFromString>

const Timeframe = t.keyof({
  day: null,
  minute: null,
  hour: null,
  week: null,
  month: null,
  quarter: null,
  year: null,
})
export type Timeframe = t.TypeOf<typeof Timeframe>

export const RouteParams = t.readonly(
  t.type({
    symbol: NonEmptyString,
    timeframe: Timeframe,
    from: UnixTimeFromString,
    to: UnixTimeFromString,
  }),
)
export type RouteParams = t.TypeOf<typeof RouteParams>

const PolygonCandleBar = t.readonly(
  t.type(
    {
      c: t.number,
      h: t.number,
      l: t.number,
      n: t.number,
      o: t.number,
      t: t.number,
      v: t.number,
      vw: t.number,
    },
    'CandleBar',
  ),
)
export type PolygonCandleBar = t.TypeOf<typeof PolygonCandleBar>

export const PolygonTickerCandles = t.readonly(
  t.type({
    results: withFallback(t.readonlyArray(PolygonCandleBar), []),
    ticker: NonEmptyString,
    resultsCount: t.number,
    queryCount: t.number,
  }),
)
export type PolygonTickerCandles = t.TypeOf<typeof PolygonTickerCandles>

export const Candles = t.readonly(
  t.type({
    closePrice: t.number,
    highPrice: t.number,
    lowPrice: t.number,
    openPrice: t.number,
    volume: t.number,
  }),
  'Candles',
)
export interface Candles extends t.TypeOf<typeof Candles> {}

export const CandlesResponse = t.readonly(
  t.type({
    results: t.readonlyArray(Candles),
    tickerName: NonEmptyString,
  }),
)

export const mapPolygonResponseToCandles = (_: PolygonCandleBar): Candles => ({
  closePrice: _.c,
  highPrice: _.h,
  lowPrice: _.l,
  openPrice: _.o,
  volume: _.v,
})

export const getCandlesFromPolygon = (
  param: RouteParams,
): RTE.ReaderTaskEither<
  LoggerEnv & PolygonEnv,
  FetchError,
  PolygonTickerCandles
> =>
  RTE.asksReaderTaskEither(({ polygonEndpoint }) =>
    pipe(
      fetchAndValidate(
        PolygonTickerCandles,
        `${polygonEndpoint}v2/aggs/ticker/${param.symbol}/range/1/${
          param.timeframe
        }/${DateFromUnixTime.encode(param.from)}/${DateFromUnixTime.encode(
          param.to,
        )}?adjusted=true&sort=asc&limit=120`,
      ),
      fetchFromPolygon,
    ),
  )

export const getCandlesHandler = (param: RouteParams): RouteHandler =>
  pipe(
    getCandlesFromPolygon(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.map(({ results, ticker }) => ({
      results: results.map(mapPolygonResponseToCandles),
      tickerName: ticker,
    })),
    RM.ichainMiddlewareKW(flow(CandlesResponse.encode, sendJson(Status.OK))),
  )
