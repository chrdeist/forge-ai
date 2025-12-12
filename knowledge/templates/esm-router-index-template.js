/**
 * ESM Router Index Template
 * Aggregates all route handlers
 */

import express from 'express';
{{IMPORTS}}

const router = express.Router();

// Register routes
{{ROUTE_REGISTRATIONS}}

export default router;
