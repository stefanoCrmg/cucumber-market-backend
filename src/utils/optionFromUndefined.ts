import { flow, pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as t from 'io-ts'
import { option } from 'io-ts-types'

export interface OptionFromUndefinedC<C extends t.Mixed>
  extends t.Type<O.Option<t.TypeOf<C>>, t.OutputOf<C> | undefined, unknown> {}

export function optionFromUndefined<C extends t.Mixed>(
  codec: C,
  name: string = `Option<${codec.name}>`,
): OptionFromUndefinedC<C> {
  return new t.Type(
    name,
    option(codec).is,
    (u, c) =>
      u === undefined
        ? t.success(O.none)
        : pipe(codec.validate(u, c), E.map(O.some)),
    flow(O.map(codec.encode), O.toUndefined),
  )
}
