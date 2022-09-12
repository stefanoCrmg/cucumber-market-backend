import * as t from 'io-ts'
import * as Sum from '@unsplash/sum-types'

export const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(JSON.stringify(error))

export type BadRequest = Sum.Member<
  'BadRequest',
  { readonly message: string; readonly errors?: Record<string, unknown> }
>
export type RouteError =
  | Sum.Member<'SomeException', { readonly exception: Error }>
  | Sum.Member<'DecodingFailure', { readonly errors: t.Errors }>
  | Sum.Member<'Unauthorized', { readonly message: string }>
  | Sum.Member<'NotFound'>
  | BadRequest

export const RouteError = Sum.create<RouteError>()
