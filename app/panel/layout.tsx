'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (pathname === '/panel/login') { setOk(true); return; }
    if (sessionStorage.getItem('panel_auth') === 'true') {
      setOk(true);
    } else {
      router.replace('/panel/login');
    }
  }, [pathname, router]);

  if (!ok) return null;
  return <>{children}</>;
}
