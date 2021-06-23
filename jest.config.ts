/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        "<rootDir>/src/parsers/**/*.ts",
        "<rootDir>/src/loaders/**/*.ts",
        "<rootDir>/src/utils/**/*.ts"
    ],

    // The directory where Jest should output its coverage files
    coverageDirectory: "<rootDir>/coverage",

    // A preset that is used as a base for Jest's configuration
    preset: "ts-jest",
    transform: {
        "^.+\\.(ts|js|html)$": "babel-jest"
    },

    transformIgnorePatterns: ["node_modules/?!(protvista-variation-adapter/dist/es/variants.js)"]
};
