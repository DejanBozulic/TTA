// @ts-nocheck
import { EMPLOYEES, PHASES, PRIORITIES, STATUSES } from "../constants";
import { AbbrTag, btnP, btnS, fi, FormRow, MInput, ModalBg, MSelect, MTextarea, PhaseMiniBar, PhasesSection, PrioTag } from "./common";
import { cleanName, defaultPhaseDurs, phaseAbbr, phaseColor, recomputePhaseDates } from "../utils";

export function TaskModal({ modal, setModal, saveTask, deleteTask, projects }) {
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

export function ProjectModal({ modal, setModal, createProject, templates }) {
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

export function TemplateModal({ modal, setModal, saveTemplate, deleteTemplate }) {
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
