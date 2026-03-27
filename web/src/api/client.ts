import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    withCredentials: true, // httpOnly cookie se envía automáticamente
});

// Si el servidor responde 401, la sesión expiró — redirigir a login
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Limpiar cualquier estado y redirigir
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;