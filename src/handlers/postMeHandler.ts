import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import * as t from 'io-ts'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'
import { flow, pipe } from 'fp-ts/function'
import * as M from 'hyper-ts/lib/Middleware'
import * as E from 'fp-ts/Either'
import { RouteError } from '../hyper-ts-routing/routeError'
import { Status } from 'hyper-ts'

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
      sendJson(Status.OK, { age, userId: param.userId }),
    ),
  )
