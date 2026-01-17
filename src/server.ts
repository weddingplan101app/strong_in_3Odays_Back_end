  import 'reflect-metadata';
  import 'module-alias/register';
  import dotenv from 'dotenv';
  import path from 'path';
  import { Router } from 'express';
  import { Server } from 'http';
  import App from './app';
  import { logger } from './utils/logger';
  import authRoute from './modules/auth/auth.routes'
  import subscriptionRoutes from './modules/subscription/subscription.route';
  import programRoutes from './modules/program/programs.route';
  // Import other routes as needed

  // Load environment variables based on NODE_ENV
  const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);
  dotenv.config({ path: path.resolve(__dirname, '../.env') })

  // import workoutRoutes from './api/v1/routes/workout.routes';
  // import subscriptionRoutes from './api/v1/routes/subscription.routes';
  // import adminRoutes from './admin/routes/admin.routes';
  type Route = {
    path: string;
    router: Router;
  };

  console.log('=== Creating routes ===');
console.log('authRoute type:', typeof authRoute);
console.log('authRoute:', authRoute)
  // Initialize application with routes``
  const routes : Route[] = [
    // new AuthRoute(),
    // Add other routes here
   { path: '/api/auth', router: authRoute },
   { path: '/api/subscription', router: subscriptionRoutes },
   { path: '/api/program', router: programRoutes },
  //    { path: '/api/v1/workouts', router: workoutRoutes },
  //   { path: '/api/v1/subscriptions', router: subscriptionRoutes },
  //   { path: '/api/admin', router: adminRoutes },
  ];
  console.log('Routes array:d', routes);

  const app = new App(routes);

  const server: Server = app.listen();

  // Unified error handler
  const handleError = (error: Error, eventName: string) => {
    logger.error(`[${eventName}] ${error.name}: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
  };

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    handleError(error, 'uncaughtException');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason:unknown ) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    handleError(error, 'unhandledRejection');
    
    // Gracefully close the server
    server.close(async () => {
      try {
        await app.closeDatabaseConnection();
      } catch (err) {
        logger.error('Error during database disconnection:', err);
      }
      process.exit(1);
    });
  });

  // Handle process termination signals
  const shutdown = async (signal: string) => {
    logger.info(`🚨 Received ${signal}. Shutting down gracefully...`);
    try {
      await app.closeDatabaseConnection();
      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register signal handlers
  ['SIGTERM', 'SIGINT', 'SIGHUP'].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });

  // Export the server for testing
  export default server;