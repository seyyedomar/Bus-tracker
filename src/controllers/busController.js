import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const getAllBuses = async (req, res) => {
  try {
    const { operatorId, status } = req.query;
    let query = db.collection('buses');
    
    if (operatorId) {
      query = query.where('operatorId', '==', operatorId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const buses = snapshot.docs.map(doc => ({
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
      error: 'Failed to fetch buses',
      message: error.message 
    });
  }
};

export const getBusById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('buses').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Bus not found' 
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
      error: 'Failed to fetch bus',
      message: error.message 
    });
  }
};

export const updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, heading } = req.body;
    
    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Latitude and longitude are required' 
      });
    }
    
    // Check if bus exists
    const busDoc = await db.collection('buses').doc(id).get();
    if (!busDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Bus not found' 
      });
    }
    
    // Update bus location
    const updateData = {
      currentLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: FieldValue.serverTimestamp()
      },
      lastUpdated: FieldValue.serverTimestamp()
    };
    
    if (speed !== undefined) {
      updateData.currentLocation.speed = parseFloat(speed);
    }
    if (heading !== undefined) {
      updateData.currentLocation.heading = parseFloat(heading);
    }
    
    await db.collection('buses').doc(id).update(updateData);
    
    // Get updated bus data
    const updatedBus = await db.collection('buses').doc(id).get();
    
    res.json({
      success: true,
      message: 'Bus location updated successfully',
      data: {
        id: updatedBus.id,
        ...updatedBus.data()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update bus location',
      message: error.message 
    });
  }
};

export const getBusStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const busDoc = await db.collection('buses').doc(id).get();
    if (!busDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Bus not found' 
      });
    }
    
    const busData = busDoc.data();
    
    // Get current active trip
    const tripSnapshot = await db.collection('trips')
      .where('busId', '==', id)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    let currentTrip = null;
    if (!tripSnapshot.empty) {
      const tripDoc = tripSnapshot.docs[0];
      currentTrip = {
        id: tripDoc.id,
        ...tripDoc.data()
      };
    }
    
    res.json({
      success: true,
      data: {
        busId: id,
        registrationNumber: busData.registrationNumber,
        status: busData.status,
        currentLocation: busData.currentLocation,
        lastUpdated: busData.lastUpdated,
        currentTrip: currentTrip
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch bus status',
      message: error.message 
    });
  }
};