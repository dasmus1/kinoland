import { useState, useEffect, useRef } from "react";

/* ══ DEFAULTS ══════════════════════════════════════════════════ */
const HALLS = ["Зал 1","Зал 2","Зал 3"];
const ROWS  = ["А","Б","В","Г","Д","Е","Ж","З","И","К"];
const COLS  = 12;
const VIP   = new Set(["И","К"]);
const KASPI_PHONE = "+7 724 555-01-01";
const KASPI_NUMBER = "77245550101";
const ADMIN_DEFAULT_PASS = "kinoland2026";

const DEF_MOVIES = [
  { id:1, title:"Пейіш 2",  genre:"Драма · Казахстан",    dur:"105 мин", rating:"16+", emoji:"🏔️", color:"#c9a84c", poster:null,
    desc:"Продолжение культовой казахстанской драмы. Герои возвращаются в родной аул, где прошлое и настоящее переплетаются в судьбоносном выборе.",
    sessions:[{id:"s1",time:"10:30",hall:"Зал 1",price:1200},{id:"s2",time:"13:00",hall:"Зал 1",price:1200},{id:"s3",time:"16:30",hall:"Зал 2",price:1400},{id:"s4",time:"19:00",hall:"Зал 1",price:1400}]},
  { id:2, title:"Абай бол", genre:"Триллер · Казахстан",   dur:"95 мин",  rating:"18+", emoji:"🔍", color:"#e05c3a", poster:null,
    desc:"Напряжённый триллер о детективе, расследующем серию исчезновений. Каждый шаг приближает к опасной правде.",
    sessions:[{id:"s5",time:"11:00",hall:"Зал 2",price:1200},{id:"s6",time:"14:30",hall:"Зал 1",price:1200},{id:"s7",time:"18:00",hall:"Зал 2",price:1400},{id:"s8",time:"21:00",hall:"Зал 3",price:1500}]},
  { id:3, title:"Мама",      genre:"Семейный · Казахстан", dur:"88 мин",  rating:"0+",  emoji:"❤️", color:"#5b8dd9", poster:null,
    desc:"Трогательная история о матери, которая ради счастья своих детей готова на всё. Фильм о силе любви и семейных ценностях.",
    sessions:[{id:"s9",time:"09:30",hall:"Зал 3",price:1000},{id:"s10",time:"12:00",hall:"Зал 1",price:1200},{id:"s11",time:"15:00",hall:"Зал 2",price:1200},{id:"s12",time:"17:30",hall:"Зал 3",price:1400}]},
];

const SNACKS = [
  {id:"ps",name:"Попкорн S",  price:600, emoji:"🍿"},
  {id:"pm",name:"Попкорн M",  price:900, emoji:"🍿"},
  {id:"pl",name:"Попкорн L",  price:1200,emoji:"🍿"},
  {id:"co",name:"Кола 0.5л", price:500, emoji:"🥤"},
  {id:"wa",name:"Вода 0.5л", price:300, emoji:"💧"},
  {id:"na",name:"Начос",      price:700, emoji:"🫓"},
  {id:"ho",name:"Хот-дог",    price:800, emoji:"🌭"},
  {id:"ju",name:"Сок 0.33л", price:450, emoji:"🧃"},
];

/* ══ STORAGE ═══════════════════════════════════════════════════ */
const DB = {
  movies:    ()  => JSON.parse(localStorage.getItem("kl_movies")||"null") || DEF_MOVIES,
  saveMovies: m  => localStorage.setItem("kl_movies", JSON.stringify(m)),
  users:     ()  => JSON.parse(localStorage.getItem("kl_users")||"[]"),
  saveUsers:  u  => localStorage.setItem("kl_users", JSON.stringify(u)),
  adminPass: ()  => localStorage.getItem("kl_admin_pass") || ADMIN_DEFAULT_PASS,
  allBookings:() => DB.users().flatMap(u=>(u.bookings||[]).map(b=>({...b,userName:u.name,userPhone:u.phone}))),
};

/* taken seats: built from all bookings */
const buildTakenCache = () => {
  const cache = {};
  DB.allBookings().forEach(b => {
    if(!cache[b.sessionId]) cache[b.sessionId]=new Set();
    (b.seats||[]).forEach(s=>cache[b.sessionId].add(s));
  });
  return cache;
};

/* ══ STYLES ════════════════════════════════════════════════════ */
const INP = {width:"100%",padding:"12px 15px",background:"#111",border:"1px solid #252525",borderRadius:10,color:"#fff",fontSize:14,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box",display:"block",marginBottom:10};
const GB  = (x={})=>({background:"linear-gradient(135deg,#c9a84c,#e8c96a)",border:"none",borderRadius:50,fontWeight:800,color:"#000",cursor:"pointer",transition:"all 0.2s",fontFamily:"'Outfit',sans-serif",...x});
const CARD = {background:"#0d0d0d",border:"1px solid #1e1e1e",borderRadius:18,padding:20};

/* ══ TICKET DOWNLOAD (Canvas) ═══════════════════════════════════ */
async function downloadTicket(b, movie, session) {
  const W=900, H=420;
  const canvas = document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const c = canvas.getContext("2d");

  // BG
  c.fillStyle="#0a0a0a"; c.fillRect(0,0,W,H);

  // Left accent
  const grad=c.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,movie.color); grad.addColorStop(1,"transparent");
  c.fillStyle=grad; c.fillRect(0,0,6,H);

  // Top bar
  c.fillStyle="#111"; c.fillRect(0,0,W,80);
  c.fillStyle=movie.color; c.font="bold 22px sans-serif"; c.fillText("KINOLAND",30,30);
  c.fillStyle="#555"; c.font="12px sans-serif"; c.fillText("г. Сарыагаш",30,52);
  c.fillStyle="#fff"; c.font="12px sans-serif"; c.fillText("kinoland-kz.netlify.app",30,68);

  // Dashed divider
  c.setLineDash([6,4]); c.strokeStyle="#222"; c.lineWidth=1;
  c.beginPath(); c.moveTo(0,80); c.lineTo(W,80); c.stroke();
  c.setLineDash([]);

  // Emoji area
  c.font="72px serif"; c.fillText(movie.emoji, W-160, 200);

  // Movie title
  c.fillStyle="#fff"; c.font="bold 36px sans-serif";
  c.fillText(movie.title, 30, 130);

  // Info
  c.fillStyle="#888"; c.font="14px sans-serif";
  c.fillText(`📅 ${b.date}  ⏰ ${session.time}  🎭 ${session.hall}`, 30, 165);

  // Seats
  c.fillStyle=movie.color; c.font="bold 13px sans-serif"; c.fillText("МЕСТА:", 30, 205);
  c.fillStyle="#ddd"; c.font="14px sans-serif";
  c.fillText(b.seats.join("  ·  "), 30, 225);

  // Snacks
  if(b.snacks && Object.keys(b.snacks).length>0){
    const items=Object.entries(b.snacks).map(([id,q])=>{const sn=SNACKS.find(x=>x.id===id);return sn?`${sn.emoji}${sn.name}×${q}`:null;}).filter(Boolean).join("  ");
    c.fillStyle=movie.color; c.font="bold 13px sans-serif"; c.fillText("ЗАКАЗ:", 30, 260);
    c.fillStyle="#aaa"; c.font="13px sans-serif"; c.fillText(items, 30, 278);
  }

  // Total
  c.fillStyle=movie.color; c.font="bold 28px sans-serif";
  c.fillText(b.total.toLocaleString()+" ₸", 30, 340);

  // Booking code
  c.fillStyle="#333"; c.fillRect(30,360,W-60,50);
  c.fillStyle=movie.color; c.font="bold 18px monospace";
  c.textAlign="center"; c.fillText(`#${b.code}`, W/2, 393);
  c.textAlign="left";

  // Barcode-style visual (simple bars from code chars)
  const code = b.code.replace("KL","");
  let bx=600;
  for(let i=0;i<code.length;i++){
    const v=code.charCodeAt(i)%3;
    c.fillStyle= v===0?"#c9a84c":v===1?"#fff":"#555";
    const bw=4+v*2, bh=60+v*20;
    c.fillRect(bx, 320-bh/2, bw, bh);
    bx+=bw+3;
  }

  // Download
  const link=document.createElement("a");
  link.download=`KINOLAND-${b.code}.png`;
  link.href=canvas.toDataURL("image/png");
  link.click();
}

/* ══ COMPONENTS ════════════════════════════════════════════════ */

function AuthModal({onClose,onAuth}){
  const[tab,setTab]=useState("login");
  const[f,setF]=useState({name:"",phone:"",email:"",pass:"",pass2:""});
  const[err,setErr]=useState("");
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const submit=()=>{
    setErr("");
    if(tab==="login"){
      if(!f.phone||!f.pass)return setErr("Заполните все поля");
      const u=DB.users().find(x=>x.phone===f.phone&&x.pass===f.pass);
      if(!u)return setErr("Неверный номер или пароль");
      onAuth(u);
    }else{
      if(!f.name||!f.phone||!f.pass)return setErr("Заполните имя, телефон и пароль");
      if(f.pass!==f.pass2)return setErr("Пароли не совпадают");
      if(DB.users().find(x=>x.phone===f.phone))return setErr("Номер уже зарегистрирован");
      const u={id:Date.now(),name:f.name,phone:f.phone,email:f.email,pass:f.pass,bookings:[]};
      DB.saveUsers([...DB.users(),u]); onAuth(u);
    }
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)",padding:16}} onClick={onClose}>
      <div style={{...CARD,width:"100%",maxWidth:400,padding:32,borderRadius:22,animation:"fadeUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:6}}>{tab==="login"?"Войти в аккаунт":"Регистрация"}</h2>
        <p style={{fontSize:13,color:"#555",marginBottom:20}}>{tab==="login"?"Введите номер и пароль":"Создайте аккаунт для покупки билетов"}</p>
        <div style={{display:"flex",background:"#0a0a0a",borderRadius:10,padding:3,marginBottom:18}}>
          {[["login","Войти"],["register","Регистрация"]].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:8,background:tab===t?"#c9a84c":"transparent",color:tab===t?"#000":"#666",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Outfit',sans-serif"}}>{l}</button>
          ))}
        </div>
        {tab==="register"&&<input placeholder="Ваше имя" value={f.name} onChange={set("name")} style={INP}/>}
        <input placeholder="+77001234567" value={f.phone} onChange={set("phone")} style={INP}/>
        {tab==="register"&&<input placeholder="Email (необязательно)" value={f.email} onChange={set("email")} style={INP}/>}
        <input placeholder="Пароль" type="password" value={f.pass} onChange={set("pass")} style={INP}/>
        {tab==="register"&&<input placeholder="Повторите пароль" type="password" value={f.pass2} onChange={set("pass2")} style={INP} onKeyDown={e=>e.key==="Enter"&&submit()}/>}
        {err&&<div style={{color:"#e05c3a",fontSize:12,background:"#e05c3a12",borderRadius:8,padding:"7px 12px",marginBottom:10}}>{err}</div>}
        <button onClick={submit} style={{...GB(),width:"100%",padding:"13px",borderRadius:11,fontSize:15}}>{tab==="login"?"Войти":"Создать аккаунт"}</button>
        <button onClick={onClose} style={{width:"100%",marginTop:8,padding:"10px",background:"transparent",border:"none",color:"#444",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif"}}>Отмена</button>
      </div>
    </div>
  );
}

/* ══ SEAT MAP ══════════════════════════════════════════════════ */
function SeatMap({session,movie,takenCache,onConfirm}){
  const[sel,setSel]=useState(new Set());
  const taken=takenCache[session.id]||new Set();
  const toggle=key=>{
    if(taken.has(key))return;
    setSel(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.size<8&&n.add(key);return n;});
  };
  const total=sel.size*session.price;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
      <div style={{width:"100%",maxWidth:680}}>
        <div style={{height:4,borderRadius:2,background:`linear-gradient(90deg,transparent,${movie.color},transparent)`,boxShadow:`0 0 20px ${movie.color}55`,marginBottom:5}}/>
        <div style={{textAlign:"center",fontSize:9,letterSpacing:5,color:"#444",textTransform:"uppercase"}}>ЭКРАН</div>
      </div>
      <div style={{width:"100%",maxWidth:680}}>
        {ROWS.map(row=>{
          const isVip=VIP.has(row);
          return(
            <div key={row} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
              <div style={{width:48,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
                <span style={{fontSize:8,color:"#c9a84c44"}}>←</span>
                <span style={{fontSize:10,fontWeight:isVip?700:400,color:isVip?"#c9a84c":"#444",width:13,textAlign:"center"}}>{row}</span>
              </div>
              <div style={{display:"flex",gap:3,flex:1}}>
                {Array.from({length:COLS},(_,i)=>{
                  const key=`${row}-${i+1}`,isTaken=taken.has(key),isSel=sel.has(key);
                  return(
                    <button key={key} onClick={()=>toggle(key)} title={key}
                      style={{flex:1,height:24,borderRadius:4,border:"none",cursor:isTaken?"not-allowed":"pointer",
                        background:isTaken?"#1a1a1a":isSel?movie.color:isVip?"#0b1e30":"#121f12",
                        transition:"all 0.1s",transform:isSel?"scale(1.12)":"scale(1)",
                        boxShadow:isSel?`0 0 8px ${movie.color}88`:"none"}}/>
                  );
                })}
              </div>
              <div style={{width:16}}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:14,fontSize:11,color:"#555",flexWrap:"wrap",justifyContent:"center"}}>
        {[["#121f12","Свободно"],["#0b1e30","VIP"],[movie.color,"Выбрано"],["#1a1a1a","Занято"]].map(([bg,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:13,height:9,borderRadius:2,background:bg}}/><span>{l}</span></div>
        ))}
      </div>
      <div style={{width:"100%",maxWidth:680,...CARD,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",padding:"14px 20px"}}>
        <div><div style={{fontSize:10,color:"#444"}}>Мест</div><div style={{fontSize:24,fontWeight:900}}>{sel.size}</div></div>
        <div style={{flex:1,minWidth:80}}>
          <div style={{fontSize:10,color:"#444",marginBottom:3}}>Места</div>
          <div style={{fontSize:11,color:"#c9a84c"}}>{sel.size>0?[...sel].sort().join(" · "):"—"}</div>
        </div>
        <div><div style={{fontSize:10,color:"#444"}}>Сумма</div><div style={{fontSize:20,fontWeight:900,color:"#c9a84c"}}>{total.toLocaleString()} ₸</div></div>
        <button disabled={sel.size===0} onClick={()=>onConfirm([...sel],total)}
          style={{background:sel.size>0?`linear-gradient(135deg,${movie.color},#e8c96a)`:"#1a1a1a",color:sel.size>0?"#000":"#333",border:"none",borderRadius:10,padding:"12px 18px",fontWeight:800,fontSize:14,cursor:sel.size>0?"pointer":"not-allowed",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>
          Далее →
        </button>
      </div>
    </div>
  );
}

/* ══ SNACK STEP ════════════════════════════════════════════════ */
function SnackStep({seats,seatTotal,movie,onBack,onFinish}){
  const[cart,setCart]=useState({});
  const add=id=>setCart(p=>({...p,[id]:(p[id]||0)+1}));
  const rem=id=>setCart(p=>{const n={...p};n[id]>1?n[id]--:delete n[id];return n;});
  const snackTotal=Object.entries(cart).reduce((s,[id,q])=>s+(SNACKS.find(x=>x.id===id)?.price||0)*q,0);
  const grand=seatTotal+snackTotal;
  return(
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:8,marginBottom:24,fontFamily:"'Outfit',sans-serif"}}>← Назад</button>
      <h2 style={{fontSize:21,fontWeight:800,marginBottom:4}}>🍿 Попкорн и напитки</h2>
      <p style={{fontSize:13,color:"#555",marginBottom:22}}>Закажите заранее — заберёте на кассе без очереди</p>
      {[["pop","ПОПКОРН","repeat(3,1fr)"],["","НАПИТКИ И ЗАКУСКИ","repeat(2,1fr)"]].map(([prefix,label,cols])=>(
        <div key={label} style={{marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:3,color:"#444",textTransform:"uppercase",marginBottom:8}}>{label}</div>
          <div style={{display:"grid",gridTemplateColumns:cols,gap:8}}>
            {SNACKS.filter(s=>prefix?s.id.startsWith(prefix):!s.id.startsWith("p")).map(sn=>(
              <div key={sn.id} style={{...CARD,padding:"12px",border:`1px solid ${cart[sn.id]?movie.color+"44":"#1e1e1e"}`,background:cart[sn.id]?`${movie.color}0a`:"#0d0d0d"}}>
                <div style={{fontSize:24,marginBottom:6}}>{sn.emoji}</div>
                <div style={{fontSize:12,fontWeight:600,color:"#fff",marginBottom:2}}>{sn.name}</div>
                <div style={{fontSize:12,color:"#c9a84c",fontWeight:700,marginBottom:8}}>{sn.price.toLocaleString()} ₸</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {cart[sn.id]?(
                    <><button onClick={()=>rem(sn.id)} style={{width:26,height:26,borderRadius:7,background:"#1e1e1e",border:"none",color:"#fff",fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>−</button>
                    <span style={{fontWeight:700,minWidth:14,textAlign:"center"}}>{cart[sn.id]}</span>
                    <button onClick={()=>add(sn.id)} style={{width:26,height:26,borderRadius:7,background:movie.color,border:"none",color:"#000",fontSize:14,cursor:"pointer",fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>+</button></>
                  ):(
                    <button onClick={()=>add(sn.id)} style={{padding:"4px 10px",background:"#141414",border:"1px solid #222",borderRadius:7,color:"#aaa",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>+ Добавить</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{...CARD,marginBottom:16,padding:"16px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#666",marginBottom:6}}><span>Билеты ({seats.length} шт.)</span><span>{seatTotal.toLocaleString()} ₸</span></div>
        {Object.entries(cart).map(([id,q])=>{const sn=SNACKS.find(x=>x.id===id);return sn?(<div key={id} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:4}}><span>{sn.emoji} {sn.name} ×{q}</span><span>{(sn.price*q).toLocaleString()} ₸</span></div>):null;})}
        <div style={{borderTop:"1px solid #1e1e1e",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700}}>Итого</span><span style={{fontSize:20,fontWeight:900,color:"#c9a84c"}}>{grand.toLocaleString()} ₸</span></div>
      </div>
      <button onClick={()=>onFinish(cart,grand)} style={{...GB(),width:"100%",padding:"14px",borderRadius:13,fontSize:15}}>
        Перейти к оплате →
      </button>
    </div>
  );
}

/* ══ KASPI PAYMENT ═════════════════════════════════════════════ */
function KaspiPayment({total,code,movie,onBack,onPaid}){
  const[paid,setPaid]=useState(false);
  const qrData=encodeURIComponent(`KASPI PAY\nМагазин: KINOLAND Сарыагаш\nСумма: ${total} тенге\nЗаказ: ${code}\nТелефон: ${KASPI_NUMBER}`);
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=0d0d0d&color=c9a84c&data=${qrData}`;
  return(
    <div style={{maxWidth:500,margin:"0 auto",textAlign:"center"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:8,marginBottom:24,fontFamily:"'Outfit',sans-serif",textAlign:"left"}}>← Назад</button>
      <div style={{marginBottom:8,fontSize:11,letterSpacing:3,color:"#c9a84c",textTransform:"uppercase"}}>Оплата через</div>
      <div style={{fontSize:32,fontWeight:900,marginBottom:4,background:"linear-gradient(135deg,#c9a84c,#e8c96a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Kaspi Pay</div>
      <p style={{fontSize:13,color:"#666",marginBottom:24}}>Откройте Kaspi.kz и отсканируйте QR-код</p>
      <div style={{...CARD,padding:28,display:"inline-block",marginBottom:20}}>
        <img src={qrUrl} alt="Kaspi QR" style={{width:220,height:220,display:"block",borderRadius:12}}/>
      </div>
      <div style={{...CARD,padding:"16px 24px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:11,color:"#555"}}>Сумма к оплате</div>
          <div style={{fontSize:28,fontWeight:900,color:"#c9a84c"}}>{total.toLocaleString()} ₸</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#555"}}>Номер Kaspi</div>
          <div style={{fontSize:15,fontWeight:700}}>{KASPI_PHONE}</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"#444",marginBottom:24}}>Заказ: <span style={{color:"#c9a84c",fontWeight:700}}>#{code}</span></div>
      {!paid?(
        <button onClick={()=>setPaid(true)} style={{...GB(),width:"100%",padding:"15px",borderRadius:13,fontSize:15}}>
          ✓ Я оплатил через Kaspi
        </button>
      ):(
        <div>
          <div style={{...CARD,background:"#0a1f0a",border:"1px solid #1a4a1a",borderRadius:13,padding:"14px 20px",marginBottom:14,color:"#4caf50",fontSize:14,fontWeight:700}}>
            ✓ Оплата подтверждена — формируем билеты...
          </div>
          <button onClick={onPaid} style={{...GB(),width:"100%",padding:"14px",borderRadius:13,fontSize:15}}>Получить билеты →</button>
        </div>
      )}
    </div>
  );
}

/* ══ TICKET VIEW ═══════════════════════════════════════════════ */
function TicketView({b,movie,session,onDownload}){
  if(!movie||!session)return null;
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=140x140&bgcolor=0d0d0d&color=c9a84c&data=${b.code}`;
  return(
    <div style={{...CARD,position:"relative",overflow:"hidden",border:`1px solid ${movie.color}33`}}>
      <div style={{position:"absolute",top:0,left:0,bottom:0,width:5,background:`linear-gradient(180deg,${movie.color},transparent)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,marginBottom:3}}>{movie.title}</div>
          <div style={{fontSize:12,color:"#666"}}>{session.time} · {session.hall} · {b.date}</div>
        </div>
        <img src={qrUrl} alt="QR" style={{width:70,height:70,borderRadius:8,border:"1px solid #222"}}/>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {b.seats.map(s=><span key={s} style={{background:"#141414",border:"1px solid #222",borderRadius:6,padding:"3px 8px",fontSize:11,color:"#c9a84c"}}>{s}</span>)}
      </div>
      {b.snacks&&Object.keys(b.snacks).length>0&&(
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>
          {Object.entries(b.snacks).map(([id,q])=>{const sn=SNACKS.find(x=>x.id===id);return sn?`${sn.emoji}${sn.name}×${q}`:null;}).filter(Boolean).join(" · ")}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#333",letterSpacing:2,fontFamily:"monospace"}}>#{b.code}</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16,fontWeight:900,color:"#c9a84c"}}>{b.total.toLocaleString()} ₸</span>
          {onDownload&&<button onClick={onDownload} style={{background:"#111",border:"1px solid #222",borderRadius:8,padding:"5px 12px",color:"#aaa",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>⬇ Скачать</button>}
        </div>
      </div>
    </div>
  );
}

/* ══ ADMIN PANEL ═══════════════════════════════════════════════ */
function AdminPanel({onClose}){
  const[tab,setTab]=useState("movies");
  const[movies,setMovies]=useState(DB.movies());
  const[editMovie,setEditMovie]=useState(null); // null=closed, {}=new, {...}=edit
  const[pass,setPass]=useState("");
  const[authed,setAuthed]=useState(!!sessionStorage.getItem("kl_admin"));
  const[passErr,setPassErr]=useState("");

  const saveAndSet=m=>{setMovies(m);DB.saveMovies(m);};

  if(!authed) return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(16px)"}}>
      <div style={{...CARD,width:"100%",maxWidth:380,padding:32,textAlign:"center",borderRadius:22}}>
        <div style={{fontSize:36,marginBottom:12}}>🔐</div>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:6}}>Вход в Админ панель</h2>
        <p style={{fontSize:13,color:"#555",marginBottom:20}}>Введите пароль администратора</p>
        <input type="password" placeholder="Пароль" value={pass} onChange={e=>setPass(e.target.value)} style={INP} onKeyDown={e=>e.key==="Enter"&&(pass===DB.adminPass()?(sessionStorage.setItem("kl_admin","1"),setAuthed(true)):(setPassErr("Неверный пароль"),setPass("")))}/>
        {passErr&&<div style={{color:"#e05c3a",fontSize:12,marginBottom:10}}>{passErr}</div>}
        <button onClick={()=>{if(pass===DB.adminPass()){sessionStorage.setItem("kl_admin","1");setAuthed(true);}else{setPassErr("Неверный пароль");setPass("");} }} style={{...GB(),width:"100%",padding:"12px",borderRadius:11,fontSize:15}}>Войти</button>
        <button onClick={onClose} style={{width:"100%",marginTop:8,padding:"10px",background:"transparent",border:"none",color:"#444",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Отмена</button>
      </div>
    </div>
  );

  const allBookings=DB.allBookings();
  const revenue=allBookings.reduce((s,b)=>s+b.total,0);

  return(
    <div style={{position:"fixed",inset:0,background:"#060606",zIndex:500,overflow:"auto",fontFamily:"'Outfit',sans-serif"}}>
      {/* Admin Nav */}
      <div style={{background:"#0a0a0a",borderBottom:"1px solid #1a1a1a",padding:"0 4%",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:10,letterSpacing:3,color:"#c9a84c",textTransform:"uppercase"}}>KINOLAND · ADMIN</div>
          <div style={{display:"flex",gap:2}}>
            {[["movies","🎬 Фильмы"],["sales","📊 Продажи"],["settings","⚙️ Настройки"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",border:"none",borderRadius:8,background:tab===t?"#c9a84c":"transparent",color:tab===t?"#000":"#888",fontWeight:tab===t?700:400,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{background:"#111",border:"1px solid #222",borderRadius:8,padding:"6px 16px",color:"#888",cursor:"pointer",fontSize:13,fontFamily:"'Outfit',sans-serif"}}>× Закрыть</button>
      </div>

      <div style={{padding:"28px 4%",maxWidth:1100,margin:"0 auto"}}>

        {/* MOVIES TAB */}
        {tab==="movies"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:800}}>Управление фильмами</h2>
              <button onClick={()=>setEditMovie({id:Date.now(),title:"",genre:"",dur:"",rating:"0+",emoji:"🎬",color:"#c9a84c",poster:null,desc:"",sessions:[]})} style={{...GB(),padding:"9px 20px",borderRadius:40,fontSize:13}}>+ Добавить фильм</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {movies.map(m=>(
                <div key={m.id} style={{...CARD,display:"flex",alignItems:"center",gap:16,padding:"16px 20px"}}>
                  {m.poster?<img src={m.poster} alt="" style={{width:60,height:80,objectFit:"cover",borderRadius:8}}/>:<div style={{width:60,height:80,borderRadius:8,background:`linear-gradient(135deg,${m.color}44,#111)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{m.emoji}</div>}
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:17}}>{m.title}</div>
                    <div style={{fontSize:12,color:"#666",marginTop:2}}>{m.genre} · {m.dur} · {m.rating}</div>
                    <div style={{fontSize:11,color:"#555",marginTop:4}}>{m.sessions.length} сеансов</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setEditMovie({...m})} style={{padding:"7px 16px",background:"#111",border:"1px solid #222",borderRadius:8,color:"#aaa",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✏️ Редактировать</button>
                    <button onClick={()=>{if(confirm(`Удалить "${m.title}"?`))saveAndSet(movies.filter(x=>x.id!==m.id));}} style={{padding:"7px 16px",background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:8,color:"#e05c3a",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>🗑</button>
                  </div>
                </div>
              ))}
              {movies.length===0&&<div style={{textAlign:"center",color:"#444",padding:"40px"}}>Нет фильмов. Добавьте первый!</div>}
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {tab==="sales"&&(
          <div>
            <h2 style={{fontSize:22,fontWeight:800,marginBottom:16}}>Продажи</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:24}}>
              {[["🎟️","Всего билетов",allBookings.reduce((s,b)=>s+b.seats.length,0)],["💰","Выручка",revenue.toLocaleString()+" ₸"],["👥","Покупателей",DB.users().length],["🎬","Транзакций",allBookings.length]].map(([ic,l,v])=>(
                <div key={l} style={{...CARD,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:6}}>{ic}</div>
                  <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:22,fontWeight:900,color:"#c9a84c"}}>{v}</div>
                </div>
              ))}
            </div>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>Последние заказы</h3>
            <div style={{...CARD,padding:0,overflow:"hidden"}}>
              {allBookings.length===0?<div style={{padding:"30px",textAlign:"center",color:"#444"}}>Заказов пока нет</div>:(
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{borderBottom:"1px solid #1a1a1a"}}>
                    {["Код","Покупатель","Фильм","Сеанс","Мест","Сумма"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[...allBookings].reverse().map(b=>{
                      const mv=movies.find(x=>x.id===b.movieId), ss=mv?.sessions.find(x=>x.id===b.sessionId);
                      return(
                        <tr key={b.id} style={{borderBottom:"1px solid #111"}}>
                          <td style={{padding:"10px 14px",fontSize:11,color:"#c9a84c",fontFamily:"monospace"}}>#{b.code}</td>
                          <td style={{padding:"10px 14px",fontSize:12,color:"#ddd"}}>{b.userName}<br/><span style={{fontSize:10,color:"#555"}}>{b.userPhone}</span></td>
                          <td style={{padding:"10px 14px",fontSize:13,fontWeight:600}}>{mv?.title||"—"}</td>
                          <td style={{padding:"10px 14px",fontSize:12,color:"#888"}}>{ss?.time||"—"} · {ss?.hall||"—"}</td>
                          <td style={{padding:"10px 14px",fontSize:13}}>{b.seats.length}</td>
                          <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#c9a84c"}}>{b.total.toLocaleString()} ₸</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab==="settings"&&(
          <SettingsTab/>
        )}
      </div>

      {/* EDIT MOVIE MODAL */}
      {editMovie&&(
        <MovieEditor movie={editMovie} movies={movies} onSave={updated=>{
          const exists=movies.find(m=>m.id===updated.id);
          const next=exists?movies.map(m=>m.id===updated.id?updated:m):[...movies,updated];
          saveAndSet(next); setEditMovie(null);
        }} onClose={()=>setEditMovie(null)}/>
      )}
    </div>
  );
}

function SettingsTab(){
  const[np,setNp]=useState(""); const[cp,setCp]=useState(""); const[msg,setMsg]=useState("");
  const change=()=>{
    if(!cp||!np)return setMsg("Заполните оба поля");
    if(cp!==DB.adminPass())return setMsg("Текущий пароль неверный");
    localStorage.setItem("kl_admin_pass",np); setMsg("✓ Пароль изменён"); setCp(""); setNp("");
  };
  return(
    <div style={{maxWidth:400}}>
      <h2 style={{fontSize:22,fontWeight:800,marginBottom:20}}>Настройки</h2>
      <div style={{...CARD,marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>Изменить пароль администратора</h3>
        <input type="password" placeholder="Текущий пароль" value={cp} onChange={e=>setCp(e.target.value)} style={INP}/>
        <input type="password" placeholder="Новый пароль" value={np} onChange={e=>setNp(e.target.value)} style={INP}/>
        {msg&&<div style={{fontSize:12,color:msg.startsWith("✓")?"#4caf50":"#e05c3a",marginBottom:8}}>{msg}</div>}
        <button onClick={change} style={{...GB(),padding:"10px 20px",borderRadius:10,fontSize:14}}>Изменить пароль</button>
      </div>
      <div style={{...CARD}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:8}}>Kaspi Pay</h3>
        <div style={{fontSize:13,color:"#888",marginBottom:4}}>Номер Kaspi: <span style={{color:"#c9a84c"}}>{KASPI_PHONE}</span></div>
        <div style={{fontSize:12,color:"#555"}}>Для смены номера обратитесь к разработчику</div>
      </div>
    </div>
  );
}

function MovieEditor({movie,movies,onSave,onClose}){
  const[f,setF]=useState({...movie,sessions:movie.sessions||[]});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const fileRef=useRef();

  const uploadPoster=e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>setF(p=>({...p,poster:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const addSession=()=>setF(p=>({...p,sessions:[...p.sessions,{id:"s"+Date.now(),time:"12:00",hall:"Зал 1",price:1200}]}));
  const updateSess=(idx,key,val)=>setF(p=>({...p,sessions:p.sessions.map((s,i)=>i===idx?{...s,[key]:val}:s)}));
  const removeSess=idx=>setF(p=>({...p,sessions:p.sessions.filter((_,i)=>i!==idx)}));

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:600,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"24px 16px"}} onClick={onClose}>
      <div style={{...CARD,width:"100%",maxWidth:620,padding:28,borderRadius:22,animation:"fadeUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontSize:20,fontWeight:900,marginBottom:18}}>{movie.title?"Редактировать фильм":"Добавить фильм"}</h2>

        {/* Poster */}
        <div style={{display:"flex",gap:16,marginBottom:16,alignItems:"flex-start"}}>
          <div style={{width:90,height:120,borderRadius:10,background:`linear-gradient(135deg,${f.color}44,#111)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,cursor:"pointer",border:"2px dashed #222",flexShrink:0}} onClick={()=>fileRef.current.click()}>
            {f.poster?<img src={f.poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:9}}/>:f.emoji}
          </div>
          <div style={{flex:1}}>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadPoster} style={{display:"none"}}/>
            <button onClick={()=>fileRef.current.click()} style={{...GB(),padding:"8px 16px",borderRadius:9,fontSize:12,marginBottom:8}}>📷 Загрузить афишу</button>
            {f.poster&&<button onClick={()=>setF(p=>({...p,poster:null}))} style={{display:"block",background:"transparent",border:"none",color:"#e05c3a",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Удалить фото</button>}
            <div style={{marginTop:8,display:"flex",gap:8}}>
              <input placeholder="Emoji" value={f.emoji} onChange={set("emoji")} style={{...INP,marginBottom:0,width:70,textAlign:"center"}}/>
              <input type="color" value={f.color} onChange={set("color")} style={{width:44,height:40,borderRadius:8,border:"1px solid #222",background:"transparent",cursor:"pointer"}}/>
              <span style={{fontSize:11,color:"#555",alignSelf:"center"}}>Цвет акцента</span>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:11,color:"#666",marginBottom:4}}>Название</div><input placeholder="Пейіш 2" value={f.title} onChange={set("title")} style={{...INP,marginBottom:0}}/></div>
          <div><div style={{fontSize:11,color:"#666",marginBottom:4}}>Жанр</div><input placeholder="Драма · Казахстан" value={f.genre} onChange={set("genre")} style={{...INP,marginBottom:0}}/></div>
          <div><div style={{fontSize:11,color:"#666",marginBottom:4}}>Длительность</div><input placeholder="105 мин" value={f.dur} onChange={set("dur")} style={{...INP,marginBottom:0}}/></div>
          <div><div style={{fontSize:11,color:"#666",marginBottom:4}}>Возрастной рейтинг</div>
            <select value={f.rating} onChange={set("rating")} style={{...INP,marginBottom:0}}>
              {["0+","6+","12+","16+","18+"].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginTop:8}}><div style={{fontSize:11,color:"#666",marginBottom:4}}>Описание</div>
          <textarea placeholder="Описание фильма..." value={f.desc} onChange={set("desc")} style={{...INP,height:70,resize:"vertical",marginBottom:0}}/>
        </div>

        {/* Sessions */}
        <div style={{marginTop:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:14}}>Сеансы</div>
          <button onClick={addSession} style={{...GB(),padding:"6px 14px",borderRadius:8,fontSize:12}}>+ Добавить сеанс</button>
        </div>
        {f.sessions.map((s,i)=>(
          <div key={s.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center",background:"#0a0a0a",borderRadius:10,padding:"10px 12px"}}>
            <div><div style={{fontSize:10,color:"#555",marginBottom:2}}>Время</div>
              <input type="time" value={s.time} onChange={e=>updateSess(i,"time",e.target.value)} style={{...INP,width:100,marginBottom:0,padding:"6px 8px"}}/>
            </div>
            <div style={{flex:1}}><div style={{fontSize:10,color:"#555",marginBottom:2}}>Зал</div>
              <select value={s.hall} onChange={e=>updateSess(i,"hall",e.target.value)} style={{...INP,marginBottom:0,padding:"6px 8px"}}>
                {HALLS.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div><div style={{fontSize:10,color:"#555",marginBottom:2}}>Цена ₸</div>
              <input type="number" value={s.price} onChange={e=>updateSess(i,"price",+e.target.value)} style={{...INP,width:90,marginBottom:0,padding:"6px 8px"}}/>
            </div>
            <button onClick={()=>removeSess(i)} style={{background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:8,padding:"6px 10px",color:"#e05c3a",cursor:"pointer",fontSize:14,alignSelf:"flex-end",marginBottom:0,fontFamily:"'Outfit',sans-serif"}}>×</button>
          </div>
        ))}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={()=>onSave(f)} style={{...GB(),flex:1,padding:"12px",borderRadius:11,fontSize:15}}>Сохранить</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"#111",border:"1px solid #222",borderRadius:11,color:"#888",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:15}}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN APP ══════════════════════════════════════════════════ */
export default function KinolandApp(){
  const[page,setPage]=useState("home");
  const[movies,setMovies]=useState(DB.movies());
  const[takenCache,setTakenCache]=useState(buildTakenCache());
  const[movie,setMovie]=useState(null);
  const[session,setSession]=useState(null);
  const[seats,setSeats]=useState([]);
  const[seatTotal,setSeatTot]=useState(0);
  const[snacks,setSnacks]=useState({});
  const[payTotal,setPayTotal]=useState(0);
  const[pendingCode,setPendingCode]=useState(null);
  const[user,setUser]=useState(null);
  const[showAuth,setAuth]=useState(false);
  const[showAdmin,setAdmin]=useState(false);
  const[lastBook,setLastBook]=useState(null);
  const[heroIdx,setHeroIdx]=useState(0);
  const[pending,setPending]=useState(null);

  useEffect(()=>{
    try{const s=localStorage.getItem("kl_me");if(s){const u=JSON.parse(s);const f=DB.users().find(x=>x.id===u.id);if(f)setUser(f);}}catch{}
  },[]);
  useEffect(()=>{ const t=setInterval(()=>setHeroIdx(i=>(i+1)%movies.length),4200); return()=>clearInterval(t); },[movies.length]);

  const reloadMovies=()=>{ const m=DB.movies(); setMovies(m); setTakenCache(buildTakenCache()); };
  const persistUser=u=>{setUser(u);localStorage.setItem("kl_me",JSON.stringify(u));};
  const refreshUser=upd=>{const arr=DB.users(),i=arr.findIndex(x=>x.id===upd.id);if(i>=0){arr[i]=upd;DB.saveUsers(arr);}persistUser(upd);};

  const handleAuth=u=>{persistUser(u);setAuth(false);if(pending){setSeats(pending.seats);setSeatTot(pending.seatTotal);setPending(null);setPage("snacks");}};
  const handleSeatConfirm=(s,t)=>{if(!user){setPending({seats:s,seatTotal:t});setAuth(true);return;}setSeats(s);setSeatTot(t);setPage("snacks");};
  const handleSnackFinish=(sc,grand)=>{setSnacks(sc);setPayTotal(grand);setPendingCode("KL"+Math.random().toString(36).substr(2,6).toUpperCase());setPage("payment");};

  const handlePaid=()=>{
    const b={id:Date.now(),code:pendingCode,movieId:movie.id,sessionId:session.id,seats,snacks,total:payTotal,date:new Date().toLocaleDateString("ru-KZ"),purchasedAt:Date.now()};
    const newTaken={...takenCache};
    if(!newTaken[session.id])newTaken[session.id]=new Set();
    seats.forEach(s=>newTaken[session.id].add(s));
    setTakenCache(newTaken);
    const upd={...user,bookings:[...(user.bookings||[]),b]};
    refreshUser(upd);setLastBook(b);setPage("done");
  };

  const logout=()=>{setUser(null);localStorage.removeItem("kl_me");setPage("home");};
  const hero=movies[heroIdx]||movies[0];
  if(!hero)return<div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>Нет фильмов. Добавьте в админ-панели.</div>;

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#fff",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;background:#0a0a0a}
        ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:3px}
        button:focus,input:focus,select:focus,textarea:focus{outline:none}
        input:focus,textarea:focus,select:focus{border-color:#c9a84c!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        .mcard:hover{transform:translateY(-6px)!important;box-shadow:0 16px 50px rgba(0,0,0,0.6)!important}
        .mcard:hover .cov{opacity:1!important}
        .ssb:hover{background:#c9a84c!important;color:#000!important;border-color:#c9a84c!important}
        .navl:hover{color:#c9a84c!important}
        select option{background:#111}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(8,8,8,0.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #141414",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 5%",height:66}}>
        <button onClick={()=>setPage("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#c9a84c,#e8c96a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🎬</div>
          <div><div style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:1,lineHeight:1}}>KINOLAND</div><div style={{fontSize:8,color:"#c9a84c",letterSpacing:3}}>САРЫАГАШ</div></div>
        </button>
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          <button className="navl" onClick={()=>setPage("home")} style={{background:"none",border:"none",color:page==="home"?"#c9a84c":"#777",cursor:"pointer",fontSize:13,padding:"7px 13px",fontFamily:"'Outfit',sans-serif",transition:"color 0.2s"}}>Афиша</button>
          {user&&<button className="navl" onClick={()=>setPage("profile")} style={{background:"none",border:"none",color:page==="profile"?"#c9a84c":"#777",cursor:"pointer",fontSize:13,padding:"7px 13px",fontFamily:"'Outfit',sans-serif",transition:"color 0.2s"}}>Мои билеты</button>}
          <button onClick={()=>setAdmin(true)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:12,padding:"7px 10px",fontFamily:"'Outfit',sans-serif"}} title="Админ">⚙️</button>
          {user?(
            <div style={{display:"flex",alignItems:"center",gap:7,background:"#0f0f0f",borderRadius:40,padding:"4px 13px 4px 4px",border:"1px solid #1e1e1e",marginLeft:4}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#e8c96a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#000"}}>{user.name[0].toUpperCase()}</div>
              <span style={{fontSize:12,color:"#ddd"}}>{user.name.split(" ")[0]}</span>
              <button onClick={logout} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:15,marginLeft:2,fontFamily:"'Outfit',sans-serif"}}>×</button>
            </div>
          ):(
            <button onClick={()=>setAuth(true)} style={{marginLeft:4,background:"linear-gradient(135deg,#c9a84c,#e8c96a)",border:"none",borderRadius:40,padding:"8px 18px",fontWeight:700,fontSize:12,color:"#000",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Войти</button>
          )}
        </div>
      </nav>

      {/* HOME */}
      {page==="home"&&(
        <div>
          <div style={{position:"relative",minHeight:"70vh",display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 20% 55%,${hero.color}18 0%,transparent 55%),#080808`,transition:"background 1.5s ease"}}/>
            <div style={{position:"absolute",top:"50%",right:"2%",transform:"translateY(-50%)",fontSize:"clamp(100px,16vw,200px)",opacity:hero.poster?0:0.05,lineHeight:1,userSelect:"none"}}>{hero.emoji}</div>
            {hero.poster&&<div style={{position:"absolute",right:0,top:0,bottom:0,width:"45%",background:`url(${hero.poster}) center/cover`}}><div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#080808 0%,transparent 60%)"}}/></div>}
            <div style={{position:"relative",zIndex:1,padding:"0 6% 60px",animation:"fadeUp 0.5s ease"}}>
              <div style={{display:"flex",gap:5,marginBottom:16}}>
                {movies.map((_,i)=><button key={i} onClick={()=>setHeroIdx(i)} style={{width:i===heroIdx?24:7,height:7,borderRadius:4,background:i===heroIdx?"#c9a84c":"#2a2a2a",border:"none",cursor:"pointer",transition:"all 0.3s"}}/>)}
              </div>
              <div style={{fontSize:9,letterSpacing:4,color:"#c9a84c",textTransform:"uppercase",marginBottom:10}}>Открытие · 25 марта 2026</div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,7vw,86px)",fontWeight:900,lineHeight:0.93,marginBottom:12}}>{hero.title}</h1>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                <span style={{background:"#101010",border:"1px solid #1e1e1e",borderRadius:20,padding:"3px 11px",fontSize:11,color:"#888"}}>{hero.genre}</span>
                <span style={{background:"#101010",border:"1px solid #1e1e1e",borderRadius:20,padding:"3px 11px",fontSize:11,color:"#888"}}>⏱ {hero.dur}</span>
                <span style={{background:"#c9a84c18",border:"1px solid #c9a84c30",borderRadius:20,padding:"3px 11px",fontSize:11,color:"#c9a84c"}}>{hero.rating}</span>
              </div>
              <p style={{color:"#888",maxWidth:440,fontSize:13,lineHeight:1.8,marginBottom:24}}>{hero.desc}</p>
              <button onClick={()=>{setMovie(hero);setPage("movie");}} style={{...GB(),padding:"13px 30px",fontSize:14,boxShadow:"0 4px 20px #c9a84c28"}}>Купить билет →</button>
            </div>
          </div>

          <div style={{padding:"48px 5%"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
              <h2 style={{fontSize:22,fontWeight:800}}>Афиша на сегодня</h2>
              <span style={{fontSize:11,color:"#444",background:"#0a0a0a",border:"1px solid #141414",borderRadius:14,padding:"3px 11px"}}>{movies.length} фильм{movies.length===1?"":"а"} · 3 зала</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
              {movies.map(m=>(
                <div key={m.id} className="mcard" onClick={()=>{setMovie(m);setPage("movie");}} style={{background:"#0a0a0a",borderRadius:18,overflow:"hidden",border:"1px solid #141414",cursor:"pointer",transition:"transform 0.3s,box-shadow 0.3s",boxShadow:`0 0 20px ${m.color}08`}}>
                  <div style={{height:190,background:m.poster?`url(${m.poster}) center/cover`:`linear-gradient(135deg,${m.color}28,#0a0a0a)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:68,position:"relative"}}>
                    {!m.poster&&<span style={{animation:"pulse 3.5s ease infinite",filter:"drop-shadow(0 4px 18px rgba(0,0,0,0.7))"}}>{m.emoji}</span>}
                    <div style={{position:"absolute",top:9,right:9,background:"rgba(0,0,0,0.82)",borderRadius:6,padding:"2px 8px",fontSize:10,color:"#ccc",border:"1px solid #1e1e1e"}}>{m.rating}</div>
                    <div className="cov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}>
                      <span style={{background:"linear-gradient(135deg,#c9a84c,#e8c96a)",color:"#000",padding:"9px 22px",borderRadius:40,fontWeight:800,fontSize:12}}>Купить билет</span>
                    </div>
                  </div>
                  <div style={{padding:"14px 16px"}}>
                    <h3 style={{fontSize:17,fontWeight:800,marginBottom:4}}>{m.title}</h3>
                    <div style={{fontSize:10,color:"#444",marginBottom:10}}>{m.genre} · {m.dur}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {m.sessions.map(s=><span key={s.id} style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:6,padding:"2px 8px",fontSize:11,color:"#c9a84c"}}>{s.time}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"#050505",borderTop:"1px solid #0f0f0f",padding:"28px 5%",display:"flex",gap:28,flexWrap:"wrap"}}>
            {[["📍","Адрес","г. Сарыагаш"],["📞","Телефон",KASPI_PHONE],["🕐","Режим","09:00–23:00"],["💳","Оплата","Kaspi Pay, карты"],["🎭","Залы","3 зала · 120 мест"]].map(([ic,l,v])=>(
              <div key={l}><div style={{fontSize:17,marginBottom:5}}>{ic}</div><div style={{fontSize:9,color:"#2a2a2a",textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>{l}</div><div style={{fontSize:12,color:"#888"}}>{v}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* MOVIE */}
      {page==="movie"&&movie&&(
        <div style={{padding:"34px 5%",maxWidth:820,margin:"0 auto",animation:"fadeUp 0.4s ease"}}>
          <button onClick={()=>setPage("home")} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,marginBottom:22,fontFamily:"'Outfit',sans-serif"}}>← Афиша</button>
          <div style={{...CARD,overflow:"hidden",marginBottom:22,borderRadius:20}}>
            <div style={{height:160,background:movie.poster?`url(${movie.poster}) center/cover`:`linear-gradient(135deg,${movie.color}38,#0d0d0d)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 32px",position:"relative"}}>
              {movie.poster&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)"}}/>}
              <div style={{position:"relative",zIndex:1}}>
                <div style={{fontSize:8,letterSpacing:3,color:"#c9a84c",marginBottom:7}}>KINOLAND · САРЫАГАШ</div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,marginBottom:7}}>{movie.title}</h1>
                <div style={{display:"flex",gap:9,flexWrap:"wrap",fontSize:12,color:"#aaa"}}>
                  <span>{movie.genre}</span><span>·</span><span>⏱ {movie.dur}</span><span style={{color:"#c9a84c"}}>{movie.rating}</span>
                </div>
              </div>
              {!movie.poster&&<div style={{fontSize:60,position:"relative",zIndex:1}}>{movie.emoji}</div>}
            </div>
            <div style={{padding:"16px 32px 22px"}}><p style={{color:"#999",lineHeight:1.8,fontSize:13}}>{movie.desc}</p></div>
          </div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:12}}>Выберите сеанс</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:9}}>
            {movie.sessions.map(s=>(
              <button key={s.id} className="ssb" onClick={()=>{setSession(s);setPage("seats");}}
                style={{background:"#0a0a0a",border:"1px solid #181818",borderRadius:13,padding:"14px 16px",textAlign:"left",cursor:"pointer",transition:"all 0.18s",color:"#fff",fontFamily:"'Outfit',sans-serif"}}>
                <div style={{fontSize:22,fontWeight:900,marginBottom:2}}>{s.time}</div>
                <div style={{fontSize:10,color:"#555",marginBottom:7}}>{s.hall}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>{s.price.toLocaleString()} ₸</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEATS */}
      {page==="seats"&&movie&&session&&(
        <div style={{padding:"34px 5%",maxWidth:840,margin:"0 auto",animation:"fadeUp 0.4s ease"}}>
          <button onClick={()=>setPage("movie")} style={{background:"none",border:"none",color:"#777",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,marginBottom:18,fontFamily:"'Outfit',sans-serif"}}>← Назад</button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <h2 style={{fontSize:19,fontWeight:800}}>{movie.title}</h2>
            <span style={{fontSize:11,color:"#888",background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:8,padding:"3px 9px"}}>{session.time} · {session.hall} · 120 мест</span>
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,color:"#555",background:"#0a0a0a",border:"1px solid #141414",borderRadius:7,padding:"5px 12px",marginBottom:16}}>
            ← Вход в зал только слева
          </div>
          <SeatMap session={session} movie={movie} takenCache={takenCache} onConfirm={handleSeatConfirm}/>
        </div>
      )}

      {/* SNACKS */}
      {page==="snacks"&&movie&&session&&(
        <div style={{padding:"34px 5%",animation:"fadeUp 0.4s ease"}}>
          <SnackStep seats={seats} seatTotal={seatTotal} movie={movie} onBack={()=>setPage("seats")} onFinish={handleSnackFinish}/>
        </div>
      )}

      {/* PAYMENT */}
      {page==="payment"&&movie&&pendingCode&&(
        <div style={{padding:"34px 5%",animation:"fadeUp 0.4s ease"}}>
          <KaspiPayment total={payTotal} code={pendingCode} movie={movie} onBack={()=>setPage("snacks")} onPaid={handlePaid}/>
        </div>
      )}

      {/* DONE */}
      {page==="done"&&lastBook&&(()=>{
        const m=movies.find(x=>x.id===lastBook.movieId),s=m?.sessions.find(x=>x.id===lastBook.sessionId);
        return(
          <div style={{padding:"50px 5%",maxWidth:500,margin:"0 auto",textAlign:"center",animation:"fadeUp 0.5s ease"}}>
            <div style={{fontSize:66,marginBottom:16}}>🎉</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,marginBottom:8}}>Готово!</h1>
            <p style={{color:"#666",marginBottom:24}}>Оплата прошла. Покажите QR на кассе или скачайте билет.</p>
            <TicketView b={lastBook} movie={m} session={s} onDownload={()=>downloadTicket(lastBook,m,s)}/>
            <div style={{display:"flex",gap:9,justifyContent:"center",marginTop:20}}>
              <button onClick={()=>setPage("profile")} style={{...GB(),padding:"11px 22px",borderRadius:40,fontSize:13}}>Мои билеты</button>
              <button onClick={()=>{setPage("home");setLastBook(null);}} style={{background:"#0f0f0f",border:"1px solid #1e1e1e",borderRadius:40,padding:"11px 22px",fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:13}}>На главную</button>
            </div>
          </div>
        );
      })()}

      {/* PROFILE */}
      {page==="profile"&&user&&(
        <div style={{padding:"34px 5%",maxWidth:640,margin:"0 auto",animation:"fadeUp 0.4s ease"}}>
          <div style={{...CARD,marginBottom:22,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",padding:"22px"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#e8c96a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#000",flexShrink:0}}>{user.name[0].toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:18,fontWeight:800}}>{user.name}</div><div style={{fontSize:12,color:"#555"}}>{user.phone}{user.email?` · ${user.email}`:""}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#333",textTransform:"uppercase",letterSpacing:2}}>Билетов куплено</div><div style={{fontSize:30,fontWeight:900,color:"#c9a84c"}}>{user.bookings?.length||0}</div></div>
          </div>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:14}}>История покупок</h2>
          {!user.bookings?.length?(
            <div style={{textAlign:"center",color:"#444",padding:"40px 0"}}>
              <div style={{fontSize:40,marginBottom:10}}>🎟️</div>
              <div style={{marginBottom:16}}>Пока нет купленных билетов</div>
              <button onClick={()=>setPage("home")} style={{...GB(),padding:"10px 22px",borderRadius:40,fontSize:13}}>Купить первый билет</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...user.bookings].reverse().map(b=>{
                const m=movies.find(x=>x.id===b.movieId),s=m?.sessions.find(x=>x.id===b.sessionId);
                return <TicketView key={b.id} b={b} movie={m} session={s} onDownload={()=>downloadTicket(b,m,s)}/>;
              })}
            </div>
          )}
        </div>
      )}

      {showAuth&&<AuthModal onClose={()=>{setAuth(false);setPending(null);}} onAuth={handleAuth}/>}
      {showAdmin&&<AdminPanel onClose={()=>{setAdmin(false);reloadMovies();}}/>}
    </div>
  );
}
