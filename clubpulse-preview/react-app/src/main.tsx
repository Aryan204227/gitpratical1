import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import App from './App';
import { AuthProvider } from './state/auth';
import { ThemeProvider } from './state/theme';
import { store } from './state/store';
import './styles.css';
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:15_000,refetchOnWindowFocus:true},mutations:{retry:0}}});
createRoot(document.getElementById('root')!).render(
 <React.StrictMode><QueryClientProvider client={queryClient}><Provider store={store}><ThemeProvider><AuthProvider><App/></AuthProvider></ThemeProvider></Provider></QueryClientProvider></React.StrictMode>
);
