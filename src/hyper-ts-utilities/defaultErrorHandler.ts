import * as C from 'fp-ts/Console'
import { RouteError } from './routeError'
import * as HR from './responses'
import { flow, pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'

export const defaultErrorHandler: <Env>(
  e: RouteError,
) => RM.ReaderMiddleware<Env, H.StatusOpen, H.ResponseEnded, never, void> =
  RouteError.match({
    UnknownMethod: () => RM.fromMiddleware(HR.sendMethodNotAllowed),
    NotFound: () => RM.fromMiddleware(HR.sendNotFound),
    SomeException: ({ exception }) =>
      pipe(
        C.error(`Some exception: ${exception}`),
        RM.rightIO,
        RM.ichainMiddlewareK(() => HR.sendInternalServerError),
      ),
    DecodingFailure: ({ errors }) =>
      pipe(
        C.error(`Decoding failure: ${errors}`),
        RM.rightIO,
        RM.ichainMiddlewareK(() => HR.sendInternalServerError),
      ),
    BadRequest: flow(HR.sendBadRequest, RM.fromMiddleware),
    Unauthorized: ({ message }) =>
      RM.fromMiddleware(HR.sendUnauthorized(message)),
    Conflict: ({ message }) =>
      RM.fromMiddleware(HR.sendJson(H.Status.Conflict, { message })),
  })
