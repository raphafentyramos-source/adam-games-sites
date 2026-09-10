import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyC4Zp45lescRGFKXjgRBz0mAg1pcae72qc",authDomain:"adam-games-21081.firebaseapp.com",projectId:"adam-games-21081",storageBucket:"adam-games-21081.firebasestorage.app",messagingSenderId:"1055528418738",appId:"1:1055528418738:web:5fafdf63424ba9744eb8ab",measurementId:"G-KVFSF864GE"};
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
const ADMIN_EMAIL="raphafentyramos@gmail.com";
const $=id=>document.getElementById(id);

const defaults=[
  {percentual:20,minimo:20,peso:15},
  {percentual:30,minimo:20,peso:15},
  {percentual:40,minimo:30,peso:20},
  {percentual:45,minimo:30,peso:25},
  {percentual:50,minimo:30,peso:20},
  {percentual:55,minimo:40,peso:5}
];

let adminOk=false, lastLink="";

function msg(text,type=""){const el=$("dvMessage");el.textContent=text;el.className=type?`message ${type}`:"message";}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
function token(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";let out="";const a=new Uint32Array(14);crypto.getRandomValues(a);for(const n of a)out+=chars[n%chars.length];return out;}
function money(n){return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function date(v){if(!v)return "—";const d=v?.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("pt-BR");}

function renderPrizes(items=defaults){
  const box=$("dvPrizes");
  box.innerHTML="";
  items.forEach((p,i)=>addPrizeRow(p,i));
}
function addPrizeRow(p={percentual:10,minimo:20,peso:10},i=null){
  const box=$("dvPrizes"), idx=i===null?box.children.length:i;
  const row=document.createElement("div");row.className="dv-prize";
  row.innerHTML=`<input type="number" min="1" max="100" step="1" value="${esc(p.percentual)}" data-p="percentual" title="Desconto"><input type="number" min="0" step="0.01" value="${esc(p.minimo)}" data-p="minimo" title="Compra mínima"><input type="number" min="0.01" step="0.01" value="${esc(p.peso)}" data-p="peso" title="Peso"><button class="dv-remove" type="button" title="Remover">✕</button>`;
  row.querySelector(".dv-remove").onclick=()=>{if(box.children.length<=1){msg("Mantenha pelo menos 1 prêmio.","error");return}row.remove();};
  box.appendChild(row);
}
function collectPrizes(){
  return [...$("dvPrizes").children].map((row,i)=>({
    id:`p${i+1}`,
    percentual:Number(row.querySelector('[data-p="percentual"]').value),
    minimo:Number(row.querySelector('[data-p="minimo"]').value),
    peso:Number(row.querySelector('[data-p="peso"]').value)
  })).filter(p=>Number.isFinite(p.percentual)&&p.percentual>0&&p.percentual<=100&&Number.isFinite(p.minimo)&&p.minimo>=0&&Number.isFinite(p.peso)&&p.peso>0);
}

async function generate(){
  if(!adminOk){msg("❌ Administrador não autenticado.","error");return;}
  const prizes=collectPrizes();
  if(!prizes.length){msg("❌ Cadastre pelo menos 1 prêmio com peso maior que zero.","error");return;}
  const choices=Number($("dvEscolhas").value||1);
  const publico=$("dvPublico").value;
  const nome=$("dvNome").value.trim()||"Campanha de Voucher";
  const id=token();
  const data={id,nome,publico,escolhasTotal:choices,escolhasUsadas:0,premios:prizes,criadoEm:Timestamp.now(),atualizadoEm:Timestamp.now(),criadoPor:adminOk?auth.currentUser?.email||ADMIN_EMAIL:""};
  const btn=$("dvGenerate");btn.disabled=true;btn.textContent="⏳ GERANDO...";
  try{
    await setDoc(doc(db,"vouchersDesconto",id),data);
    lastLink=new URL(`voucher.html?id=${encodeURIComponent(id)}`,window.location.href).href;
    $("dvLinkUrl").textContent=lastLink;$("dvLinkBox").style.display="block";
    msg("✅ Link único criado com sucesso.","success");
    await loadList();
  }catch(e){console.error(e);msg("❌ Não foi possível criar o voucher. "+(e.message||""),"error");}
  finally{btn.disabled=false;btn.textContent="🔗 GERAR LINK ÚNICO";}
}

async function loadList(){
  const box=$("dvList");box.innerHTML="<div class='dv-empty'>⏳ Carregando...</div>";
  try{
    const snap=await getDocs(collection(db,"vouchersDesconto"));
    const arr=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>((b.criadoEm?.toMillis?.()||0)-(a.criadoEm?.toMillis?.()||0)));
    if(!arr.length){box.innerHTML="<div class='dv-empty'>Nenhum voucher de desconto criado.</div>";return;}
    box.innerHTML=arr.map(v=>{
      const publico=v.publico==="vip"?"👑 VIP":v.publico==="nao_vip"?"⭐ NÃO VIP":"🌎 TODOS";
      const usados=Number(v.escolhasUsadas||0),total=Number(v.escolhasTotal||0);
      const link=new URL(`voucher.html?id=${encodeURIComponent(v.id)}`,window.location.href).href;
      const weights=(v.premios||[]).map(p=>`${p.percentual}%/${money(p.minimo)} • peso ${p.peso}`).join(" · ");
      return `<div class="dv-item"><div class="dv-item-top"><div class="dv-item-title">${esc(v.nome||"Voucher")}</div><div class="dv-item-date">${date(v.criadoEm)}</div></div><div style="margin-top:7px"><span class="dv-badge">${publico}</span><span class="dv-badge">🎴 ${usados}/${total} escolhas</span></div><div class="dv-item-info">${(v.premios||[]).length} prêmios cadastrados</div><div class="dv-weights">${esc(weights)}</div><div class="dv-item-link">${esc(link)}</div><div class="dv-link-buttons"><button class="dv-secondary" type="button" data-copy="${esc(link)}">📋 COPIAR LINK</button><button class="dv-delete" type="button" data-del="${esc(v.id)}">🗑️ EXCLUIR</button></div></div>`;
    }).join("");
    box.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);msg("📋 Link copiado.","success")}catch{msg("Copie o link manualmente.","error")}});
    box.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(!confirm("Excluir este link de voucher? O cliente não poderá mais usá-lo."))return;try{await deleteDoc(doc(db,"vouchersDesconto",b.dataset.del));msg("🗑️ Voucher excluído.","success");loadList()}catch(e){msg("❌ Não foi possível excluir.","error")}});
  }catch(e){console.error(e);box.innerHTML="<div class='dv-empty'>Não foi possível carregar o histórico.</div>";}
}

$("dvAddPrize").onclick=()=>addPrizeRow();
$("dvGenerate").onclick=generate;
$("dvRefresh").onclick=loadList;
$("dvNew").onclick=()=>{$("dvLinkBox").style.display="none";$("dvNome").value="";};
$("dvCopy").onclick=async()=>{if(!lastLink)return;try{await navigator.clipboard.writeText(lastLink);msg("📋 Link copiado.","success")}catch{msg("Copie o link manualmente.","error")}};
renderPrizes();

onAuthStateChanged(auth,async user=>{
  if(!user){return;}
  const email=(user.email||"").trim().toLowerCase();
  if(email===ADMIN_EMAIL.toLowerCase()){adminOk=true;loadList();}
});
