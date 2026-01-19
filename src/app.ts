import 'reflect-metadata';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { useContainer as typeOrmUseContainer } from 'typeorm';
import { Container } from 'typedi';
import express, { Application, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'http';
import { logger, stream } from './utils/logger';
import { Routes } from './interfaces/routes.inteface';
import { sequelize } from './config/database';
import errorMiddleware from './middleware/error.middleware';

routingUseContainer(Container);
typeOrmUseContainer(Container);

class App {
  public app: Application;
  public port: number | string;
  public env: string;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';
    this.port = process.env.PORT || 9000;

    this.connectToDatabase()
    this.initializeMiddlewares();
    
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

public listen(): Server {
    const server = this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on port ${this.port}`);
      logger.info(`=================================`);
      logger.info(`Database Config - Host: ${process.env.DB_HOST}, User: ${process.env.DB_USER}, DB: ${process.env.DB_NAME}, Port: ${process.env.DB_PORT}`);
    });
    
    return server;
  }

  public async closeDatabaseConnection(): Promise<void> {
    try {
      await sequelize.close();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

   public getServer(): Application {
    return this.app;
  }
 private async connectToDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully!');
    
    if (process.env.NODE_ENV !== 'production') {
      try {
        await sequelize.sync({ alter: true });
        logger.info('Database synced');
      } catch (syncError: any) {
        // Log but don't crash on sync errors
        logger.warn('Database sync warning (non-fatal):', syncError.message);
        logger.info('Continuing with existing schema...');
      }
    }
    
  } catch (error) {
    logger.error('Error connecting to the database:', error);
    throw error;
  }
}

   private initializeMiddlewares(): void {
    // Request logging
    this.app.use(morgan(this.env === 'production' ? 'combined' : 'dev', { stream }));
    
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));
    
    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });
  }

  private initializeRoutes(routes: Routes[]): void {
    // Simple API ready response
    // this.app.get('/api', (req: Request, res: Response) => {
    //   res.status(200).json({ message: 'API is ready' });
    // });
    
    // Other API routes
    routes.forEach((route: Routes) => {
    console.log(`Mounting: ${route.path} -> ${route.router}`);
    this.app.use(route.path, route.router); // Use route.path directly
  });

  //   this.app.use('/api/*', (req: Request, res: Response) => {
  //   console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  //   console.log('Registered routes should be under /api/auth');
  //   res.status(404).json({ 
  //     error: 'Route not found',
  //     method: req.method,
  //     url: req.originalUrl,
  //     expectedPath: '/api/auth/login'
  //   });
  // });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }
}

export default App;