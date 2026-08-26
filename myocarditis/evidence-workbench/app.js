import React, {useEffect, useMemo, useRef, useState} from 'https://esm.sh/react@18.3.1';
import {createRoot} from 'https://esm.sh/react-dom@18.3.1/client';
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const h = React.createElement;
const DB_NAME = 'myocarditis-evidence-workbench';
const DB_VERSION = 1;
const STORES = ['pdfs','annotations','notes','sourceOverrides'];

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{for(const s of STORES){if(!req.result.objectStoreNames.contains(s))req.result.createObjectStore(s)}};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function dbGet(store,key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbSet(store,key,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function dbDelete(store,key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function dbAll(store){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const keysReq=tx.objectStore(store).getAllKeys();const valsReq=tx.objectStore(store).getAll();tx.oncomplete=()=>resolve(keysReq.result.map((k,i)=>[k,valsReq.result[i]]));tx.onerror=()=>reject(tx.error)})}

function normalizeRole(id,s){
  if(id==='AHA_MYOCARDITIS_2021') return 'pediatric_anchor';
  const p=(s.population||'').toLowerCase(), role=(s.role||'').toLowerCase();
  if(id==='AHA_FULMINANT_2020'||id==='FERREIRA_LLC_2018'||p==='adult'||p.includes('predominantly adult')) return 'adult_overlay';
  if(role.includes('alcapa')||role.includes('mimic')||role.includes('differential')) return 'mimic_differential';
  if(p.includes('adult and pediatric')||p.includes('adult and pediatric-relevant')||p.includes('athletes including adolescents')) return 'mixed_population';
  if(s.primary_or_overlay==='overlay') return 'adult_overlay';
  if(p.includes('pediatric')) return 'pediatric_primary';
  return 'supportive';
}
const ROLE_LABELS={pediatric_anchor:'Pediatric anchor',pediatric_primary:'Pediatric evidence',mixed_population:'Mixed population',adult_overlay:'Adult overlay',mimic_differential:'Mimic / differential',supportive:'Supportive'};
const PURPOSES=['important','key','board','caution'];

function safeMarkdown(md=''){
  const esc=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc.split('\n').map(line=>{
    if(line.startsWith('### '))return `<h3>${line.slice(4)}</h3>`;
    if(line.startsWith('## '))return `<h2>${line.slice(3)}</h2>`;
    if(line.startsWith('# '))return `<h1>${line.slice(2)}</h1>`;
    if(line.startsWith('- '))return `<div>• ${line.slice(2)}</div>`;
    return line?`<div>${line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code>$1</code>')}</div>`:'<br>';
  }).join('');
}

function SourceList({sources,selected,onSelect,filter,setFilter,query,setQuery,overrides}){
  const rows=useMemo(()=>Object.entries(sources).map(([id,s])=>({id,...s,normalizedRole:overrides[id]?.role||normalizeRole(id,s)})).filter(s=>{
    const q=query.toLowerCase();
    const match=!q||`${s.title} ${s.authors||''} ${s.journal||''} ${s.role||''}`.toLowerCase().includes(q);
    return match&&(filter==='all'||s.normalizedRole===filter);
  }),[sources,filter,query,overrides]);
  return h('section',{className:'panel source-panel'},
    h('div',{className:'source-header'},h('strong',null,`Sources · ${Object.keys(sources).length}`),h('div',{className:'subtle'},'Registry + local PDFs')),
    h('div',{className:'toolbar'},
      h('input',{className:'search','aria-label':'Search sources',placeholder:'Search sources…',value:query,onChange:e=>setQuery(e.target.value)}),
      h('div',{className:'filters'},['all','pediatric_anchor','pediatric_primary','mixed_population','adult_overlay','mimic_differential'].map(r=>h('button',{key:r,className:`chip ${filter===r?'active':''}`,onClick:()=>setFilter(r)},r==='all'?'All':ROLE_LABELS[r])))
    ),
    h('div',{className:'source-list'},rows.map(s=>h('div',{key:s.id,className:`source-item ${selected===s.id?'active':''}`,onClick:()=>onSelect(s.id)},
      h('div',{className:'source-title'},s.title),
      h('div',{className:'source-meta'},h('span',{className:`badge ${s.normalizedRole.includes('overlay')?'overlay':s.normalizedRole==='mixed_population'?'mixed':'primary'}`},ROLE_LABELS[s.normalizedRole]||s.normalizedRole),`${s.year||''} · ${s.journal||s.organization||''}`)
    )))
  );
}

function App(){
  const [sources,setSources]=useState({});
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState('all'); const [query,setQuery]=useState('');
  const [pdfBlob,setPdfBlob]=useState(null); const [pdfDoc,setPdfDoc]=useState(null); const [pageNo,setPageNo]=useState(1); const [scale,setScale]=useState(1.2);
  const [annotations,setAnnotations]=useState([]); const [selectedAnn,setSelectedAnn]=useState(null); const [drawMode,setDrawMode]=useState(false); const [draftRect,setDraftRect]=useState(null);
  const [notes,setNotes]=useState(''); const [tab,setTab]=useState('notes'); const [overrides,setOverrides]=useState({}); const [status,setStatus]=useState('Ready');
  const canvasRef=useRef(null); const overlayRef=useRef(null); const fileRef=useRef(null); const dragRef=useRef(null);

  useEffect(()=>{fetch('../question-bank/sources.json').then(r=>{if(!r.ok)throw new Error('sources.json unavailable');return r.json()}).then(data=>{setSources(data);setSelected(Object.keys(data)[0]||null)}).catch(e=>setStatus(e.message)); dbAll('sourceOverrides').then(rows=>setOverrides(Object.fromEntries(rows)))},[]);
  useEffect(()=>{if(!selected)return;(async()=>{setStatus('Loading local workspace…');setPdfBlob(await dbGet('pdfs',selected)||null);setAnnotations(await dbGet('annotations',selected)||[]);setNotes(await dbGet('notes',selected)||'');setSelectedAnn(null);setPageNo(1);setStatus('Ready')})()},[selected]);
  useEffect(()=>{if(!pdfBlob){setPdfDoc(null);return}let cancelled=false;(async()=>{try{setStatus('Opening PDF…');const data=await pdfBlob.arrayBuffer();const doc=await pdfjsLib.getDocument({data}).promise;if(!cancelled){setPdfDoc(doc);setPageNo(1);setStatus(`${doc.numPages} pages`)}}catch(e){setStatus(`PDF error: ${e.message}`)}})();return()=>{cancelled=true}},[pdfBlob]);
  useEffect(()=>{if(!pdfDoc||!canvasRef.current)return;let cancelled=false;(async()=>{const page=await pdfDoc.getPage(pageNo);const viewport=page.getViewport({scale});const canvas=canvasRef.current,ctx=canvas.getContext('2d');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;await page.render({canvasContext:ctx,viewport}).promise;if(!cancelled)setStatus(`Page ${pageNo} / ${pdfDoc.numPages}`)})();return()=>{cancelled=true}},[pdfDoc,pageNo,scale]);

  async function attachPdf(file){if(!selected||!file)return;if(file.type!=='application/pdf'){setStatus('Choose a PDF file');return}await dbSet('pdfs',selected,file);setPdfBlob(file);setStatus('PDF saved locally')}
  async function removePdf(){if(!selected)return;await dbDelete('pdfs',selected);setPdfBlob(null);setPdfDoc(null);setStatus('Local PDF removed')}
  async function saveAnnotations(next){setAnnotations(next);await dbSet('annotations',selected,next)}
  async function saveNotes(value){setNotes(value);await dbSet('notes',selected,value)}
  async function saveOverride(role){const next={...overrides,[selected]:{...(overrides[selected]||{}),role}};setOverrides(next);await dbSet('sourceOverrides',selected,next[selected])}

  function pointerDown(e){if(!drawMode||!overlayRef.current)return;const r=overlayRef.current.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;dragRef.current={x,y};setDraftRect({x,y,w:0,h:0})}
  function pointerMove(e){if(!dragRef.current||!overlayRef.current)return;const r=overlayRef.current.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;const a=dragRef.current;setDraftRect({x:Math.min(a.x,x),y:Math.min(a.y,y),w:Math.abs(x-a.x),h:Math.abs(y-a.y)})}
  async function pointerUp(){if(!dragRef.current||!draftRect)return;dragRef.current=null;if(draftRect.w<.01||draftRect.h<.01){setDraftRect(null);return}const ann={id:crypto.randomUUID(),page:pageNo,rect:draftRect,purpose:'important',comment:'',createdAt:new Date().toISOString()};const next=[...annotations,ann];await saveAnnotations(next);setSelectedAnn(ann.id);setTab('annotations');setDraftRect(null);setDrawMode(false)}
  async function patchAnn(patch){const next=annotations.map(a=>a.id===selectedAnn?{...a,...patch,updatedAt:new Date().toISOString()}:a);await saveAnnotations(next)}
  async function deleteAnn(){const next=annotations.filter(a=>a.id!==selectedAnn);await saveAnnotations(next);setSelectedAnn(null)}
  function jumpAnn(a){setPageNo(a.page);setSelectedAnn(a.id);setTab('annotations')}
  async function exportWorkspace(){const ann=await dbAll('annotations'),noteRows=await dbAll('notes'),roleRows=await dbAll('sourceOverrides');const payload={schemaVersion:1,project:'pediatric-myocarditis',exportedAt:new Date().toISOString(),annotations:Object.fromEntries(ann),notes:Object.fromEntries(noteRows),sourceOverrides:Object.fromEntries(roleRows)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`myocarditis-evidence-workbench-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}

  useEffect(()=>{const key=e=>{if(e.target.matches('input,textarea,select'))return;if(e.key.toLowerCase()==='h'){e.preventDefault();setDrawMode(v=>!v)}if(e.key.toLowerCase()==='n'){e.preventDefault();setTab('notes')}if(e.key==='['&&pdfDoc)setPageNo(n=>Math.max(1,n-1));if(e.key===']'&&pdfDoc)setPageNo(n=>Math.min(pdfDoc.numPages,n+1));if(e.key==='Escape'){setDrawMode(false);setDraftRect(null);dragRef.current=null}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[pdfDoc]);

  const source=sources[selected]||{}; const sourceRole=overrides[selected]?.role||normalizeRole(selected,source); const currentAnnotations=annotations.filter(a=>a.page===pageNo); const activeAnn=annotations.find(a=>a.id===selectedAnn);

  return h('main',{className:'app'},
    h('header',{className:'topbar'},h('div',null,h('span',{className:'brand'},'Evidence Workbench'),h('span',{className:'subtle'},' · Pediatric Myocarditis')),h('div',{className:'status'},status,'  ',h('button',{className:'btn',onClick:exportWorkspace},'Export JSON'))),
    h('div',{className:'workspace'},
      h(SourceList,{sources,selected,onSelect:setSelected,filter,setFilter,query,setQuery,overrides}),
      h('section',{className:'panel pdf-panel'},
        h('div',{className:'pdf-toolbar'},
          h('button',{className:'btn primary',onClick:()=>fileRef.current?.click()},pdfBlob?'Replace PDF':'Attach PDF'),h('input',{ref:fileRef,type:'file','aria-label':'Attach PDF',accept:'application/pdf',hidden:true,onChange:e=>attachPdf(e.target.files?.[0])}),
          pdfBlob&&h('button',{className:'btn danger',onClick:removePdf},'Remove'),
          h('span',{className:'grow'}),
          pdfDoc&&h(React.Fragment,null,h('button',{className:'btn',onClick:()=>setPageNo(n=>Math.max(1,n-1))},'‹'),h('span',{className:'status'},`${pageNo}/${pdfDoc.numPages}`),h('button',{className:'btn',onClick:()=>setPageNo(n=>Math.min(pdfDoc.numPages,n+1))},'›'),h('button',{className:'btn',onClick:()=>setScale(s=>Math.max(.6,s-.15))},'−'),h('span',{className:'status'},`${Math.round(scale*100)}%`),h('button',{className:'btn',onClick:()=>setScale(s=>Math.min(2.4,s+.15))},'+'),h('button',{className:`btn ${drawMode?'primary':''}`,onClick:()=>setDrawMode(v=>!v)},drawMode?'Draw highlight…':'Highlight',' ',h('span',{className:'kbd'},'H')))
        ),
        h('div',{className:'pdf-wrap'},pdfDoc?h('div',{className:'page-shell'},h('canvas',{ref:canvasRef}),h('div',{ref:overlayRef,className:'annotation-layer',style:{cursor:drawMode?'crosshair':'default'},onPointerDown:pointerDown,onPointerMove:pointerMove,onPointerUp:pointerUp,onPointerLeave:()=>{if(dragRef.current)pointerUp()}},
          currentAnnotations.map(a=>h('div',{key:a.id,className:`annotation ${a.purpose==='key'?'key':a.purpose==='caution'?'caution':a.purpose==='board'?'board':''} ${selectedAnn===a.id?'selected':''}`,style:{left:`${a.rect.x*100}%`,top:`${a.rect.y*100}%`,width:`${a.rect.w*100}%`,height:`${a.rect.h*100}%`},title:a.comment||a.purpose,onClick:e=>{e.stopPropagation();setSelectedAnn(a.id);setTab('annotations')}})),
          draftRect&&h('div',{className:'draw-rect',style:{left:`${draftRect.x*100}%`,top:`${draftRect.y*100}%`,width:`${draftRect.w*100}%`,height:`${draftRect.h*100}%`}})
        )):h('div',{className:'pdf-empty'},h('h2',null,'Attach the PDF you legally have access to'),h('p',null,'The file remains in this browser. It is not committed to GitHub or uploaded by this tool.'),h('button',{className:'btn primary',onClick:()=>fileRef.current?.click()},'Choose PDF')))
      ),
      h('aside',{className:'panel right-panel'},
        h('div',{className:'editor-header'},h('div',{className:'source-title'},source.title||'Select a source'),h('div',{className:'source-meta'},`${source.authors||''} ${source.year?`· ${source.year}`:''}`)),
        h('nav',{className:'tabs'},['notes','annotations','source'].map(t=>h('div',{key:t,className:`tab ${tab===t?'active':''}`,onClick:()=>setTab(t)},t[0].toUpperCase()+t.slice(1)))),
        h('div',{className:'inspector'},
          tab==='notes'&&h(React.Fragment,null,h('div',{className:'field'},h('label',{className:'label'},'Markdown notes'),h('textarea',{className:'textarea','aria-label':'Markdown notes',value:notes,placeholder:'# Notes\n\n- Key point…',onChange:e=>saveNotes(e.target.value)})),h('div',{className:'field'},h('label',{className:'label'},'Preview'),h('div',{className:'note-preview',dangerouslySetInnerHTML:{__html:safeMarkdown(notes)}}))),
          tab==='annotations'&&h(React.Fragment,null,activeAnn&&h('div',{className:'field'},h('label',{className:'label'},'Selected annotation'),h('select',{className:'select',value:activeAnn.purpose,onChange:e=>patchAnn({purpose:e.target.value})},PURPOSES.map(p=>h('option',{key:p,value:p},p))),h('textarea',{className:'textarea','aria-label':'Annotation comment',style:{minHeight:'100px',marginTop:'8px'},placeholder:'Comment / evidence note…',value:activeAnn.comment||'',onChange:e=>patchAnn({comment:e.target.value})}),h('button',{className:'btn danger',style:{marginTop:'8px'},onClick:deleteAnn},'Delete annotation')),h('label',{className:'label'},`Annotations · ${annotations.length}`),h('div',{className:'annotation-list'},annotations.length?annotations.map(a=>h('div',{key:a.id,className:`annotation-card ${selectedAnn===a.id?'active':''}`,onClick:()=>jumpAnn(a)},h('div',{className:'quote'},a.comment||`${a.purpose} highlight`),h('div',{className:'meta'},`Page ${a.page} · ${a.purpose}`))):h('div',{className:'subtle'},'Press H and drag on the PDF to create a highlight.'))),
          tab==='source'&&h(React.Fragment,null,h('div',{className:'field'},h('label',{className:'label'},'Evidence role'),h('select',{className:'select',value:sourceRole,onChange:e=>saveOverride(e.target.value)},Object.entries(ROLE_LABELS).map(([k,v])=>h('option',{key:k,value:k},v)))),h('div',{className:'subtle',style:{marginTop:'6px'}},'This controlled field overrides intermediate registry metadata without modifying the source citation.'),['population','source_type','journal','doi','pmid','role'].map(k=>source[k]?h('div',{className:'field',key:k},h('label',{className:'label'},k.replaceAll('_',' ')),h('div',{className:'note-preview',style:{minHeight:'auto'}},String(source[k]))):null))
        )
      )
    )
  );
}

createRoot(document.getElementById('root')).render(h(App));
