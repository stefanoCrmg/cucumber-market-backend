import { FetchError, matchFetchError } from './../utils/fetch'
import * as t from 'io-ts'
import * as Sum from '@unsplash/sum-types'

export const makeStandardError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(JSON.stringify(error))

export type BadRequest = Sum.Member<
  'BadRequest',
  { readonly message: string; readonly errors?: Record<string, unknown> }
>
export type DecodingFailure = Sum.Member<
  'DecodingFailure',
  { readonly errors: t.Errors; readonly codecName: string }
>
export type RouteError =
  | Sum.Member<'SomeException', { readonly exception: Error }>
  | Sum.Member<'Unauthorized', { readonly message: string }>
  | Sum.Member<'NotFound'>
  | DecodingFailure
  | BadRequest

export const RouteError = Sum.create<RouteError>()

export const matchFetchErrorToRouteError: (_: FetchError) => RouteError =
  matchFetchError({
    Unauthorized: (_) =>
      RouteError.mk.Unauthorized({ message: JSON.stringify(_.data) }),
    HttpClientError: (_) =>
      RouteError.mk.BadRequest({
        message: _.statusCode.toString(),
        errors: _.data,
      }),
    HttpServerError: (_) =>
      RouteError.mk.BadRequest({
        message: _.statusCode.toString(),
        errors: _.data,
      }),
    DecodingFailure: RouteError.mk.DecodingFailure,
    [Sum._]: () =>
      RouteError.mk.SomeException({ exception: new Error('Catch-all error') }),
  })
