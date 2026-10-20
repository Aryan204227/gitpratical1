import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AppUser } from '../types';
type AuthValue={user:AppUser|null;loading:boolean;refresh:()=>Promise<void>};
const AuthContext=createContext<AuthValue|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
  const query=useQuery({
    queryKey:['auth','me'],
    queryFn:async()=>{const r=await api.get('/api/auth/me');return (r.data.user??null) as AppUser|null;},
    retry:false,refetchOnWindowFocus:false,staleTime:30_000
  });
  const value=useMemo<AuthValue>(()=>({user:query.data??null,loading:query.isPending,refresh:async()=>{await query.refetch();}}),[query.data,query.isPending,query.refetch]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const v=useContext(AuthContext);if(!v)throw new Error('useAuth must be used inside AuthProvider');return v;}
