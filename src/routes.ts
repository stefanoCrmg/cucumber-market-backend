import { withJsonBodyParser } from './hyper-ts-utilities/helpers'
import { end, lit, query, then, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { Handlers } from './hyper-ts-utilities/routing'
import { getHelloHandler } from '@handlers/getHelloHandler'
import { getAnotherOneHandler } from '@handlers/getAnotherOneHandler'
import { postMeHandler } from '@handlers/postMeHandler'
import * as Sum from '@unsplash/sum-types'
import * as t from 'io-ts'

type Location =
  | Sum.Member<'Hello', {}>
  | Sum.Member<'AnotherOne', { readonly userId: string }>
  | Sum.Member<'PostMe', { readonly userId: string }>

const Location = Sum.create<Location>()

const helloMatch = pipe(lit('hello'), then(end))
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
  .alt(helloMatch.parser.map(Location.mk.Hello))
  .alt(anotherOneMatch.parser.map(Location.mk.AnotherOne))
  .alt(postMeMatch.parser.map(Location.mk.PostMe))

export const handlers: Handlers<Location> = {
  Hello: { get: getHelloHandler },
  AnotherOne: { get: getAnotherOneHandler },
  PostMe: { post: withJsonBodyParser(postMeHandler) },
}
