import { pipe } from 'fp-ts/lib/function'
import { fromRequestHandler } from 'hyper-ts/lib/express'
import { RouteError, normalizeError } from './routeError'
import { RouteHandler } from './routeHandler'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as E from 'fp-ts/Either'
import bodyParser from 'body-parser'

const {
  mk: { SomeException },
} = RouteError

export const withJsonBodyParser =
  <P>(handler: (params: P) => RouteHandler) =>
  (params: P): RouteHandler =>
    pipe(
      fromRequestHandler(
        bodyParser.json(),
        () => E.right(undefined),
        (_) => SomeException({ exception: normalizeError(_) }),
      ),
      RM.fromMiddleware,
      RM.ichain(() => handler(params)),
    )
