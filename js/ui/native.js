/* ═══ ميزات أندرويد الأصلية ═══ المرحلة 4 (تحويل CivilDraft لتطبيق أندرويد)
   تعمل داخل غلاف Capacitor فقط؛ على الويب لا تفعل شيئاً.
   ١) التنزيلات (<a download> بروابط blob:/data: — DXF وPDF والنسخ والتقارير وCSV)
      لا تعمل في WebView، فتُكتَب في ذاكرة التطبيق المؤقتة ثم تُفتح نافذةُ
      المشاركة (واتساب، Drive، البريد…).
   ٢) زرُّ الرجوع: يرسل Escape (يُغلق اللوحة/الأداة المفتوحة)، وضغطتان
      متتاليتان خلال ثانيتين تخرجان من التطبيق.
   ٣) شريطُ الحالة بلون التطبيق، وطلبُ تخزينٍ دائم كي لا تُمسح المشاريع.
   ٤) window.print غير مدعوم في WebView: رسالةٌ واضحة بدل الصمت. */

function cap(){
 try{
  const C=typeof window!=="undefined"&&window.Capacitor;
  if(C&&typeof C.isNativePlatform==="function"&&C.isNativePlatform())return C;
 }catch(e){}
 return null;
}
function plug(C,name){return (C&&C.Plugins&&C.Plugins[name])||null}

/* اسمُ ملفٍّ آمن لنظام الملفات — دالّةٌ خالصة تُختبَر بلا DOM */
export function safeName(n){
 const s=String(n||"export").replace(/[\\/:*?"<>|\u0000-\u001f]+/g,"_").trim();
 return (s||"export").slice(0,120);
}
function blobToB64(b){
 return new Promise((ok,no)=>{
  const r=new FileReader();
  r.onload=()=>{const s=String(r.result||""); ok(s.slice(s.indexOf(",")+1))};
  r.onerror=()=>no(r.error);
  r.readAsDataURL(b);
 });
}
function toast(msg){
 try{
  let t=document.getElementById("cd-ntoast");
  if(!t){
   t=document.createElement("div"); t.id="cd-ntoast"; t.setAttribute("role","status");
   document.body.appendChild(t);   /* التنسيق في touch.css §11 */
  }
  t.textContent=msg; t.hidden=false;
  clearTimeout(t._h); t._h=setTimeout(()=>{t.hidden=true},2200);
 }catch(e){}
}

export async function shareFile(name,blob){
 const C=cap(), FS=plug(C,"Filesystem"), SH=plug(C,"Share");
 if(!FS)throw new Error("Filesystem plugin missing");
 const path=safeName(name);
 const data=await blobToB64(blob);
 const w=await FS.writeFile({path,data,directory:"CACHE",recursive:true});
 if(SH){
  try{await SH.share({title:path,files:[w.uri],dialogTitle:"حفظ / مشاركة "+path})}
  catch(e){ /* إلغاءُ المستخدم للمشاركة ليس خطأً */ }
 }else toast("حُفظ الملف: "+path);
 return w.uri;
}

/* نحفظ كلَّ Blob يُنشأ له رابط، فنقرأه مباشرةً عند «التنزيل» بلا طلبٍ شبكي */
const BLOBS=new Map();
function hookDownloads(){
 const mk=URL.createObjectURL.bind(URL), rv=URL.revokeObjectURL.bind(URL);
 URL.createObjectURL=function(o){const u=mk(o); if(o instanceof Blob)BLOBS.set(u,o); return u};
 URL.revokeObjectURL=function(u){setTimeout(()=>BLOBS.delete(u),15000); return rv(u)};
 const orig=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){
  const href=this.href||"", name=this.getAttribute("download");
  const b=name!=null&&BLOBS.get(href);
  if(b){
   shareFile(name||"export",b).catch(()=>toast("تعذّر حفظ الملف"));
   return;
  }
  return orig.call(this);
 };
}

function hookBack(C){
 const App=plug(C,"App"); if(!App||!App.addListener)return;
 let last=0;
 App.addListener("backButton",()=>{
  const now=Date.now();
  if(now-last<2000){try{App.exitApp()}catch(e){} return}
  last=now;
  const tgt=document.activeElement||document.body;
  try{
   tgt.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape",bubbles:true,cancelable:true}));
  }catch(e){}
  toast("اضغط رجوع مرّةً أخرى للخروج");
 });
}

export function initNative(){
 const C=cap(); if(!C)return false;
 try{hookDownloads()}catch(e){}
 try{hookBack(C)}catch(e){}
 try{
  const SB=plug(C,"StatusBar");
  if(SB){SB.setBackgroundColor&&SB.setBackgroundColor({color:"#0f172a"}).catch(()=>{});
   SB.setStyle&&SB.setStyle({style:"DARK"}).catch(()=>{})}
 }catch(e){}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
 try{
  window.print=function(){toast("الطباعة غير متاحة في التطبيق — صدّر PDF ثم شاركه")};
 }catch(e){}
 return true;
}
