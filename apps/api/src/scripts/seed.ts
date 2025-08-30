import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create system roles
  console.log('Creating system roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System Administrator',
      permissions: ['*'],
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular User',
      permissions: ['task.read', 'task.update', 'document.read', 'client.read', 'entity.read'],
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager',
      permissions: ['tenant.*', 'user.read', 'client.*', 'entity.*', 'task.*', 'document.*', 'compliance.*'],
      isSystem: true,
    },
  });

  // Create demo tenant
  console.log('Creating demo tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-firm' },
    update: {},
    create: {
      name: 'Demo CS/CA Firm',
      slug: 'demo-firm',
      email: 'admin@demo-firm.com',
      phone: '+91-9876543210',
      gstNumber: '27AAAAA0000A1Z5',
      panNumber: 'AAAAA0000A',
      planType: 'PROFESSIONAL',
      settings: {
        features: ['compliance_tracking', 'document_management', 'task_automation'],
        notifications: {
          email: true,
          sms: true,
          whatsapp: false
        }
      },
      address: {
        street: '123 Business District',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      }
    },
  });

  // Create demo users
  console.log('Creating demo users...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      designation: 'Managing Partner',
      department: 'Administration',
      isEmailVerified: true,
      isActive: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'manager@demo.com',
      firstName: 'Compliance',
      lastName: 'Manager',
      password: hashedPassword,
      designation: 'Compliance Manager',
      department: 'Compliance',
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Assign roles
  console.log('Assigning roles...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: managerRole.id,
    },
  });

  // Create demo clients
  console.log('Creating demo clients...');
  const client1 = await prisma.client.upsert({
    where: { id: 'demo-client-1' },
    update: {},
    create: {
      id: 'demo-client-1',
      tenantId: demoTenant.id,
      name: 'ABC Private Limited',
      type: 'PRIVATE_LIMITED',
      email: 'contact@abc-pvt.com',
      phone: '+91-9876543210',
      gstNumber: '27ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      cinNumber: 'U74999MH2020PTC123456',
      address: {
        street: '456 Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        country: 'India'
      }
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'demo-client-2' },
    update: {},
    create: {
      id: 'demo-client-2',
      tenantId: demoTenant.id,
      name: 'XYZ LLP',
      type: 'LLP',
      email: 'info@xyz-llp.com',
      phone: '+91-9876543211',
      gstNumber: '27XYZAB5678G1Z5',
      panNumber: 'XYZAB5678G',
      address: {
        street: '789 Commercial Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400003',
        country: 'India'
      }
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('Demo users created:');
  console.log('- Admin: admin@demo.com (password: demo123)');
  console.log('- Manager: manager@demo.com (password: demo123)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
