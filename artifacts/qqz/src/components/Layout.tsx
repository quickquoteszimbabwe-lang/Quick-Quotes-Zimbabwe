import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, FileText, CreditCard, User, Shield, Send, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRole } from "@/lib/pricingModels";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/services", icon: LayoutGrid, label: "Services" },
    { href: "/requests", icon: FileText, label: "Requests" },
    { href: "/payments", icon: CreditCard, label: "Payments" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  if (user?.role === "professional") {
    navItems.splice(3, 0, { href: "/offers", icon: Send, label: "My Offers" });
  }

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Quick Quotes Zimbabwe"
              className="h-8 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm hidden md:block text-white/80">{user.name}</span>
                <span className="text-xs bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-full capitalize">
                  {formatRole(user.role)}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {user && (
        <nav className="bg-white dark:bg-card border-t border-border sticky bottom-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-around py-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = location === href || location.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <InstallAppPrompt />
    </div>
  );
}
