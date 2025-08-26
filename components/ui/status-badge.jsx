import { Badge } from "@/components/ui/badge";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Shield, CheckCircle, XCircle, Clock, Users, Key } from "lucide-react";

export function StatusBadge({ type, children, className = "" }) {
  const baseClasses = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium";
  
  const variants = {
    // Account Status
    active: {
      className: "border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700",
      icon: <CheckCircle className="w-3.5 h-3.5" />
    },
    inactive: {
      className: "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700",
      icon: <XCircle className="w-3.5 h-3.5" />
    },
    
    // Authentication Types
    googleOnly: {
      className: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700",
      icon: <GoogleIcon className="w-3.5 h-3.5" />
    },
    googlePassword: {
      className: "border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700",
      icon: <GoogleIcon className="w-3.5 h-3.5" />
    },
    password: {
      className: "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700",
      icon: <Key className="w-3.5 h-3.5" />
    },
    
    // Verification Status
    verified: {
      className: "border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700",
      icon: <CheckCircle className="w-3.5 h-3.5" />
    },
    unverified: {
      className: "border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700",
      icon: <Clock className="w-3.5 h-3.5" />
    },
    
    // 2FA Status
    twoFAEnabled: {
      className: "border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700",
      icon: <Shield className="w-3.5 h-3.5" />
    },
    twoFADisabled: {
      className: "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700",
      icon: <Shield className="w-3.5 h-3.5" />
    },
    
    // Role Badges
    admin: {
      className: "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700",
      icon: <Shield className="w-3.5 h-3.5" />
    },
    user: {
      className: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700",
      icon: <Users className="w-3.5 h-3.5" />
    }
  };

  const variant = variants[type] || variants.user;

  return (
    <Badge 
      variant="outline" 
      className={`${baseClasses} ${variant.className} ${className}`}
    >
      {variant.icon}
      <span>{children}</span>
    </Badge>
  );
}
