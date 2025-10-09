import { db } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Read JSON files
    const routesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../data/routes.json'), 'utf8')
    );
    const busesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../data/buses.json'), 'utf8')
    );
    const tripsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../data/trips.json'), 'utf8')
    );

    // Seed Routes
    console.log('Seeding routes...');
    for (const route of routesData) {
      await db.collection('routes').doc(route.id).set(route);
    }
    console.log(`${routesData.length} routes added`);

    // Seed Buses
    console.log('Seeding buses...');
    for (const bus of busesData) {
      await db.collection('buses').doc(bus.id).set(bus);
    }
    console.log(`${busesData.length} buses added`);

    // Seed Trips
    console.log('Seeding trips...');
    for (const trip of tripsData) {
      // Convert date strings to Firestore timestamps
      const tripData = {
        ...trip,
        scheduledDeparture: new Date(trip.scheduledDeparture),
        scheduledArrival: new Date(trip.scheduledArrival),
        createdAt: new Date()
      };
      await db.collection('trips').doc(trip.id).set(tripData);
    }
    console.log(` ${tripsData.length} trips added`);

    console.log(' Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();