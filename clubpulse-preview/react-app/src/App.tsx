import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './components/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WorkspaceShell } from './components/WorkspaceShell';
import { DashboardPage,ClubsPage,ClubDetailsPage,MembersPage,RecruitmentPage,TasksPage,ContributionsPage,FeedbackPage,AnalyticsPage,ReactLabPage,NextLabPage } from './pages/WorkspacePages';
export default function App(){
 return <HashRouter>
  <Routes>
   <Route path="/login" element={<AuthPage mode="login"/>}/>
   <Route path="/register" element={<AuthPage mode="register"/>}/>
   <Route element={<ProtectedRoute><WorkspaceShell/></ProtectedRoute>}>
    <Route index element={<DashboardPage/>}/>
    <Route path="clubs" element={<ClubsPage/>}/><Route path="clubs/:id" element={<ClubDetailsPage/>}/>
    <Route path="members" element={<MembersPage/>}/>
    <Route path="recruitment" element={<RecruitmentPage/>}/>
    <Route path="tasks" element={<TasksPage/>}/>
    <Route path="contributions" element={<ContributionsPage/>}/>
    <Route path="feedback" element={<FeedbackPage/>}/>
    <Route path="analytics" element={<AnalyticsPage/>}/>
    <Route path="labs/react" element={<ReactLabPage/>}/>
    <Route path="labs/nextjs" element={<NextLabPage/>}/>
   </Route>
   <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
 </HashRouter>;
}
