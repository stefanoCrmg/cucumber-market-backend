import { FinnhubEnv } from '../serverEnv'
import { FetchError } from '../utils/fetch'
import {
  matchFetchErrorToRouteError,
  RouteError,
} from '../hyper-ts-routing/routeError'
import { unwrapFinnhubApiKey } from '../serverEnv'
import { fetchAndValidate } from '../utils/fetch'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe, flow } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import { DateFromUnixTime, NonEmptyString, NumberFromString } from 'io-ts-types'
import { Member, create } from '@unsplash/sum-types'
import * as E from 'fp-ts/Either'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as R from 'fp-ts/Reader'
import { match, P } from 'ts-pattern'

const DateFromNumberFromString = NumberFromString.pipe(DateFromUnixTime)
type DateFromNumberFromString = t.TypeOf<typeof DateFromNumberFromString>

const Timeframe = t.keyof({
  '1': null,
  '5': null,
  '15': null,
  '30': null,
  '60': null,
  D: null,
  W: null,
  M: null,
})
export type Timeframe = t.TypeOf<typeof Timeframe>

export const RouteParams = t.readonly(
  t.type({
    symbol: NonEmptyString,
    timeframe: Timeframe,
    from: DateFromNumberFromString,
    to: DateFromNumberFromString,
  }),
)
export type RouteParams = t.TypeOf<typeof RouteParams>

const FinnhubCandleResponseOK = t.readonly(
  t.type({
    c: t.readonlyArray(t.number),
    h: t.readonlyArray(t.number),
    l: t.readonlyArray(t.number),
    o: t.readonlyArray(t.number),
    t: t.readonlyArray(DateFromUnixTime),
    v: t.readonlyArray(t.number),
    s: t.literal('ok'),
  }),
  'FinnhubCandleResponseOK',
)

const FinnhubCandleResponseFAIL = t.readonly(
  t.type({
    s: t.literal('no_data'),
  }),
  'FinnhubCandleResponseFAIL',
)
export const FinnhubCandleResponse = t.union(
  [FinnhubCandleResponseOK, FinnhubCandleResponseFAIL],
  'FinnhubCandleResponse',
)
export type FinnhubCandleResponse = t.TypeOf<typeof FinnhubCandleResponse>

export const Candles = t.readonly(
  t.type({
    closePrices: t.readonlyArray(t.number),
    highPrices: t.readonlyArray(t.number),
    lowPrices: t.readonlyArray(t.number),
    openPrices: t.readonlyArray(t.number),
    timestamps: t.readonlyArray(DateFromUnixTime),
    volumes: t.readonlyArray(t.number),
  }),
  'Candles',
)
export interface Candles extends t.TypeOf<typeof Candles> {}

type NoData = Member<'NoData'>
const {
  mk: { NoData },
} = create<NoData>()

export const mapFinnhubResponseToCandles = (
  obj: FinnhubCandleResponse,
): E.Either<NoData, Candles> =>
  match(obj)
    .with({ s: 'no_data' }, () => E.left(NoData))
    .with({ s: 'ok' }, (_) =>
      E.right({
        closePrices: _.c,
        highPrices: _.h,
        lowPrices: _.l,
        openPrices: _.o,
        timestamps: _.t,
        volumes: _.v,
      }),
    )
    .exhaustive()

export const getCandlesFromFinnhub = (
  param: RouteParams,
): RTE.ReaderTaskEither<FinnhubEnv, FetchError, FinnhubCandleResponse> =>
  R.asks(({ finnhubApiKey, finnhubEndpoint }) =>
    fetchAndValidate(
      FinnhubCandleResponse,
      `${finnhubEndpoint}/v1/stock/candle?symbol=${param.symbol}&resolution=${
        param.timeframe
      }&from=${DateFromUnixTime.encode(
        param.from,
      )}&to=${DateFromUnixTime.encode(param.to)}`,
      { headers: { 'X-Finnhub-Token': unwrapFinnhubApiKey(finnhubApiKey) } },
    ),
  )

export const getCandlesHandler = (param: RouteParams): RouteHandler =>
  pipe(
    getCandlesFromFinnhub(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.chainEitherK(
      flow(
        mapFinnhubResponseToCandles,
        E.mapLeft(() => RouteError.mk.NotFound),
      ),
    ),
    RM.ichainMiddlewareKW(flow(Candles.encode, (_) => sendJson(Status.OK, _))),
  )
