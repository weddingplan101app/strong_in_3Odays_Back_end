// This JavaScript wrapper allows Sequelize CLI to use TypeScript config
require('ts-node/register');
require('tsconfig-paths/register');

// Import the config from TypeScript file
const { config } = require('./database.ts');

// Export in the format Sequelize CLI expects
module.exports = config;