import { NonEmptyString } from 'io-ts-types'
import { end, lit, query, then, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { getHealthHandler } from '@handlers/getHealthHandler'
import { getAnotherOneHandler } from '@handlers/getAnotherOneHandler'
import { postMeHandler } from '@handlers/postMeHandler'
import {
  getQuoteHandler,
  RouteParams as getQuoteRouteParams,
} from '@handlers/getQuoteHandler'
import {
  findSymbolHandler,
  RouteParams as findSymbolRouteParams,
} from '@handlers/findSymbolHandler'
import {
  getCandlesHandler,
  RouteParams as getCandlesRouteParams,
  Timeframe,
} from '@handlers/getCandlesHandler'
import * as Sum from '@unsplash/sum-types'
import * as t from 'io-ts'
import { Handlers } from './hyper-ts-routing/routing'

type Location =
  | Sum.Member<'Health', {}>
  | Sum.Member<'Quote', { readonly symbol: NonEmptyString }>
  | Sum.Member<
      'Candles',
      {
        readonly symbol: NonEmptyString
        readonly timeframe: Timeframe
        readonly from: Date
        readonly to: Date
      }
    >
  | Sum.Member<'SymbolLookup', { readonly identifier: NonEmptyString }>
  | Sum.Member<'AnotherOne', { readonly userId: string }>
  | Sum.Member<'PostMe', { readonly userId: string }>

const Location = Sum.create<Location>()

const healthMatch = pipe(lit('health'), then(end))

const quoteMatch = pipe(
  lit('quote'),
  then(query(getQuoteRouteParams)),
  then(end),
)

const symbolLookupMatch = pipe(
  lit('symbol'),
  then(query(findSymbolRouteParams)),
  then(end),
)

const candlesMatch = pipe(
  lit('candle'),
  then(query(getCandlesRouteParams)),
  then(end),
)

const anotherOneMatch = pipe(
  lit('another'),
  then(query(t.readonly(t.type({ userId: t.string })))),
  then(end),
)
const postMeMatch = pipe(
  lit('post-me'),
  then(query(t.readonly(t.type({ userId: t.string })))),
  then(end),
)

export const router = zero<Location>()
  .alt(healthMatch.parser.map(Location.mk.Health))
  .alt(quoteMatch.parser.map(Location.mk.Quote))
  .alt(symbolLookupMatch.parser.map(Location.mk.SymbolLookup))
  .alt(candlesMatch.parser.map(Location.mk.Candles))
  .alt(anotherOneMatch.parser.map(Location.mk.AnotherOne))
  .alt(postMeMatch.parser.map(Location.mk.PostMe))

export const handlers: Handlers<Location> = {
  Health: { get: () => getHealthHandler },
  Quote: { get: getQuoteHandler },
  SymbolLookup: { get: findSymbolHandler },
  Candles: { get: getCandlesHandler },
  AnotherOne: { get: getAnotherOneHandler },
  PostMe: { post: postMeHandler },
}
