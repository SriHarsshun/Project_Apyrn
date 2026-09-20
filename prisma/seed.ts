import { PrismaClient, Role, ItemStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const company = await prisma.company.create({
    data: {
      name: 'Demo Company Inc.',
      users: {
        create: {
          email: 'admin@apyrn.com',
          password: hashedPassword,
          name: 'Demo Admin',
          role: Role.ADMIN,
        }
      },
      items: {
        create: [
          {
            title: 'ThinkPad T14',
            sku: 'LAP-TP-T14',
            quantity: 50,
            status: ItemStatus.IN_STOCK,
            category: 'Laptops',
            reorderPoint: 10,
          },
          {
            title: 'Dell 27" 4K',
            sku: 'MON-DELL-27',
            quantity: 15,
            status: ItemStatus.IN_STOCK,
            category: 'Monitors',
            reorderPoint: 20,
          }
        ]
      }
    }
  });
  
  console.log('Database seeded successfully.', company.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
