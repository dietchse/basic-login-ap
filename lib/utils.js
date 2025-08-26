import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function untuk mendapatkan URL avatar lengkap
export function getFullAvatarUrl(profilePicture) {
  if (!profilePicture) return null;
  
  // URL Google atau URL lengkap lainnya - return langsung
  if (profilePicture.startsWith('http')) {
    return profilePicture; 
  }
  
  // Path lokal - tambahkan base URL backend
  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${profilePicture}`;
  return fullUrl;
}
