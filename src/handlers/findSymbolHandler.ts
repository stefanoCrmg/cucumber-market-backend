import { FinnhubEnv } from './../serverEnv'
import { FetchError } from './../utils/fetch'
import { matchFetchErrorToRouteError } from '../hyper-ts-routing/routeError'
import { unwrapFinnhubApiKey } from '../serverEnv'
import { fetchAndValidate } from '../utils/fetch'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { pipe, flow } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import { NonEmptyString } from 'io-ts-types'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as R from 'fp-ts/Reader'

export const RouteParams = t.readonly(t.type({ identifier: NonEmptyString }))
export type RouteParams = t.TypeOf<typeof RouteParams>

export const SymbolDescription = t.readonly(
  t.type({
    description: NonEmptyString,
    displaySymbol: NonEmptyString,
    symbol: NonEmptyString,
    type: t.string,
  }),
  'SymbolDescription',
)

export const SymbolLookup = t.readonly(
  t.type({
    count: t.number,
    result: t.readonlyArray(SymbolDescription),
  }),
  'SymbolLookup',
)
export interface SymbolLookup extends t.TypeOf<typeof SymbolLookup> {}

export const searchSymbolOnFinnhub = (
  param: RouteParams,
): RTE.ReaderTaskEither<FinnhubEnv, FetchError, SymbolLookup> =>
  R.asks(({ finnhubApiKey, finnhubEndpoint }) =>
    fetchAndValidate(
      SymbolLookup,
      `${finnhubEndpoint}/v1/search?q=${param.identifier.toUpperCase()}`,
      { headers: { 'X-Finnhub-Token': unwrapFinnhubApiKey(finnhubApiKey) } },
    ),
  )

export const findSymbolHandler = (param: RouteParams): RouteHandler =>
  pipe(
    searchSymbolOnFinnhub(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.ichainMiddlewareKW(
      flow(SymbolLookup.encode, (_) => sendJson(Status.OK, _)),
    ),
  )
