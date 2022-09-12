import { RouteError } from './routeError'
import * as HR from './responses'
import { Parser, Route } from 'fp-ts-routing'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import * as Sum from '@unsplash/sum-types'
import { ServerEnv } from 'src/serverEnv'

const HttpMethod = t.keyof({
  get: null,
  post: null,
  patch: null,
  put: null,
})
export type HttpMethod = t.TypeOf<typeof HttpMethod>

const decodeMethod: M.Middleware<
  H.StatusOpen,
  H.StatusOpen,
  RouteError,
  HttpMethod
> = pipe(
  M.decodeMethod((s) => HttpMethod.decode(s.toLowerCase())),
  M.mapLeft((): RouteError => RouteError.mk.UnknownMethod),
)

export type RouteHandler = RM.ReaderMiddleware<
  ServerEnv,
  H.StatusOpen,
  H.ResponseEnded,
  RouteError,
  void
>

const fromParser = <A extends object>(
  parser: Parser<A>,
): M.Middleware<H.StatusOpen, H.StatusOpen, RouteError, A> =>
  M.fromConnection((c) =>
    pipe(
      parser.run(Route.parse(c.getOriginalUrl())),
      O.map(([a]) => E.right(a)),
      O.getOrElse(() => E.left(RouteError.mk.NotFound)),
    ),
  )

export type Handlers<A extends Sum.AnyMember> = {
  [Loc in Sum.Serialized<A> as Loc[0]]: Partial<
    Readonly<Record<HttpMethod, (params: Loc[1]) => RouteHandler>>
  >
}

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
      () => RM.fromMiddleware(HR.sendMethodNotAllowed),
      (handler) => handler(Sum.serialize(route)[1]),
    ),
  )

export const routerMiddleware = <A extends Sum.AnyMember, E>(
  routes: Parser<A>,
  handlers: Handlers<A>,
  defaultErrorHandler: (
    e: E | RouteError,
  ) => RM.ReaderMiddleware<
    ServerEnv,
    H.StatusOpen,
    H.ResponseEnded,
    never,
    void
  >,
): RM.ReaderMiddleware<ServerEnv, H.StatusOpen, H.ResponseEnded, never, void> =>
  pipe(
    fromParser(routes),
    M.bindTo('route'),
    M.apSW('method', decodeMethod),
    RM.fromMiddleware,
    RM.ichainW(({ method, route }) => handleRoute(route, method, handlers)),
    RM.orElseW(defaultErrorHandler),
  )
