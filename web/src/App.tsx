import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import router from '@/router';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
    },
  },
});

const AppInitializer = () => {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    // Al montar la app, verificar si hay sesión activa
    authApi.getMe()
      .then((user) => setUser(user))
      .catch(() => clearUser());
  }, [setUser, clearUser]);

  return <RouterProvider router={router} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppInitializer />
    <Toaster position="top-right" />
  </QueryClientProvider>
);

export default App;