module.exports = {
  testRegex: '/test/',
  moduleNameMapper: {
    '^@handlers/(.*)$': '<rootDir>/src/handlers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@fp/(.*)$': '<rootDir>/src/fp/$1',
  },
  modulePathIgnorePatterns: ['jestHelpers'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
}
