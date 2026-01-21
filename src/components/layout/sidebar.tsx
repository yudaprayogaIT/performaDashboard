// src/components/layout/sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ConfirmModal from "@/components/ui/confirm-modal";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  {
    label: "Reports",
    href: "/reports",
    icon: "analytics",
    children: [
      { label: "Sales Local", href: "/reports/local", icon: "store" },
      { label: "Sales Cabang", href: "/reports/cabang", icon: "storefront" },
      { label: "Per Kategori", href: "/reports/kategori", icon: "category" },
    ],
  },
  {
    label: "Data Management",
    href: "/upload",
    icon: "folder_data",
    children: [
      { label: "Upload Data", href: "/upload", icon: "cloud_upload" },
      { label: "Riwayat Upload", href: "/upload/history", icon: "history" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
    children: [
      { label: "Master Users", href: "/settings/users", icon: "people" },
      {
        label: "Master Branches",
        href: "/settings/branches",
        icon: "storefront",
      },
      {
        label: "Master Kategori",
        href: "/settings/categories",
        icon: "category",
      },
      { label: "Setting Target", href: "/settings/targets", icon: "flag" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading, logout, getInitials, getPrimaryRole } = useAuth();

  // State untuk logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
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
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.href)
                        ? "bg-primary/20 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>

                  {/* Sub Items */}
                  {item.children && isActive(item.href) && (
                    <ul className="mt-2 ml-4 pl-4 border-l border-white/10 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              pathname === child.href
                                ? "text-primary font-medium"
                                : "text-white/50 hover:text-white"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {child.icon}
                            </span>
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            {isLoading ? (
              // Loading skeleton
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            ) : user ? (
              // User info
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
              // Not logged in (fallback)
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
