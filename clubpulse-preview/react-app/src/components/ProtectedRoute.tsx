import { Navigate,useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { LoadingState } from './Primitives';
import type {ReactNode} from 'react';
export function ProtectedRoute({children}:{children:ReactNode}){
 const {user,loading}=useAuth();const location=useLocation();
 if(loading)return <LoadingState label="Checking your session…"/>;
 if(!user)return <Navigate to={'/login?next='+encodeURIComponent(location.pathname)} replace/>;
 return children;
}
