module.exports = {
  testEnvironment: 'node',
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['src/**/*.js'],
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // Explicitly tell Jest where to find modules
  moduleDirectories: ['node_modules', 'src'],
};
