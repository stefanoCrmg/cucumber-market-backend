import * as C from 'fp-ts/Console'
import { RouteError } from './routeError'
import { flow, pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import {
  sendNotFound,
  sendInternalServerError,
  sendBadRequest,
  sendUnauthorized,
} from './responses'

export const defaultErrorHandler: <Env>(
  e: RouteError,
) => RM.ReaderMiddleware<Env, H.StatusOpen, H.ResponseEnded, never, void> =
  RouteError.match({
    NotFound: () => RM.fromMiddleware(sendNotFound),
    SomeException: ({ exception }) =>
      pipe(
        C.error(`Some exception: ${exception}`),
        RM.rightIO,
        RM.ichainMiddlewareK(() => sendInternalServerError),
      ),
    DecodingFailure: ({ errors }) =>
      pipe(
        C.error(`Decoding failure: ${errors}`),
        RM.rightIO,
        RM.ichainMiddlewareK(() => sendInternalServerError),
      ),
    BadRequest: flow(sendBadRequest, RM.fromMiddleware),
    Unauthorized: ({ message }) => RM.fromMiddleware(sendUnauthorized(message)),
  })
