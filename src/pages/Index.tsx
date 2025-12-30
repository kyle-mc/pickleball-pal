import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CourtFinder from "@/components/CourtFinder";
import Community from "@/components/Community";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <CourtFinder />
      <Community />
      <Footer />
    </main>
  );
};

export default Index;
