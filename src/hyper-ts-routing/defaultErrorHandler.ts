import { ServerEnv } from 'src/serverEnv'
import * as C from 'fp-ts/Console'
import { RouteError } from './routeError'
import { pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import {
  sendNotFound,
  sendInternalServerError,
  sendBadRequest,
  sendUnauthorized,
} from './responses'

export type DefaultErrorHandler = (
  e: RouteError,
) => RM.ReaderMiddleware<ServerEnv, H.StatusOpen, H.ResponseEnded, never, void>

export const defaultErrorHandler: DefaultErrorHandler = RouteError.match({
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
  BadRequest: ({ errors, message }) =>
    pipe(
      C.error(`Bad Request: ${errors} -- ${message}`),
      RM.rightIO,
      RM.ichainMiddlewareK(() => sendBadRequest({ message, errors })),
    ),
  Unauthorized: ({ message }) =>
    pipe(
      C.error(`Unauthorized: ${message}`),
      RM.rightIO,
      RM.ichainMiddlewareK(() => sendUnauthorized(message)),
    ),
})
