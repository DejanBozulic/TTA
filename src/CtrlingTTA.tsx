// @ts-nocheck
import { useRef, useState } from "react";
import { EMPLOYEES, PHASES, PROJECT_PALETTE, PROJECT_TEXT_PAL } from "./constants";
import { INIT_PROJECTS, INIT_TASKS, INIT_TEMPLATES } from "./data/mockData";
import { TemplateModal, ProjectModal, TaskModal } from "./components/modals";
import { DashView, EmployeeView, GanttView, ListView, MonthlyView } from "./views/taskViews";
import { defaultPhaseDurs, hoursToDays, isOverdue, mkPhases, mkPhasesFromDurs, phasePatternStyle, shiftDate } from "./utils";

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
