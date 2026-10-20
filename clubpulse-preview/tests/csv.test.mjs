import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, rowsToObjects } from '../lib/csv.mjs';

test('CSV parser supports commas and escaped quotes inside quoted fields',()=>{
 const rows=parseCsv('title,owner,due_date,priority\r\n"Workshop, autumn","Lead ""A""",2026-11-01,High\r\n');
 assert.deepEqual(rows,[['title','owner','due_date','priority'],['Workshop, autumn','Lead "A"', '2026-11-01','High']]);
});
test('CSV parser handles LF and ignores blank rows',()=>{
 assert.deepEqual(parseCsv('a,b\n1,2\n\n3,4\n'),[['a','b'],['1','2'],['3','4']]);
});
test('CSV parser rejects unclosed and misplaced quotes',()=>{
 assert.throws(()=>parseCsv('title,owner\n"missing quote,x'),/Unclosed quoted field/);
 assert.throws(()=>parseCsv('ti"tle,owner'),/Unexpected quote/);
});
test('object conversion requires unique required task headers',()=>{
 assert.throws(()=>rowsToObjects([['title','owner','due_date']]),/Missing required CSV columns/);
 assert.throws(()=>rowsToObjects([['title','title','due_date','owner','priority']]),/duplicate column/);
});
test('object conversion maps rows by header instead of column order',()=>{
 const rows=rowsToObjects([['owner','priority','title','due_date'],['Lead','High','Build dashboard','2026-11-07']]);
 assert.deepEqual(rows,[{owner:'Lead',priority:'High',title:'Build dashboard',due_date:'2026-11-07'}]);
});
