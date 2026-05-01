// @ts-nocheck
import { defaultPhaseStatuses, mkPhases } from "../utils";

export const INIT_TEMPLATES = [
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
export const INIT_PROJECTS = [
  {id:1,name:"LIMS validacija (IT GxP)",abbr:"LIMS",color:"#e0edff",textColor:"#1d4ed8"},
  {id:2,name:"MES sistem (GAMP 4)",abbr:"MES",color:"#e6f9f0",textColor:"#15803d"},
  {id:3,name:"Cistilna soba ISO 7",abbr:"CS-ISO7",color:"#fef3e2",textColor:"#b45309"},
  {id:4,name:"Parni sterilizator (GAMP 5)",abbr:"PS-G5",color:"#f3e8ff",textColor:"#7c3aed"},
];

export function makeTask(id,name,abbr,project,assignee,priority,startDate,dueDate,status,pct) {
  return {id,name,abbr,project,assignee,priority,startDate,dueDate,status,pct,desc:"",comments:"",
    phases:mkPhases(startDate,dueDate,defaultPhaseStatuses(status,pct))};
}
export const INIT_TASKS = [
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
