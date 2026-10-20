import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
export function useWorkspaceQuery<T>(key:string,path:string,enabled=true){
 return useQuery<T>({
  queryKey:['workspace',key],
  queryFn:async()=>{const response=await api.get(path);return response.data as T;},
  enabled,
  staleTime:15_000,
  retry:(count,error)=>{const status=(error as {response?:{status?:number}})?.response?.status;return count<1&&status!==401&&status!==403&&status!==503;},
  refetchOnWindowFocus:true
 });
}
