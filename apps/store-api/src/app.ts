/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import router from './app/routes';
import notFound from './app/middlewares/notFound';
import globalErrorHandler from './app/middlewares/globalErrorhandler';

const app: Application = express();

//parsers
app.use(express.json());
app.use(cookieParser());

// CORS configuration - allow localhost subdomains for multi-tenant dev
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow any localhost subdomain on any port (e.g., demo.localhost:3000)
    const localhostPattern = /^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/;
    // Allow framextech.com subdomains
    const prodPattern = /^https?:\/\/([a-z0-9-]+\.)?framextech\.com$/;

    if (localhostPattern.test(origin) || prodPattern.test(origin)) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Application routes
app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from boiler plate code');
});

// This is connected with the globalErrorhandler.ts file at the middleware folder.
app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
