'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({ href, children, onSelect }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(
        'transition-colors hover:text-foreground/80',
        isActive ? 'text-foreground' : 'text-foreground/60'
      )}
    >
      {children}
    </Link>
  );
}