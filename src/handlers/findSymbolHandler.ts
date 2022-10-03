import { PolygonEnv, LoggerEnv } from './../serverEnv'
import { FetchError, fetchAndValidate } from './../utils/fetch'
import { matchFetchErrorToRouteError } from '../hyper-ts-routing/routeError'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe, flow } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable,
} from 'io-ts-types'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { fetchFromPolygon } from '../utils/polygon'

export const RouteParams = t.readonly(t.type({ identifier: NonEmptyString }))
export type RouteParams = t.TypeOf<typeof RouteParams>

const Market = t.keyof({
  stocks: null,
  otc: null,
  crypto: null,
  fx: null,
})

const Ticker = t.readonly(
  t.type(
    {
      active: t.boolean,
      cik: optionFromNullable(NonEmptyString),
      composite_figi: optionFromNullable(NonEmptyString),
      currency_name: NonEmptyString,
      last_updated_utc: DateFromISOString,
      locale: NonEmptyString,
      market: Market,
      name: NonEmptyString,
      primary_exchange: optionFromNullable(NonEmptyString),
      share_class_figi: optionFromNullable(NonEmptyString),
      ticker: NonEmptyString,
      type: NonEmptyString,
    },
    'Ticker',
  ),
)
export interface Ticker extends t.TypeOf<typeof Ticker> {}

const TickerResponse = t.readonly(
  t.type(
    {
      count: t.number,
      next_url: optionFromNullable(NonEmptyString),
      request_id: NonEmptyString,
      results: t.readonlyArray(Ticker),
      status: NonEmptyString,
    },
    'TickerResponse',
  ),
)
export interface TickerResponse extends t.TypeOf<typeof TickerResponse> {}

export const searchSymbolOnPolygon = (
  param: RouteParams,
): RTE.ReaderTaskEither<LoggerEnv & PolygonEnv, FetchError, TickerResponse> =>
  RTE.asksReaderTaskEither(({ polygonEndpoint }) =>
    pipe(
      fetchAndValidate(
        TickerResponse,
        `${polygonEndpoint}v3/reference/tickers?type=CS&search=${param.identifier}&active=true&sort=ticker&order=asc&limit=10`,
      ),
      fetchFromPolygon,
    ),
  )

export const findSymbolHandler = (param: RouteParams): RouteHandler =>
  pipe(
    searchSymbolOnPolygon(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.ichainMiddlewareKW(flow(TickerResponse.encode, sendJson(Status.OK))),
  )
