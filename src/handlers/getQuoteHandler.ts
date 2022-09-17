import { matchFetchErrorToRouteError } from './../hyper-ts-routing/routeError'
import { ExternalAPIsEnv, FinnhubApiKey } from './../serverEnv'
import { fetchAndValidate } from './../utils/fetch'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import { DateFromUnixTime, NonEmptyString } from 'io-ts-types'

export const RouteParams = t.readonly(t.type({ symbol: NonEmptyString }))
export type RouteParams = t.TypeOf<typeof RouteParams>

const FinnhubBody = t.type(
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

const Quote = t.type(
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

export const getQuoteHandler = (param: RouteParams): RouteHandler =>
  pipe(
    RM.ask<ExternalAPIsEnv>(),
    RM.chainTaskEitherK(({ finnhubApiKey, finnhubEndpoint }) =>
      fetchAndValidate(
        FinnhubBody,
        `${finnhubEndpoint}/v1/quote?symbol=${param.symbol.toUpperCase()}`,
        { headers: { 'X-Finnhub-Token': FinnhubApiKey.unwrap(finnhubApiKey) } },
      ),
    ),
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.ichainMiddlewareKW((_) =>
      pipe(
        Quote.encode({
          currentPrice: _.c,
          change: _.d,
          percentageChange: _.dp,
          dailyHighPrice: _.h,
          dailyLowPrice: _.l,
          dailyOpenPrice: _.o,
          previousClose: _.pc,
          timestamp: _.t,
        }),
        (quote) => sendJson(Status.OK, quote),
      ),
    ),
  )
