/* ═══ واجهة الهاتف ═══ المرحلة 2 (تحويل CivilDraft لتطبيق أندرويد)
   ١) فئةُ is-phone على <html>: عرضٌ ≤768px، أو داخل غلاف Capacitor وأقصرُ
      بُعدَي الشاشة ≤600px (الهاتفُ الأفقيّ). القواعدُ في touch.css §10.
   ٢) السجلّ على الهاتف سطرٌ واحد؛ لمسةٌ تفتحه وأخرى تطويه.
   ٣) أوّلُ تشغيلٍ على الهاتف يُفعّل «وضع المبتدئ» مرّةً واحدة —
      والمستخدمُ يُطفئه متى شاء ولا نعيد فرضه. */
import {UIS} from "./store.js";

const KEY="cd.phoneInit";

function nativeShell(){
 try{
  const C=typeof window!=="undefined"&&window.Capacitor;
  return !!(C&&typeof C.isNativePlatform==="function"&&C.isNativePlatform());
 }catch(e){return false}
}
/* دالّةٌ خالصة — تُختبَر بلا DOM */
export function phoneMatch(w,h,nat){
 return w<=768||(!!nat&&Math.min(w,h)<=600);
}

export function initPhone(opts={}){
 if(typeof window==="undefined"||typeof document==="undefined")return false;
 const root=document.documentElement;
 const nat=nativeShell();
 const upd=()=>{
  const on=phoneMatch(window.innerWidth,window.innerHeight,nat);
  root.classList.toggle("is-phone",on);
  return on;
 };
 const on=upd();
 window.addEventListener("resize",upd,{passive:true});
 window.addEventListener("orientationchange",upd);

 const log=document.getElementById("log");
 if(log)log.addEventListener("click",e=>{
  if(!root.classList.contains("is-phone"))return;
  if(e.target&&e.target.closest&&e.target.closest("button,a"))return;
  log.classList.toggle("cd-open");
  log.scrollTop=log.scrollHeight;
 });

 if(on&&!opts.safe&&!UIS.beginner&&typeof opts.setBeginner==="function"){
  let done=false;
  try{done=window.localStorage.getItem(KEY)==="1"}catch(e){}
  if(!done){
   try{window.localStorage.setItem(KEY,"1")}catch(e){}
   setTimeout(()=>{try{opts.setBeginner(1)}catch(e){}},0);
  }
 }
 return on;
}
