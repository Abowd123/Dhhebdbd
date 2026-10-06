import {safeName,initNative} from "../ui/native.js";
let ok=0,bad=0;const t=(c,m)=>{c?ok++:(bad++,console.error("FAIL",m))};
t(safeName("a/b:c.dxf")==="a_b_c.dxf","slashes");
t(safeName("")==="export","empty");
t(safeName("مشروع 1.pdf")==="مشروع 1.pdf","arabic");
t(safeName("x".repeat(300)).length===120,"len");
t(initNative()===false,"no-op on web/node");
console.log(`native: ${ok}/${ok+bad}`); if(bad)process.exit(1);
