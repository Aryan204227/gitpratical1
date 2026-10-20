import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
type TaskFilterState = { status:'All'|'To do'|'In progress'|'Completed'|'Blocked'; query:string };
const initialState:TaskFilterState={status:'All',query:''};
const taskFilterSlice=createSlice({
  name:'taskFilter',initialState,reducers:{
    setStatus(state,action:PayloadAction<TaskFilterState['status']>){state.status=action.payload;},
    setQuery(state,action:PayloadAction<string>){state.query=action.payload;},
    resetFilters(){return initialState;}
  }
});
export const {setStatus,setQuery,resetFilters}=taskFilterSlice.actions;
export default taskFilterSlice.reducer;
