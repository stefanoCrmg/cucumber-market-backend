import { Serialized } from '@unsplash/sum-types'
import { pipe } from 'fp-ts/function'
import * as H from 'hyper-ts'
import * as M from 'hyper-ts/lib/Middleware'
import { BadRequest, normalizeError, RouteError } from './routeError'

const {
  mk: { SomeException },
} = RouteError

export const sendStatus = (
  status: H.Status,
): M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> =>
  pipe(
    M.status(status),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.end()),
  )

export const sendBadRequest = ({
  message,
  errors,
}: Serialized<BadRequest>['1']): M.Middleware<
  H.StatusOpen,
  H.ResponseEnded,
  never,
  void
> => sendJson(H.Status.BadRequest, { message, errors })

export const sendUnauthorized = (
  message: string,
): M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> =>
  sendJson(H.Status.Unauthorized, { message })

export const sendNotFound = sendStatus(H.Status.NotFound)
export const sendInternalServerError = sendStatus(H.Status.InternalServerError)

export const sendJson = (
  status: H.Status,
  body: unknown,
): M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> =>
  pipe(
    M.status(status),
    M.ichain(() =>
      M.json(body, (_) => SomeException({ exception: normalizeError(_) })),
    ),
    M.orElse(() => sendInternalServerError),
  )
