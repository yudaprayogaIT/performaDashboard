// src/components/layout/sidebar.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ConfirmModal from "@/components/ui/confirm-modal";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href?: string; // Optional now - parent items don't need href
  icon: string;
  permission?: string;
  anyPermissions?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    permission: "view_dashboard",
  },
  {
    label: "Gross Margin",
    href: "/gross-margin",
    icon: "trending_up",
    permission: "view_dashboard",
  },
  {
    label: "Data Management",
    icon: "folder_data",
    anyPermissions: [
      "upload_omzet",
      "upload_gross_margin",
      "upload_retur",
      "view_upload_history",
      "view_all_uploads",
    ],
    children: [
      {
        label: "Upload Data",
        href: "/upload",
        icon: "cloud_upload",
        anyPermissions: ["upload_omzet", "upload_gross_margin", "upload_retur"],
      },
      {
        label: "Review Data",
        href: "/data",
        icon: "table_view",
        anyPermissions: [
          "view_all_uploads",
          "upload_omzet",
          "upload_gross_margin",
          "upload_retur",
        ],
      },
      {
        label: "Riwayat Upload",
        href: "/upload/history",
        icon: "history",
        anyPermissions: [
          "view_all_uploads",
          "upload_omzet",
          "upload_gross_margin",
          "upload_retur",
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: "settings",
    anyPermissions: [
      "manage_users",
      "manage_locations",
      "manage_categories",
      "manage_targets",
      "manage_branches",
    ],
    children: [
      // {
      //   label: "Master Users",
      //   href: "/settings/users",
      //   icon: "people",
      //   permission: "manage_users",
      // },
      {
        label: "Master Branches",
        href: "/settings/branches",
        icon: "storefront",
        permission: "manage_branches",
      },
      {
        label: "Master Kategori",
        href: "/settings/categories",
        icon: "category",
        permission: "manage_categories",
      },
      {
        label: "Setting Target",
        href: "/settings/targets",
        icon: "flag",
        permission: "manage_targets",
      },
    ],
  },
  {
    label: "Admin",
    icon: "admin_panel_settings",
    anyPermissions: ["manage_roles", "manage_permissions", "manage_users"],
    children: [
      {
        label: "DocType",
        href: "/admin/doctype",
        icon: "description",
        permission: "manage_users",
      },
      {
        label: "Role Management",
        href: "/admin/roles",
        icon: "shield",
        permission: "manage_roles",
      },
      {
        label: "Permission Management",
        href: "/admin/permissions",
        icon: "key",
        permission: "manage_permissions",
      },
      {
        label: "User Management",
        href: "/admin/users",
        icon: "group",
        permission: "manage_users",
      },
      {
        label: "Audit Log",
        href: "/admin/audit",
        icon: "history",
        permission: "view_audit_log",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading, logout, getInitials, getPrimaryRole } = useAuth();
  const {
    hasPermission,
    hasAnyPermission,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();

  // State untuk expanded menu items (hanya satu yang bisa expand)
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // State untuk logout modal dan loading timeout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set timeout for loading state (max 3 seconds)
  useEffect(() => {
    if (permissionsLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [permissionsLoading]);

  // Auto-expand menu if child is active
  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child) => child.href && pathname.startsWith(child.href),
    );
  };

  // Auto-expand parent menu when child is active
  useEffect(() => {
    const activeParent = filteredNavItems.find((item) => isChildActive(item));
    if (activeParent) {
      setExpandedItem(activeParent.label);
    }
  }, [pathname]);

  // Check if menu item or its children are active
  const isActiveItem = (item: NavItem): boolean => {
    if (
      item.href &&
      (pathname === item.href || pathname.startsWith(item.href + "/"))
    ) {
      return true;
    }
    return isChildActive(item);
  };

  // Toggle expanded state (hanya satu yang bisa expand)
  const toggleExpanded = (label: string) => {
    setExpandedItem((prev) => (prev === label ? null : label));
  };

  // Check if item should be expanded
  const isExpanded = (item: NavItem): boolean => {
    return expandedItem === item.label;
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  };

  // Filter nav items based on permissions
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    if (permissionsError || loadingTimeout) {
      console.warn(
        "Permission check failed or timed out, showing all menu items",
      );
      return items;
    }

    if (permissionsLoading && !loadingTimeout) return [];

    return items
      .filter((item) => {
        if (!item.permission && !item.anyPermissions) return true;

        if (item.permission) {
          return hasPermission(item.permission);
        }

        if (item.anyPermissions) {
          return hasAnyPermission(item.anyPermissions);
        }

        return false;
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterNavItems(item.children) : undefined,
      }))
      .filter((item) => {
        if (item.children && item.children.length === 0) {
          return false;
        }
        return true;
      });
  };

  const filteredNavItems = filterNavItems(navItems);

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-background-dark border-r border-white/10">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl">
                monitoring
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-wide">
                P<span className="text-[#B11F23]">e</span>rforma
              </h1>
              <p className="text-xs text-white/50 font-medium tracking-widest">
                Dashboard
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {permissionsLoading && !loadingTimeout ? (
              <ul className="space-y-1">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="animate-pulse">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5">
                      <div className="w-5 h-5 bg-white/10 rounded"></div>
                      <div className="h-4 bg-white/10 rounded w-24"></div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1">
                {filteredNavItems.map((item) => (
                  <li key={item.label}>
                    {/* Parent Item */}
                    {item.href ? (
                      // Menu item dengan link langsung
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                          isActiveItem(item)
                            ? "bg-primary/20 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/90"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {item.icon}
                        </span>
                        <span className="font-medium text-[15px] flex-1">
                          {item.label}
                        </span>
                        {item.children && (
                          <motion.span
                            animate={{ rotate: isExpanded(item) ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="material-symbols-outlined text-[18px] text-white/40 group-hover:text-white/60 transition-colors"
                          >
                            keyboard_arrow_down
                          </motion.span>
                        )}
                      </Link>
                    ) : (
                      // Menu item tanpa link (hanya expandable)
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                          isActiveItem(item)
                            ? "bg-primary/20 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/90"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {item.icon}
                        </span>
                        <span className="font-medium text-[15px] flex-1 text-left">
                          {item.label}
                        </span>
                        {item.children && (
                          <motion.span
                            animate={{ rotate: isExpanded(item) ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="material-symbols-outlined text-[18px] text-white/40 group-hover:text-white/60 transition-colors"
                          >
                            keyboard_arrow_down
                          </motion.span>
                        )}
                      </button>
                    )}

                    {/* Children Items */}
                    <AnimatePresence initial={false}>
                      {item.children && isExpanded(item) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <ul className="mt-1 ml-3 pl-5 border-l-2 border-white/10 space-y-0.5">
                            {item.children.map((child, index) => (
                              <motion.li
                                key={child.href}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{
                                  delay: index * 0.05,
                                  duration: 0.2,
                                }}
                              >
                                <Link
                                  href={child.href!}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                                    pathname === child.href
                                      ? "text-primary bg-primary/10 font-medium"
                                      : "text-white/50 hover:text-white/90 hover:bg-white/5"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {child.icon}
                                  </span>
                                  <span>{child.label}</span>
                                </Link>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            {isLoading ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {getPrimaryRole()}
                  </p>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="text-white/50 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/5"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    logout
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/50">
                    person
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/50">Not logged in</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi?"
        confirmText="Ya, Logout"
        cancelText="Batal"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
}
