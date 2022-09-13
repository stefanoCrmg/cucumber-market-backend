import { RouteError } from './routeError'
import { Parser, Route } from 'fp-ts-routing'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as Sum from '@unsplash/sum-types'
import { ServerEnv } from 'src/serverEnv'
import { sendNotFound } from './responses'
import { DefaultErrorHandler } from './defaultErrorHandler'
import { HttpMethod } from './consts'

export type RouteHandler = RM.ReaderMiddleware<
  ServerEnv,
  H.StatusOpen,
  H.ResponseEnded,
  RouteError,
  void
>

export type CleanRouteHandler = RM.ReaderMiddleware<
  ServerEnv,
  H.StatusOpen,
  H.ResponseEnded,
  never,
  void
>

export type Handlers<A extends Sum.AnyMember> = {
  [Loc in Sum.Serialized<A> as Loc[0]]: Partial<
    Readonly<Record<HttpMethod, (params: Loc[1]) => RouteHandler>>
  >
}

const decodeMethod: M.Middleware<
  H.StatusOpen,
  H.StatusOpen,
  RouteError,
  HttpMethod
> = pipe(
  M.decodeMethod((s) => HttpMethod.decode(s.toLowerCase())),
  M.mapLeft(() => RouteError.mk.NotFound),
)

const fromParser = <A extends object>(
  parser: Parser<A>,
): M.Middleware<H.StatusOpen, H.StatusOpen, RouteError, A> =>
  M.fromConnection((c) =>
    pipe(
      Route.parse(c.getOriginalUrl()),
      parser.run,
      O.match(
        () => E.left(RouteError.mk.NotFound),
        ([a]) => E.right(a),
      ),
    ),
  )

const handleRoute = <A extends Sum.AnyMember>(
  route: A,
  method: HttpMethod,
  handlers: Handlers<A>,
): RouteHandler =>
  pipe(
    (handlers as any)[Sum.serialize(route)[0]],
    O.fromNullable,
    O.chainNullableK((routeHandlers) => routeHandlers[method]),
    O.match(
      () => RM.fromMiddleware(sendNotFound),
      (handler) => handler(Sum.serialize(route)[1]),
    ),
  )

export const routerMiddleware = <A extends Sum.AnyMember>(
  routes: Parser<A>,
  handlers: Handlers<A>,
  defaultErrorHandler: DefaultErrorHandler,
): CleanRouteHandler =>
  pipe(
    fromParser(routes),
    M.bindTo('route'),
    M.apSW('method', decodeMethod),
    RM.fromMiddleware,
    RM.ichainW(({ method, route }) => handleRoute(route, method, handlers)),
    RM.orElse(defaultErrorHandler),
  )
