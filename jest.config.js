const fs = require('node:fs')

const swcrc = JSON.parse(fs.readFileSync('.swcrc', 'utf8'))

// If you have other plugins, change this line.
;((swcrc.jsc ??= {}).experimental ??= {}).plugins = [['jest_workaround', {}]]

module.exports = {
  testRegex: '/test/',
  moduleNameMapper: {
    '^@handlers/(.*)$': '<rootDir>/src/handlers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@fp/(.*)$': '<rootDir>/src/fp/$1',
  },
  modulePathIgnorePatterns: ['jestHelpers'],
  setupFilesAfterEnv: ['@relmify/jest-fp-ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', swcrc],
  },
}
