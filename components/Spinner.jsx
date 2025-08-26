import { Loader } from 'lucide-react';

export default function Spinner() {
  return (
    <Loader className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
  );
}