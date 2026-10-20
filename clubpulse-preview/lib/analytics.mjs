export function completionRate(completed,total){
 const safeTotal=Number.isFinite(Number(total))?Math.max(0,Number(total)):0;
 const safeCompleted=Number.isFinite(Number(completed))?Math.max(0,Number(completed)):0;
 if(safeTotal===0)return null;
 return Math.round(Math.min(safeCompleted,safeTotal)/safeTotal*100);
}
export function feedbackAverage(ratings,minimumResponses=5){
 const values=Array.from(ratings??[]).map(Number).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
 if(values.length<minimumResponses)return null;
 return Math.round(values.reduce((sum,value)=>sum+value,0)/values.length*10)/10;
}
export function contributionPoints(eventType){
 if(eventType==='task_completed')return 1;
 return 0;
}
export function isApplicationOpen(status){
 return status==='Open'||status==='Review';
}
