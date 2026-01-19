import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config(); // ← must run first

// 🔍 DEBUG — add THESE lines
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
import path from 'path';
import { logger } from '../utils/logger';



// Extract the database configuration for reuse
const dbConfig = {
  database: process.env.DB_NAME ,
  username: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres' as const,
  dialectModule: require('pg'),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

// Create Sequelize instance for your app
const sequelize = new Sequelize({
  ...dbConfig,
  logging: process.env.NODE_ENV === 'development' 
    ? (sql: string) => logger.debug(sql) 
    : false,
  models: [path.join(__dirname, '../models/**/*.{js,ts}')],
});

export { sequelize };

// Export configuration for Sequelize CLI
// This is in the format that Sequelize CLI expects
export const config = {
  development: {
    ...dbConfig,
    logging: console.log, // CLI needs console.log
  },
  test: {
    ...dbConfig,
    database: process.env.DB_NAME_TEST || `${dbConfig.database}_test`,
    logging: false,
  },
  production: {
    ...dbConfig,
    logging: false,
  },
};