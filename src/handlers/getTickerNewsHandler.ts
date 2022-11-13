import { RouteError } from '../hyper-ts-routing/routeError'
import { PolygonEnv, LoggerEnv } from '../serverEnv'
import { FetchError, fetchAndValidate } from '../utils/fetch'
import { matchFetchErrorToRouteError } from '../hyper-ts-routing/routeError'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
  optionFromNullable,
  withFallback,
} from 'io-ts-types'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as searchParams from 'fp-ts-std/URLSearchParams'
import * as O from 'fp-ts/Option'
import { fetchFromPolygon } from '../utils/polygon'
import { optionFromUndefined } from '../utils/optionFromUndefined'
import { urlSearchParams } from 'fp-ts-std'

const Article = t.exact(
  t.readonly(
    t.type({
      title: NonEmptyString,
      article_url: NonEmptyString,
      image_url: NonEmptyString,
      published_utc: DateFromISOString,
      description: optionFromNullable(NonEmptyString),
    }),
  ),
)
export interface Article extends t.TypeOf<typeof Article> {}

export const ArticlesResponse = t.exact(
  t.readonly(
    t.type({
      count: withFallback(t.number, 0),
      results: t.readonlyArray(Article),
    }),
  ),
)
export interface ArticlesResponse extends t.TypeOf<typeof ArticlesResponse> {}

const OrderQueryParam = t.keyof({ desc: null, asc: null })

export const RouteParams = t.readonly(
  t.type({
    ticker: NonEmptyString,
    order: optionFromUndefined(OrderQueryParam),
    limit: optionFromUndefined(NumberFromString),
  }),
)
export type RouteParams = t.TypeOf<typeof RouteParams>

const setParamIfSome =
  (name: string, opt: O.Option<string>) => (url: URLSearchParams) =>
    pipe(
      opt,
      O.match(
        () => url,
        (str) => urlSearchParams.setParam(name)(str)(url),
      ),
    )

export const getTickerNewsFromPolygon = (
  param: RouteParams,
): RTE.ReaderTaskEither<
  LoggerEnv & PolygonEnv,
  FetchError,
  ArticlesResponse
> => {
  const prepSearchParams = pipe(
    searchParams.empty,
    searchParams.setParam('ticker')(param.ticker),
    setParamIfSome('order', param.order),
    setParamIfSome(
      'limit',
      pipe(
        param.limit,
        O.map((n) => n.toString()),
      ),
    ),
  )
  return RTE.asksReaderTaskEither(({ polygonEndpoint }) =>
    pipe(
      fetchAndValidate(
        ArticlesResponse,
        `${polygonEndpoint}v2/reference/news?${prepSearchParams}`,
      ),
      fetchFromPolygon,
    ),
  )
}

export const getTickerNewsHandler = (param: RouteParams): RouteHandler =>
  pipe(
    getTickerNewsFromPolygon(param),
    RM.fromReaderTaskEither,
    RM.mapLeft(matchFetchErrorToRouteError),
    RM.filterOrElseW(
      ({ count }) => count !== 0,
      () => RouteError.mk.NotFound,
    ),
    RM.ichainMiddlewareKW(flow(ArticlesResponse.encode, sendJson(Status.OK))),
  )
