import * as C from 'fp-ts/Console'
import { RouteError } from './routeError'
import { pipe } from 'fp-ts/function'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import {
  sendNotFound,
  sendInternalServerError,
  sendBadRequest,
  sendUnauthorized,
} from './responses'
import { CleanRouteHandler } from './routing'
import * as pc from 'picocolors'
import { formatValidationErrors } from 'io-ts-reporters'

export type DefaultErrorHandler = (e: RouteError) => CleanRouteHandler

export const defaultErrorHandler: DefaultErrorHandler = RouteError.match({
  NotFound: () => RM.fromMiddleware(sendNotFound),
  SomeException: ({ exception }) =>
    pipe(
      C.error(`Some exception: ${exception}`),
      RM.rightIO,
      RM.ichainMiddlewareK(() => sendInternalServerError),
    ),
  DecodingFailure: ({ errors, codecName }) =>
    pipe(
      C.error(
        `DecodingFailure: Using codec: ${pc.blue(
          pc.underline(codecName),
        )} but got ${pc.yellow(formatValidationErrors(errors).join('\n'))}`,
      ),
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
