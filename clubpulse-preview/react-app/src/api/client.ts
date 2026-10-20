import axios from 'axios';
export const api = axios.create({ baseURL: '/', withCredentials: true, timeout: 12_000, headers: { 'Content-Type':'application/json' } });
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return (error.response?.data as {error?:string}|undefined)?.error ?? (error.code === 'ECONNABORTED' ? 'The server took too long to respond.' : 'The server could not be reached. Wake-up after idle can take a little time.');
  return error instanceof Error ? error.message : 'Something went wrong.';
}
