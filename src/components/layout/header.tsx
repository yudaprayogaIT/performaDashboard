"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  anyPermissions?: string[];
  children?: NavItem[];
}

// Same nav items from sidebar
const allNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
  },
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
      {
        label: "Upload Data",
        href: "/upload",
        icon: "cloud_upload",
      },
      {
        label: "Riwayat Upload",
        href: "/upload/history",
        icon: "history",
      },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
    children: [
      {
        label: "Master Users",
        href: "/settings/users",
        icon: "people",
      },
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
      {
        label: "Setting Target",
        href: "/settings/targets",
        icon: "flag",
      },
    ],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "admin_panel_settings",
    children: [
      {
        label: "Role Management",
        href: "/admin/roles",
        icon: "shield",
      },
      {
        label: "Permission Management",
        href: "/admin/permissions",
        icon: "key",
      },
      {
        label: "User Management",
        href: "/admin/users",
        icon: "group",
      },
      {
        label: "Audit Log",
        href: "/admin/audit",
        icon: "history",
      },
    ],
  },
];

// Flatten all nav items for search
function flattenNavItems(
  items: NavItem[],
  parent?: string,
): Array<NavItem & { parentLabel?: string }> {
  let result: Array<NavItem & { parentLabel?: string }> = [];

  items.forEach((item) => {
    result.push({ ...item, parentLabel: parent });
    if (item.children) {
      result = result.concat(flattenNavItems(item.children, item.label));
    }
  });

  return result;
}

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Use notifications hook with error handling
  let notifications: any[] = [];
  let unreadCount = 0;

  try {
    const notifData = useNotifications();
    notifications = notifData.notifications;
    unreadCount = notifData.unreadCount;
  } catch (err) {
    console.warn("Notifications not available:", err);
    // Graceful degradation - just show empty notifications
  }

  // Flatten all menu items
  const flatItems = flattenNavItems(allNavItems);

  // Filter search results
  const searchResults =
    searchQuery.trim().length > 0
      ? flatItems
          .filter(
            (item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.parentLabel
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          )
          .slice(0, 5) // Limit to 5 results
      : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.trim().length > 0);
  };

  const handleSelectItem = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background-dark/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={searchRef}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="w-80 h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full glass-card1 rounded-xl overflow-hidden shadow-lg border border-white/10">
                {searchResults.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectItem(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-white">{item.label}</div>
                      {item.parentLabel && (
                        <div className="text-xs text-white/50">
                          {item.parentLabel}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full mt-2 w-full glass-card rounded-xl p-4 text-center text-sm text-white/50">
                No menu found
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 glass-card rounded-xl overflow-hidden shadow-lg border border-white/10 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">
                    Notifications
                  </h3>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-white/50">
                    No notifications
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
                          !notif.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">
                              {notif.title}
                            </h4>
                            <p className="text-xs text-white/60 mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-white/40 mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle (Future) */}
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-white/60 hover:text-white transition-colors">
              dark_mode
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
