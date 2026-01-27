// prisma/seed.ts

import { PrismaClient, LocationType, PermissionModule } from "@prisma/client";
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
    {
      name: "ACCESSORIES KAKI",
      description: "Aksesoris kaki furniture",
      sortOrder: 18,
    },
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
  // SEED GRANULAR PERMISSIONS (NEW STRUCTURE)
  // =============================================
  console.log("🔐 Seeding granular permissions...");

  const permissions = [
    // DASHBOARD Module
    {
      slug: "view_dashboard",
      name: "View Dashboard",
      description: "View all dashboard charts and graphs",
      module: PermissionModule.DASHBOARD,
      isSystem: true,
    },
    {
      slug: "view_dashboard_limited",
      name: "View Limited Dashboard",
      description: "View limited dashboard (future feature)",
      module: PermissionModule.DASHBOARD,
      isSystem: false,
    },
    {
      slug: "export_dashboard",
      name: "Export Dashboard",
      description: "Export dashboard data to Excel/PDF",
      module: PermissionModule.DASHBOARD,
      isSystem: true,
    },

    // UPLOAD Module
    {
      slug: "upload_omzet",
      name: "Upload Omzet",
      description: "Upload sales/omzet data (Marketing)",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },
    {
      slug: "upload_gross_margin",
      name: "Upload Gross Margin",
      description: "Upload gross margin data (Accounting)",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },
    {
      slug: "upload_retur",
      name: "Upload Retur",
      description: "Upload return/retur data (Accounting)",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },
    {
      slug: "view_upload_history",
      name: "View Upload History",
      description: "View own upload history",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },
    {
      slug: "view_all_uploads",
      name: "View All Uploads",
      description: "View all users' upload history (Admin)",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },
    {
      slug: "delete_upload",
      name: "Delete Upload",
      description: "Delete uploaded data (Admin only)",
      module: PermissionModule.UPLOAD,
      isSystem: true,
    },

    // SETTINGS Module
    {
      slug: "manage_roles",
      name: "Manage Roles",
      description: "CRUD roles",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },
    {
      slug: "manage_permissions",
      name: "Manage Permissions",
      description: "CRUD permissions",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },
    {
      slug: "manage_users",
      name: "Manage Users",
      description: "CRUD users",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },
    {
      slug: "manage_branches",
      name: "Manage Branches",
      description: "CRUD branches/locations",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },
    {
      slug: "manage_categories",
      name: "Manage Categories",
      description: "CRUD categories",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },
    {
      slug: "manage_targets",
      name: "Manage Targets",
      description: "Set sales targets",
      module: PermissionModule.SETTINGS,
      isSystem: true,
    },

    // AUDIT Module
    {
      slug: "view_audit_log",
      name: "View Audit Log",
      description: "View audit logs (compliance)",
      module: PermissionModule.AUDIT,
      isSystem: true,
    },

    // EXPORT Module
    {
      slug: "export_sales_data",
      name: "Export Sales Data",
      description: "Export raw sales data",
      module: PermissionModule.EXPORT,
      isSystem: true,
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { slug: permission.slug },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // =============================================
  // SEED ROLES (WITH isSystem FLAG)
  // =============================================
  console.log("👔 Seeding roles...");

  const administratorRole = await prisma.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: {
      name: "ADMINISTRATOR",
      description: "Full access to all features (System Role)",
      isSystem: true, // Cannot be deleted
    },
  });

  const direkturRole = await prisma.role.upsert({
    where: { name: "DIREKTUR" },
    update: {},
    create: {
      name: "DIREKTUR",
      description: "View dashboard, export, view audit logs",
      isSystem: false,
    },
  });

  const marketingRole = await prisma.role.upsert({
    where: { name: "MARKETING" },
    update: {},
    create: {
      name: "MARKETING",
      description: "Upload omzet data only",
      isSystem: false,
    },
  });

  const accountingRole = await prisma.role.upsert({
    where: { name: "ACCOUNTING" },
    update: {},
    create: {
      name: "ACCOUNTING",
      description: "Upload gross margin and retur data",
      isSystem: false,
    },
  });

  console.log("✅ Created 4 roles");

  // =============================================
  // ASSIGN PERMISSIONS TO ROLES
  // =============================================
  console.log("🔗 Assigning permissions to roles...");

  const allPermissions = await prisma.permission.findMany();

  // ADMINISTRATOR - ALL permissions (18 permissions)
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: administratorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: administratorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // DIREKTUR - view dashboard, export, view all uploads, view audit, export sales
  const direkturPermissions = allPermissions.filter((p) =>
    [
      "view_dashboard",
      "export_dashboard",
      "view_all_uploads",
      "view_audit_log",
      "export_sales_data",
    ].includes(p.slug)
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

  // MARKETING - upload omzet, view upload history
  const marketingPermissions = allPermissions.filter((p) =>
    ["upload_omzet", "view_upload_history"].includes(p.slug)
  );
  for (const permission of marketingPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: marketingRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: marketingRole.id,
        permissionId: permission.id,
      },
    });
  }

  // ACCOUNTING - upload gross margin, upload retur, view upload history
  const accountingPermissions = allPermissions.filter((p) =>
    [
      "upload_gross_margin",
      "upload_retur",
      "view_upload_history",
    ].includes(p.slug)
  );
  for (const permission of accountingPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: accountingRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: accountingRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Assigned permissions to all roles");

  // =============================================
  // SEED USERS (TEST ACCOUNTS)
  // =============================================
  console.log("👤 Seeding users...");

  const adminPassword = await bcrypt.hash("ekatunggal123", 10);
  const defaultPassword = await bcrypt.hash("password123", 10);

  // Administrator user
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

  // Direktur user
  const direkturUser = await prisma.user.upsert({
    where: { email: "direktur@performa.com" },
    update: {},
    create: {
      name: "Direktur User",
      email: "direktur@performa.com",
      password: defaultPassword,
      isActive: true,
    },
  });

  // Marketing user
  const marketingUser = await prisma.user.upsert({
    where: { email: "marketing@performa.com" },
    update: {},
    create: {
      name: "Marketing User",
      email: "marketing@performa.com",
      password: defaultPassword,
      isActive: true,
    },
  });

  // Accounting user
  const accountingUser = await prisma.user.upsert({
    where: { email: "accounting@performa.com" },
    update: {},
    create: {
      name: "Accounting User",
      email: "accounting@performa.com",
      password: defaultPassword,
      isActive: true,
    },
  });

  console.log("✅ Created 4 users");

  // =============================================
  // ASSIGN ROLES TO USERS
  // =============================================
  console.log("🔗 Assigning roles to users...");

  // Admin -> ADMINISTRATOR role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: administratorRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: administratorRole.id,
    },
  });

  // Direktur -> DIREKTUR role
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

  // Marketing -> MARKETING role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: marketingUser.id,
        roleId: marketingRole.id,
      },
    },
    update: {},
    create: {
      userId: marketingUser.id,
      roleId: marketingRole.id,
    },
  });

  // Accounting -> ACCOUNTING role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: accountingUser.id,
        roleId: accountingRole.id,
      },
    },
    update: {},
    create: {
      userId: accountingUser.id,
      roleId: accountingRole.id,
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
  console.log(`   - Permissions: 18 (granular)`);
  console.log(`   - Roles: 4 (ADMINISTRATOR, DIREKTUR, MARKETING, ACCOUNTING)`);
  console.log(`   - Users: 4`);
  console.log("\n🔐 Test Credentials:");
  console.log("   - administrator@performa.com / ekatunggal123 (ADMINISTRATOR - All Access)");
  console.log("   - direktur@performa.com / password123 (DIREKTUR - View Dashboard & Export)");
  console.log("   - marketing@performa.com / password123 (MARKETING - Upload Omzet Only)");
  console.log("   - accounting@performa.com / password123 (ACCOUNTING - Upload Gross Margin & Retur)");
  console.log("\n📝 Permission Breakdown:");
  console.log("   - ADMINISTRATOR: ALL 18 permissions");
  console.log("   - DIREKTUR: 5 permissions (view_dashboard, export_dashboard, view_all_uploads, view_audit_log, export_sales_data)");
  console.log("   - MARKETING: 2 permissions (upload_omzet, view_upload_history)");
  console.log("   - ACCOUNTING: 3 permissions (upload_gross_margin, upload_retur, view_upload_history)");
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
