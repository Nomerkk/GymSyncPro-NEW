import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 gym-gradient items-center justify-center p-8">
        <div className="text-center text-white">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
            alt="Modern gym interior" 
            className="rounded-xl mb-8 shadow-2xl" 
          />
          <h1 className="text-5xl font-bold mb-4">FitZone</h1>
          <p className="text-xl opacity-90">Your Premium Gym Management System</p>
          <div className="mt-8 space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300" size={20} />
              <span>Smart Check-in System</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300" size={20} />
              <span>Class Booking & Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300" size={20} />
              <span>Membership Tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-300" size={20} />
              <span>Payment Management</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground">Welcome to FitZone</h2>
                <p className="text-muted-foreground mt-2">Sign in to access your gym account</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={handleLogin}
                  className="w-full gym-gradient text-white py-3 px-4 rounded-md font-medium hover:opacity-90 transition-opacity"
                  data-testid="button-login"
                >
                  Sign In with Replit
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>New to FitZone? Your account will be created automatically.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
