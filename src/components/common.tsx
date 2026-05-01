// @ts-nocheck
import { useRef } from "react";
import { HOURS_PER_DAY, PHASES, STATUSES } from "../constants";
import { fmtDate, pColor, phaseAbbr, phaseColor, phaseOpacity, phasePatternStyle, phaseStatusColor, recomputePhaseDates, sColor } from "../utils";

export const fi   = {border:"1px solid #d1d5db",borderRadius:7,padding:"6px 10px",fontSize:13,color:"#1a1a1a",background:"#fff",outline:"none"};
export const card = {border:"1px solid #e5e7eb",borderRadius:10,padding:16,background:"#fff"};
export const btnS = {borderRadius:7,padding:"6px 14px",fontSize:13,cursor:"pointer",border:"1px solid #d1d5db",background:"transparent",color:"#1a1a1a"};
export const btnP = {borderRadius:7,padding:"6px 14px",fontSize:13,cursor:"pointer",background:"#1a1a1a",color:"#fff",border:"none"};

export function AbbrTag({ abbr }) {
  if (!abbr) return null;
  return <span style={{fontSize:10,fontWeight:700,background:"#f3f4f6",color:"#6b7280",borderRadius:4,padding:"1px 6px",flexShrink:0}}>{abbr}</span>;
}
export function ProjTag({ name, projects }) {
  const p=projects.find(x=>x.name===name)||{color:"#eee",textColor:"#333"};
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:p.color,color:p.textColor}}>{name}</span>;
}
export function PrioTag({ p }) {
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:pColor(p)+"18",color:pColor(p)}}>{p}</span>;
}
export function StatTag({ s }) {
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:sColor(s)+"18",color:sColor(s)}}>{s}</span>;
}
export function PctBar({ v, width }) {
  return (
    <div style={{width:width||60,height:4,borderRadius:2,background:"#e5e7eb",flexShrink:0}}>
      <div style={{width:v+"%",height:4,borderRadius:2,background:"#2563eb"}}></div>
    </div>
  );
}
export function FormRow({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</div>
      {children}
    </div>
  );
}
export function MInput({ value, onChange, placeholder }) {
  return <input style={{width:"100%",...fi}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
export function MSelect({ value, onChange, options }) {
  return (
    <select style={{width:"100%",...fi}} value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
export function MTextarea({ value, onChange, placeholder }) {
  return <textarea style={{width:"100%",...fi,resize:"vertical",minHeight:56,fontFamily:"inherit"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
export function Empty() { return <div style={{textAlign:"center",padding:48,color:"#9ca3af",fontSize:13}}>Ni nalog za prikaz.</div>; }
export function SLabel({ children, style }) {
  return <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"#9ca3af",marginBottom:8,...style}}>{children}</div>;
}
export function ModalBg({ children, onClose, wide }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,width:wide?720:520,maxWidth:"97vw",maxHeight:"93vh",overflowY:"auto",border:"1px solid #e5e7eb",boxShadow:"0 8px 32px rgba(0,0,0,.18)"}}>
        {children}
      </div>
    </div>
  );
}

export function PhaseMiniBar({ durs, phases, height=8 }) {
  if (durs) {
    const total=durs.reduce((a,b)=>a+b,0)||1;
    return (
      <div style={{display:"flex",height,borderRadius:4,overflow:"hidden",gap:1}}>
        {PHASES.map((name,i)=><div key={name} title={name+" "+durs[i]+"h"} style={{flex:durs[i]/total,...phasePatternStyle(name,"#64748b"),minWidth:3}} />)}
      </div>
    );
  }
  if (phases&&phases.length) {
    const total=phases.reduce((a,ph)=>a+(ph.duration||1),0)||1;
    return (
      <div style={{display:"flex",height,borderRadius:4,overflow:"hidden",gap:1}}>
        {phases.map((ph,i)=><div key={i} title={ph.type+" ("+ph.duration+"h) · "+ph.status} style={{flex:(ph.duration||1)/total,...phasePatternStyle(ph.type,phaseStatusColor(ph),phaseOpacity(ph)),minWidth:3}} />)}
      </div>
    );
  }
  return null;
}

export function PhasesSection({ phases, startDate, onChange }) {
  const maxId=(phases||[]).reduce((m,p)=>Math.max(m,p.id||0),0);
  const nextId=useRef(maxId+1);
  function commit(np){onChange(recomputePhaseDates(startDate,np));}
  function addPhase(type){commit([...(phases||[]),{id:nextId.current++,type,status:"Planirano",duration:24}]);}
  function removePhase(id){commit((phases||[]).filter(p=>p.id!==id));}
  function updPhase(id,field,val){commit((phases||[]).map(p=>p.id===id?{...p,[field]:val}:p));}
  function movePhase(id,dir){
    const arr=[...(phases||[])],idx=arr.findIndex(p=>p.id===id);
    if(idx+dir<0||idx+dir>=arr.length)return;
    const tmp=arr[idx];arr[idx]=arr[idx+dir];arr[idx+dir]=tmp;commit(arr);
  }
  const totalH=(phases||[]).reduce((a,p)=>a+(p.duration||1),0);
  return (
    <div style={{marginTop:16,borderTop:"1px solid #e5e7eb",paddingTop:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"}}>Faze naloge ({(phases||[]).length})</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>skupaj: {totalH} ur ({Math.round(totalH/HOURS_PER_DAY*10)/10} dni)</div>
      </div>
      {(phases||[]).length===0&&<div style={{fontSize:12,color:"#9ca3af",textAlign:"center",padding:"10px 0",marginBottom:8}}>Ni faz. Dodajte prvo fazo spodaj.</div>}
      {(phases||[]).map((ph,pi)=>(
        <div key={ph.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,padding:"7px 8px",background:"#f9fafb",borderRadius:7,border:"1px solid "+phaseColor(ph.type)+"33"}}>
          <div style={{width:8,height:8,borderRadius:2,flexShrink:0,...phasePatternStyle(ph.type,"#64748b")}} />
          <select value={ph.type} onChange={e=>updPhase(ph.id,"type",e.target.value)} style={{...fi,fontSize:11,fontWeight:700,color:phaseColor(ph.type),borderColor:phaseColor(ph.type)+"66",padding:"3px 6px",width:95,flexShrink:0}}>
            {PHASES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" min={1} max={720} value={ph.duration} onChange={e=>updPhase(ph.id,"duration",Math.max(1,Number(e.target.value)))} style={{...fi,width:52,textAlign:"center",fontSize:12,padding:"3px 4px",flexShrink:0}} />
          <span style={{fontSize:10,color:"#9ca3af",flexShrink:0}}>ur</span>
          <select value={ph.status} onChange={e=>updPhase(ph.id,"status",e.target.value)} style={{...fi,flex:1,fontSize:12,padding:"3px 6px"}}>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{fontSize:10,color:"#9ca3af",whiteSpace:"nowrap",flexShrink:0,minWidth:90,textAlign:"right"}}>{fmtDate(ph.startDate)} → {fmtDate(ph.dueDate)}</span>
          <button onClick={()=>movePhase(ph.id,-1)} disabled={pi===0} style={{...btnS,padding:"2px 5px",fontSize:11,opacity:pi===0?0.25:1,flexShrink:0}}>↑</button>
          <button onClick={()=>movePhase(ph.id,1)} disabled={pi===(phases||[]).length-1} style={{...btnS,padding:"2px 5px",fontSize:11,opacity:pi===(phases||[]).length-1?0.25:1,flexShrink:0}}>↓</button>
          <button onClick={()=>removePhase(ph.id)} style={{...btnS,padding:"2px 6px",fontSize:11,color:"#dc2626",borderColor:"#fca5a5",flexShrink:0}}>×</button>
        </div>
      ))}
      <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#9ca3af"}}>Dodaj fazo:</span>
        {PHASES.map(type=>(
          <button key={type} onClick={()=>addPhase(type)} style={{padding:"3px 11px",borderRadius:20,border:"1px solid "+phaseColor(type)+"77",background:"transparent",color:phaseColor(type),fontSize:11,fontWeight:600,cursor:"pointer"}}>+ {type}</button>
        ))}
      </div>
      {(phases||[]).length>0&&(
        <div style={{marginTop:10}}>
          <PhaseMiniBar phases={phases} height={9} />
          <div style={{display:"flex",marginTop:4}}>
            {(phases||[]).map((ph,i)=><div key={i} style={{flex:ph.duration||1,textAlign:"center",fontSize:8,color:phaseColor(ph.type),fontWeight:600,minWidth:0,overflow:"hidden"}}>{ph.duration>8?phaseAbbr(ph.type):""}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
