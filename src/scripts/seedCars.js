/* Seed initial car data into the cars table.
 * Run with: npm run seed:cars
 */

const { pool } = require('../config/db');

const budgetCars = [
  {
    name: 'Swift',
    category: 'budget',
    pricePerDay: 2199,
    imageUrl: 'media/cars/budget/swift-side.jpg',
    specs: ['Petrol', 'Manual', '5 Seater'],
  },
  {
    name: 'Nexon',
    category: 'budget',
    pricePerDay: 3499,
    imageUrl: 'media/cars/budget/nexon-side.jpg',
    specs: ['Diesel', 'Manual', '5 Seater'],
  },
  {
    name: 'Punch',
    category: 'budget',
    pricePerDay: 2999,
    imageUrl: 'media/cars/budget/punch-side.jpg',
    specs: ['Petrol', 'Manual', '5 Seater'],
  },
  {
    name: 'XUV700',
    category: 'budget',
    pricePerDay: 4999,
    imageUrl: 'media/cars/budget/xuv700-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'XUV300',
    category: 'budget',
    pricePerDay: 6999,
    imageUrl: 'media/cars/budget/xuv300-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'MG Hector Plus',
    category: 'budget',
    pricePerDay: 5999,
    imageUrl: 'media/cars/budget/mghector-side.jpg',
    specs: ['Petrol', 'Automatic', '6 Seater'],
  },
  {
    name: 'Innova Crysta',
    category: 'budget',
    pricePerDay: 6499,
    imageUrl: 'media/cars/budget/innova-side.jpg',
    specs: ['Diesel', 'Manual', '7 Seater'],
  },
  {
    name: 'Thar',
    category: 'budget',
    pricePerDay: 5499,
    imageUrl: 'media/cars/budget/thar-side.jpg',
    specs: ['Diesel', 'Manual', '4 Seater'],
  },
  {
    name: 'Hilux',
    category: 'budget',
    pricePerDay: 6999,
    imageUrl: 'media/cars/budget/hilux-side.jpg',
    specs: ['Diesel', 'Manual', '5 Seater'],
  },
  {
    name: 'Creta',
    category: 'budget',
    pricePerDay: 7499,
    imageUrl: 'media/cars/budget/creta-side.jpg',
    specs: ['Diesel', 'Automatic', '5 Seater'],
  },
];

const premiumCars = [
  {
    name: 'Toyota Fortuner',
    category: 'premium',
    pricePerDay: 6999,
    imageUrl: 'media/cars/premium/fortuner-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'BMW 3 Series',
    category: 'premium',
    pricePerDay: 7999,
    imageUrl: 'media/cars/premium/bmw3-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'BMW 5 Series',
    category: 'premium',
    pricePerDay: 9999,
    imageUrl: 'media/cars/premium/bmw5-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Mercedes C-Class',
    category: 'premium',
    pricePerDay: 8499,
    imageUrl: 'media/cars/premium/benzC-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Mercedes E-Class',
    category: 'premium',
    pricePerDay: 10999,
    imageUrl: 'media/cars/premium/benzE-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Audi A4',
    category: 'premium',
    pricePerDay: 8999,
    imageUrl: 'media/cars/premium/audiA4-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Audi A6',
    category: 'premium',
    pricePerDay: 11499,
    imageUrl: 'media/cars/premium/audiA6-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Range Rover Velar',
    category: 'premium',
    pricePerDay: 14999,
    imageUrl: 'media/cars/premium/rangeRoverVelar-side.jpg',
    specs: ['Diesel', 'Automatic', '5 Seater'],
  },
  {
    name: 'Land Rover Defender',
    category: 'premium',
    pricePerDay: 15999,
    imageUrl: 'media/cars/premium/defender-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'Toyota Land Cruiser',
    category: 'premium',
    pricePerDay: 16999,
    imageUrl: 'media/cars/premium/landCruiser-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'Kia Carnival',
    category: 'premium',
    pricePerDay: 6499,
    imageUrl: 'media/cars/premium/kiaCarnival-side.jpg',
    specs: ['Diesel', 'Automatic', '7 Seater'],
  },
  {
    name: 'Jeep Wrangler Rubicon',
    category: 'premium',
    pricePerDay: 12999,
    imageUrl: 'media/cars/premium/jeepRubicon-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Volvo XC60',
    category: 'premium',
    pricePerDay: 9499,
    imageUrl: 'media/cars/premium/volvoXC60-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Lexus ES',
    category: 'premium',
    pricePerDay: 10499,
    imageUrl: 'media/cars/premium/lexusES-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Jaguar XF',
    category: 'premium',
    pricePerDay: 9999,
    imageUrl: 'media/cars/premium/jaguarXF-side.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
];

const luxuryCars = [
  // We only have names and images in the frontend; prices here are reasonable placeholders.
  {
    name: 'Porsche 911',
    category: 'luxury',
    pricePerDay: 24999,
    imageUrl: 'media/cars/luxury/porsche911-1.jpg',
    specs: ['Petrol', 'Automatic', '2+2 Seater'],
  },
  {
    name: 'Rolls-Royce Ghost',
    category: 'luxury',
    pricePerDay: 39999,
    imageUrl: 'media/cars/luxury/rollsroyce-1.jpg',
    specs: ['Petrol', 'Automatic', '4 Seater'],
  },
  {
    name: 'Rolls-Royce La Rose Noire Droptail',
    category: 'luxury',
    pricePerDay: 49999,
    imageUrl: 'media/cars/luxury/droptail-1.jpg',
    specs: ['Petrol', 'Automatic', '2 Seater'],
  },
  {
    name: 'Audi Q3',
    category: 'luxury',
    pricePerDay: 14999,
    imageUrl: 'media/cars/luxury/audiq3-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Volvo XC40',
    category: 'luxury',
    pricePerDay: 15999,
    imageUrl: 'media/cars/luxury/volvoxc40-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Lexus NX',
    category: 'luxury',
    pricePerDay: 16999,
    imageUrl: 'media/cars/luxury/lexusnx-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Mini Countryman',
    category: 'luxury',
    pricePerDay: 13999,
    imageUrl: 'media/cars/luxury/minicountryman-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Mercedes-Benz GLA',
    category: 'luxury',
    pricePerDay: 16999,
    imageUrl: 'media/cars/luxury/mercedesgla-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Mercedes-Benz GLB',
    category: 'luxury',
    pricePerDay: 17999,
    imageUrl: 'media/cars/luxury/mercedesglb-1.jpg',
    specs: ['Petrol', 'Automatic', '7 Seater'],
  },
  {
    name: 'Genesis GV70',
    category: 'luxury',
    pricePerDay: 18999,
    imageUrl: 'media/cars/luxury/genesisgv70-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
  {
    name: 'Range Rover Evoque',
    category: 'luxury',
    pricePerDay: 18999,
    imageUrl: 'media/cars/luxury/rangeroverevoque-1.jpg',
    specs: ['Diesel', 'Automatic', '5 Seater'],
  },
  {
    name: 'Acura RDX',
    category: 'luxury',
    pricePerDay: 16999,
    imageUrl: 'media/cars/luxury/acurardx-1.jpg',
    specs: ['Petrol', 'Automatic', '5 Seater'],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding cars table...');
    await client.query('BEGIN');

    const allCars = [...budgetCars, ...premiumCars, ...luxuryCars];

    for (const car of allCars) {
      // Avoid duplicates based on name + category
      await client.query(
        `
        INSERT INTO cars (name, category, price_per_day, image_url, specs)
        SELECT $1, $2, $3, $4, $5
        WHERE NOT EXISTS (
          SELECT 1 FROM cars WHERE name = $1 AND category = $2
        )
        `,
        [car.name, car.category, car.pricePerDay, car.imageUrl, JSON.stringify(car.specs)]
      );
    }

    await client.query('COMMIT');
    console.log('Cars seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding cars:', err);
  } finally {
    client.release();
    // Exit process so the script ends cleanly
    process.exit(0);
  }
}

seed();

