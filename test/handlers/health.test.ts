import request from 'supertest'
import * as _URL from 'fp-ts-std/URL'
import { testServer } from '../jestHelpers/mockServerEnv'

describe('Health route', () => {
  test('GET /health', (done) => {
    request(testServer)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(() => done())
  })
})
