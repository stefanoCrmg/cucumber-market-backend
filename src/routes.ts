import { NonEmptyString } from 'io-ts-types'
import { end, lit, query, then, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { getHealthHandler } from '@handlers/getHealthHandler'
import { postMeHandler } from '@handlers/postMeHandler'
import {
  findTickerHandler,
  RouteParams as findTickerRouteParams,
} from '@handlers/findTickerHandler'
import {
  getCandlesHandler,
  RouteParams as getCandlesRouteParams,
  Timeframe,
} from '@handlers/getCandlesHandler'
import {
  getTickerNewsHandler,
  RouteParams as getTickerNewsRouteParams,
} from '@handlers/getTickerNewsHandler'
import * as Sum from '@unsplash/sum-types'
import * as t from 'io-ts'
import * as O from 'fp-ts/Option'
import { Handlers } from './hyper-ts-routing/routing'

type Location =
  | Sum.Member<'Health', {}>
  | Sum.Member<
      'Candles',
      {
        readonly symbol: NonEmptyString
        readonly timeframe: Timeframe
        readonly from: Date
        readonly to: Date
      }
    >
  | Sum.Member<'TickerLookup', { readonly search: NonEmptyString }>
  | Sum.Member<'PostMe', { readonly userId: string }>
  | Sum.Member<
      'News',
      {
        readonly ticker: NonEmptyString
        readonly limit: O.Option<number>
        readonly order: O.Option<'asc' | 'desc'>
      }
    >

const Location = Sum.create<Location>()

const healthMatch = pipe(lit('health'), then(end))

const tickerLookupMatch = pipe(
  lit('ticker'),
  then(query(findTickerRouteParams)),
  then(end),
)

const candlesMatch = pipe(
  lit('candles'),
  then(query(getCandlesRouteParams)),
  then(end),
)

const newsMatch = pipe(
  lit('news'),
  then(query(getTickerNewsRouteParams)),
  then(end),
)

const postMeMatch = pipe(
  lit('post-me'),
  then(query(t.readonly(t.type({ userId: t.string })))),
  then(end),
)

export const router = zero<Location>()
  .alt(healthMatch.parser.map(Location.mk.Health))
  .alt(tickerLookupMatch.parser.map(Location.mk.TickerLookup))
  .alt(candlesMatch.parser.map(Location.mk.Candles))
  .alt(postMeMatch.parser.map(Location.mk.PostMe))
  .alt(newsMatch.parser.map(Location.mk.News))

export const handlers: Handlers<Location> = {
  Health: { get: () => getHealthHandler },
  TickerLookup: { get: findTickerHandler },
  Candles: { get: getCandlesHandler },
  PostMe: { post: postMeHandler },
  News: { get: getTickerNewsHandler },
}
