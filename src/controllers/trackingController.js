import { db } from '../config/firebase.js';

export const trackBus = async (req, res) => {
  try {
    const { busId } = req.params;
    
    // Getting bus details
    const busDoc = await db.collection('buses').doc(busId).get();
    if (!busDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Bus not found' 
      });
    }
    
    const busData = busDoc.data();
    
    // Getting current active trip
    const tripSnapshot = await db.collection('trips')
      .where('busId', '==', busId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    let tripInfo = null;
    let routeInfo = null;
    
    if (!tripSnapshot.empty) {
      const tripDoc = tripSnapshot.docs[0];
      const tripData = tripDoc.data();
      
      tripInfo = {
        id: tripDoc.id,
        ...tripData
      };
      
      // Getting route details
      const routeDoc = await db.collection('routes').doc(tripData.routeId).get();
      if (routeDoc.exists) {
        routeInfo = {
          id: routeDoc.id,
          ...routeDoc.data()
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        bus: {
          id: busId,
          registrationNumber: busData.registrationNumber,
          type: busData.type,
          capacity: busData.capacity,
          operator: busData.operator
        },
        currentLocation: busData.currentLocation || null,
        status: busData.status,
        lastUpdated: busData.lastUpdated,
        currentTrip: tripInfo,
        route: routeInfo
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to track bus',
      message: error.message 
    });
  }
};

export const trackRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Checking if route exists
    const routeDoc = await db.collection('routes').doc(routeId).get();
    if (!routeDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Route not found' 
      });
    }
    
    const routeData = routeDoc.data();
    
    // Getting all active trips for this route
    const tripsSnapshot = await db.collection('trips')
      .where('routeId', '==', routeId)
      .where('status', '==', 'active')
      .get();
    
    if (tripsSnapshot.empty) {
      return res.json({
        success: true,
        data: {
          route: {
            id: routeId,
            ...routeData
          },
          activeBuses: [],
          message: 'No active buses on this route currently'
        }
      });
    }
    
    // Getting bus details with locations
    const busesPromises = tripsSnapshot.docs.map(async (tripDoc) => {
      const tripData = tripDoc.data();
      const busDoc = await db.collection('buses').doc(tripData.busId).get();
      
      if (!busDoc.exists) return null;
      
      const busData = busDoc.data();
      return {
        busId: tripData.busId,
        registrationNumber: busData.registrationNumber,
        currentLocation: busData.currentLocation,
        status: busData.status,
        lastUpdated: busData.lastUpdated,
        trip: {
          id: tripDoc.id,
          scheduledDeparture: tripData.scheduledDeparture,
          scheduledArrival: tripData.scheduledArrival
        }
      };
    });
    
    const buses = (await Promise.all(busesPromises)).filter(bus => bus !== null);
    
    res.json({
      success: true,
      data: {
        route: {
          id: routeId,
          ...routeData
        },
        activeBuses: buses,
        count: buses.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to track route',
      message: error.message 
    });
  }
};