// prisma/seed.ts

import { PrismaClient, LocationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // =============================================
  // SEED LOCATIONS
  // =============================================
  console.log("📍 Seeding locations...");

  // LOCAL locations (Bogor & sekitarnya)
  const localLocations = [
    {
      code: "LOCAL-BGR",
      name: "Bogor Pusat",
      type: LocationType.LOCAL,
      address: "Jl. Pajajaran, Bogor",
    },
    {
      code: "LOCAL-CBI",
      name: "Cibinong",
      type: LocationType.LOCAL,
      address: "Jl. Raya Cibinong, Bogor",
    },
    {
      code: "LOCAL-CGR",
      name: "Citeureup",
      type: LocationType.LOCAL,
      address: "Jl. Raya Citeureup, Bogor",
    },
    {
      code: "LOCAL-DRM",
      name: "Dramaga",
      type: LocationType.LOCAL,
      address: "Jl. Raya Dramaga, Bogor",
    },
    {
      code: "LOCAL-GNL",
      name: "Gunung Putri",
      type: LocationType.LOCAL,
      address: "Jl. Raya Gunung Putri, Bogor",
    },
  ];

  // CABANG locations (Luar Bogor)
  const cabangLocations = [
    {
      code: "CABANG-JKT",
      name: "Jakarta Pusat",
      type: LocationType.CABANG,
      address: "Jl. Sudirman, Jakarta",
    },
    {
      code: "CABANG-BKS",
      name: "Bekasi",
      type: LocationType.CABANG,
      address: "Jl. Ahmad Yani, Bekasi",
    },
    {
      code: "CABANG-DPK",
      name: "Depok",
      type: LocationType.CABANG,
      address: "Jl. Margonda Raya, Depok",
    },
    {
      code: "CABANG-TGR",
      name: "Tangerang",
      type: LocationType.CABANG,
      address: "Jl. Sudirman, Tangerang",
    },
    {
      code: "CABANG-BDG",
      name: "Bandung",
      type: LocationType.CABANG,
      address: "Jl. Dago, Bandung",
    },
    {
      code: "CABANG-SMG",
      name: "Semarang",
      type: LocationType.CABANG,
      address: "Jl. Pemuda, Semarang",
    },
    {
      code: "CABANG-SBY",
      name: "Surabaya",
      type: LocationType.CABANG,
      address: "Jl. Tunjungan, Surabaya",
    },
    {
      code: "CABANG-YGY",
      name: "Yogyakarta",
      type: LocationType.CABANG,
      address: "Jl. Malioboro, Yogyakarta",
    },
    {
      code: "CABANG-MLG",
      name: "Malang",
      type: LocationType.CABANG,
      address: "Jl. Ijen, Malang",
    },
    {
      code: "CABANG-SKA",
      name: "Solo",
      type: LocationType.CABANG,
      address: "Jl. Slamet Riyadi, Solo",
    },
  ];

  for (const location of [...localLocations, ...cabangLocations]) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: {},
      create: location,
    });
  }

  console.log(`✅ Created ${localLocations.length} local locations`);
  console.log(`✅ Created ${cabangLocations.length} cabang locations`);

  // =============================================
  // SEED CATEGORIES
  // =============================================
  console.log("📦 Seeding categories...");

  const categories = [
    {
      name: "ACCESSORIES",
      description: "Aksesoris furniture dan springbed",
      sortOrder: 1,
    },
    {
      name: "BAHAN KIMIA",
      description: "Bahan kimia untuk produksi",
      sortOrder: 2,
    },
    {
      name: "BUSA",
      description: "Busa untuk sofa dan springbed",
      sortOrder: 3,
    },
    { name: "HDP", description: "High Density Polyurethane", sortOrder: 4 },
    { name: "JASA", description: "Jasa instalasi dan service", sortOrder: 5 },
    {
      name: "KAIN POLOS SOFA",
      description: "Kain polos untuk sofa",
      sortOrder: 6,
    },
    {
      name: "KAIN POLOS SPRINGBED",
      description: "Kain polos untuk springbed",
      sortOrder: 7,
    },
    {
      name: "KAIN QUILTING",
      description: "Kain quilting untuk kasur",
      sortOrder: 8,
    },
    { name: "MSP", description: "Material Support Product", sortOrder: 9 },
    { name: "KAWAT", description: "Kawat untuk springbed", sortOrder: 10 },
    { name: "NON WOVEN", description: "Material non woven", sortOrder: 11 },
    { name: "OTHER", description: "Produk lainnya", sortOrder: 12 },
    {
      name: "PER COIL",
      description: "Per coil untuk springbed",
      sortOrder: 13,
    },
    { name: "PITA LIST", description: "Pita dan list dekorasi", sortOrder: 14 },
    { name: "PLASTIC", description: "Material plastik", sortOrder: 15 },
    {
      name: "STAPLESS",
      description: "Stapless dan material pengikat",
      sortOrder: 16,
    },
    { name: "FURNITURE", description: "Furniture lengkap", sortOrder: 17 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log(`✅ Created ${categories.length} categories`);

  // =============================================
  // SEED PERMISSIONS
  // =============================================
  console.log("🔐 Seeding permissions...");

  const permissions = [
    {
      name: "dashboard.view",
      module: "dashboard",
      description: "View dashboard",
    },
    {
      name: "dashboard.export",
      module: "dashboard",
      description: "Export reports",
    },
    { name: "sales.upload", module: "sales", description: "Upload sales data" },
    {
      name: "sales.view.local",
      module: "sales",
      description: "View local sales",
    },
    {
      name: "sales.view.cabang",
      module: "sales",
      description: "View cabang sales",
    },
    { name: "sales.view.all", module: "sales", description: "View all sales" },
    { name: "sales.delete", module: "sales", description: "Delete sales data" },
    { name: "settings.users", module: "settings", description: "Manage users" },
    { name: "settings.roles", module: "settings", description: "Manage roles" },
    {
      name: "settings.categories",
      module: "settings",
      description: "Manage categories",
    },
    {
      name: "settings.locations",
      module: "settings",
      description: "Manage locations",
    },
    {
      name: "settings.targets",
      module: "settings",
      description: "Manage targets",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // =============================================
  // SEED ROLES
  // =============================================
  console.log("👔 Seeding roles...");

  const adminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: {
      name: "Super Admin",
      description: "Full access to all features",
    },
  });

  const direkturRole = await prisma.role.upsert({
    where: { name: "Direktur" },
    update: {},
    create: {
      name: "Direktur",
      description: "View all sales and reports",
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: {
      name: "Manager",
      description: "Manage local and cabang sales",
    },
  });

  const uploaderRole = await prisma.role.upsert({
    where: { name: "Uploader" },
    update: {},
    create: {
      name: "Uploader",
      description: "Upload sales data only",
    },
  });

  console.log("✅ Created 4 roles");

  // =============================================
  // ASSIGN PERMISSIONS TO ROLES
  // =============================================
  console.log("🔗 Assigning permissions to roles...");

  const allPermissions = await prisma.permission.findMany();

  // Super Admin - semua permission
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Direktur - view semua, export, tapi tidak bisa manage settings
  const direkturPermissions = allPermissions.filter(
    (p) => p.name.startsWith("dashboard.") || p.name.startsWith("sales.view"),
  );
  for (const permission of direkturPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: direkturRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: direkturRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Manager - view local & cabang
  const managerPermissions = allPermissions.filter(
    (p) =>
      p.name === "dashboard.view" ||
      p.name === "sales.view.local" ||
      p.name === "sales.view.cabang",
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Uploader - hanya upload
  const uploaderPermissions = allPermissions.filter(
    (p) => p.name === "sales.upload" || p.name === "dashboard.view",
  );
  for (const permission of uploaderPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: uploaderRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: uploaderRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Assigned permissions to all roles");

  // =============================================
  // SEED USERS
  // =============================================
  console.log("👤 Seeding users...");

  const adminPassword = await bcrypt.hash("ekatunggal123", 10);
  const defaultPassword = await bcrypt.hash("password123", 10);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "administrator@performa.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "administrator@performa.com",
      password: adminPassword,
      isActive: true,
    },
  });

  // Direktur user (untuk testing)
  const direkturUser = await prisma.user.upsert({
    where: { email: "direktur@salesmonitor.com" },
    update: {},
    create: {
      name: "Direktur User",
      email: "direktur@salesmonitor.com",
      password: defaultPassword,
      isActive: true,
    },
  });

  // Uploader user (untuk testing)
  const uploaderUser = await prisma.user.upsert({
    where: { email: "uploader@salesmonitor.com" },
    update: {},
    create: {
      name: "Uploader User",
      email: "uploader@salesmonitor.com",
      password: defaultPassword,
      isActive: true,
    },
  });

  console.log("✅ Created 3 users");

  // =============================================
  // ASSIGN ROLES TO USERS
  // =============================================
  console.log("🔗 Assigning roles to users...");

  // Admin -> Super Admin role
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

  // Direktur user -> Direktur role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: direkturUser.id,
        roleId: direkturRole.id,
      },
    },
    update: {},
    create: {
      userId: direkturUser.id,
      roleId: direkturRole.id,
    },
  });

  // Uploader user -> Uploader role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: uploaderUser.id,
        roleId: uploaderRole.id,
      },
    },
    update: {},
    create: {
      userId: uploaderUser.id,
      roleId: uploaderRole.id,
    },
  });

  console.log("✅ Assigned roles to all users");

  // =============================================
  // SUMMARY
  // =============================================
  console.log("\n========================================");
  console.log("🎉 Seeding completed successfully!");
  console.log("========================================");
  console.log("\n📋 Summary:");
  console.log(`   - Locations: 15 (5 LOCAL + 10 CABANG)`);
  console.log(`   - Categories: 17`);
  console.log(`   - Permissions: 12`);
  console.log(`   - Roles: 4`);
  console.log(`   - Users: 3`);
  console.log("🔐 Test Credentials:");
  console.log("   - administrator@performa.com / ekatunggal123 (Super Admin)");
  console.log("   - direktur@performa.com / password123 (Direktur)");
  console.log("   - uploader@performa.com / password123 (Uploader)");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
