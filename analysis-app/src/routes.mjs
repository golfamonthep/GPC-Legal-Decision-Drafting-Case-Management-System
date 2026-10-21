export const PAGE_PATHS={home:'/',work:'/analysis',knowledge:'/knowledge',transfer:'/intake',settings:'/settings'};
export function readRoute(location){
 const query=new URLSearchParams(location.search);
 const view=query.has('handoff')?'transfer':Object.entries(PAGE_PATHS).find(([,p])=>p===location.pathname)?.[0]||'home';
 return {view,jobId:view==='work'?query.get('job'):null,listing:view==='work'&&!query.has('new')&&!query.has('job')};
}
export function pageUrl(view,{jobId,newJob=false}={}){
 const base=PAGE_PATHS[view]||'/';
 return view==='work'&&jobId?`${base}?job=${encodeURIComponent(jobId)}`:view==='work'&&newJob?`${base}?new=1`:base;
}
