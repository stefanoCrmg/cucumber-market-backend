import { Status } from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'

export const getHealthHandler: RouteHandler = RM.fromMiddleware(
  sendJson(Status.OK)({ ok: true }),
)
