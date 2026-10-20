import { create } from 'zustand';
type UiState = { compact:boolean; toggleCompact:()=>void; setCompact:(value:boolean)=>void };
export const useUiStore=create<UiState>((set)=>({compact:false,toggleCompact:()=>set(state=>({compact:!state.compact})),setCompact:(compact)=>set({compact})}));
