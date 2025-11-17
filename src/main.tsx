import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 👈 ADDED: React Query imports

// 1. Initialize the Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set a stale time to make data fast on revisit
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. Wrap App with the QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);