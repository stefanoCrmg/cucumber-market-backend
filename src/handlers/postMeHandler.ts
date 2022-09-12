import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJsonOK } from '../hyper-ts-utilities/responses'
import { RouteHandler } from '../hyper-ts-utilities/routing'
import { flow, pipe } from 'fp-ts/function'
import * as M from 'hyper-ts/lib/Middleware'
import * as E from 'fp-ts/Either'
import { RouteError } from '../hyper-ts-utilities/routeError'

type RouteParams = { readonly userId: string }
const Body = t.type({ age: t.number })

export const postMeHandler = (param: RouteParams): RouteHandler =>
  pipe(
    M.decodeBody(
      flow(
        Body.decode,
        E.mapLeft((_) => RouteError.mk.DecodingFailure({ errors: _ })),
      ),
    ),
    RM.fromMiddleware,
    RM.ichainMiddlewareKW(({ age }) =>
      sendJsonOK({ age, userId: param.userId }),
    ),
  )
