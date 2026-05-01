// @ts-nocheck
import { useEffect, useState } from "react";
import { DAY_LABELS, EMPLOYEES, HOURS_PER_DAY, MONTH_NAMES, PHASES, PRIORITIES, STATUSES, TODAY_MS } from "../constants";
import { AbbrTag, btnP, btnS, card, Empty, fi, PhaseMiniBar, PctBar, PrioTag, ProjTag, SLabel, StatTag } from "../components/common";
import { buildPPT, buildXLSX, cleanName, defaultPhaseDurs, effectiveStatus, exportCSV, fmtDate, getHolidays, getPhaseOnDay, hoursToDays, isOverdue, loadPptxLib, pColor, phaseAbbr, phaseColor, phaseOpacity, phasePatternStyle, phaseStatusColor, sColor, shiftDate } from "../utils";

export function MonthlyView({ tasks, projects, openEditTask, yr, setYr, mo, setMo }) {
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

export function ListView({ tasks, projects, openNewTask, openEditTask }) {
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
export function TList({ tasks, projects, openEditTask }) {
  return <div style={{borderTop:"1px solid #e5e7eb"}}>{tasks.map(t=><TRow key={t.id} t={t} projects={projects} onClick={()=>openEditTask(t)} />)}</div>;
}
export function TRow({ t, projects, onClick }) {
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

export function EmployeeView({ tasks, projects, openNewTask, openEditTask }) {
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

export function GanttView({ tasks, setTasks, projects, templates, openNewTask, openEditTask, openNewProject, openNewTemplate, openEditTemplate, viewYr, viewMo }) {
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

export function DashView({ tasks, projects }) {
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
