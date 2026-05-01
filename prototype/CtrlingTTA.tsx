import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

const EMPLOYEES = ["Ana K.","Bor M.","Cvetka P.","Domen L.","Eva R.","Filip S."];
const STATUSES = ["Planirano","Na cakanju","V teku","Zakljuceno"];
const PRIORITIES = ["Nizka","Srednja","Visoka","Kriticna"];
const PHASES = ["Priprava","Pregled","Korekcija","Odobritev"];
const HOURS_PER_DAY = 8;
const PROJECT_PALETTE  = ["#e0edff","#e6f9f0","#fef3e2","#f3e8ff","#fce7f3","#ecfdf5"];
const PROJECT_TEXT_PAL = ["#1d4ed8","#15803d","#b45309","#7c3aed","#be185d","#065f46"];
const DAY_LABELS = ["Ne","Po","To","Sr","Ce","Pe","So"];
const MONTH_NAMES = ["Januar","Februar","Marec","April","Maj","Junij","Julij","Avgust","September","Oktober","November","December"];
const TODAY_MS = new Date("2026-04-30").getTime();

function phaseColor(type) {
  if (type==="Priprava")  return "#3b82f6";
  if (type==="Pregled")   return "#f59e0b";
  if (type==="Korekcija") return "#8b5cf6";
  if (type==="Odobritev") return "#10b981";
  return "#6b7280";
}
function phaseStatusColor(ph) {
  const phEnd=new Date(ph.dueDate).getTime(), phStart=new Date(ph.startDate).getTime();
  if (ph.status!=="Zakljuceno" && ph.status!=="Na cakanju" && TODAY_MS>phEnd) return "#fdba74";
  if (ph.status==="Planirano"  && phStart<=TODAY_MS && TODAY_MS<=phEnd) return "#93c5fd";
  if (ph.status==="Zakljuceno") return "#86efac";
  if (ph.status==="V teku")     return "#93c5fd";
  if (ph.status==="Na cakanju") return "#94a3b8";
  return "#c4b5fd";
}
function phasePatternStyle(type, color, opacity) {
  const op = opacity !== undefined ? { opacity } : {};
  const blk = "rgba(255,255,255,0.45)";
  if (type==="Priprava") {
    // Pikčast vzorec (kot inženirska risba)
    return { ...op, background: color,
      backgroundImage: `radial-gradient(circle, ${blk} 0.8px, transparent 1px)`,
      backgroundSize: "4px 4px" };
  }
  if (type==="Pregled") {
    // Poševne (diagonalne) črte
    return { ...op, background: color,
      backgroundImage: `repeating-linear-gradient(45deg, ${blk} 0px, ${blk} 1px, transparent 1px, transparent 4px)` };
  }
  if (type==="Korekcija") {
    // Križni karo vzorec (gosto)
    return { ...op, background: color,
      backgroundImage: `repeating-linear-gradient(45deg, ${blk} 0px, ${blk} 0.8px, transparent 0.8px, transparent 3.5px), repeating-linear-gradient(-45deg, ${blk} 0px, ${blk} 0.8px, transparent 0.8px, transparent 3.5px)` };
  }
  // Odobritev – polno
  return { ...op, background: color };
}
function phaseOpacity(ph) {
  if (ph.status==="Planirano") return 0.5;
  return 1;
}
function phaseAbbr(type) {
  if (type==="Priprava")  return "Pr";
  if (type==="Pregled")   return "Pg";
  if (type==="Korekcija") return "Ko";
  if (type==="Odobritev") return "Od";
  return "?";
}
function sColor(s) {
  if (s==="Planirano")  return "#c4b5fd";
  if (s==="Na cakanju") return "#94a3b8";
  if (s==="V teku")     return "#93c5fd";
  if (s==="Zakljuceno") return "#86efac";
  if (s==="Zamuda")     return "#fdba74";
  return "#888";
}
function effectiveStatus(t) {
  if (t.status!=="Zakljuceno"&&t.status!=="Na cakanju"&&TODAY_MS>new Date(t.dueDate).getTime()) return "Zamuda";
  return t.status;
}
function pColor(p) {
  if (p==="Nizka")    return "#16a34a";
  if (p==="Srednja")  return "#2563eb";
  if (p==="Visoka")   return "#d97706";
  if (p==="Kriticna") return "#dc2626";
  return "#888";
}
function isOverdue(t) {
  if (t.status==="Zakljuceno") return false;
  return TODAY_MS > new Date(t.dueDate).getTime();
}
function shiftDate(d, days) {
  const dt = new Date(d); dt.setDate(dt.getDate()+days);
  return dt.toISOString().split("T")[0];
}
function fmtDate(s) {
  const d = new Date(s);
  return d.getDate()+". "+MONTH_NAMES[d.getMonth()].slice(0,3);
}
function cleanName(t) {
  if (!t.abbr) return t.name;
  const p = t.abbr+" - ";
  return t.name.startsWith(p) ? t.name.slice(p.length) : t.name;
}
function hoursToDays(hours) { return Math.max(1, Math.round(hours/HOURS_PER_DAY)); }
function recomputePhaseDates(taskStart, phases) {
  let off = 0;
  return phases.map(ph => {
    const cd = hoursToDays(ph.duration||HOURS_PER_DAY);
    const phS = shiftDate(taskStart, off), phE = shiftDate(taskStart, off+cd-1);
    off += cd;
    return { ...ph, startDate:phS, dueDate:phE };
  });
}
function mkPhases(sd, ed, statuses=[]) {
  const totalCD = Math.max(4, Math.round((new Date(ed)-new Date(sd))/86400000)+1);
  const totalH  = totalCD*HOURS_PER_DAY;
  const q=Math.floor(totalH/4), r=totalH%4;
  const hs=[q+(r>0?1:0),q+(r>1?1:0),q+(r>2?1:0),q];
  let off=0,uid=1;
  return PHASES.map((type,i) => {
    const cd=hoursToDays(hs[i]);
    const phS=shiftDate(sd,off),phE=shiftDate(sd,off+cd-1);
    off+=cd;
    return {id:uid++,type,status:statuses[i]||"Planirano",duration:hs[i],startDate:phS,dueDate:phE};
  });
}
function mkPhasesFromDurs(sd, durs, statuses=[]) {
  let off=0,uid=1;
  return PHASES.map((type,i) => {
    const h=Math.max(1,durs[i]||HOURS_PER_DAY),cd=hoursToDays(h);
    const phS=shiftDate(sd,off),phE=shiftDate(sd,off+cd-1);
    off+=cd;
    return {id:uid++,type,status:statuses[i]||"Planirano",duration:h,startDate:phS,dueDate:phE};
  });
}
function defaultPhaseStatuses(status, pct) {
  if (status==="Zakljuceno") return ["Zakljuceno","Zakljuceno","Zakljuceno","Zakljuceno"];
  if (status==="Planirano")  return ["Planirano","Planirano","Planirano","Planirano"];
  if (status==="Na cakanju") return ["Na cakanju","Planirano","Planirano","Planirano"];
  if (pct>=75) return ["Zakljuceno","Zakljuceno","V teku","Planirano"];
  if (pct>=50) return ["Zakljuceno","V teku","Planirano","Planirano"];
  return ["V teku","Planirano","Planirano","Planirano"];
}
function defaultPhaseDurs(totalHours) {
  const t=Math.max(4,totalHours),q=Math.floor(t/4),r=t%4;
  return [q+(r>0?1:0),q+(r>1?1:0),q+(r>2?1:0),q];
}
function getPhaseOnDay(t,yr,mo,d) {
  const dt=new Date(yr,mo,d).getTime();
  return (t.phases||[]).find(ph => dt>=new Date(ph.startDate).getTime()&&dt<=new Date(ph.dueDate).getTime());
}
function easterDate(y) {
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),dy=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,dy);
}
function getHolidays(y) {
  const e=easterDate(y),pad=n=>String(n).padStart(2,"0"),key=d=>pad(d.getMonth()+1)+"-"+pad(d.getDate()),addD=(dt,n)=>{const r=new Date(dt);r.setDate(r.getDate()+n);return r;};
  const h={"01-01":"Novo leto","01-02":"Novo leto","02-08":"Presernov dan","04-27":"Dan upora","05-01":"Praznik dela","05-02":"Praznik dela","06-25":"Dan drzavnosti","08-15":"Vnebovzetje","10-31":"Dan reformacije","11-01":"Dan spomina","12-25":"Bozic","12-26":"Dan samostojnosti"};
  h[key(addD(e,1))]="Velikonocni ponedeljek"; h[key(addD(e,49))]="Binkosti";
  return h;
}
function exportCSV(tasks) {
  const hdr=["ID","Ime","Okrajsava","Projekt","Dodeljena","Prioriteta","Zacetek","Rok","Status","%"];
  const rows=tasks.map(t=>[t.id,t.name,t.abbr||"",t.project,t.assignee,t.priority,t.startDate,t.dueDate,t.status,t.pct]);
  const csv=[hdr,...rows].map(r=>r.map(c=>'"'+(c||"").toString().replace(/"/g,'""')+'"').join(",")).join("\n");
  const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="ctrlng3.csv";a.click();
}

function loadPptxLib() {
  if (window.PptxGenJS) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundled.js";
    s.onload = () => res();
    s.onerror = () => rej(new Error("PptxGenJS load failed"));
    document.head.appendChild(s);
  });
}

function buildPPT(filtered, projects, viewYr, viewMo) {
  const pptx = new window.PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const W=13.33,H=7.5,ML=0.3,MR=0.3,LABEL_W=2.8;
  const CHART_X=ML+LABEL_W+0.1, CHART_W=W-CHART_X-MR;
  const gS=new Date(viewYr,viewMo,1).getTime();
  const gE=new Date(viewYr,viewMo+4,0).getTime()+86400000;
  const spanMs=gE-gS;
  const toX=ms=>CHART_X+Math.max(0,Math.min(1,(ms-gS)/spanMs))*CHART_W;
  const hex=c=>c.replace("#","");
  const noLine={color:"FFFFFF",width:0};
  const visibleProjects=projects.filter(p=>filtered.some(t=>t.project===p.name));

  visibleProjects.forEach(proj => {
    const pt=filtered.filter(t=>t.project===proj.name);
    if(!pt.length) return;
    const slide=pptx.addSlide();
    slide.background={color:"FFFFFF"};
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:W,h:0.55,fill:{color:hex(proj.color)},line:noLine});
    slide.addText(proj.name,{x:ML,y:0,w:W-ML*2,h:0.55,fontSize:18,bold:true,color:hex(proj.textColor),fontFace:"Calibri",valign:"middle"});
    const TY=0.65, TASKS_Y=TY+0.22;
    const ROW_H=Math.min(0.28,(H-TASKS_Y-0.4)/Math.max(pt.length,1));
    let mc=new Date(viewYr,viewMo,1);
    const gEndDate=new Date(viewYr,viewMo+4,0);
    while(mc<=gEndDate){
      const mx=toX(mc.getTime());
      slide.addShape(pptx.ShapeType.rect,{x:mx,y:TY,w:0.01,h:H-TY-0.35,fill:{color:"E5E7EB"},line:noLine});
      slide.addText(MONTH_NAMES[mc.getMonth()].slice(0,3)+" "+mc.getFullYear(),{x:mx+0.05,y:TY,w:1.5,h:0.2,fontSize:7,color:"9CA3AF",fontFace:"Calibri"});
      mc=new Date(mc.getFullYear(),mc.getMonth()+1,1);
    }
    const todayX=toX(TODAY_MS);
    if(todayX>=CHART_X&&todayX<=CHART_X+CHART_W)
      slide.addShape(pptx.ShapeType.rect,{x:todayX,y:TY,w:0.02,h:H-TY-0.35,fill:{color:"EF4444"},line:noLine});
    pt.forEach((t,ti)=>{
      const ry=TASKS_Y+ti*(ROW_H+0.03);
      if(ry+ROW_H>H-0.35) return;
      slide.addText((t.abbr?t.abbr+" ":"")+cleanName(t),{x:ML,y:ry,w:LABEL_W-0.1,h:ROW_H,fontSize:7,color:"374151",fontFace:"Calibri",valign:"middle",align:"right",wrap:false});
      slide.addShape(pptx.ShapeType.rect,{x:CHART_X,y:ry,w:CHART_W,h:ROW_H,fill:{color:"F3F4F6"},line:noLine});
      (t.phases||[]).forEach(ph=>{
        const phSMs=new Date(ph.startDate).getTime();
        const phEMs=new Date(ph.dueDate).getTime()+86400000;
        if(phEMs<=gS||phSMs>=gE) return;
        const px=toX(Math.max(phSMs,gS));
        const pw=Math.max(0.01,(Math.min(phEMs,gE)-Math.max(phSMs,gS))/spanMs*CHART_W);
        slide.addShape(pptx.ShapeType.rect,{x:px,y:ry,w:pw,h:ROW_H,fill:{color:hex(phaseStatusColor(ph))},line:noLine});
        if(t.pct>0)
          slide.addShape(pptx.ShapeType.rect,{x:px,y:ry+ROW_H-0.05,w:pw*(t.pct/100),h:0.05,fill:{color:"111827"},line:noLine});
      });
    });
    const legY=H-0.28;
          [["Na cakanju","94a3b8"],["V teku","93c5fd"],["Zakljuceno","86efac"],["Zamuda","fdba74"],["Planirano","c4b5fd"]].forEach((p,i)=>{
      const lx=CHART_X+i*1.1;
      slide.addShape(pptx.ShapeType.rect,{x:lx,y:legY+0.04,w:0.12,h:0.12,fill:{color:p[1]},line:noLine});
      slide.addText(p[0],{x:lx+0.15,y:legY,w:0.92,h:0.2,fontSize:7,color:"6B7280",fontFace:"Calibri",valign:"middle"});
    });
  });
  return pptx.writeFile({fileName:"ctrlng_gantt.pptx"});
}

function buildXLSX(filtered, projects) {
  const wb = XLSX.utils.book_new();
  const visibleProjects = projects.filter(p => filtered.some(t => t.project === p.name));
  visibleProjects.forEach(proj => {
    const pt = filtered.filter(t => t.project === proj.name);
    if (!pt.length) return;
    const rows = [
      [proj.name],
      [],
      ["NALOGE"],
      ["ID","Okr.","Naloga","Dodeljena","Prioriteta","Status","Zacetek","Rok","%","Ur skupaj"]
    ];
    pt.forEach(t => {
      const totalH = (t.phases||[]).reduce((a,p)=>a+(p.duration||0), 0);
      rows.push([t.id, t.abbr||"", cleanName(t), t.assignee, t.priority, effectiveStatus(t), t.startDate, t.dueDate, t.pct, totalH]);
    });
    rows.push([], ["FAZE NALOG"]);
    rows.push(["Naloga","Tip faze","Status faze","Trajanje (ur)","Zacetek faze","Rok faze"]);
    pt.forEach(t => {
      (t.phases||[]).forEach(ph => {
        rows.push([(t.abbr?t.abbr+" - ":"")+cleanName(t), ph.type, ph.status, ph.duration, ph.startDate, ph.dueDate]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{wch:6},{wch:8},{wch:32},{wch:12},{wch:11},{wch:12},{wch:12},{wch:12},{wch:6},{wch:12}];
    let sheetName = (proj.abbr || proj.name).replace(/[\\\/\?\*\[\]:]/g, "_").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  XLSX.writeFile(wb, "ctrlng_gantt.xlsx");
}

const fi   = {border:"1px solid #d1d5db",borderRadius:7,padding:"6px 10px",fontSize:13,color:"#1a1a1a",background:"#fff",outline:"none"};
const card = {border:"1px solid #e5e7eb",borderRadius:10,padding:16,background:"#fff"};
const btnS = {borderRadius:7,padding:"6px 14px",fontSize:13,cursor:"pointer",border:"1px solid #d1d5db",background:"transparent",color:"#1a1a1a"};
const btnP = {borderRadius:7,padding:"6px 14px",fontSize:13,cursor:"pointer",background:"#1a1a1a",color:"#fff",border:"none"};

function AbbrTag({ abbr }) {
  if (!abbr) return null;
  return <span style={{fontSize:10,fontWeight:700,background:"#f3f4f6",color:"#6b7280",borderRadius:4,padding:"1px 6px",flexShrink:0}}>{abbr}</span>;
}
function ProjTag({ name, projects }) {
  const p=projects.find(x=>x.name===name)||{color:"#eee",textColor:"#333"};
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:p.color,color:p.textColor}}>{name}</span>;
}
function PrioTag({ p }) {
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:pColor(p)+"18",color:pColor(p)}}>{p}</span>;
}
function StatTag({ s }) {
  return <span style={{borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,background:sColor(s)+"18",color:sColor(s)}}>{s}</span>;
}
function PctBar({ v, width }) {
  return (
    <div style={{width:width||60,height:4,borderRadius:2,background:"#e5e7eb",flexShrink:0}}>
      <div style={{width:v+"%",height:4,borderRadius:2,background:"#2563eb"}}></div>
    </div>
  );
}
function FormRow({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</div>
      {children}
    </div>
  );
}
function MInput({ value, onChange, placeholder }) {
  return <input style={{width:"100%",...fi}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
function MSelect({ value, onChange, options }) {
  return (
    <select style={{width:"100%",...fi}} value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function MTextarea({ value, onChange, placeholder }) {
  return <textarea style={{width:"100%",...fi,resize:"vertical",minHeight:56,fontFamily:"inherit"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} />;
}
function Empty() { return <div style={{textAlign:"center",padding:48,color:"#9ca3af",fontSize:13}}>Ni nalog za prikaz.</div>; }
function SLabel({ children, style }) {
  return <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"#9ca3af",marginBottom:8,...style}}>{children}</div>;
}
function ModalBg({ children, onClose, wide }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,width:wide?720:520,maxWidth:"97vw",maxHeight:"93vh",overflowY:"auto",border:"1px solid #e5e7eb",boxShadow:"0 8px 32px rgba(0,0,0,.18)"}}>
        {children}
      </div>
    </div>
  );
}

function PhaseMiniBar({ durs, phases, height=8 }) {
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

function PhasesSection({ phases, startDate, onChange }) {
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

const INIT_TEMPLATES = [
  {id:1,name:"IT GxP sistem",tasks:[
    {name:"URS - Uporabniske zahteve",abbr:"URS",priority:"Kriticna",duration:80},{name:"Validacijski nacrt (VP)",abbr:"VP",priority:"Kriticna",duration:40},{name:"Kvalifikacija dobavitelja (SQ)",abbr:"SQ",priority:"Visoka",duration:56},{name:"DQ - Kvalifikacija zasnove",abbr:"DQ",priority:"Kriticna",duration:56},{name:"IQ - Instalacijska kvalifikacija",abbr:"IQ",priority:"Kriticna",duration:80},{name:"OQ - Operativna kvalifikacija",abbr:"OQ",priority:"Kriticna",duration:112},{name:"PQ - Procesna kvalifikacija",abbr:"PQ",priority:"Kriticna",duration:112},{name:"Pregled in odobritev dokumentacije",abbr:"POD",priority:"Visoka",duration:56},{name:"Validacijsko porocilo",abbr:"ValP",priority:"Kriticna",duration:40},{name:"Prenos v produkcijo (Go-Live)",abbr:"GL",priority:"Visoka",duration:24},
  ]},
  {id:2,name:"IT non-GxP sistem",tasks:[
    {name:"Zahteve sistema (RSD)",abbr:"RSD",priority:"Visoka",duration:56},{name:"Analiza tveganja",abbr:"AT",priority:"Srednja",duration:40},{name:"Testni nacrt (TP)",abbr:"TP",priority:"Visoka",duration:40},{name:"Instalacija in konfiguracija",abbr:"IK",priority:"Visoka",duration:56},{name:"Funkcionalno testiranje (FAT)",abbr:"FAT",priority:"Visoka",duration:80},{name:"UAT - Testiranje s strani uporabnikov",abbr:"UAT",priority:"Srednja",duration:56},{name:"Testno porocilo",abbr:"TP2",priority:"Visoka",duration:32},{name:"Usposabljanje uporabnikov",abbr:"UU",priority:"Srednja",duration:24},{name:"Prenos v produkcijo",abbr:"GL",priority:"Visoka",duration:16},
  ]},
  {id:3,name:"Naprava GAMP 3",tasks:[
    {name:"URS - Uporabniske zahteve",abbr:"URS",priority:"Visoka",duration:56},{name:"Validacijski nacrt",abbr:"VN",priority:"Visoka",duration:40},{name:"DQ - Kvalifikacija zasnove",abbr:"DQ",priority:"Visoka",duration:40},{name:"IQ - Instalacijska kvalifikacija",abbr:"IQ",priority:"Kriticna",duration:56},{name:"OQ - Operativna kvalifikacija",abbr:"OQ",priority:"Kriticna",duration:80},{name:"Validacijsko porocilo",abbr:"ValP",priority:"Visoka",duration:32},
  ]},
  {id:4,name:"Naprava GAMP 4",tasks:[
    {name:"URS - Uporabniske zahteve",abbr:"URS",priority:"Kriticna",duration:80},{name:"Validacijski nacrt",abbr:"VN",priority:"Kriticna",duration:40},{name:"Analiza tveganja (RA)",abbr:"RA",priority:"Kriticna",duration:56},{name:"FS - Funkcionalne specifikacije",abbr:"FS",priority:"Visoka",duration:56},{name:"DS - Detajlne specifikacije",abbr:"DS",priority:"Visoka",duration:56},{name:"DQ - Kvalifikacija zasnove",abbr:"DQ",priority:"Kriticna",duration:56},{name:"IQ - Instalacijska kvalifikacija",abbr:"IQ",priority:"Kriticna",duration:80},{name:"OQ - Operativna kvalifikacija",abbr:"OQ",priority:"Kriticna",duration:112},{name:"PQ - Procesna kvalifikacija",abbr:"PQ",priority:"Kriticna",duration:112},{name:"Validacijsko porocilo",abbr:"ValP",priority:"Kriticna",duration:40},
  ]},
  {id:5,name:"Naprava GAMP 5",tasks:[
    {name:"URS - Uporabniske zahteve",abbr:"URS",priority:"Kriticna",duration:80},{name:"Validacijski nacrt",abbr:"VN",priority:"Kriticna",duration:40},{name:"Analiza tveganja (FMEA/RA)",abbr:"FMEA",priority:"Kriticna",duration:80},{name:"FS - Funkcionalne specifikacije",abbr:"FS",priority:"Kriticna",duration:80},{name:"DS - Detajlne specifikacije",abbr:"DS",priority:"Kriticna",duration:80},{name:"Pregled kode (Code Review)",abbr:"CR",priority:"Visoka",duration:56},{name:"DQ - Kvalifikacija zasnove",abbr:"DQ",priority:"Kriticna",duration:56},{name:"IQ - Instalacijska kvalifikacija",abbr:"IQ",priority:"Kriticna",duration:80},{name:"OQ - Operativna kvalifikacija",abbr:"OQ",priority:"Kriticna",duration:168},{name:"PQ - Procesna kvalifikacija",abbr:"PQ",priority:"Kriticna",duration:168},{name:"Validacijsko porocilo",abbr:"ValP",priority:"Kriticna",duration:56},{name:"Periodicni pregled",abbr:"PP",priority:"Visoka",duration:40},
  ]},
  {id:6,name:"Prostor / GMP soba",tasks:[
    {name:"URS - Zahteve za prostor",abbr:"URS",priority:"Kriticna",duration:56},{name:"Validacijski nacrt prostora",abbr:"VNP",priority:"Kriticna",duration:40},{name:"DQ - Nacrtna kvalifikacija",abbr:"DQ",priority:"Visoka",duration:56},{name:"IQ - Gradbena kvalifikacija",abbr:"IQ",priority:"Kriticna",duration:112},{name:"OQ - Operativna kvalifikacija",abbr:"OQ",priority:"Kriticna",duration:112},{name:"PQ - Procesna kvalifikacija",abbr:"PQ",priority:"Kriticna",duration:168},{name:"Monitoring okolja",abbr:"MO",priority:"Visoka",duration:80},{name:"Validacijsko porocilo prostora",abbr:"ValP",priority:"Kriticna",duration:40},
  ]},
  {id:7,name:"Commissioning / GEP",tasks:[
    {name:"Definicija obsega (Scope of Work)",abbr:"SOW",priority:"Visoka",duration:40},{name:"FAT - Tovarniski sprejem test",abbr:"FAT",priority:"Visoka",duration:56},{name:"SAT - Sprejem test na lokaciji",abbr:"SAT",priority:"Visoka",duration:56},{name:"Commissioning nacrt",abbr:"CN",priority:"Visoka",duration:40},{name:"Mehansko dokoncanje (MC)",abbr:"MC",priority:"Visoka",duration:112},{name:"Predinspecija in snagging lista",abbr:"SL",priority:"Srednja",duration:56},{name:"Commissioning testiranje sistemov",abbr:"CTS",priority:"Visoka",duration:112},{name:"GEP dokumentacija in porocilo",abbr:"GEP",priority:"Visoka",duration:56},{name:"Predaja v obratovanje (Handover)",abbr:"HO",priority:"Visoka",duration:24},
  ]},
];
const INIT_PROJECTS = [
  {id:1,name:"LIMS validacija (IT GxP)",abbr:"LIMS",color:"#e0edff",textColor:"#1d4ed8"},
  {id:2,name:"MES sistem (GAMP 4)",abbr:"MES",color:"#e6f9f0",textColor:"#15803d"},
  {id:3,name:"Cistilna soba ISO 7",abbr:"CS-ISO7",color:"#fef3e2",textColor:"#b45309"},
  {id:4,name:"Parni sterilizator (GAMP 5)",abbr:"PS-G5",color:"#f3e8ff",textColor:"#7c3aed"},
];

function makeTask(id,name,abbr,project,assignee,priority,startDate,dueDate,status,pct) {
  return {id,name,abbr,project,assignee,priority,startDate,dueDate,status,pct,desc:"",comments:"",
    phases:mkPhases(startDate,dueDate,defaultPhaseStatuses(status,pct))};
}
const INIT_TASKS = [
  makeTask(1,"URS - Uporabniske zahteve","URS","LIMS validacija (IT GxP)","Ana K.","Kriticna","2026-04-01","2026-04-10","Zakljuceno",100),
  makeTask(2,"Validacijski nacrt (VP)","VP","LIMS validacija (IT GxP)","Bor M.","Kriticna","2026-04-11","2026-04-15","Zakljuceno",100),
  makeTask(3,"Kvalifikacija dobavitelja (SQ)","SQ","LIMS validacija (IT GxP)","Ana K.","Visoka","2026-04-16","2026-04-22","V teku",60),
  makeTask(4,"DQ - Kvalifikacija zasnove","DQ","LIMS validacija (IT GxP)","Cvetka P.","Kriticna","2026-04-23","2026-04-29","Planirano",0),
  makeTask(5,"IQ - Instalacijska kvalifikacija","IQ","LIMS validacija (IT GxP)","Ana K.","Kriticna","2026-04-30","2026-05-09","Planirano",0),
  makeTask(6,"OQ - Operativna kvalifikacija","OQ","LIMS validacija (IT GxP)","Bor M.","Kriticna","2026-05-10","2026-05-23","Planirano",0),
  makeTask(7,"PQ - Procesna kvalifikacija","PQ","LIMS validacija (IT GxP)","Cvetka P.","Kriticna","2026-05-24","2026-06-06","Planirano",0),
  makeTask(8,"Pregled in odobritev dokumentacije","POD","LIMS validacija (IT GxP)","Ana K.","Visoka","2026-06-07","2026-06-13","Planirano",0),
  makeTask(9,"Validacijsko porocilo","ValP","LIMS validacija (IT GxP)","Bor M.","Kriticna","2026-06-14","2026-06-18","Planirano",0),
  makeTask(10,"Prenos v produkcijo (Go-Live)","GL","LIMS validacija (IT GxP)","Ana K.","Visoka","2026-06-19","2026-06-21","Planirano",0),
  makeTask(11,"URS - Zahteve sistema","URS","MES sistem (GAMP 4)","Domen L.","Kriticna","2026-04-01","2026-04-10","Zakljuceno",100),
  makeTask(12,"Validacijski nacrt","VN","MES sistem (GAMP 4)","Domen L.","Kriticna","2026-04-11","2026-04-15","Zakljuceno",100),
  makeTask(13,"Analiza tveganja (RA)","RA","MES sistem (GAMP 4)","Bor M.","Kriticna","2026-04-16","2026-04-22","V teku",75),
  makeTask(14,"FS - Funkcionalne specifikacije","FS","MES sistem (GAMP 4)","Eva R.","Visoka","2026-04-23","2026-04-29","Na cakanju",0),
  makeTask(15,"DS - Detajlne specifikacije","DS","MES sistem (GAMP 4)","Eva R.","Visoka","2026-04-30","2026-05-06","Planirano",0),
  makeTask(16,"DQ - Kvalifikacija zasnove","DQ","MES sistem (GAMP 4)","Domen L.","Kriticna","2026-05-07","2026-05-13","Planirano",0),
  makeTask(17,"IQ - Instalacijska kvalifikacija","IQ","MES sistem (GAMP 4)","Bor M.","Kriticna","2026-05-14","2026-05-23","Planirano",0),
  makeTask(18,"OQ - Operativna kvalifikacija","OQ","MES sistem (GAMP 4)","Eva R.","Kriticna","2026-05-24","2026-06-06","Planirano",0),
  makeTask(19,"PQ - Procesna kvalifikacija","PQ","MES sistem (GAMP 4)","Domen L.","Kriticna","2026-06-07","2026-06-20","Planirano",0),
  makeTask(20,"Validacijsko porocilo","ValP","MES sistem (GAMP 4)","Bor M.","Kriticna","2026-06-21","2026-06-25","Planirano",0),
  makeTask(21,"URS - Zahteve za prostor","URS","Cistilna soba ISO 7","Filip S.","Kriticna","2026-04-05","2026-04-11","Zakljuceno",100),
  makeTask(22,"Validacijski nacrt prostora","VNP","Cistilna soba ISO 7","Ana K.","Kriticna","2026-04-12","2026-04-16","V teku",90),
  makeTask(23,"DQ - Nacrtna kvalifikacija","DQ","Cistilna soba ISO 7","Filip S.","Visoka","2026-04-17","2026-04-23","Planirano",0),
  makeTask(24,"IQ - Gradbena kvalifikacija","IQ","Cistilna soba ISO 7","Ana K.","Kriticna","2026-04-24","2026-05-07","Planirano",0),
  makeTask(25,"OQ - Operativna kvalifikacija","OQ","Cistilna soba ISO 7","Filip S.","Kriticna","2026-05-08","2026-05-21","Planirano",0),
  makeTask(26,"PQ - Procesna kvalifikacija","PQ","Cistilna soba ISO 7","Cvetka P.","Kriticna","2026-05-22","2026-06-11","Planirano",0),
  makeTask(27,"Monitoring okolja","MO","Cistilna soba ISO 7","Ana K.","Visoka","2026-06-12","2026-06-21","Planirano",0),
  makeTask(28,"Validacijsko porocilo prostora","ValP","Cistilna soba ISO 7","Filip S.","Kriticna","2026-06-22","2026-06-26","Planirano",0),
  makeTask(29,"URS - Uporabniske zahteve","URS","Parni sterilizator (GAMP 5)","Domen L.","Kriticna","2026-04-03","2026-04-12","V teku",25),
  makeTask(30,"Validacijski nacrt","VN","Parni sterilizator (GAMP 5)","Eva R.","Kriticna","2026-04-13","2026-04-17","Planirano",0),
  makeTask(31,"Analiza tveganja (FMEA/RA)","FMEA","Parni sterilizator (GAMP 5)","Domen L.","Kriticna","2026-04-18","2026-04-27","Planirano",0),
  makeTask(32,"FS - Funkcionalne specifikacije","FS","Parni sterilizator (GAMP 5)","Eva R.","Kriticna","2026-04-28","2026-05-07","Planirano",0),
  makeTask(33,"DS - Detajlne specifikacije","DS","Parni sterilizator (GAMP 5)","Filip S.","Kriticna","2026-05-08","2026-05-17","Planirano",0),
  makeTask(34,"Pregled kode (Code Review)","CR","Parni sterilizator (GAMP 5)","Bor M.","Visoka","2026-05-18","2026-05-24","Planirano",0),
  makeTask(35,"DQ - Kvalifikacija zasnove","DQ","Parni sterilizator (GAMP 5)","Domen L.","Kriticna","2026-05-25","2026-05-31","Planirano",0),
  makeTask(36,"IQ - Instalacijska kvalifikacija","IQ","Parni sterilizator (GAMP 5)","Eva R.","Kriticna","2026-06-01","2026-06-10","Planirano",0),
  makeTask(37,"OQ - Operativna kvalifikacija","OQ","Parni sterilizator (GAMP 5)","Filip S.","Kriticna","2026-06-11","2026-07-01","Planirano",0),
  makeTask(38,"PQ - Procesna kvalifikacija","PQ","Parni sterilizator (GAMP 5)","Domen L.","Kriticna","2026-07-02","2026-07-22","Planirano",0),
  makeTask(39,"Validacijsko porocilo","ValP","Parni sterilizator (GAMP 5)","Eva R.","Kriticna","2026-07-23","2026-07-29","Planirano",0),
  makeTask(40,"Periodicni pregled","PP","Parni sterilizator (GAMP 5)","Domen L.","Visoka","2026-07-30","2026-08-03","Planirano",0),
];

export default function App() {
  const [tasks,setTasks]         = useState(INIT_TASKS);
  const [projects,setProjects]   = useState(INIT_PROJECTS);
  const [templates,setTemplates] = useState(INIT_TEMPLATES);
  const [navView,setNavView]     = useState("naloge");
  const [subView,setSubView]     = useState("monthly");
  const [modal,setModal]         = useState(null);
  const [viewYr,setViewYr]       = useState(2026);
  const [viewMo,setViewMo]       = useState(3);
  const nextTaskId=useRef(41),nextProjId=useRef(5),nextTplId=useRef(8);
  const overdue=tasks.filter(t=>isOverdue(t)).length;

  function openNewTask(defaults) {
    const sd=(defaults&&defaults.startDate)||"2026-04-30",ed=(defaults&&defaults.dueDate)||"2026-05-15";
    setModal({type:"task",data:{id:null,name:"",abbr:"",desc:"",project:projects[0]?.name||"",assignee:EMPLOYEES[0],priority:"Srednja",startDate:sd,dueDate:ed,status:"Planirano",pct:0,comments:"",phases:mkPhases(sd,ed),...(defaults||{})}});
  }
  function openEditTask(t){setModal({type:"task",data:{...t,phases:t.phases||mkPhases(t.startDate,t.dueDate)}});}
  function saveTask(){
    const d=modal.data;if(!d.name.trim())return;
    const finalDue=d.phases&&d.phases.length>0?d.phases[d.phases.length-1].dueDate:d.dueDate;
    const saved={...d,dueDate:finalDue};
    if(d.id)setTasks(p=>p.map(t=>t.id===d.id?saved:t));else setTasks(p=>[...p,{...saved,id:nextTaskId.current++}]);
    setModal(null);
  }
  function deleteTask(id){setTasks(p=>p.filter(t=>t.id!==id));setModal(null);}
  function openNewProject(){setModal({type:"project",data:{id:null,name:"",abbr:"",templateId:"",startDate:"2026-05-01",assignee:EMPLOYEES[0]}});}
  function createProject(){
    const d=modal.data;if(!d.name.trim())return;
    const ci=projects.length%PROJECT_PALETTE.length;
    setProjects(p=>[...p,{id:nextProjId.current++,name:d.name,abbr:d.abbr||"",color:PROJECT_PALETTE[ci],textColor:PROJECT_TEXT_PAL[ci]}]);
    if(d.templateId){
      const tpl=templates.find(t=>t.id===Number(d.templateId));
      if(tpl){let off=0;const nt=tpl.tasks.map(tt=>{const durs=tt.phaseDurations||defaultPhaseDurs(tt.duration||56),calDays=durs.reduce((a,h)=>a+hoursToDays(h),0),sd=shiftDate(d.startDate,off),task={id:nextTaskId.current++,name:tt.name,abbr:tt.abbr||"",desc:"",project:d.name,assignee:d.assignee,priority:tt.priority,startDate:sd,dueDate:shiftDate(sd,calDays-1),status:"Planirano",pct:0,comments:"",phases:mkPhasesFromDurs(sd,durs)};off+=calDays;return task;});setTasks(p=>[...p,...nt]);}
    }
    setModal(null);setSubView("gantt");
  }
  function openNewTemplate(){setModal({type:"template",data:{id:null,name:"",tasks:[{name:"",abbr:"",priority:"Srednja",duration:64,phaseDurations:[16,16,16,16]}]}});}
  function openEditTemplate(tpl){setModal({type:"template",data:{...tpl,tasks:tpl.tasks.map(t=>({...t,phaseDurations:t.phaseDurations||defaultPhaseDurs(t.duration)}))}});}
  function saveTemplate(){const d=modal.data;if(!d.name.trim())return;if(d.id)setTemplates(p=>p.map(t=>t.id===d.id?d:t));else setTemplates(p=>[...p,{...d,id:nextTplId.current++}]);setModal(null);}
  function deleteTemplate(id){setTemplates(p=>p.filter(t=>t.id!==id));setModal(null);}

  const tabs=[["monthly","Mesecni pregled"],["list","Po nalogi"],["employee","Po zaposlenem"],["gantt","Po projektu (Gantt)"],["dashboard","Statistika"]];
  const navItems=[{id:"agent",label:"Pogovor z agentom",icon:"💬"},{id:"naloge",label:"Naloge",icon:"✓",badge:overdue||null},{id:"zapisniki",label:"Zapisniki",icon:"≡"},{id:"dokumenti",label:"Dokumenti",icon:"📄"}];
  const STATUS_LEGEND=[["Na cakanju","#94a3b8"],["V teku","#93c5fd"],["Zakljuceno","#86efac"],["Zamuda","#fdba74"],["Planirano","#c4b5fd"]];

  return (
    <div style={{display:"flex",height:"100vh",minHeight:500,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14,background:"#f9fafb",color:"#1a1a1a"}}>
      <div style={{width:210,flexShrink:0,borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",padding:"16px 0",background:"#fff",overflowY:"auto"}}>
        <div style={{padding:"0 16px 12px",borderBottom:"1px solid #f3f4f6",marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.02em"}}>CTRL-ING</div>
          <div style={{fontSize:10,color:"#9ca3af",marginTop:1,fontWeight:500,letterSpacing:".04em"}}>TASK TRACKER 3</div>
        </div>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",color:"#9ca3af",padding:"8px 16px 4px",textTransform:"uppercase"}}>Navigacija</div>
        {navItems.map(n=>(
          <div key={n.id} onClick={()=>setNavView(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",cursor:"pointer",fontSize:13,color:navView===n.id?"#1a1a1a":"#6b7280",background:navView===n.id?"#f3f4f6":"transparent",fontWeight:navView===n.id?500:400}}>
            <span style={{width:16,textAlign:"center"}}>{n.icon}</span><span>{n.label}</span>
            {n.badge&&<span style={{marginLeft:"auto",background:"#dc2626",color:"#fff",borderRadius:10,fontSize:10,fontWeight:600,padding:"1px 6px"}}>{n.badge}</span>}
          </div>
        ))}
        <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",color:"#9ca3af",padding:"14px 16px 4px",textTransform:"uppercase"}}>Vzorci — tip faze</div>
        {PHASES.map(name=>(
          <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 16px"}}>
            <div style={{width:14,height:14,borderRadius:2,flexShrink:0,...phasePatternStyle(name,"#4b7db5")}} />
            <span style={{fontSize:12,color:"#6b7280"}}>{name}</span>
          </div>
        ))}
        <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",color:"#9ca3af",padding:"14px 16px 4px",textTransform:"uppercase"}}>Barve — status</div>
        {STATUS_LEGEND.map(([label,color])=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 16px"}}>
            <div style={{width:14,height:14,borderRadius:2,background:color,flexShrink:0}} />
            <span style={{fontSize:12,color:"#6b7280"}}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          {navView==="naloge"?(
            <>
              <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",marginBottom:20}}>
                {tabs.map(([v,l])=>(
                  <div key={v} onClick={()=>setSubView(v)} style={{padding:"10px 16px",fontSize:13,cursor:"pointer",color:subView===v?"#1a1a1a":"#6b7280",borderBottom:subView===v?"2px solid #1a1a1a":"2px solid transparent",marginBottom:-1,fontWeight:subView===v?500:400,whiteSpace:"nowrap"}}>{l}</div>
                ))}
              </div>
              {subView==="monthly"  &&<MonthlyView  tasks={tasks} projects={projects} openEditTask={openEditTask} yr={viewYr} setYr={setViewYr} mo={viewMo} setMo={setViewMo} />}
              {subView==="list"     &&<ListView     tasks={tasks} projects={projects} openNewTask={openNewTask} openEditTask={openEditTask} />}
              {subView==="employee" &&<EmployeeView tasks={tasks} projects={projects} openNewTask={openNewTask} openEditTask={openEditTask} />}
              {subView==="gantt"    &&<GanttView    tasks={tasks} setTasks={setTasks} projects={projects} templates={templates} openNewTask={openNewTask} openEditTask={openEditTask} openNewProject={openNewProject} openNewTemplate={openNewTemplate} openEditTemplate={openEditTemplate} viewYr={viewYr} viewMo={viewMo} />}
              {subView==="dashboard"&&<DashView     tasks={tasks} projects={projects} />}
            </>
          ):(
            <div style={{textAlign:"center",paddingTop:80,color:"#9ca3af",fontSize:13}}>
              <div style={{fontSize:40,marginBottom:12}}>🚧</div>
              <div>Ta razdelek ni na voljo v demonstraciji.</div>
            </div>
          )}
        </div>
      </div>
      {modal?.type==="task"    &&<TaskModal     modal={modal} setModal={setModal} saveTask={saveTask} deleteTask={deleteTask} projects={projects} />}
      {modal?.type==="project" &&<ProjectModal  modal={modal} setModal={setModal} createProject={createProject} templates={templates} />}
      {modal?.type==="template"&&<TemplateModal modal={modal} setModal={setModal} saveTemplate={saveTemplate} deleteTemplate={deleteTemplate} />}
    </div>
  );
}

function MonthlyView({ tasks, projects, openEditTask, yr, setYr, mo, setMo }) {
  const [tip,setTip]=useState(null);
  const COL=52,LW=130;
  const dim=new Date(yr,mo+1,0).getDate(),days=Array.from({length:dim},(_,i)=>i+1);
  const prev=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);};
  const next=()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const dow=d=>new Date(yr,mo,d).getDay(),isWE=d=>{const w=dow(d);return w===0||w===6;};
  const isToday=d=>yr===2026&&mo===3&&d===30;
  const getHol=d=>{const h=getHolidays(yr),k=String(mo+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");return h[k]||null;};
  const bgDay=d=>isToday(d)?"#eff6ff":getHol(d)?"#fef2f2":isWE(d)?"#f9f8f4":"transparent";
  const getDayTasks=(emp,d)=>{const dt=new Date(yr,mo,d).getTime();return tasks.filter(t=>t.assignee===emp&&dt>=new Date(t.startDate).getTime()&&dt<=new Date(t.dueDate).getTime());};
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={prev} style={btnS}>‹</button>
        <div style={{fontSize:16,fontWeight:600,minWidth:160,textAlign:"center"}}>{MONTH_NAMES[mo]} {yr}</div>
        <button onClick={next} style={btnS}>›</button>
        <button onClick={()=>{setYr(2026);setMo(3);}} style={{...btnS,fontSize:12}}>Danes</button>
        <button onClick={()=>exportCSV(tasks)} style={{...btnS,marginLeft:"auto"}}>⬇ CSV</button>
      </div>
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:LW+COL*dim}}>
          <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",position:"sticky",top:0,background:"#f9fafb",zIndex:2}}>
            <div style={{width:LW,flexShrink:0,fontSize:11,fontWeight:600,color:"#9ca3af",padding:"6px 8px",textTransform:"uppercase"}}>Zaposleni</div>
            {days.map(d=>{const hol=getHol(d);return(
              <div key={d} style={{width:COL,flexShrink:0,textAlign:"center",padding:"4px 0",borderLeft:"0.5px solid #e5e7eb",background:bgDay(d)}}>
                <div style={{fontSize:9,color:hol?"#dc2626":isWE(d)?"#b45309":"#9ca3af",textTransform:"uppercase",fontWeight:hol?700:400}}>{DAY_LABELS[dow(d)]}</div>
                <div style={{fontSize:12,fontWeight:isToday(d)?700:400,color:isToday(d)?"#2563eb":hol?"#dc2626":"#6b7280"}} title={hol||""}>{d}{hol?"*":""}</div>
              </div>
            );})}
          </div>
          {EMPLOYEES.map(emp=>{
            const empT=tasks.filter(t=>t.assignee===emp);
            if(!empT.length)return null;
            const cnt=empT.filter(t=>new Date(t.startDate).getTime()<=new Date(yr,mo+1,0).getTime()&&new Date(t.dueDate).getTime()>=new Date(yr,mo,1).getTime()).length;
            return(
              <div key={emp} style={{display:"flex",borderBottom:"1px solid #e5e7eb",minHeight:80,alignItems:"stretch"}}>
                <div style={{width:LW,flexShrink:0,padding:"8px",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"1px solid #e5e7eb",background:"#fff"}}>
                  <div style={{fontWeight:600,fontSize:13}}>{emp}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{cnt} nal.</div>
                </div>
                {days.map(d=>{
                  const dt=getDayTasks(emp,d);
                  return(
                    <div key={d} style={{width:COL,flexShrink:0,borderLeft:"0.5px solid #e5e7eb",padding:"3px 2px",background:bgDay(d),display:"flex",flexDirection:"column",gap:2}}>
                      {dt.map(t=>{
                        const isStart=new Date(t.startDate).getDate()===d&&new Date(t.startDate).getMonth()===mo;
                        const dur=Math.round((new Date(t.dueDate).getTime()-new Date(t.startDate).getTime())/86400000)+1;
                        const activePhase=getPhaseOnDay(t,yr,mo,d);
                        const col=activePhase?phaseStatusColor(activePhase):"#9ca3af";
                        const opa=activePhase?phaseOpacity(activePhase):0.9;
                        const barPat=activePhase?phasePatternStyle(activePhase.type,col,opa):{background:col,opacity:opa};
                        const projAbbr=(projects.find(p=>p.name===t.project)||{abbr:t.project.slice(0,6)}).abbr||t.project.slice(0,6);
                        const pAbbr=activePhase?phaseAbbr(activePhase.type):"";
                        return(
                          <div key={t.id} onClick={()=>openEditTask(t)}
                            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTip({task:t,phase:activePhase,x:r.left,y:r.bottom+4});}}
                            onMouseLeave={()=>setTip(null)}
                            style={{height:34,borderRadius:4,...barPat,cursor:"pointer",flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"center",paddingLeft:isStart?4:2,overflow:"hidden"}}>
                            {isStart&&<span style={{fontSize:8,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:COL*dur-8,lineHeight:1.3}}>{projAbbr}·{pAbbr}</span>}
                            {isStart&&<span style={{fontSize:8,color:"rgba(255,255,255,.9)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:COL*dur-8,lineHeight:1.3}}>{t.abbr||t.name.slice(0,4)}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {tip&&(
        <div style={{position:"fixed",left:Math.min(tip.x,window.innerWidth-230),top:tip.y,background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 12px",zIndex:300,minWidth:200,pointerEvents:"none",boxShadow:"0 4px 12px rgba(0,0,0,.12)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{tip.task.abbr&&<AbbrTag abbr={tip.task.abbr} />}<span style={{fontWeight:600,fontSize:13}}>{cleanName(tip.task)}</span></div>
          {tip.phase&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><div style={{width:9,height:9,borderRadius:2,...phasePatternStyle(tip.phase.type,"#4b7db5")}} /><span style={{fontSize:12,fontWeight:600,color:phaseColor(tip.phase.type)}}>{tip.phase.type}</span><span style={{fontSize:11,color:"#9ca3af"}}>{tip.phase.duration}h</span><StatTag s={tip.phase.status} /></div>}
          {(tip.task.phases||[]).length>0&&<div style={{marginBottom:6}}><PhaseMiniBar phases={tip.task.phases} height={6} /></div>}
          <div style={{fontSize:11,color:"#9ca3af"}}>{tip.task.startDate} → {tip.task.dueDate} · {tip.task.pct}%</div>
        </div>
      )}
    </div>
  );
}

function ListView({ tasks, projects, openNewTask, openEditTask }) {
  const [pill,setPill]=useState("vse"),[search,setSearch]=useState(""),[fSt,setFSt]=useState(""),[fEmp,setFEmp]=useState("");
  const odCnt=tasks.filter(t=>isOverdue(t)).length;
  const pills=[{id:"vse",label:"Vse ("+tasks.length+")"},{id:"zamude",label:"Zamude ("+odCnt+")",danger:true},...projects.map(p=>({id:p.name,label:p.name}))];
  const filtered=tasks.filter(t=>{
    if(pill==="zamude"&&!isOverdue(t))return false;
    if(pill!=="vse"&&pill!=="zamude"&&t.project!==pill)return false;
    if(fSt&&t.status!==fSt)return false;
    if(fEmp&&t.assignee!==fEmp)return false;
    if(search&&!(t.name.toLowerCase().includes(search.toLowerCase())||(t.abbr||"").toLowerCase().includes(search.toLowerCase())))return false;
    return true;
  });
  const odRows=filtered.filter(t=>isOverdue(t)),restRows=filtered.filter(t=>!isOverdue(t));
  return (
    <div>
      <div style={{display:"flex",gap:0,marginBottom:20,border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",background:"#fff"}}>
        {STATUSES.map(s=><div key={s} style={{flex:1,textAlign:"center",padding:"14px 8px",borderRight:"1px solid #e5e7eb"}}><div style={{fontSize:22,fontWeight:700,lineHeight:1,color:sColor(s)}}>{tasks.filter(t=>t.status===s).length}</div><div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{s}</div></div>)}
        <div style={{flex:1,textAlign:"center",padding:"14px 8px",borderRight:"1px solid #e5e7eb"}}><div style={{fontSize:22,fontWeight:700,lineHeight:1,color:"#f97316"}}>{odCnt}</div><div style={{fontSize:11,color:"#6b7280",marginTop:4}}>Zamude</div></div>
        <div style={{flex:1,textAlign:"center",padding:"14px 8px"}}><div style={{fontSize:22,fontWeight:700,lineHeight:1,color:"#d97706"}}>{tasks.filter(t=>t.priority==="Kriticna"&&t.status!=="Zakljuceno").length}</div><div style={{fontSize:11,color:"#6b7280",marginTop:4}}>Kriticne</div></div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {pills.map(p=><button key={p.id} onClick={()=>setPill(p.id)} style={{padding:"5px 14px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",borderColor:pill===p.id?(p.danger?"#fdba74":"#1a1a1a"):"#e5e7eb",background:pill===p.id?(p.danger?"#fff7ed":"#1a1a1a"):"transparent",color:pill===p.id?(p.danger?"#f97316":"#fff"):"#6b7280"}}>{p.label}</button>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...fi,width:150}} placeholder="Iskanje..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={fi} value={fSt}  onChange={e=>setFSt(e.target.value)}><option value="">Vsi statusi</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <select style={fi} value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">Vsi zaposleni</option>{EMPLOYEES.map(e=><option key={e} value={e}>{e}</option>)}</select>
        <button onClick={()=>exportCSV(filtered)} style={{...btnS,marginLeft:"auto"}}>⬇ CSV</button>
        <button onClick={()=>openNewTask()} style={btnP}>+ Nova naloga</button>
      </div>
      {filtered.length===0?<Empty />:(
        <>
          {pill==="vse"&&odRows.length>0&&<><SLabel>Zamude</SLabel><TList tasks={odRows} projects={projects} openEditTask={openEditTask} /><SLabel style={{marginTop:20}}>Ostale naloge</SLabel><TList tasks={restRows} projects={projects} openEditTask={openEditTask} /></>}
          {pill==="vse"&&odRows.length===0&&<TList tasks={filtered} projects={projects} openEditTask={openEditTask} />}
          {pill!=="vse"&&<TList tasks={filtered} projects={projects} openEditTask={openEditTask} />}
        </>
      )}
    </div>
  );
}
function TList({ tasks, projects, openEditTask }) {
  return <div style={{borderTop:"1px solid #e5e7eb"}}>{tasks.map(t=><TRow key={t.id} t={t} projects={projects} onClick={()=>openEditTask(t)} />)}</div>;
}
function TRow({ t, projects, onClick }) {
  const od=isOverdue(t),totalH=(t.phases||[]).reduce((a,p)=>a+(p.duration||0),0);
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",padding:"12px 8px",borderBottom:"1px solid #f3f4f6",gap:12,cursor:"pointer"}}>
      <div style={{width:3,height:36,borderRadius:2,background:pColor(t.priority),flexShrink:0}}></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>{t.abbr&&<AbbrTag abbr={t.abbr} />}<span style={{fontSize:14,fontWeight:500}}>{cleanName(t)}</span>{totalH>0&&<span style={{fontSize:10,color:"#9ca3af"}}>{totalH}h</span>}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}><ProjTag name={t.project} projects={projects} /><PrioTag p={t.priority} /><StatTag s={effectiveStatus(t)} /><span style={{fontSize:11,color:"#9ca3af",alignSelf:"center"}}>{t.assignee}</span></div>
        {(t.phases||[]).length>0&&<PhaseMiniBar phases={t.phases} height={5} />}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><PctBar v={t.pct} width={60} /><span style={{fontSize:11,color:"#9ca3af"}}>{t.pct}%</span></div>
        <span style={{fontSize:12,color:od?"#f97316":"#6b7280",minWidth:50,textAlign:"right"}}>{fmtDate(t.dueDate)}</span>
      </div>
    </div>
  );
}

function EmployeeView({ tasks, projects, openNewTask, openEditTask }) {
  const [search,setSearch]=useState(""),[fProj,setFProj]=useState(""),[fSt,setFSt]=useState("");
  const filtered=tasks.filter(t=>{
    if(fProj&&t.project!==fProj)return false;
    if(fSt&&t.status!==fSt)return false;
    if(search&&!(t.name.toLowerCase().includes(search.toLowerCase())||(t.abbr||"").toLowerCase().includes(search.toLowerCase())))return false;
    return true;
  });
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <input style={{...fi,width:150}} placeholder="Iskanje..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={fi} value={fProj} onChange={e=>setFProj(e.target.value)}><option value="">Vsi projekti</option>{projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select>
        <select style={fi} value={fSt}   onChange={e=>setFSt(e.target.value)}><option value="">Vsi statusi</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <button onClick={()=>exportCSV(filtered)} style={{...btnS,marginLeft:"auto"}}>⬇ CSV</button>
        <button onClick={()=>openNewTask()} style={btnP}>+ Nova naloga</button>
      </div>
      {filtered.length===0?<Empty />:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {EMPLOYEES.map(emp=>{
            const et=filtered.filter(t=>t.assignee===emp);
            if(!et.length)return null;
            const avg=Math.round(et.reduce((a,t)=>a+t.pct,0)/et.length);
            return(
              <div key={emp} style={card}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{emp}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{flex:1,height:4,borderRadius:2,background:"#e5e7eb"}}><div style={{width:avg+"%",height:4,borderRadius:2,background:"#2563eb"}}></div></div>
                  <span style={{fontSize:11,color:"#9ca3af",whiteSpace:"nowrap"}}>{avg}% · {et.length} nal.</span>
                </div>
                {et.map(t=>(
                  <div key={t.id} onClick={()=>openEditTask(t)} style={{padding:"6px 8px",background:"#f9fafb",borderRadius:6,marginBottom:5,cursor:"pointer",border:"1px solid #f3f4f6"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>{t.abbr&&<AbbrTag abbr={t.abbr} />}<span style={{fontSize:12,fontWeight:500}}>{cleanName(t)}</span></div>
                    {(t.phases||[]).length>0&&<div style={{marginBottom:4}}><PhaseMiniBar phases={t.phases} height={4} /></div>}
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}><StatTag s={effectiveStatus(t)} /><PrioTag p={t.priority} /></div>
                  </div>
                ))}
                <button onClick={()=>openNewTask({assignee:emp})} style={{...btnS,width:"100%",marginTop:8,fontSize:12,padding:"4px 0",textAlign:"center"}}>+ Nova naloga</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GanttView({ tasks, setTasks, projects, templates, openNewTask, openEditTask, openNewProject, openNewTemplate, openEditTemplate, viewYr, viewMo }) {
  const [search,setSearch]=useState(""),[fProj,setFProj]=useState(""),[fEmp,setFEmp]=useState("");
  const [showTpl,setShowTpl]=useState(false),[drag,setDrag]=useState(null),[busyPpt,setBusyPpt]=useState(false);
  const gStart=new Date(viewYr,viewMo,1),gEnd=new Date(viewYr,viewMo+4,0);
  const minMs=gStart.getTime(),maxMs=gEnd.getTime(),span=maxMs-minMs;
  const months=[];let mc=new Date(gStart);
  while(mc.getTime()<=maxMs){months.push(MONTH_NAMES[mc.getMonth()].slice(0,3)+" "+mc.getFullYear());mc=new Date(mc.getFullYear(),mc.getMonth()+1,1);}
  const gridLines=[];let gc=new Date(gStart);
  while(gc.getTime()<=maxMs){const pct=(gc.getTime()-minMs)/span*100;if(gc.getDate()===1&&gc.getTime()>minMs)gridLines.push({pct,type:"month"});else if(gc.getDay()===1)gridLines.push({pct,type:"week"});gc=new Date(gc.getFullYear(),gc.getMonth(),gc.getDate()+1);}
  const todayPct=(TODAY_MS-minMs)/span*100;
  const filtered=tasks.filter(t=>{if(fProj&&t.project!==fProj)return false;if(fEmp&&t.assignee!==fEmp)return false;if(search&&!(t.name.toLowerCase().includes(search.toLowerCase())||(t.abbr||"").toLowerCase().includes(search.toLowerCase())))return false;return true;});
  const dayPct=s=>Math.max(0,Math.min(100,(new Date(s).getTime()-minMs)/span*100));
  const wPct=(s,e)=>Math.max(0.2,(new Date(e).getTime()+86400000-new Date(s).getTime())/span*100);
  function onPhaseDown(ev,t,ph,part){ev.preventDefault();ev.stopPropagation();const r=ev.currentTarget.closest("[data-gt]").getBoundingClientRect();setDrag({taskId:t.id,phaseId:ph.id,part,sx:ev.clientX,origStart:ph.startDate,origDuration:ph.duration,tw:r.width});}
  useEffect(()=>{
    if(!drag)return;
    const cascade=(phases,fromIdx)=>{
      for(let i=fromIdx+1;i<phases.length;i++){
        const prev=phases[i-1],ns=shiftDate(prev.dueDate,1),cd=hoursToDays(phases[i].duration);
        phases[i]={...phases[i],startDate:ns,dueDate:shiftDate(ns,cd-1)};
      }
      return phases;
    };
    const onMove=ev=>{
      const dx=ev.clientX-drag.sx,dd=Math.round(dx/drag.tw*span/86400000);
      setTasks(p=>p.map(t=>{
        if(t.id!==drag.taskId)return t;
        const idx=(t.phases||[]).findIndex(ph=>ph.id===drag.phaseId);
        if(idx===-1)return t;
        let np=[...(t.phases||[])];
        if(drag.part==="move"){
          const ns=shiftDate(drag.origStart,dd),cd=hoursToDays(np[idx].duration);
          np[idx]={...np[idx],startDate:ns,dueDate:shiftDate(ns,cd-1)};
        } else {
          const nd=Math.max(HOURS_PER_DAY,drag.origDuration+dd*HOURS_PER_DAY),cd=hoursToDays(nd);
          np[idx]={...np[idx],duration:nd,dueDate:shiftDate(drag.origStart,cd-1)};
        }
        np=cascade(np,idx);
        const maxDue=np.reduce((m,ph)=>ph.dueDate>m?ph.dueDate:m,"");
        const minStart=np.reduce((m,ph)=>(!m||ph.startDate<m)?ph.startDate:m,"");
        return{...t,phases:np,startDate:minStart||t.startDate,dueDate:maxDue||t.dueDate};
      }));
    };
    const onUp=()=>setDrag(null);
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[drag]);

  function handlePPT() {
    if (busyPpt) return;
    setBusyPpt(true);
    loadPptxLib()
      .then(() => buildPPT(filtered, projects, viewYr, viewMo))
      .catch(err => { console.error(err); alert("Napaka pri izvozu PPT: " + err.message); })
      .finally(() => setBusyPpt(false));
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <input style={{...fi,width:150}} placeholder="Iskanje..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={fi} value={fProj} onChange={e=>setFProj(e.target.value)}><option value="">Vsi projekti</option>{projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select>
        <select style={fi} value={fEmp}  onChange={e=>setFEmp(e.target.value)}><option value="">Vsi zaposleni</option>{EMPLOYEES.map(e=><option key={e} value={e}>{e}</option>)}</select>
        <button onClick={()=>buildXLSX(filtered,projects)} style={{...btnS,marginLeft:"auto"}}>⬇ XLSX</button>
        <button onClick={handlePPT} disabled={busyPpt} style={{...btnS,opacity:busyPpt?0.5:1}}>{busyPpt?"...":"⬇ PPT"}</button>
        <button onClick={()=>setShowTpl(s=>!s)} style={btnS}>Predloge {showTpl?"▲":"▼"}</button>
        <button onClick={openNewProject} style={btnP}>+ Nov projekt</button>
      </div>
      {showTpl&&(
        <div style={{...card,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600}}>Predloge projektov</div>
            <button onClick={openNewTemplate} style={btnP}>+ Nova predloga</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
            {templates.map(tpl=>(
              <div key={tpl.id} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:600,fontSize:13}}>{tpl.name}</div>
                  <button onClick={()=>openEditTemplate(tpl)} style={{...btnS,fontSize:11,padding:"2px 10px"}}>Uredi</button>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:6}}>{tpl.tasks.length} nalog</div>
                {tpl.tasks.map((t,i)=>{const durs=t.phaseDurations||defaultPhaseDurs(t.duration);return(
                  <div key={i} style={{marginBottom:7}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4,marginBottom:2}}>
                      <div style={{display:"flex",alignItems:"center",gap:4,minWidth:0,flex:1,overflow:"hidden"}}>{t.abbr&&<AbbrTag abbr={t.abbr} />}<span style={{fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cleanName(t)}</span></div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}><PrioTag p={t.priority} /><span style={{fontSize:10,color:"#9ca3af"}}>{durs.reduce((a,b)=>a+b,0)}h</span></div>
                    </div>
                    <PhaseMiniBar durs={durs} height={6} />
                  </div>
                );})}
              </div>
            ))}
          </div>
        </div>
      )}
      {filtered.length===0?<Empty />:(
        <div>
          {projects.map(proj=>{
            const pt=filtered.filter(t=>t.project===proj.name);if(!pt.length)return null;
            return(
              <div key={proj.id} style={{marginTop:20}}>
                <div style={{paddingTop:10,display:"flex",alignItems:"center",gap:8,marginBottom:6,borderTop:"2px solid "+proj.textColor+"33"}}>
                  <span style={{borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:600,background:proj.color,color:proj.textColor}}>{proj.name}</span>
                  <button onClick={()=>openNewTask({project:proj.name})} style={{...btnP,fontSize:11,padding:"2px 10px"}}>+ Naloga</button>
                </div>
                <div style={{display:"flex",gap:0,marginBottom:8,borderRadius:8,overflow:"hidden",background:proj.color,border:"1px solid "+proj.textColor+"33"}}>
                  {STATUSES.map(s=><div key={s} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRight:"1px solid "+proj.textColor+"22"}}><div style={{fontSize:18,fontWeight:700,lineHeight:1,color:sColor(s)}}>{pt.filter(t=>t.status===s).length}</div><div style={{fontSize:9,color:proj.textColor,marginTop:2,opacity:.8}}>{s}</div></div>)}
                  <div style={{flex:1,textAlign:"center",padding:"8px 4px",borderRight:"1px solid "+proj.textColor+"22"}}><div style={{fontSize:18,fontWeight:700,lineHeight:1,color:"#f97316"}}>{pt.filter(t=>isOverdue(t)).length}</div><div style={{fontSize:9,color:proj.textColor,marginTop:2,opacity:.8}}>Zamude</div></div>
                  <div style={{flex:1,textAlign:"center",padding:"8px 4px"}}><div style={{fontSize:18,fontWeight:700,lineHeight:1}}>{Math.round(pt.reduce((a,t)=>a+t.pct,0)/Math.max(pt.length,1))}%</div><div style={{fontSize:9,color:proj.textColor,marginTop:2,opacity:.8}}>Napredek</div></div>
                </div>
                <div style={{display:"flex",marginBottom:4}}>
                  <div style={{width:260,flexShrink:0}}></div>
                  <div style={{flex:1,display:"flex"}}>{months.map((m,i)=><div key={i} style={{flex:1,fontSize:9,color:"#9ca3af",textAlign:"center",fontWeight:500}}>{m}</div>)}</div>
                </div>
                {pt.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",marginBottom:7}}>
                    <div style={{width:260,flexShrink:0,paddingRight:8,cursor:"pointer",display:"flex",alignItems:"center",gap:5}} onClick={()=>openEditTask(t)}>
                      {t.abbr&&<AbbrTag abbr={t.abbr} />}
                      <span style={{fontSize:12,color:"#6b7280",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{cleanName(t)}</span>
                    </div>
                    <div data-gt="" style={{flex:1,position:"relative",height:24,background:"#f3f4f6"}}>
                      {gridLines.map((l,i)=>(l.type==="month"?<div key={i} style={{position:"absolute",top:0,left:l.pct+"%",width:1.5,height:"100%",background:"#9ca3af",opacity:.4,pointerEvents:"none"}}/>:<div key={i} style={{position:"absolute",top:0,left:l.pct+"%",width:0,height:"100%",borderLeft:"1px dashed #d1d5db",opacity:.5,pointerEvents:"none"}}/>))}
                      {todayPct>=0&&todayPct<=100&&<div style={{position:"absolute",top:0,left:todayPct+"%",width:2,height:"100%",background:"#dc2626",opacity:.8,pointerEvents:"none"}}/>}
                      {(t.phases||[]).map((ph,pi,arr)=>{
                        const lft=dayPct(ph.startDate),wid=wPct(ph.startDate,ph.dueDate);
                        if(wid<0.1)return null;
                        const col=phaseStatusColor(ph),opa=phaseOpacity(ph);
                        const phStartMs=new Date(ph.startDate).getTime(),phEndMs=new Date(ph.dueDate).getTime();
                        const barPct=ph.status==="Na cakanju"&&TODAY_MS>=phStartMs
                          ?Math.min(100,(TODAY_MS-phStartMs)/Math.max(1,phEndMs-phStartMs)*100)
                          :t.pct;
                        return <div key={ph.id||pi} title={ph.type+" ("+ph.duration+"h) · "+ph.status+" · "+t.pct+"%"}
                          onMouseDown={ev=>onPhaseDown(ev,t,ph,"move")}
                          style={{position:"absolute",left:lft+"%",width:wid+"%",height:24,...phasePatternStyle(ph.type,col,opa),
                            borderRadius:0,borderRight:"none",display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:8,fontWeight:700,color:"#fff",overflow:"hidden",
                            cursor:"grab",pointerEvents:"auto",zIndex:2}}>
                          <div style={{position:"absolute",bottom:0,left:0,right:0,height:6,background:"rgba(0,0,0,0.2)"}}>
                            <div style={{width:barPct+"%",height:"100%",background:"rgba(0,0,0,0.4)"}} />
                          </div>
                          <div onMouseDown={ev=>{ev.stopPropagation();onPhaseDown(ev,t,ph,"resize");}} style={{position:"absolute",right:0,top:0,bottom:0,width:6,cursor:"ew-resize"}}/>
                        </div>;
                      })}
                    </div>
                  </div>
                ))}
                {todayPct>=0&&todayPct<=100&&<div style={{display:"flex",marginBottom:4}}><div style={{width:260,flexShrink:0}}></div><div style={{flex:1,position:"relative",height:14}}><div style={{position:"absolute",left:todayPct+"%",transform:"translateX(-50%)",background:"#dc2626",color:"#fff",fontSize:8,fontWeight:600,padding:"1px 5px",borderRadius:3,whiteSpace:"nowrap"}}>danes · {fmtDate(new Date(TODAY_MS).toISOString().split("T")[0])} {new Date(TODAY_MS).getFullYear()}</div></div></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashView({ tasks, projects }) {
  const byStatus=STATUSES.map(s=>({s,n:tasks.filter(t=>t.status===s).length}));
  const byProj=projects.map(p=>({p:p.name,n:tasks.filter(t=>t.project===p.name).length,d:tasks.filter(t=>t.project===p.name&&t.status==="Zakljuceno").length}));
  const byEmp=EMPLOYEES.map(e=>({e,n:tasks.filter(t=>t.assignee===e).length}));
  const byPrio=PRIORITIES.map(p=>({p,n:tasks.filter(t=>t.priority===p).length}));
  const mxE=Math.max(...byEmp.map(x=>x.n),1);
  const kpis=[{v:tasks.length,l:"skupaj nalog",c:"#1a1a1a"},{v:tasks.filter(t=>t.status==="Zakljuceno").length,l:"zakljuceno",c:"#16a34a"},{v:tasks.filter(t=>t.status==="V teku").length,l:"v teku",c:"#60a5fa"},{v:tasks.filter(t=>isOverdue(t)).length,l:"zamude",c:"#f97316"},{v:tasks.filter(t=>t.status==="Planirano").length,l:"planirano",c:"#a78bfa"},{v:Math.round(tasks.reduce((a,t)=>a+t.pct,0)/Math.max(tasks.length,1))+"%",l:"povp. napredek",c:"#d97706"}];
  const charts=[{title:"Status nalog",rows:byStatus.map(({s,n})=>({label:s,n,color:sColor(s)})),total:tasks.length},{title:"Napredek po projektih",rows:byProj.map(({p,n,d})=>({label:p,n:n?Math.round(d/n*100):0,color:"#2563eb",suffix:"%"})),total:100},{title:"Obremenjenost zaposlenih",rows:byEmp.map(({e,n})=>({label:e,n,color:"#7c3aed"})),total:mxE},{title:"Prioritete",rows:byPrio.map(({p,n})=>({label:p,n,color:pColor(p)})),total:tasks.length}];
  return(
    <div>
      <div style={{display:"flex",gap:0,marginBottom:24,border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",background:"#fff"}}>
        {kpis.map((k,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"16px 8px",borderRight:i<kpis.length-1?"1px solid #e5e7eb":"none"}}><div style={{fontSize:26,fontWeight:700,lineHeight:1,color:k.c}}>{k.v}</div><div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{k.l}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {charts.map(({title,rows,total})=>(
          <div key={title} style={card}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"#9ca3af",marginBottom:14}}>{title}</div>
            {rows.map(({label,n,color,suffix})=><div key={label} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:12}}><span style={{color:"#6b7280"}}>{label}</span><span style={{fontWeight:600}}>{n}{suffix||""}</span></div><div style={{height:6,borderRadius:3,background:"#f3f4f6"}}><div style={{width:(total?n/total*100:0)+"%",height:6,borderRadius:3,background:color,transition:"width .4s"}}></div></div></div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskModal({ modal, setModal, saveTask, deleteTask, projects }) {
  const d=modal.data;
  function upd(k,v){setModal(p=>{const nd={...p.data,[k]:v};if(k==="startDate"&&nd.phases&&nd.phases.length>0){nd.phases=recomputePhaseDates(v,nd.phases);nd.dueDate=nd.phases[nd.phases.length-1].dueDate;}return{...p,data:nd};});}
  function onPhasesChange(np){setModal(p=>({...p,data:{...p.data,phases:np,dueDate:np.length>0?np[np.length-1].dueDate:p.data.dueDate}}));}
  return(
    <ModalBg onClose={()=>setModal(null)} wide>
      <h2 style={{fontSize:16,fontWeight:600,marginBottom:18}}>{d.id?"Uredi nalogo":"Nova naloga"}</h2>
      <FormRow label="Ime naloge"><MInput value={d.name} onChange={v=>upd("name",v)} placeholder="Vnesi ime naloge..." /></FormRow>
      <FormRow label="Okrajsava"><MInput value={d.abbr||""} onChange={v=>upd("abbr",v)} placeholder="npr. FS, IQ, OQ" /></FormRow>
      <FormRow label="Opis"><MTextarea value={d.desc} onChange={v=>upd("desc",v)} placeholder="Kratek opis..." /></FormRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FormRow label="Projekt"><select style={{width:"100%",...fi}} value={d.project} onChange={e=>upd("project",e.target.value)}>{projects.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select></FormRow>
        <FormRow label="Dodeljena osebi"><MSelect value={d.assignee} onChange={v=>upd("assignee",v)} options={EMPLOYEES} /></FormRow>
        <FormRow label="Prioriteta"><MSelect value={d.priority} onChange={v=>upd("priority",v)} options={PRIORITIES} /></FormRow>
        <FormRow label="Status"><MSelect value={d.status} onChange={v=>upd("status",v)} options={STATUSES} /></FormRow>
        <FormRow label="Zacetni datum"><input type="date" style={{width:"100%",...fi}} value={d.startDate} onChange={e=>upd("startDate",e.target.value)} /></FormRow>
        <FormRow label="Rok (izracunan iz faz)"><input type="date" style={{width:"100%",...fi,background:"#f9fafb",color:"#6b7280"}} value={d.dueDate} readOnly /></FormRow>
      </div>
      <FormRow label="% dokoncanja">
        <div style={{display:"flex",gap:6}}>
          {[0,25,50,75,100].map(v=><button key={v} onClick={()=>upd("pct",v)} style={{flex:1,padding:"8px 0",borderRadius:7,border:"1px solid",fontSize:13,cursor:"pointer",fontWeight:d.pct===v?700:400,background:d.pct===v?"#1a1a1a":"transparent",color:d.pct===v?"#fff":"#6b7280",borderColor:d.pct===v?"#1a1a1a":"#e5e7eb"}}>{v}%</button>)}
        </div>
      </FormRow>
      <PhasesSection phases={d.phases||[]} startDate={d.startDate} onChange={onPhasesChange} />
      <FormRow label="Komentarji"><MTextarea value={d.comments} onChange={v=>upd("comments",v)} placeholder="Dodaj komentar..." /></FormRow>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
        {d.id&&<button onClick={()=>deleteTask(d.id)} style={{...btnS,color:"#dc2626",borderColor:"#fca5a5",marginRight:"auto"}}>Izbriši</button>}
        <button onClick={()=>setModal(null)} style={btnS}>Preklic</button>
        <button onClick={saveTask} style={btnP}>Shrani</button>
      </div>
    </ModalBg>
  );
}

function ProjectModal({ modal, setModal, createProject, templates }) {
  const d=modal.data;function upd(k,v){setModal(p=>({...p,data:{...p.data,[k]:v}}));}
  const selTpl=templates.find(t=>t.id===Number(d.templateId));
  return(
    <ModalBg onClose={()=>setModal(null)}>
      <h2 style={{fontSize:16,fontWeight:600,marginBottom:18}}>Nov projekt</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FormRow label="Ime projekta"><MInput value={d.name} onChange={v=>upd("name",v)} placeholder="npr. Projekt Delta..." /></FormRow>
        <FormRow label="Okrajsava projekta"><MInput value={d.abbr||""} onChange={v=>upd("abbr",v)} placeholder="npr. PD, LIMS..." /></FormRow>
      </div>
      <FormRow label="Predloga (opcijsko)">
        <select style={{width:"100%",...fi}} value={d.templateId} onChange={e=>upd("templateId",e.target.value)}>
          <option value="">Brez predloge</option>
          {templates.map(t=><option key={t.id} value={t.id}>{t.name} ({t.tasks.length} nalog)</option>)}
        </select>
      </FormRow>
      {selTpl&&(
        <div style={{background:"#f9fafb",borderRadius:8,padding:12,marginBottom:12,border:"1px solid #e5e7eb"}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:8,color:"#6b7280"}}>Naloge iz predloge:</div>
          {selTpl.tasks.map((t,i)=>{const durs=t.phaseDurations||defaultPhaseDurs(t.duration);return(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,marginBottom:3,gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0,flex:1}}>{t.abbr&&<AbbrTag abbr={t.abbr} />}<span style={{color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cleanName(t)}</span></div>
                <div style={{display:"flex",gap:6,flexShrink:0}}><PrioTag p={t.priority} /><span style={{color:"#9ca3af"}}>{durs.reduce((a,b)=>a+b,0)}h</span></div>
              </div>
              <PhaseMiniBar durs={durs} height={5} />
            </div>
          );})}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <FormRow label="Zacetni datum"><input type="date" style={{width:"100%",...fi}} value={d.startDate} onChange={e=>upd("startDate",e.target.value)} /></FormRow>
        <FormRow label="Odgovorna oseba"><MSelect value={d.assignee} onChange={v=>upd("assignee",v)} options={EMPLOYEES} /></FormRow>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
        <button onClick={()=>setModal(null)} style={btnS}>Preklic</button>
        <button onClick={createProject} style={btnP}>Ustvari projekt</button>
      </div>
    </ModalBg>
  );
}

function TemplateModal({ modal, setModal, saveTemplate, deleteTemplate }) {
  const d=modal.data;
  function upd(k,v){setModal(p=>({...p,data:{...p.data,[k]:v}}));}
  function updTask(i,k,v){const t=[...d.tasks];t[i]={...t[i],[k]:v};upd("tasks",t);}
  function updPhaseDur(i,pi,v){const t=[...d.tasks];const durs=[...(t[i].phaseDurations||defaultPhaseDurs(t[i].duration||64))];durs[pi]=Math.max(1,Number(v));t[i]={...t[i],phaseDurations:durs,duration:durs.reduce((a,b)=>a+b,0)};upd("tasks",t);}
  function addTask(){upd("tasks",[...d.tasks,{name:"",abbr:"",priority:"Srednja",duration:64,phaseDurations:[16,16,16,16]}]);}
  function removeTask(i){upd("tasks",d.tasks.filter((_,idx)=>idx!==i));}
  return(
    <ModalBg onClose={()=>setModal(null)} wide>
      <h2 style={{fontSize:16,fontWeight:600,marginBottom:18}}>{d.id?"Uredi predlogo":"Nova predloga"}</h2>
      <FormRow label="Ime predloge"><MInput value={d.name} onChange={v=>upd("name",v)} placeholder="npr. Mobilna aplikacija..." /></FormRow>
      <div style={{display:"grid",gridTemplateColumns:"1fr 58px auto 42px 42px 42px 42px auto",gap:6,marginBottom:4,alignItems:"end"}}>
        <div style={{fontSize:10,fontWeight:600,color:"#9ca3af",textTransform:"uppercase"}}>Ime naloge</div>
        <div style={{fontSize:10,fontWeight:600,color:"#9ca3af",textTransform:"uppercase"}}>Okr.</div>
        <div style={{fontSize:10,fontWeight:600,color:"#9ca3af",textTransform:"uppercase"}}>Prio</div>
        {PHASES.map(name=><div key={name} style={{fontSize:9,fontWeight:700,color:phaseColor(name),textAlign:"center",textTransform:"uppercase"}}>{phaseAbbr(name)}<br/><span style={{fontWeight:400,color:"#9ca3af"}}>(h)</span></div>)}
        <div></div>
      </div>
      {d.tasks.map((t,i)=>{
        const durs=t.phaseDurations||defaultPhaseDurs(t.duration||64);
        return(
          <div key={i} style={{marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 58px auto 42px 42px 42px 42px auto",gap:6,alignItems:"center",marginBottom:4}}>
              <input style={{...fi,width:"100%"}} value={t.name} onChange={e=>updTask(i,"name",e.target.value)} placeholder={"Naloga "+(i+1)+"..."} />
              <input style={{...fi,width:"100%"}} value={t.abbr||""} onChange={e=>updTask(i,"abbr",e.target.value)} placeholder="Okr." />
              <select style={fi} value={t.priority} onChange={e=>updTask(i,"priority",e.target.value)}>{PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}</select>
              {durs.map((dur,pi)=><input key={pi} type="number" min={1} max={720} style={{...fi,width:"100%",padding:"6px 4px",textAlign:"center",borderColor:phaseColor(PHASES[pi])+"88"}} value={dur} onChange={e=>updPhaseDur(i,pi,e.target.value)} />)}
              <button onClick={()=>removeTask(i)} style={{...btnS,color:"#dc2626",borderColor:"#fca5a5",padding:"6px 8px"}}>×</button>
            </div>
            <div style={{paddingRight:36,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1}}><PhaseMiniBar durs={durs} height={5} /></div>
              <span style={{fontSize:10,color:"#9ca3af",flexShrink:0}}>{durs.reduce((a,b)=>a+b,0)}h</span>
            </div>
          </div>
        );
      })}
      <button onClick={addTask} style={{...btnS,marginTop:4,fontSize:12}}>+ Dodaj nalogo</button>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
        {d.id&&<button onClick={()=>deleteTemplate(d.id)} style={{...btnS,color:"#dc2626",borderColor:"#fca5a5",marginRight:"auto"}}>Izbriši predlogo</button>}
        <button onClick={()=>setModal(null)} style={btnS}>Preklic</button>
        <button onClick={saveTemplate} style={btnP}>Shrani predlogo</button>
      </div>
    </ModalBg>
  );
}
