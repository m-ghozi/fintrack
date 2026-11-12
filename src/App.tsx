/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { RouterProvider } from '@/src/lib/router';
import { AppLayout } from '@/src/components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

// Persist the query cache to localStorage so a PWA relaunch (especially
// offline) restores the last data instantly instead of showing skeletons.
// `buster` must change when cached shapes change (bump with app version).
const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'fintrack-query-cache',
});

const APP_BUSTER = '0.1.0';

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
        buster: APP_BUSTER,
      }}
    >
      <RouterProvider>
        <AppLayout />
      </RouterProvider>
    </PersistQueryClientProvider>
  );
}
