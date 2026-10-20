'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function DashboardRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      router.refresh();
      // Brief delay so user perceives the refresh animation
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      title="รีเฟรชข้อมูลแดชบอร์ด"
      aria-label="รีเฟรชข้อมูลแดชบอร์ด"
      disabled={refreshing}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
    >
      <RefreshCw
        size={15}
        className={refreshing ? 'animate-spin text-[#d62839]' : ''}
        aria-hidden="true"
      />
    </button>
  );
}
