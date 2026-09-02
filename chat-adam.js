/*
=========================================================
 ADAM GAMES — SISTEMA DE CHAT
 Chat Geral + Privado + estrutura para Salas
=========================================================
*/
import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
/* =====================================================
   FIREBASE
===================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyC4Zp45lescRGFKXjgRBz0mAg1pcae72qc",
  authDomain: "adam-games-21081.firebaseapp.com",
  projectId: "adam-games-21081",
  storageBucket: "adam-games-21081.firebasestorage.app",
  messagingSenderId: "1055528418738",
  appId: "1:1055528418738:web:5fafdf63424ba9744eb8ab",
  measurementId: "G-KVFSF864GE"
};
const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
/* =====================================================
   ESTADO
===================================================== */
let usuarioAtual = null;
let dadosUsuario = null;
let salaAtual = "geral";
let conversaAtual = null;
let unsubscribeMensagens = null;
let unsubscribeConversas = null;
/* =====================================================
   ESTILO
===================================================== */
const estilo = document.createElement("style");
estilo.textContent = `
#adamChatButton{
  position:fixed;
  right:18px;
  bottom:88px;
  width:58px;
  height:58px;
  border-radius:50%;
  border:none;
  background:linear-gradient(135deg,#0878ff,#00bfff);
  color:#fff;
  font-size:27px;
  box-shadow:0 8px 25px rgba(0,0,0,.35);
  z-index:99998;
  cursor:pointer;
}
#adamChatBadge{
  position:absolute;
  top:-4px;
  right:-4px;
  min-width:20px;
  height:20px;
  border-radius:20px;
  background:#ff1744;
  color:#fff;
  font-size:11px;
  font-weight:bold;
  display:none;
  align-items:center;
  justify-content:center;
  border:2px solid #fff;
}
#adamChatWindow{
  position:fixed;
  z-index:99999;
  right:12px;
  bottom:78px;
  width:min(420px,calc(100vw - 24px));
  height:min(650px,calc(100vh - 110px));
  background:#071522;
  border:1px solid rgba(0,191,255,.35);
  border-radius:20px;
  box-shadow:0 15px 60px rgba(0,0,0,.55);
  overflow:hidden;
  display:none;
  flex-direction:column;
  color:#fff;
  font-family:Arial,sans-serif;
}
#adamChatHeader{
  min-height:62px;
  background:linear-gradient(135deg,#092b45,#071522);
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:10px 14px;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.adamChatTitle{
  font-size:16px;
  font-weight:800;
}
.adamChatSub{
  font-size:10px;
  color:#83cfff;
  margin-top:3px;
}
#adamChatClose{
  width:35px;
  height:35px;
  border:0;
  border-radius:50%;
  background:rgba(255,255,255,.08);
  color:#fff;
  font-size:20px;
}
#adamChatTabs{
  display:flex;
  gap:6px;
  padding:8px;
  background:#06111b;
}
.adamChatTab{
  flex:1;
  border:1px solid rgba(255,255,255,.08);
  background:#0b1d2b;
  color:#a9c8dc;
  border-radius:10px;
  padding:9px 4px;
  font-size:11px;
  font-weight:bold;
}
.adamChatTab.active{
  background:#0878ff;
  color:#fff;
  border-color:#0878ff;
}
#adamChatBody{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
}
#adamChatRoomList{
  overflow:auto;
  padding:8px;
}
.adamRoom{
  width:100%;
  border:0;
  border-radius:12px;
  padding:12px;
  margin-bottom:7px;
  background:#0c2030;
  color:#fff;
  text-align:left;
  display:flex;
  align-items:center;
  gap:10px;
}
.adamRoom.active{
  background:#103a58;
}
.adamRoomIcon{
  width:40px;
  height:40px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#0878ff;
  font-size:20px;
}
.adamRoomInfo{
  flex:1;
}
.adamRoomName{
  font-size:13px;
  font-weight:bold;
}
.adamRoomDescription{
  font-size:10px;
  color:#8caec3;
  margin-top:3px;
}
#adamChatMessages{
  flex:1;
  min-height:0;
  overflow:auto;
  padding:12px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.adamMessage{
  max-width:82%;
  display:flex;
  gap:7px;
  align-items:flex-end;
}
.adamMessage.mine{
  align-self:flex-end;
  flex-direction:row-reverse;
}
.adamAvatar{
  width:30px;
  height:30px;
  border-radius:50%;
  object-fit:cover;
  background:#17364b;
  flex:none;
}
.adamBubble{
  background:#102b3e;
  border-radius:13px 13px 13px 4px;
  padding:8px 10px;
}
.mine .adamBubble{
  background:#0878ff;
  border-radius:13px 13px 4px 13px;
}
.adamSender{
  font-size:10px;
  color:#69c8ff;
  font-weight:bold;
  margin-bottom:3px;
}
.mine .adamSender{
  color:#dff5ff;
}
.adamText{
  font-size:13px;
  line-height:1.35;
  word-break:break-word;
}
.adamTime{
  font-size:8px;
  opacity:.65;
  margin-top:4px;
  text-align:right;
}
.adamVip{
  color:#ffd54a;
}
#adamChatComposer{
  display:flex;
  gap:7px;
  padding:9px;
  background:#06111b;
  border-top:1px solid rgba(255,255,255,.08);
}
#adamChatInput{
  flex:1;
  min-width:0;
  border:1px solid rgba(255,255,255,.12);
  background:#0c2030;
  color:#fff;
  border-radius:12px;
  padding:11px;
  outline:none;
}
#adamChatSend{
  width:48px;
  border:0;
  border-radius:12px;
  background:#0878ff;
  color:#fff;
  font-size:19px;
}
#adamPrivateSearch{
  margin:10px;
  padding:11px;
  width:calc(100% - 20px);
  box-sizing:border-box;
  border:1px solid rgba(255,255,255,.12);
  border-radius:12px;
  background:#0c2030;
  color:#fff;
  outline:none;
}
#adamUserResults{
  overflow:auto;
  padding:0 10px 10px;
}
.adamUser{
  display:flex;
  align-items:center;
  gap:9px;
  padding:10px;
  border-radius:12px;
  background:#0c2030;
  margin-bottom:7px;
  cursor:pointer;
}
.adamUser img{
  width:38px;
  height:38px;
  border-radius:50%;
  object-fit:cover;
}
.adamUserName{
  flex:1;
  font-size:12px;
  font-weight:bold;
}
.adamPrivateButton{
  border:0;
  background:#0878ff;
  color:#fff;
  border-radius:8px;
  padding:7px 9px;
  font-size:10px;
  font-weight:bold;
}
#adamPrivateHeader{
  display:none;
  align-items:center;
  gap:8px;
  padding:8px;
  background:#091c2b;
}
#adamPrivateBack{
  border:0;
  background:transparent;
  color:#fff;
  font-size:20px;
}
#adamPrivateName{
  font-weight:bold;
  font-size:13px;
}
.adamEmpty{
  text-align:center;
  color:#7291a4;
  padding:35px 15px;
  font-size:12px;
}
`;
document.head.appendChild(estilo);
/* =====================================================
   INTERFACE
===================================================== */
const botao = document.createElement("button");
botao.id = "adamChatButton";
botao.innerHTML = `
  💬
  <span id="adamChatBadge">0</span>
`;
document.body.appendChild(botao);
const janela = document.createElement("div");
janela.id = "adamChatWindow";
janela.innerHTML = `
  <div id="adamChatHeader">
    <div>
      <div class="adamChatTitle">💬 Adam Games</div>
      <div class="adamChatSub">Comunidade online</div>
    </div>
    <button id="adamChatClose">×</button>
  </div>
  <div id="adamChatTabs">
    <button class="adamChatTab active" data-tab="geral">
      🌎 Geral
    </button>
    <button class="adamChatTab" data-tab="privado">
      🔒 Privados
    </button>
    <button class="adamChatTab" data-tab="salas">
      🏠 Salas
    </button>
  </div>
  <div id="adamChatBody">
    <div id="adamChatRoomList"></div>
    <input
      id="adamPrivateSearch"
      placeholder="🔎 Procurar usuário..."
      style="display:none"
    >
    <div
      id="adamUserResults"
      style="display:none"
    ></div>
    <div id="adamPrivateHeader">
      <button id="adamPrivateBack">‹</button>
      <div id="adamPrivateName"></div>
    </div>
    <div id="adamChatMessages"></div>
    <div id="adamChatComposer">
      <input
        id="adamChatInput"
        maxlength="500"
        placeholder="Digite uma mensagem..."
      >
      <button id="adamChatSend">➤</button>
    </div>
  </div>
`;
document.body.appendChild(janela);
/* =====================================================
   ELEMENTOS
===================================================== */
const chatMessages =
  document.getElementById("adamChatMessages");
const chatInput =
  document.getElementById("adamChatInput");
const chatSend =
  document.getElementById("adamChatSend");
const roomList =
  document.getElementById("adamChatRoomList");
const privateSearch =
  document.getElementById("adamPrivateSearch");
const userResults =
  document.getElementById("adamUserResults");
const privateHeader =
  document.getElementById("adamPrivateHeader");
const privateName =
  document.getElementById("adamPrivateName");
/* =====================================================
   UTILIDADES
===================================================== */
function escapar(texto){
  return String(texto || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function nomeUsuario(){
  return (
    dadosUsuario?.nome ||
    usuarioAtual?.displayName ||
    usuarioAtual?.email?.split("@")[0] ||
    "Usuário"
  );
}
function avatarUsuario(){
  return (
    dadosUsuario?.avatar ||
    usuarioAtual?.photoURL ||
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(nomeUsuario())
  );
}
function ehVip(){
  return dadosUsuario?.vip === true;
}
function formatarHora(timestamp){
  if(!timestamp) return "";
  try{
    const data = timestamp.toDate();
    return data.toLocaleTimeString("pt-BR",{
      hour:"2-digit",
      minute:"2-digit"
    });
  }catch{
    return "";
  }
}
/* =====================================================
   ABRIR / FECHAR
===================================================== */
botao.addEventListener("click",()=>{
  const aberto =
    janela.style.display === "flex";
  janela.style.display =
    aberto ? "none" : "flex";
});
document
  .getElementById("adamChatClose")
  .addEventListener("click",()=>{
    janela.style.display="none";
  });
/* =====================================================
   TABS
===================================================== */
document
  .querySelectorAll(".adamChatTab")
  .forEach(tab=>{
    tab.addEventListener("click",()=>{
      document
        .querySelectorAll(".adamChatTab")
        .forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      abrirAba(tab.dataset.tab);
    });
  });
function abrirAba(tab){
  roomList.style.display="none";
  privateSearch.style.display="none";
  userResults.style.display="none";
  privateHeader.style.display="none";
  chatMessages.style.display="none";
  document.getElementById("adamChatComposer").style.display="none";
  if(tab==="geral"){
    roomList.style.display="block";
    chatMessages.style.display="flex";
    document.getElementById("adamChatComposer").style.display="flex";
    abrirSalaGeral();
  }
  if(tab==="privado"){
    privateSearch.style.display="block";
    userResults.style.display="block";
    carregarUsuarios();
  }
  if(tab==="salas"){
    roomList.style.display="block";
    mostrarSalas();
  }
}
/* =====================================================
   SALAS
===================================================== */
function mostrarSalas(){
  roomList.innerHTML = `
    <button class="adamRoom active" data-sala="geral">
      <div class="adamRoomIcon">🌎</div>
      <div class="adamRoomInfo">
        <div class="adamRoomName">
          Chat Geral
        </div>
        <div class="adamRoomDescription">
          Todos os usuários
        </div>
      </div>
    </button>
    <div class="adamEmpty">
      ➕ Novas salas poderão ser criadas
      futuramente pelo administrador.
    </div>
  `;
}
/* =====================================================
   CHAT GERAL
===================================================== */
async function abrirSalaGeral(){
  conversaAtual = null;
  salaAtual = "geral";
  privateHeader.style.display="none";
  if(unsubscribeMensagens){
    unsubscribeMensagens();
    unsubscribeMensagens=null;
  }
  chatMessages.innerHTML =
    `<div class="adamEmpty">Carregando chat...</div>`;
  const mensagensRef =
    collection(
      db,
      "salas",
      "geral",
      "mensagens"
    );
  const q = query(
    mensagensRef,
    orderBy("criadoEm","asc")
  );
  unsubscribeMensagens =
    onSnapshot(
      q,
      snapshot=>{
        chatMessages.innerHTML="";
        if(snapshot.empty){
          chatMessages.innerHTML=`
            <div class="adamEmpty">
              💬 Ainda não há mensagens.<br>
              Seja o primeiro a falar!
            </div>
          `;
          return;
        }
        snapshot.forEach(item=>{
          renderizarMensagem(
            item.data()
          );
        });
        rolarMensagens();
      },
      erro=>{
        console.error(
          "Erro no Chat Geral:",
          erro
        );
        chatMessages.innerHTML=`
          <div class="adamEmpty">
            ⚠️ Não foi possível carregar o chat.
          </div>
        `;
      }
    );
}
/* =====================================================
   RENDER MENSAGEM
===================================================== */
function renderizarMensagem(msg){
  const minha =
    msg.remetenteUid === usuarioAtual.uid;
  const div =
    document.createElement("div");
  div.className =
    "adamMessage " +
    (minha ? "mine" : "");
  const vip =
    msg.vip === true
      ? `<span class="adamVip"> 👑 VIP</span>`
      : "";
  div.innerHTML = `
    <img
      class="adamAvatar"
      src="${escapar(
        msg.remetenteAvatar ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          msg.remetenteNome || "U"
        )
      )}"
    >
    <div class="adamBubble">
      <div class="adamSender">
        ${escapar(msg.remetenteNome || "Usuário")}
        ${vip}
      </div>
      <div class="adamText">
        ${escapar(msg.texto)}
      </div>
      <div class="adamTime">
        ${formatarHora(msg.criadoEm)}
      </div>
    </div>
  `;
  chatMessages.appendChild(div);
}
/* =====================================================
   ENVIAR MENSAGEM
===================================================== */
async function enviarMensagem(){
  const texto =
    chatInput.value.trim();
  if(!texto) return;
  if(!usuarioAtual) return;
  chatInput.disabled=true;
  chatSend.disabled=true;
  try{
    if(conversaAtual){
      await enviarPrivado(texto);
    }else{
      await addDoc(
        collection(
          db,
          "salas",
          salaAtual,
          "mensagens"
        ),
        {
          texto,
          remetenteUid:
            usuarioAtual.uid,
          remetenteNome:
            nomeUsuario(),
          remetenteAvatar:
            avatarUsuario(),
          vip:
            ehVip(),
          criadoEm:
            serverTimestamp()
        }
      );
    }
    chatInput.value="";
  }catch(erro){
    console.error(erro);
    alert(
      "Não foi possível enviar a mensagem."
    );
  }finally{
    chatInput.disabled=false;
    chatSend.disabled=false;
    chatInput.focus();
  }
}
chatSend.addEventListener(
  "click",
  enviarMensagem
);
chatInput.addEventListener(
  "keydown",
  evento=>{
    if(evento.key==="Enter"){
      evento.preventDefault();
      enviarMensagem();
    }
  }
);
/* =====================================================
   PRIVADOS — USUÁRIOS
===================================================== */
async function carregarUsuarios(){
  userResults.innerHTML =
    `<div class="adamEmpty">
      🔎 Carregando usuários...
    </div>`;
  try{
    const snap =
      await getDocs(
        collection(db,"admins")
      );
    window.adamChatUsuarios=[];
    snap.forEach(item=>{
      const dados=item.data();
      if(item.id === usuarioAtual.uid)
        return;
      window.adamChatUsuarios.push({
        uid:
          dados.uid || item.id,
        nome:
          dados.nome ||
          dados.email ||
          "Usuário",
        email:
          dados.email || "",
        avatar:
          dados.avatar ||
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(
            dados.nome || "U"
          ),
        vip:
          dados.vip === true,
        publicId:
          dados.publicId || ""
      });
    });
    renderizarUsuarios(
      window.adamChatUsuarios
    );
  }catch(erro){
    console.error(erro);
    userResults.innerHTML=`
      <div class="adamEmpty">
        ⚠️ Não foi possível carregar os usuários.
      </div>
    `;
  }
}
function renderizarUsuarios(lista){
  userResults.innerHTML="";
  if(!lista.length){
    userResults.innerHTML=`
      <div class="adamEmpty">
        Nenhum usuário encontrado.
      </div>
    `;
    return;
  }
  lista.forEach(usuario=>{
    const div =
      document.createElement("div");
    div.className="adamUser";
    const vip =
      usuario.vip
        ? `<span class="adamVip">👑</span>`
        : "";
    div.innerHTML=`
      <img
        src="${escapar(usuario.avatar)}"
      >
      <div class="adamUserName">
        ${escapar(usuario.nome)}
        ${vip}
      </div>
      <button
        class="adamPrivateButton"
      >
        💬 PRIVADO
      </button>
    `;
    div
      .querySelector(".adamPrivateButton")
      .addEventListener(
        "click",
        evento=>{
          evento.stopPropagation();
          abrirPrivado(usuario);
        }
      );
    userResults.appendChild(div);
  });
}
/* =====================================================
   BUSCA
===================================================== */
privateSearch.addEventListener(
  "input",
  ()=>{
    const termo =
      privateSearch.value
        .trim()
        .toLowerCase();
    if(!window.adamChatUsuarios)
      return;
    if(!termo){
      renderizarUsuarios(
        window.adamChatUsuarios
      );
      return;
    }
    const filtrados =
      window.adamChatUsuarios.filter(u=>{
        return (
          u.nome
            .toLowerCase()
            .includes(termo)
          ||
          u.email
            .toLowerCase()
            .includes(termo)
          ||
          u.publicId
            .toLowerCase()
            .includes(termo)
        );
      });
    renderizarUsuarios(filtrados);
  }
);
/* =====================================================
   ID DA CONVERSA PRIVADA
===================================================== */
function idConversa(uid1,uid2){
  return [uid1,uid2]
    .sort()
    .join("_");
}
/* =====================================================
   ABRIR PRIVADO
===================================================== */
async function abrirPrivado(usuario){
  conversaAtual={
    uid:usuario.uid,
    nome:usuario.nome,
    avatar:usuario.avatar,
    vip:usuario.vip
  };
  privateSearch.style.display="none";
  userResults.style.display="none";
  privateHeader.style.display="flex";
  privateName.textContent =
    "🔒 " + usuario.nome;
  chatMessages.style.display="flex";
  document
    .getElementById("adamChatComposer")
    .style.display="flex";
  if(unsubscribeMensagens){
    unsubscribeMensagens();
    unsubscribeMensagens=null;
  }
  const conversaId =
    idConversa(
      usuarioAtual.uid,
      usuario.uid
    );
  const conversaRef =
    doc(
      db,
      "conversas",
      conversaId
    );
  const conversaSnap =
    await getDoc(conversaRef);
  if(!conversaSnap.exists()){
    await setDoc(
      conversaRef,
      {
        participantes:[
          usuarioAtual.uid,
          usuario.uid
        ],
        participanteNomes:{
          [usuarioAtual.uid]:
            nomeUsuario(),
          [usuario.uid]:
            usuario.nome
        },
        participanteAvatares:{
          [usuarioAtual.uid]:
            avatarUsuario(),
          [usuario.uid]:
            usuario.avatar
        },
        participanteVip:{
          [usuarioAtual.uid]:
            ehVip(),
          [usuario.uid]:
            usuario.vip === true
        },
        criadoEm:
          serverTimestamp(),
        ultimaMensagem:"",
        ultimaMensagemEm:null,
        ultimoRemetenteUid:""
      }
    );
  }
  const mensagensRef =
    collection(
      db,
      "conversas",
      conversaId,
      "mensagens"
    );
  const q =
    query(
      mensagensRef,
      orderBy("criadoEm","asc")
    );
  unsubscribeMensagens =
    onSnapshot(
      q,
      snapshot=>{
        chatMessages.innerHTML="";
        if(snapshot.empty){
          chatMessages.innerHTML=`
            <div class="adamEmpty">
              🔒 Essa conversa ainda está vazia.<br>
              Envie a primeira mensagem!
            </div>
          `;
          return;
        }
        snapshot.forEach(item=>{
          renderizarMensagem(
            item.data()
          );
        });
        rolarMensagens();
      },
      erro=>{
        console.error(
          "Erro no privado:",
          erro
        );
      }
    );
}
async function enviarPrivado(texto){
  if(!conversaAtual)
    return;
  const conversaId =
    idConversa(
      usuarioAtual.uid,
      conversaAtual.uid
    );
  await addDoc(
    collection(
      db,
      "conversas",
      conversaId,
      "mensagens"
    ),
    {
      texto,
      remetenteUid:
        usuarioAtual.uid,
      destinatarioUid:
        conversaAtual.uid,
      remetenteNome:
        nomeUsuario(),
      remetenteAvatar:
        avatarUsuario(),
      vip:
        ehVip(),
      criadoEm:
        serverTimestamp(),
      lida:false
    }
  );
  await updateDoc(
    doc(
      db,
      "conversas",
      conversaId
    ),
    {
      ultimaMensagem:
        texto,
      ultimaMensagemEm:
        serverTimestamp(),
      ultimoRemetenteUid:
        usuarioAtual.uid,
      ultimaMensagemLida:false
    }
  );
}
/* =====================================================
   VOLTAR DO PRIVADO
===================================================== */
document
  .getElementById("adamPrivateBack")
  .addEventListener(
    "click",
    ()=>{
      if(unsubscribeMensagens){
        unsubscribeMensagens();
        unsubscribeMensagens=null;
      }
      conversaAtual=null;
      privateHeader.style.display="none";
      privateSearch.style.display="block";
      userResults.style.display="block";
      chatMessages.style.display="none";
      document
        .getElementById("adamChatComposer")
        .style.display="none";
      carregarUsuarios();
    }
  );
/* =====================================================
   ROLAR
===================================================== */
function rolarMensagens(){
  requestAnimationFrame(()=>{
    chatMessages.scrollTop =
      chatMessages.scrollHeight;
  });
}
/* =====================================================
   AUTENTICAÇÃO
===================================================== */
onAuthStateChanged(
  auth,
  async usuario=>{
    usuarioAtual=usuario;
    if(!usuario){
      botao.style.display="none";
      janela.style.display="none";
      return;
    }
    botao.style.display="block";
    try{
      const snap =
        await getDoc(
          doc(
            db,
            "admins",
            usuario.uid
          )
        );
      if(snap.exists()){
        dadosUsuario=snap.data();
      }else{
        const q =
          query(
            collection(db,"admins"),
            where(
              "uid",
              "==",
              usuario.uid
            )
          );
        const resultado =
          await getDocs(q);
        if(!resultado.empty){
          dadosUsuario =
            resultado.docs[0].data();
        }
      }
    }catch(erro){
      console.error(
        "Erro ao carregar usuário:",
        erro
      );
    }
    mostrarSalas();
    abrirSalaGeral();
  }
);
