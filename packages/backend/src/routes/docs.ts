import { Router } from 'express';
// import swaggerUi from 'swagger-ui-express';
// import swaggerJsdoc from 'swagger-jsdoc';

const router = Router();

// Options for the swagger docs
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgentVendi API',
      version: '1.0.0',
      description: 'The no-code vending machine for production-grade AI agents.',
    },
    servers: [{ url: 'http://localhost:3001' }],
  },
  apis: ['./packages/backend/src/routes/*.ts'], // Path to the API docs
};

// const specs = swaggerJsdoc(options);

// router.use('/', swaggerUi.serve);
// router.get('/', swaggerUi.setup(specs));

// Placeholder for now as I need to install dependencies.
router.get('/', (req, res) => {
  res.json({ message: 'Swagger API documentation under construction. Use schema.json for agent definitions.' });
});

export default router;
