import * as E from 'fp-ts/Either'
import * as IOE from 'fp-ts/IOEither'
import * as IO from 'fp-ts/IO'
import * as C from 'fp-ts/Console'
import { flow, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { getParamNonEmpty } from 'fp-ts-std/Env'
import { Member, create } from '@unsplash/sum-types'
import { formatValidationErrors } from 'io-ts-reporters'
import * as pc from 'picocolors'
import * as _URL from 'fp-ts-std/URL'

export type EnvVarErrors =
  | Member<'MissingEnvVar', { name: string }>
  | Member<'WrongType', { name: string; errors: t.Errors }>
  | Member<'NotURL', { name: string; errorValue: string }>
const EnvVarErrors = create<EnvVarErrors>()

export const readEnvVar =
  <A, O = A>(codec: t.Type<A, O>) =>
  (name: string): IOE.IOEither<EnvVarErrors, A> =>
    pipe(
      getParamNonEmpty(name),
      IO.map(E.fromOption(() => EnvVarErrors.mk.MissingEnvVar({ name }))),
      IOE.chainEitherK(
        flow(
          codec.decode,
          E.mapLeft((errors) => EnvVarErrors.mk.WrongType({ errors, name })),
        ),
      ),
    )

export const readURLFromEnvVar = (
  name: string,
): IOE.IOEither<EnvVarErrors, URL> =>
  pipe(
    getParamNonEmpty(name),
    IO.map(E.fromOption(() => EnvVarErrors.mk.MissingEnvVar({ name }))),
    IOE.chainEitherK((_) =>
      _URL.parse(() => EnvVarErrors.mk.NotURL({ name, errorValue: _ }))(_),
    ),
  )

export const observeEnvVarErrors = EnvVarErrors.match({
  NotURL: ({ name, errorValue }) =>
    C.error(
      `${pc.blue(pc.underline(name))} is not an URL got: ${pc.yellow(
        errorValue,
      )}`,
    ),
  WrongType: ({ errors, name }) =>
    C.error(
      `Looking for: ${pc.blue(pc.underline(name))} but got ${pc.yellow(
        formatValidationErrors(errors).join('\n'),
      )}`,
    ),
  MissingEnvVar: (missingEnvVar) =>
    C.error(`Missing env var: ${pc.yellow(missingEnvVar.name)}`),
})
