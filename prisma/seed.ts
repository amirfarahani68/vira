import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager role',
    },
  });

  const technicianRole = await prisma.role.upsert({
    where: { name: 'technician' },
    update: {},
    create: {
      name: 'technician',
      description: 'Technician role',
    },
  });

  // Permissions
  const permissionsData = [
    { action: 'read', resource: 'users' },
    { action: 'write', resource: 'users' },
    { action: 'read', resource: 'attendance' },
    { action: 'write', resource: 'attendance' },
    { action: 'read', resource: 'leave' },
    { action: 'approve', resource: 'leave' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { action_resource: { action: perm.action, resource: perm.resource } },
      update: {},
      create: perm,
    });
  }

  // assign all permissions to admin role
  const permissions = await prisma.permission.findMany();
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Branch
  const branch = await prisma.branch.upsert({
    where: { name: 'Main Branch' },
    update: {},
    create: {
      name: 'Main Branch',
      location: 'Tehran',
    },
  });

  // Admin user
  const adminPassword = 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'System Administrator',
      email: 'admin@example.com',
      status: 'active',
      roleId: adminRole.id,
      branchId: branch.id,
    },
  });

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
