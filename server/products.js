const retailerNames = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart', 'JioMart', 'Amazon Fresh']
const retailerMultipliers = [1, 1.06, 0.97, 1.03, 1.08, 1.02]

const sourceProducts = [
  ['Organic Greek Yogurt', 'Green Valley', 'Dairy', '170g cup', 120, 17, 8, 3, 0, 2.49, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=700&q=85'],
  ['Avocado Hass', 'Nature Pick', 'Fruits', '1 medium fruit', 240, 3, 13, 22, 10, 1.19, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=700&q=85'],
  ['Red Bell Peppers', 'Harvest Field', 'Vegetables', '1 medium pepper', 37, 1, 7, 0, 2, 1.29, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=700&q=85'],
  ['Wild Blueberries', 'North Farm', 'Fruits', '1 cup', 84, 1, 21, 0, 4, 3.99, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=700&q=85'],
  ['Baby Spinach', 'Leaf & Co.', 'Vegetables', '85g serving', 20, 2, 3, 0, 2, 2.99, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&q=85'],
  ['Almond Butter', 'Stone Mill', 'Pantry', '2 tbsp', 196, 7, 6, 18, 4, 8.49, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700&q=85'],
  ['Honeycrisp Apples', 'Orchard House', 'Fruits', '1 medium apple', 95, 1, 25, 0, 4, 1.49, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=700&q=85'],
  ['Cherry Tomatoes', 'Sun Garden', 'Vegetables', '1 cup', 27, 1, 6, 0, 2, 2.79, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700&q=85'],
  ['Free-Range Eggs', 'Meadow Rise', 'Dairy', '2 large eggs', 143, 13, 1, 10, 0, 4.99, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&q=85'],
  ['Whole Grain Oats', 'Morning Mill', 'Grains', '40g serving', 150, 5, 27, 3, 4, 4.49, 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=700&q=85'],
  ['Broccoli Crowns', 'Harvest Field', 'Vegetables', '1 cup chopped', 31, 3, 6, 0, 2, 2.49, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=700&q=85'],
  ['Strawberries', 'Berry Good', 'Fruits', '1 cup sliced', 49, 1, 12, 0, 3, 3.49, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=700&q=85'],
  ['Bananas', 'Tropical Harvest', 'Fruits', '1 medium banana', 105, 1, 27, 0, 3, 1.99, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=700&q=85'],
  ['Fresh Paneer', 'Farmstead', 'Dairy', '100g serving', 265, 18, 6, 20, 0, 4.99, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700&q=85'],
  ['Toned Milk', 'Daily Dairy', 'Dairy', '250ml glass', 120, 8, 12, 4, 0, 1.49, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=700&q=85'],
  ['Yellow Moong Dal', 'Kitchen Roots', 'Pantry', '50g dry serving', 174, 12, 30, 1, 8, 3.49, 'https://images.unsplash.com/photo-1585997648044-3b9d8b6b8e7f?w=700&q=85'],
  ['Mango Alphonso', 'Sun Orchard', 'Fruits', '1 cup sliced', 99, 1, 25, 1, 3, 3.49, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=700&q=85'],
  ['Pineapple Chunks', 'Tropical Harvest', 'Fruits', '1 cup chunks', 82, 1, 22, 0, 2, 2.49, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=700&q=85'],
  ['Green Grapes', 'Vine Valley', 'Fruits', '1 cup', 104, 1, 27, 0, 1, 3.29, 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=700&q=85'],
  ['Pomegranate Arils', 'Ruby Orchard', 'Fruits', '1 cup arils', 144, 3, 33, 2, 7, 4.99, 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=700&q=85'],
  ['Oranges', 'Citrus Grove', 'Fruits', '1 medium orange', 62, 1, 15, 0, 3, 1.99, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=700&q=85'],
  ['Cauliflower Florets', 'Harvest Field', 'Vegetables', '1 cup chopped', 27, 2, 5, 0, 2, 2.29, 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=700&q=85'],
  ['Carrot Sticks', 'Root & Rise', 'Vegetables', '1 cup chopped', 52, 1, 12, 0, 4, 1.49, 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=700&q=85'],
  ['Sweet Corn', 'Golden Field', 'Vegetables', '1 cup kernels', 132, 5, 29, 2, 4, 2.19, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=700&q=85'],
  ['Cucumber', 'Cool Garden', 'Vegetables', '1 cup sliced', 16, 1, 4, 0, 1, 1.29, 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=700&q=85'],
  ['Sweet Potatoes', 'Root & Rise', 'Vegetables', '1 medium potato', 112, 2, 26, 0, 4, 2.49, 'https://images.unsplash.com/photo-1596097635121-14b63f7a0c19?w=700&q=85'],
  ['Brown Rice', 'Grain House', 'Grains', '1 cup cooked', 216, 5, 45, 2, 4, 4.49, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=700&q=85'],
  ['Quinoa', 'Ancient Harvest', 'Grains', '1 cup cooked', 222, 8, 39, 4, 5, 7.49, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&q=85'],
  ['Pearl Millet', 'Kitchen Roots', 'Grains', '1 cup cooked', 207, 6, 41, 2, 2, 3.99, 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=700&q=85'],
  ['Whole Wheat Bread', 'Morning Mill', 'Grains', '2 slices', 160, 8, 28, 2, 4, 3.49, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700&q=85'],
  ['Barley', 'Grain House', 'Grains', '1 cup cooked', 193, 4, 44, 1, 6, 3.79, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=700&q=85'],
  ['Cottage Cheese', 'Farmstead', 'Dairy', '1 cup', 206, 28, 8, 9, 0, 4.49, 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=700&q=85'],
  ['Cheddar Cheese', 'Mellow Dairy', 'Dairy', '28g slice', 113, 7, 0, 9, 0, 5.99, 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=700&q=85'],
  ['Plain Kefir', 'Green Valley', 'Dairy', '240ml glass', 110, 10, 12, 2, 0, 3.99, 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=700&q=85'],
  ['Mozzarella', 'Mellow Dairy', 'Dairy', '28g serving', 85, 6, 1, 6, 0, 5.49, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700&q=85'],
  ['Buttermilk', 'Daily Dairy', 'Dairy', '250ml glass', 98, 8, 12, 2, 0, 1.99, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&q=85']
]

export const products = sourceProducts.map(([name, brand, category, serving, calories, protein, carbs, fat, fiber, basePrice, image], index) => ({
  id: index + 1,
  name,
  brand,
  category,
  image,
  serving,
  calories,
  protein,
  carbs,
  fat,
  fiber,
  retailers: retailerNames.map((retailer, retailerIndex) => ({
    name: retailer,
    price: Math.round(basePrice * 85 * retailerMultipliers[retailerIndex])
  }))
}))
