import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogOut, Settings, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ERPDashboardLayoutProps {
  children: React.ReactNode;
}

export const ERPDashboardLayout: React.FC<ERPDashboardLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Finance", href: "/finance", icon: "💰" },
    { label: "HR", href: "/hr", icon: "👥" },
    { label: "Inventory", href: "/inventory", icon: "📦" },
    { label: "CRM", href: "/crm", icon: "🤝" },
    { label: "Projects", href: "/projects", icon: "📋" },
    { label: "Procurement", href: "/procurement", icon: "🛒" },
    { label: "Analytics", href: "/analytics", icon: "📈" },
    { label: "Documents", href: "/documents", icon: "📄" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-700`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">Nexis ERP</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {sidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-sm"
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {sidebarOpen && (
                  <span className="ml-2 truncate text-sm">{user?.name}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-semibold text-slate-900">
            Nexis ERP System
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Welcome, {user?.name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ERPDashboardLayout;
