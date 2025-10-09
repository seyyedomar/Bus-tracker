import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as routeController from '../controllers/routeController.js';
import * as busController from '../controllers/busController.js';
import * as tripController from '../controllers/tripController.js';
import * as trackingController from '../controllers/trackingController.js';

const router = express.Router();

// Public routes - anyone with a valid API key can access
router.get('/routes', authenticate, routeController.getAllRoutes);
router.get('/routes/:id', authenticate, routeController.getRouteById);
router.get('/routes/:id/buses', authenticate, routeController.getBusesOnRoute);

router.get('/buses', authenticate, busController.getAllBuses);
router.get('/buses/:id', authenticate, busController.getBusById);
router.get('/buses/:id/status', authenticate, busController.getBusStatus);

router.get('/trips', authenticate, tripController.getAllTrips);
router.get('/trips/:id', authenticate, tripController.getTripById);
router.get('/trips/active', authenticate, tripController.getActiveTrips);

router.get('/tracking/bus/:busId', authenticate, trackingController.trackBus);
router.get('/tracking/route/:routeId', authenticate, trackingController.trackRoute);

// Operator-only routes - requires OPERATOR or NTC_ADMIN role
router.put('/buses/:id/location', 
  authenticate, 
  requireRole('OPERATOR', 'NTC_ADMIN'), 
  busController.updateBusLocation
);

// Health check endpoint - no authentication required
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'NTC Bus Tracking API is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to NTC Bus Tracking API',
    version: '1.0.0',
    endpoints: {
      routes: {
        'GET /api/routes': 'Get all routes',
        'GET /api/routes/:id': 'Get route by ID',
        'GET /api/routes/:id/buses': 'Get buses on a route'
      },
      buses: {
        'GET /api/buses': 'Get all buses (query params: operatorId, status)',
        'GET /api/buses/:id': 'Get bus by ID',
        'GET /api/buses/:id/status': 'Get bus real-time status',
        'PUT /api/buses/:id/location': 'Update bus location (OPERATOR only)'
      },
      trips: {
        'GET /api/trips': 'Get all trips (query params: status, routeId, busId, date)',
        'GET /api/trips/:id': 'Get trip by ID',
        'GET /api/trips/active': 'Get all active trips'
      },
      tracking: {
        'GET /api/tracking/bus/:busId': 'Track specific bus in real-time',
        'GET /api/tracking/route/:routeId': 'Track all buses on a route'
      }
    },
    authentication: {
      method: 'API Key',
      header: 'x-api-key',
      roles: ['NTC_ADMIN', 'OPERATOR', 'PUBLIC']
    }
  });
});

export default router;