import * as t from 'io-ts'

export const HttpMethod = t.keyof({
  get: null,
  post: null,
  patch: null,
  put: null,
})
export type HttpMethod = t.TypeOf<typeof HttpMethod>
