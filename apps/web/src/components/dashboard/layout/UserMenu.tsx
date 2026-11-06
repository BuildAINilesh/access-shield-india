'use client';

import { User } from 'lucide-react';
import { DropdownMenu } from '@accessshield/ui';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function UserMenu() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      onSelect: () => router.push('/dashboard/settings/profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      onSelect: () => router.push('/dashboard/settings'),
    },
    {
      id: 'divider',
      label: '',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Sign out',
      destructive: true,
      onSelect: () => {
        void handleSignOut();
      },
    },
  ];

  return (
    <DropdownMenu
      trigger={
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-950 text-violet-200 hover:bg-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <User className="h-5 w-5" aria-hidden="true" />
        </button>
      }
      items={menuItems}
      align="end"
      ariaLabel="User account menu"
    />
  );
}
