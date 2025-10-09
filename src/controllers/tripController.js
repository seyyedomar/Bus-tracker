import { db } from '../config/firebase.js';

export const getAllTrips = async (req, res) => {
  try {
    const { status, routeId, busId, date } = req.query;
    let query = db.collection('trips');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    if (routeId) {
      query = query.where('routeId', '==', routeId);
    }
    if (busId) {
      query = query.where('busId', '==', busId);
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .where('scheduledDeparture', '>=', startDate)
        .where('scheduledDeparture', '<=', endDate);
    }
    
    const snapshot = await query.orderBy('scheduledDeparture', 'desc').limit(100).get();
    const trips = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trips',
      message: error.message 
    });
  }
};

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('trips').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Trip not found' 
      });
    }
    
    const tripData = doc.data();
    
    // Getting route details
    const routeDoc = await db.collection('routes').doc(tripData.routeId).get();
    const routeData = routeDoc.exists ? routeDoc.data() : null;
    
    // Getting bus details
    const busDoc = await db.collection('buses').doc(tripData.busId).get();
    const busData = busDoc.exists ? busDoc.data() : null;
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...tripData,
        route: routeData,
        bus: busData
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trip',
      message: error.message 
    });
  }
};

export const getActiveTrips = async (req, res) => {
  try {
    const snapshot = await db.collection('trips')
      .where('status', '==', 'active')
      .get();
    
    const tripsPromises = snapshot.docs.map(async (doc) => {
      const tripData = doc.data();
      
      // Getting bus's current location
      const busDoc = await db.collection('buses').doc(tripData.busId).get();
      const busData = busDoc.exists ? busDoc.data() : null;
      
      return {
        id: doc.id,
        ...tripData,
        currentLocation: busData?.currentLocation || null,
        busRegistration: busData?.registrationNumber || null
      };
    });
    
    const trips = await Promise.all(tripsPromises);
    
    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch active trips',
      message: error.message 
    });
  }
};