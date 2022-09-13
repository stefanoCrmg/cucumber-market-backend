import { Status } from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJson } from '../hyper-ts-utilities/responses'
import { RouteHandler } from '../hyper-ts-utilities/routing'

export const getHelloHandler: RouteHandler = RM.fromMiddleware(
  sendJson(Status.OK, { ok: true }),
)
