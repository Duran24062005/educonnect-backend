export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: ['src/**/*.js', '!src/uploads/**'],
};
