import { z } from 'zod';

/**
 * Express middleware to validate request body using Zod.
 * @param {z.ZodSchema} schema 
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: err.errors.map(e => ({ path: e.path, message: e.message }))
      });
    }
    next(err);
  }
};
