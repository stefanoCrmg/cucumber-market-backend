import fc from 'fast-check'

const add = (x: number, y: number) => x + y

describe('add', () => {
  it('adds', () => {
    fc.assert(
      fc.property(fc.integer(), (x) => expect(x + x).toEqual(add(x, x))),
    )
  })
})
