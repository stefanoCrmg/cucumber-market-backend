import request from 'supertest'
import { prismaMock } from '../jestHelpers/prismaSingleton'
import { makeServer } from '../../src/makeServer'

const testServer = makeServer({ prismaClient: prismaMock })

describe('Hello route example', () => {
  test('GET /', (done) => {
    request(testServer)
      .get('/hello')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(() => done())
  })
})
