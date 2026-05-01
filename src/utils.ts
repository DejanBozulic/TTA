// @ts-nocheck
import * as XLSX from "xlsx";
import { HOURS_PER_DAY, MONTH_NAMES, PHASES, TODAY_MS } from "./constants";

export function phaseColor(type) {
  if (type==="Priprava")  return "#3b82f6";
  if (type==="Pregled")   return "#f59e0b";
  if (type==="Korekcija") return "#8b5cf6";
  if (type==="Odobritev") return "#10b981";
  return "#6b7280";
}
export function phaseStatusColor(ph) {
  const phEnd=new Date(ph.dueDate).getTime(), phStart=new Date(ph.startDate).getTime();
  if (ph.status!=="Zakljuceno" && ph.status!=="Na cakanju" && TODAY_MS>phEnd) return "#fdba74";
  if (ph.status==="Planirano"  && phStart<=TODAY_MS && TODAY_MS<=phEnd) return "#93c5fd";
  if (ph.status==="Zakljuceno") return "#86efac";
  if (ph.status==="V teku")     return "#93c5fd";
  if (ph.status==="Na cakanju") return "#94a3b8";
  return "#c4b5fd";
}
export function phasePatternStyle(type, color, opacity) {
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
export function phaseOpacity(ph) {
  if (ph.status==="Planirano") return 0.5;
  return 1;
}
export function phaseAbbr(type) {
  if (type==="Priprava")  return "Pr";
  if (type==="Pregled")   return "Pg";
  if (type==="Korekcija") return "Ko";
  if (type==="Odobritev") return "Od";
  return "?";
}
export function sColor(s) {
  if (s==="Planirano")  return "#c4b5fd";
  if (s==="Na cakanju") return "#94a3b8";
  if (s==="V teku")     return "#93c5fd";
  if (s==="Zakljuceno") return "#86efac";
  if (s==="Zamuda")     return "#fdba74";
  return "#888";
}
export function effectiveStatus(t) {
  if (t.status!=="Zakljuceno"&&t.status!=="Na cakanju"&&TODAY_MS>new Date(t.dueDate).getTime()) return "Zamuda";
  return t.status;
}
export function pColor(p) {
  if (p==="Nizka")    return "#16a34a";
  if (p==="Srednja")  return "#2563eb";
  if (p==="Visoka")   return "#d97706";
  if (p==="Kriticna") return "#dc2626";
  return "#888";
}
export function isOverdue(t) {
  if (t.status==="Zakljuceno") return false;
  return TODAY_MS > new Date(t.dueDate).getTime();
}
export function shiftDate(d, days) {
  const dt = new Date(d); dt.setDate(dt.getDate()+days);
  return dt.toISOString().split("T")[0];
}
export function fmtDate(s) {
  const d = new Date(s);
  return d.getDate()+". "+MONTH_NAMES[d.getMonth()].slice(0,3);
}
export function cleanName(t) {
  if (!t.abbr) return t.name;
  const p = t.abbr+" - ";
  return t.name.startsWith(p) ? t.name.slice(p.length) : t.name;
}
export function hoursToDays(hours) { return Math.max(1, Math.round(hours/HOURS_PER_DAY)); }
export function recomputePhaseDates(taskStart, phases) {
  let off = 0;
  return phases.map(ph => {
    const cd = hoursToDays(ph.duration||HOURS_PER_DAY);
    const phS = shiftDate(taskStart, off), phE = shiftDate(taskStart, off+cd-1);
    off += cd;
    return { ...ph, startDate:phS, dueDate:phE };
  });
}
export function mkPhases(sd, ed, statuses=[]) {
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
export function mkPhasesFromDurs(sd, durs, statuses=[]) {
  let off=0,uid=1;
  return PHASES.map((type,i) => {
    const h=Math.max(1,durs[i]||HOURS_PER_DAY),cd=hoursToDays(h);
    const phS=shiftDate(sd,off),phE=shiftDate(sd,off+cd-1);
    off+=cd;
    return {id:uid++,type,status:statuses[i]||"Planirano",duration:h,startDate:phS,dueDate:phE};
  });
}
export function defaultPhaseStatuses(status, pct) {
  if (status==="Zakljuceno") return ["Zakljuceno","Zakljuceno","Zakljuceno","Zakljuceno"];
  if (status==="Planirano")  return ["Planirano","Planirano","Planirano","Planirano"];
  if (status==="Na cakanju") return ["Na cakanju","Planirano","Planirano","Planirano"];
  if (pct>=75) return ["Zakljuceno","Zakljuceno","V teku","Planirano"];
  if (pct>=50) return ["Zakljuceno","V teku","Planirano","Planirano"];
  return ["V teku","Planirano","Planirano","Planirano"];
}
export function defaultPhaseDurs(totalHours) {
  const t=Math.max(4,totalHours),q=Math.floor(t/4),r=t%4;
  return [q+(r>0?1:0),q+(r>1?1:0),q+(r>2?1:0),q];
}
export function getPhaseOnDay(t,yr,mo,d) {
  const dt=new Date(yr,mo,d).getTime();
  return (t.phases||[]).find(ph => dt>=new Date(ph.startDate).getTime()&&dt<=new Date(ph.dueDate).getTime());
}
export function easterDate(y) {
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),dy=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,dy);
}
export function getHolidays(y) {
  const e=easterDate(y),pad=n=>String(n).padStart(2,"0"),key=d=>pad(d.getMonth()+1)+"-"+pad(d.getDate()),addD=(dt,n)=>{const r=new Date(dt);r.setDate(r.getDate()+n);return r;};
  const h={"01-01":"Novo leto","01-02":"Novo leto","02-08":"Presernov dan","04-27":"Dan upora","05-01":"Praznik dela","05-02":"Praznik dela","06-25":"Dan drzavnosti","08-15":"Vnebovzetje","10-31":"Dan reformacije","11-01":"Dan spomina","12-25":"Bozic","12-26":"Dan samostojnosti"};
  h[key(addD(e,1))]="Velikonocni ponedeljek"; h[key(addD(e,49))]="Binkosti";
  return h;
}
export function exportCSV(tasks) {
  const hdr=["ID","Ime","Okrajsava","Projekt","Dodeljena","Prioriteta","Zacetek","Rok","Status","%"];
  const rows=tasks.map(t=>[t.id,t.name,t.abbr||"",t.project,t.assignee,t.priority,t.startDate,t.dueDate,t.status,t.pct]);
  const csv=[hdr,...rows].map(r=>r.map(c=>'"'+(c||"").toString().replace(/"/g,'""')+'"').join(",")).join("\n");
  const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="ctrlng3.csv";a.click();
}

export function loadPptxLib() {
  if (window.PptxGenJS) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/PptxGenJS/3.12.0/pptxgen.bundled.js";
    s.onload = () => res();
    s.onerror = () => rej(new Error("PptxGenJS load failed"));
    document.head.appendChild(s);
  });
}

export function buildPPT(filtered, projects, viewYr, viewMo) {
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

export function buildXLSX(filtered, projects) {
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
