import { Outlet, Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/about", label: "About" },
    { path: "/articles", label: "Articles" },
    { path: "/activities", label: "Activities" },
    { path: "/gallery", label: "Gallery" },
    { path: "/news", label: "News" },
    { path: "/recruit", label: "Recruit" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold tracking-tight">KHUX</div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium tracking-wide transition-colors uppercase ${
                    isActive(item.path)
                      ? "text-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block w-full text-left px-4 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-foreground bg-accent"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="mb-3">KHUX</h3>
              <p className="text-sm text-muted-foreground">
                Kyunghee University UX/UI Research Society
              </p>
            </div>
            <div>
              <h4 className="mb-3">Teams</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Leaders</li>
                <li>Education</li>
                <li>Operations</li>
                <li>Growth</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3">Pages</h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3">Contact</h4>
              <p className="text-sm text-muted-foreground">
                Email: khux@khu.ac.kr
              </p>
              <Link
                to="/admin/login"
                className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KHUX. All rights reserved.{" "}
            <Link
              to="/admin/login"
              className="opacity-30 hover:opacity-100 transition-opacity"
            >
              &bull;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
