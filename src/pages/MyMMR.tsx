import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MyMMR = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">Current MMR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-display text-foreground">3.5</span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-display text-foreground">62%</span>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">Games Played</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-display text-foreground">47</span>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { result: "W", score: "11-8, 11-6", change: +0.05 },
                  { result: "W", score: "11-9, 9-11, 11-7", change: +0.08 },
                  { result: "L", score: "8-11, 11-9, 9-11", change: -0.03 },
                  { result: "W", score: "11-4, 11-7", change: +0.04 },
                ].map((match, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        match.result === "W" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                      }`}>
                        {match.result}
                      </span>
                      <span className="text-muted-foreground">{match.score}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {match.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-primary" />
                      ) : match.change < 0 ? (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      ) : (
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={match.change > 0 ? "text-primary" : match.change < 0 ? "text-destructive" : "text-muted-foreground"}>
                        {match.change > 0 ? "+" : ""}{match.change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default MyMMR;
