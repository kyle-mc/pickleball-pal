import { Menu, X, LogIn, LogOut, User, HelpCircle, FileText, Shield, Mail, Map, Settings } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { startTour } = useOnboardingTour();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
        .then(({ data }) => setIsAdmin((data?.length ?? 0) > 0));
    });
  }, [user?.id]);

  const navLinks = [
    { href: "/", label: "My MMR", tourLabel: "my mmr" },
    { href: "/standings", label: "Stats", tourLabel: "stats" },
    { href: "/games", label: "Games", tourLabel: "games" },
    { href: "/videos", label: "Videos", tourLabel: "videos" },
    { href: "/schedule", label: "Events", tourLabel: "events" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="PicklePlay Logo" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-display text-2xl text-foreground tracking-wide">PICKLEPLAY</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  data-tour={`nav-${link.tourLabel}`}
                  className={`transition-colors ${
                    isActive(link.href) 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="max-w-24 truncate">
                        {user.user_metadata?.display_name || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={startTour} className="cursor-pointer">
                      <Map className="w-4 h-4 mr-2" />
                      App Tour
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile - only show user menu button */}
            <div className="md:hidden flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border w-56">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={startTour} className="cursor-pointer">
                      <Map className="w-4 h-4 mr-2" />
                      App Tour
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="#">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Help Center
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="#">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Us
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="#">
                        <Shield className="w-4 h-4 mr-2" />
                        Privacy Policy
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="#">
                        <FileText className="w-4 h-4 mr-2" />
                        Terms of Service
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
                  <LogIn className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Navbar;
