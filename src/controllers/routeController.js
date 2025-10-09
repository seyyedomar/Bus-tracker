import { db } from '../config/firebase.js';

export const getAllRoutes = async (req, res) => {
  try {
    const snapshot = await db.collection('routes').get();
    const routes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch routes',
      message: error.message 
    });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('routes').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Route not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch route',
      message: error.message 
    });
  }
};

export const getBusesOnRoute = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if route exists
    const routeDoc = await db.collection('routes').doc(id).get();
    if (!routeDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Route not found' 
      });
    }
    
    // Get all active trips for this route
    const tripsSnapshot = await db.collection('trips')
      .where('routeId', '==', id)
      .where('status', '==', 'active')
      .get();
    
    const busIds = tripsSnapshot.docs.map(doc => doc.data().busId);
    
    if (busIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No active buses on this route currently'
      });
    }
    
    // Get bus details
    const busesPromises = busIds.map(busId => 
      db.collection('buses').doc(busId).get()
    );
    const busesSnapshots = await Promise.all(busesPromises);
    
    const buses = busesSnapshots
      .filter(doc => doc.exists)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    res.json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch buses on route',
      message: error.message 
    });
  }
};