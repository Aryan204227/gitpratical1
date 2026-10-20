import { Activity,CloudOff,Cloud } from 'lucide-react';
import { useApiHealth } from '../hooks/useApiHealth';
export function ApiBadge(){
 const {health,checking}=useApiHealth();
 if(checking)return <span className="connection-badge"><Activity size={14}/> Checking API…</span>;
 if(health?.database==='connected')return <span className="connection-badge online"><Cloud size={14}/> API + database connected</span>;
 return <span className="connection-badge offline"><CloudOff size={14}/> Database not connected</span>;
}
