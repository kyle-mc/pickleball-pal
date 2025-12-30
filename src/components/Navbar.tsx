import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-xl">P</span>
            </div>
            <span className="font-display text-2xl text-foreground tracking-wide">PICKLEPLAY</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#courts" className="text-muted-foreground hover:text-foreground transition-colors">Find Courts</a>
            <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors">Community</a>
            <Button variant="heroOutline" size="sm">Log In</Button>
            <Button variant="hero" size="sm">Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">Features</a>
              <a href="#courts" className="text-muted-foreground hover:text-foreground transition-colors py-2">Find Courts</a>
              <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors py-2">Community</a>
              <div className="flex gap-2 pt-2">
                <Button variant="heroOutline" size="sm" className="flex-1">Log In</Button>
                <Button variant="hero" size="sm" className="flex-1">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
