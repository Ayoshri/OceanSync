
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'field_officer';
  pin: string;
}

// Mock admin users with PIN authentication
const adminUsers: AdminUser[] = [
  { id: 'admin-1', name: 'Sarah Johnson', email: 'sarah@authority.gov', role: 'admin', pin: '1234' },
  { id: 'admin-2', name: 'Mike Chen', email: 'mike@authority.gov', role: 'supervisor', pin: '5678' },
  { id: 'admin-3', name: 'Lisa Rodriguez', email: 'lisa@authority.gov', role: 'field_officer', pin: '9999' },
  { id: 'admin-4', name: 'David Park', email: 'david@authority.gov', role: 'field_officer', pin: '0000' },
];

interface AdminAuthScreenProps {
  onLogin: (admin: AdminUser) => void;
}

export function AdminAuthScreen({ onLogin }: AdminAuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    pin: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find admin user by email and PIN
      const adminUser = adminUsers.find(
        user => user.email === formData.email && user.pin === formData.pin
      );

      if (!adminUser) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or PIN. Please check your credentials.",
          variant: "destructive",
        });
        return;
      }

      onLogin(adminUser);
      
      toast({
        title: "Welcome to Marine Authority Portal",
        description: `Logged in as ${adminUser.name} (${adminUser.role})`,
      });
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="text-white text-3xl" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Marine Authority Portal</h1>
            <p className="text-gray-600 text-sm">Authorized Personnel Only</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-medium">Secure Access Required</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Official Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@authority.gov"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                data-testid="admin-input-email"
              />
            </div>
            
            <div>
              <Label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                Security PIN
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  name="pin"
                  type={showPin ? "text" : "password"}
                  value={formData.pin}
                  onChange={handleInputChange}
                  placeholder="Enter 4-digit PIN"
                  required
                  maxLength={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  data-testid="admin-input-pin"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              disabled={isLoading}
              data-testid="admin-button-submit"
            >
              {isLoading ? "Authenticating..." : "Secure Login"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Demo Credentials:</p>
              <p>sarah@authority.gov (PIN: 1234) - Admin</p>
              <p>mike@authority.gov (PIN: 5678) - Supervisor</p>
              <p>lisa@authority.gov (PIN: 9999) - Field Officer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
