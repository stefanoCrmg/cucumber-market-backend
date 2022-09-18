import { matchFetchErrorToRouteError } from '../hyper-ts-routing/routeError'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import { DateFromUnixTime, NonEmptyString } from 'io-ts-types'
import { FinnhubEnv, unwrapFinnhubApiKey } from '../serverEnv'
import { fetchAndValidate, FetchError } from '../utils/fetch'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as R from 'fp-ts/Reader'

export const RouteParams = t.readonly(t.type({ symbol: NonEmptyString }))
export type RouteParams = t.TypeOf<typeof RouteParams>

export const FinnhubBody = t.type(
  {
    c: t.number,
    d: t.number,
    dp: t.number,
    h: t.number,
    l: t.number,
    o: t.number,
    pc: t.number,
    t: DateFromUnixTime,
  },
  'FinnhubBody_quoteRequest',
)
export interface FinnhubBody extends t.TypeOf<typeof FinnhubBody> {}

export const Quote = t.type(
  {
    currentPrice: t.number,
    change: t.number,
    percentageChange: t.number,
    dailyHighPrice: t.number,
    dailyLowPrice: t.number,
    dailyOpenPrice: t.number,
    previousClose: t.number,
    timestamp: DateFromUnixTime,
  },
  'Quote',
)
interface Quote extends t.TypeOf<typeof Quote> {}

export const mapFinnhubBodyToQuote = (_: FinnhubBody): Quote => ({
  currentPrice: _.c,
  change: _.d,
  percentageChange: _.dp,
  dailyHighPrice: _.h,
  dailyLowPrice: _.l,
  dailyOpenPrice: _.o,
  previousClose: _.pc,
  timestamp: _.t,
})

export const getQuoteFromFinnhub = (
  param: RouteParams,
): RTE.ReaderTaskEither<FinnhubEnv, FetchError, FinnhubBody> =>
  R.asks(({ finnhubApiKey, finnhubEndpoint }) =>
    fetchAndValidate(
      FinnhubBody,
      `${finnhubEndpoint}/v1/quote?symbol=${param.symbol.toUpperCase()}`,
      { headers: { 'X-Finnhub-Token': unwrapFinnhubApiKey(finnhubApiKey) } },
    ),
  )

export const getQuoteHandler = (param: RouteParams): RouteHandler =>
  pipe(
    getQuoteFromFinnhub(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.ichainMiddlewareKW((_) =>
      pipe(mapFinnhubBodyToQuote(_), Quote.encode, (quote) =>
        sendJson(Status.OK, quote),
      ),
    ),
  )
