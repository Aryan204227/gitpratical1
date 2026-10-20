export function parseCsv(text){
 if(typeof text!=='string')throw new TypeError('CSV input must be text.');
 const rows=[];let row=[];let field='';let quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(quoted){
   if(char==='"'&&text[i+1]==='"'){field+='"';i++;}
   else if(char==='"')quoted=false;
   else field+=char;
  }else if(char==='"'){
   if(field.length)throw new Error('Unexpected quote in an unquoted field.');
   quoted=true;
  }else if(char===','){
   row.push(field);field='';
  }else if(char==='\n'||char==='\r'){
   if(char==='\r'&&text[i+1]==='\n')i++;
   row.push(field);field='';
   if(row.some(cell=>cell.trim()!==''))rows.push(row);
   row=[];
  }else field+=char;
 }
 if(quoted)throw new Error('Unclosed quoted field.');
 row.push(field);
 if(row.some(cell=>cell.trim()!==''))rows.push(row);
 return rows;
}
export function rowsToObjects(rows){
 if(!Array.isArray(rows)||rows.length===0)throw new Error('CSV file is empty.');
 const headers=rows[0].map(v=>String(v).trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw new Error('CSV contains duplicate column headers.');
 const required=['title','owner','due_date','priority'];
 const missing=required.filter(header=>!headers.includes(header));
 if(missing.length)throw new Error('Missing required CSV columns: '+missing.join(', ')+'.');
 return rows.slice(1).map((cells,index)=>{
  const padded=[...cells];while(padded.length<headers.length)padded.push('');
  if(padded.length>headers.length)throw new Error('Row '+(index+2)+' has more columns than the header.');
  return Object.fromEntries(headers.map((header,i)=>[header,String(padded[i]??'').trim()]));
 });
}
