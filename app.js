// ===== API CONFIG (aus config.js) =====
const API_URL = CONFIG.supabase.url;
const API_KEY = CONFIG.supabase.key;
const API_HEADERS = {'apikey':API_KEY,'Authorization':'Bearer '+API_KEY,'Content-Type':'application/json','Prefer':'return=representation'};

// ===== EMAILJS CONFIG (aus config.js) =====
const EMAILJS_PUBLIC_KEY = CONFIG.emailjs.publicKey;
const EMAILJS_SERVICE_ID = CONFIG.emailjs.serviceId;
const EMAILJS_TEMPLATE_ID = CONFIG.emailjs.templateId;

// ===== DEMO MODE =====
const DEMO_MODE = CONFIG.forceDemo || new URLSearchParams(window.location.search).has('demo');
const DEMO_TRAINERS = [
    {id:'anna',name:'Anna Schmidt',initials:'AS',color:'#4a7ce8',photo:'https://i.pravatar.cc/150?img=5',is_guest:false,is_active:true},
    {id:'marco',name:'Marco Weber',initials:'MW',color:'#e85d5d',photo:'https://i.pravatar.cc/150?img=12',is_guest:false,is_active:true},
    {id:'julia',name:'Julia Meier',initials:'JM',color:'#f59e0b',photo:'https://i.pravatar.cc/150?img=9',is_guest:true,is_active:true,start_date:'2025-12-23',end_date:'2025-12-28',payout_price_45:100,sale_price_45:120,payout_lecture:150,travel_cost:280,hotel_cost:450,other_cost:50,arrival_date:'2025-12-22',departure_date:'2025-12-29',arrival_type:'flight',departure_type:'flight',arrival_flight:'LH 1832',departure_flight:'LH 1833'}
];
const DEMO_CLIENTS = [
    {id:1,name:'Max Müller',email:'max@example.com',phone1:'+49 170 1234567',is_member:true},
    {id:2,name:'Sarah Koch',email:'sarah@example.com',phone1:'+49 171 2345678',is_member:false},
    {id:3,name:'Lisa Wagner',email:'lisa@example.com',phone1:'+49 172 3456789',is_member:true},
    {id:4,name:'Tom Fischer',email:'tom@example.com',phone1:'+49 173 4567890',is_member:false},
    {id:5,name:'Emma Braun',email:'emma@example.com',phone1:'+49 174 5678901',is_member:true},
    {id:6,name:'Peter & Maria Schmidt',email:'schmidt@example.com',phone1:'+49 175 6789012',is_member:false,partner:'Maria Schmidt'},
    {id:7,name:'Sandra Huber',email:'sandra@example.com',phone1:'+49 176 7890123',is_member:false},
    {id:8,name:'Eva & Daniel Hoffmann',email:'hoffmann@example.com',phone1:'+49 177 8901234',is_member:true,partner:'Daniel Hoffmann'},
    {id:9,name:'Markus Schwarz',email:'markus@example.com',phone1:'+49 178 9012345',is_member:false},
    {id:10,name:'Christina Wolf',email:'christina@example.com',phone1:'+49 179 0123456',is_member:true}
];
function generateDemoLessons(){
    const lessons=[];
    const demoClients=['Max Müller','Sarah Koch','Lisa Wagner','Tom Fischer','Emma Braun','Peter & Maria Schmidt','Sandra Huber','Eva & Daniel Hoffmann','Markus Schwarz','Christina Wolf'];
    // Camp: 23.-28. Dezember 2025 (6 Tage)
    for(let d=0;d<6;d++){
        const date=new Date(2025,11,23+d); // 23. Dez 2025
        const dateStr=date.toISOString().split('T')[0];
        let id=d*20+1;
        // Anna's lessons (regulär)
        lessons.push({id:id++,teacher:'anna',client:demoClients[d%10],date:dateStr,time:'09:00',dur:45,notes:'',location:'home'});
        lessons.push({id:id++,teacher:'anna',client:demoClients[(d+1)%10],date:dateStr,time:'10:00',dur:45,notes:'',location:'home'});
        lessons.push({id:id++,teacher:'anna',client:demoClients[(d+2)%10],date:dateStr,time:'14:00',dur:90,notes:'Intensiv-Training',location:'home'});
        // Marco's lessons (regulär)
        lessons.push({id:id++,teacher:'marco',client:demoClients[(d+3)%10],date:dateStr,time:'09:30',dur:45,notes:'',location:'home'});
        lessons.push({id:id++,teacher:'marco',client:demoClients[(d+4)%10],date:dateStr,time:'11:00',dur:90,notes:'Paar-Unterricht',location:'home'});
        lessons.push({id:id++,teacher:'marco',client:demoClients[(d+5)%10],date:dateStr,time:'15:00',dur:45,notes:'',location:'home'});
        // Julia's GROUP lessons (Gasttrainer - Camp Workshops)
        lessons.push({id:id++,teacher:'julia',client:'Salsa Styling Workshop',date:dateStr,time:'12:00',dur:60,notes:'GROUP',location:'home',customPrice:150});
        lessons.push({id:id++,teacher:'julia',client:'Bachata Sensual',date:dateStr,time:'16:00',dur:60,notes:'GROUP',location:'home',customPrice:150});
        lessons.push({id:id++,teacher:'julia',client:'Kizomba Basics',date:dateStr,time:'18:00',dur:60,notes:'GROUP',location:'home',customPrice:150});
    }
    return lessons;
}
if(DEMO_MODE){
    document.addEventListener('DOMContentLoaded',()=>{
        // Add DEMO badge
        const badge=document.createElement('div');
        badge.innerHTML='DEMO';
        badge.style.cssText='position:fixed;top:8px;right:8px;background:#ef4444;color:#fff;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:0.5px;z-index:10000;font-family:Poppins,sans-serif';
        document.body.appendChild(badge);
    });
}

// ===== FLIGHT TRACKING (AeroDataBox via RapidAPI) =====
let FLIGHT_API_KEY=localStorage.getItem('flight_api_key')||'';
const flightCache={};

async function fetchFlightStatus(flightNumber,flightDate){
if(!FLIGHT_API_KEY||!flightNumber)return null;
const cacheKey=flightNumber+'_'+flightDate;
if(flightCache[cacheKey]&&Date.now()-flightCache[cacheKey].ts<300000)return flightCache[cacheKey].data;
try{
const cleanFlightNum=flightNumber.replace(/\s/g,'').toUpperCase();
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),10000);
const r=await fetch('https://motus-flight-proxy.mail-markushomm.workers.dev/flight/'+cleanFlightNum+'/'+flightDate+'?key='+encodeURIComponent(FLIGHT_API_KEY),{signal:controller.signal});
clearTimeout(timeout);
if(!r.ok){
console.error('Flight API HTTP error:',r.status,r.statusText);
const errText=await r.text();
console.error('Error response:',errText);
return null;
}
const data=await r.json();
console.log('Flight API response:',data);
if(data&&data.length>0){
const flight=data[0];
const dep=flight.departure||{};
const arr=flight.arrival||{};
const result={
status:flight.status?.toLowerCase()||'scheduled',
airline:flight.airline?.name||'',
flightNumber:flight.number||'',
aircraft:flight.aircraft?.model||'',
departure:{
airport:dep.airport?.name||'',
iata:dep.airport?.iata||'',
scheduled:dep.scheduledTime?.local||dep.scheduledTime?.utc||'',
estimated:dep.predictedTime?.local||dep.revisedTime?.local||dep.scheduledTime?.local||'',
actual:dep.actualTime?.local||'',
delay:dep.delay||0,
gate:dep.gate||'',
terminal:dep.terminal||''
},
arrival:{
airport:arr.airport?.name||'',
iata:arr.airport?.iata||'',
scheduled:arr.scheduledTime?.local||arr.scheduledTime?.utc||'',
estimated:arr.predictedTime?.local||arr.revisedTime?.local||arr.scheduledTime?.local||'',
actual:arr.actualTime?.local||'',
delay:arr.delay||0,
gate:arr.gate||'',
terminal:arr.terminal||''
}
};
flightCache[cacheKey]={data:result,ts:Date.now()};
return result;
}
return null;
}catch(e){
console.error('Flight API error:',e);
if(e.name==='AbortError')toast('Timeout - bitte nochmal versuchen');
return null;
}
}

function getFlightStatusBadge(status,delay){
const statusMap={
'scheduled':{text:'Geplant',color:'#6b7280',icon:'🕐'},
'expected':{text:'Geplant',color:'#6b7280',icon:'🕐'},
'unknown':{text:'Geplant',color:'#6b7280',icon:'🕐'},
'active':{text:'Unterwegs',color:'#3b82f6',icon:'✈️'},
'enroute':{text:'Unterwegs',color:'#3b82f6',icon:'✈️'},
'airborne':{text:'Unterwegs',color:'#3b82f6',icon:'✈️'},
'landed':{text:'Gelandet',color:'#22c55e',icon:'✅'},
'arrived':{text:'Gelandet',color:'#22c55e',icon:'✅'},
'cancelled':{text:'Storniert',color:'#ef4444',icon:'❌'},
'incident':{text:'Zwischenfall',color:'#f97316',icon:'⚠️'},
'diverted':{text:'Umgeleitet',color:'#f97316',icon:'↪️'}
};
const s=statusMap[status]||{text:status||'Unbekannt',color:'#6b7280',icon:'❓'};
let badge='<span style="background:'+s.color+';color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">'+s.icon+' '+s.text+'</span>';
if(delay&&delay>0){
badge+=' <span style="color:#ef4444;font-size:11px;font-weight:600">+'+delay+' min</span>';
}
return badge;
}

function formatFlightTime(timeString){
if(!timeString)return'-';
// AeroDataBox returns "2026-01-10 14:30" or ISO format
if(timeString.includes(' ')){
const timePart=timeString.split(' ')[1];
return timePart?timePart.substring(0,5):'-';
}
const d=new Date(timeString);
if(isNaN(d))return timeString.substring(11,16)||'-';
return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
}

function getFlightStatusText(status){
const map={'scheduled':'Geplant','expected':'Geplant','unknown':'Geplant','active':'Unterwegs','enroute':'Unterwegs','airborne':'Unterwegs','landed':'Gelandet','arrived':'Gelandet','cancelled':'Storniert'};
return map[status]||status||'Geplant';
}

async function setFlightApiKey(){
const current=FLIGHT_API_KEY?'Aktuell: '+FLIGHT_API_KEY.slice(0,8)+'...'+FLIGHT_API_KEY.slice(-4):'Noch nicht gesetzt';
const key=prompt('RapidAPI Key (AeroDataBox):\n'+current+'\n\nNeuen Key eingeben\n(oder "clear" zum Löschen):');
if(key===null)return;
if(key.toLowerCase()==='clear'){
FLIGHT_API_KEY='';
localStorage.removeItem('flight_api_key');
if(online)syncAppConfig();
toast('API Key gelöscht');
updateFlightApiStatus();
return;
}
if(key.trim()){
FLIGHT_API_KEY=key.trim();
localStorage.setItem('flight_api_key',FLIGHT_API_KEY);
if(online)syncAppConfig();
toast('API Key gespeichert & synchronisiert!');
updateFlightApiStatus();
}
}

async function syncAppConfig(){
const cfg={flight_api_key:FLIGHT_API_KEY||null};
try{await apiPatch('settings','default',{app_config:JSON.stringify(cfg)});}catch(e){}
}

function updateFlightApiStatus(){
const el=document.getElementById('flightApiStatus');
if(el){el.textContent=FLIGHT_API_KEY?'✓ Aktiv':'—';}
}

function showStoredFlightInfo(guestId,tripType){
const g=teachers.find(t=>t.id===guestId);
if(!g)return;
const isArrival=tripType==='arrival';
const storedInfo=isArrival?g.arrival_flight_info:g.departure_flight_info;
const flightNumber=isArrival?g.arrival_flight:g.departure_flight;
const flightDate=isArrival?g.arrival_date:g.departure_date;
if(storedInfo){
const info=isArrival?storedInfo.arrival:storedInfo.departure;
const otherInfo=isArrival?storedInfo.departure:storedInfo.arrival;
let msg=storedInfo.airline+' '+flightNumber+'\n';
msg+=(otherInfo.iata||'?')+' → '+(info.iata||'?')+'\n\n';
const statusText={'scheduled':'Geplant','expected':'Geplant','unknown':'Geplant','active':'Unterwegs','enroute':'Unterwegs','airborne':'Unterwegs','landed':'Gelandet','arrived':'Gelandet','cancelled':'Storniert'};
msg+='Status: '+(statusText[storedInfo.status]||storedInfo.status||'Geplant')+'\n';
msg+='Geplant: '+formatFlightTime(info.scheduled);
if(info.delay&&info.delay>0)msg+=' (+'+info.delay+' min)';
if(info.estimated&&info.estimated!==info.scheduled)msg+='\nErwartet: '+formatFlightTime(info.estimated);
if(info.gate)msg+='\nGate: '+info.gate;
if(info.terminal)msg+='\nTerminal: '+info.terminal;
if(confirm(msg+'\n\n🔄 Aktualisieren?')){
refreshFlightInfo(guestId,tripType);
}
}else{
if(confirm('Keine Fluginfo gespeichert.\n\n📡 Jetzt abrufen?')){
refreshFlightInfo(guestId,tripType);
}
}
}

async function refreshFlightInfo(guestId,tripType){
const g=teachers.find(t=>t.id===guestId);
if(!g)return;
if(!FLIGHT_API_KEY){
const key=prompt('RapidAPI Key eingeben:');
if(key){FLIGHT_API_KEY=key;localStorage.setItem('flight_api_key',key);}
else return;
}
const isArrival=tripType==='arrival';
const flightNumber=isArrival?g.arrival_flight:g.departure_flight;
const flightDate=isArrival?g.arrival_date:g.departure_date;
toast('Lade Flugstatus...');
const info=await fetchFlightStatus(flightNumber,flightDate);
if(info){
const idx=teachers.findIndex(t=>t.id===guestId);
if(idx>=0){
if(isArrival)teachers[idx].arrival_flight_info=info;
else teachers[idx].departure_flight_info=info;
saveLocal();
render();
// Sync to Supabase
const syncData=isArrival?{arrival_flight_info:JSON.stringify(info)}:{departure_flight_info:JSON.stringify(info)};
if(online)apiPatch('teachers',guestId,syncData);
toast('✓ Fluginfo aktualisiert');
}
}else{
toast('Flug nicht gefunden');
}
}

async function refreshGuestFlight(guestId){
const g=teachers.find(t=>t.id===guestId);
if(!g)return;
if(!FLIGHT_API_KEY){
const key=prompt('RapidAPI Key eingeben:');
if(key){FLIGHT_API_KEY=key;localStorage.setItem('flight_api_key',key);}
else return;
}
toast('Lade Flugstatus...');
let updated=false;
if(g.arrival_flight&&g.arrival_date){
const info=await fetchFlightStatus(g.arrival_flight,g.arrival_date);
if(info){
const idx=teachers.findIndex(t=>t.id===guestId);
if(idx>=0){teachers[idx].arrival_flight_info=info;updated=true;}
}
}
if(g.departure_flight&&g.departure_date){
const info=await fetchFlightStatus(g.departure_flight,g.departure_date);
if(info){
const idx=teachers.findIndex(t=>t.id===guestId);
if(idx>=0){teachers[idx].departure_flight_info=info;updated=true;}
}
}
if(updated){
saveLocal();
render();
// Sync to Supabase
const idx=teachers.findIndex(t=>t.id===guestId);
if(idx>=0&&online){
const syncData={};
if(teachers[idx].arrival_flight_info)syncData.arrival_flight_info=JSON.stringify(teachers[idx].arrival_flight_info);
if(teachers[idx].departure_flight_info)syncData.departure_flight_info=JSON.stringify(teachers[idx].departure_flight_info);
const ok=await apiPatch('teachers',guestId,syncData);
console.log('Flight info sync:',ok?'success':'failed',syncData);
}
toast('✓ Fluginfo aktualisiert & synchronisiert');
}else{
toast('Keine Fluginfo gefunden');
}
}

// ===== NOTION INTEGRATION =====
const NOTION_WORKER='https://motus-notion-proxy.mail-markushomm.workers.dev';
const NOTION_BOOKINGS_DB='2d13de26-599f-8144-aac4-ecb872eccc40';
const NOTION_CLIENTS_DB='2d13de26-599f-8144-993b-eef94a37cd79';
const NOTION_STATS_DB='2d13de26-599f-81ff-b7b8-ff8bfdacf34e';

async function notionRequest(endpoint,method,body){
    try{
        const r=await fetch(NOTION_WORKER+'/'+endpoint,{
            method,
            headers:{'Content-Type':'application/json'},
            body:body?JSON.stringify(body):undefined
        });
        if(!r.ok){console.error('Notion error:',await r.text());return null;}
        return await r.json();
    }catch(e){console.error('Notion fetch error:',e);return null;}
}

async function syncBookingToNotion(lesson){
    // Handle both local (client, date, time) and DB (client_name, lesson_date, lesson_time) field names
    const clientName=lesson.client_name||lesson.client;
    const lessonDate=lesson.lesson_date||lesson.date;
    const lessonTime=lesson.lesson_time||lesson.time||'';
    const dur=lesson.duration||lesson.dur||45;

    if(!lesson||!clientName)return;
    const trainer=teachers.find(t=>t.id===lesson.teacher_id||t.id===lesson.teacher);
    const clientObj=clients.find(c=>c.name===clientName);
    const isMember=clientObj?.is_member||false;

    // Preise aus Settings holen
    const price45=settings.prices?.[45]||settings.price_45||100;
    const memberPrice45=settings.memberPrice45||settings.member_price_45||80;
    const base45=isMember?memberPrice45:price45;
    const price=dur===90?base45*2:base45;

    const page={
        parent:{database_id:NOTION_BOOKINGS_DB},
        properties:{
            'Termin':{title:[{text:{content:clientName+' - '+lessonDate}}]},
            'Client':{rich_text:[{text:{content:clientName}}]},
            'Trainer':{select:{name:trainer?.name||'Markus'}},
            'Datum':{date:{start:lessonDate}},
            'Uhrzeit':{rich_text:[{text:{content:lessonTime.substring(0,5)||''}}]},
            'Dauer':{select:{name:dur+' min'}},
            'Preis':{number:price},
            'Status':{select:{name:'Geplant'}},
            'Member':{checkbox:isMember}
        }
    };
    const result=await notionRequest('pages','POST',page);
    // log removed
}

async function syncClientToNotion(client){
    if(!client||!client.name)return;
    const page={
        parent:{database_id:NOTION_CLIENTS_DB},
        properties:{
            'Name':{title:[{text:{content:client.name}}]},
            'Telefon':{phone_number:client.phone1||null},
            'Member':{checkbox:client.is_member||false},
            'Notizen':{rich_text:[{text:{content:client.notes||''}}]}
        }
    };
    await notionRequest('pages','POST',page);
}

async function syncAllToNotion(){
    toast('📓 Lösche alte Einträge...');
    // Erst alle alten Einträge aus Notion löschen
    try{
        const existing=await notionRequest('databases/'+NOTION_BOOKINGS_DB+'/query','POST',{page_size:100});
        if(existing&&existing.results){
            for(const page of existing.results){
                await notionRequest('pages/'+page.id,'PATCH',{archived:true});
                await new Promise(r=>setTimeout(r,100));
            }
        }
    }catch(e){}

    toast('📓 Sync zu Notion...');
    let count=0;
    // Sync ALL bookings (exclude blocked and pauses)
    const allLessons=lessons.filter(l=>!l.client_name?.startsWith('[BLOCKED]')&&!l.client?.startsWith('[BLOCKED]')&&!l.client_name?.startsWith('[PAUSE]')&&!l.client?.startsWith('[PAUSE]'));
    for(const lesson of allLessons){
        await syncBookingToNotion(lesson);
        count++;
        await new Promise(r=>setTimeout(r,350));
    }
    toast('✅ '+count+' Buchungen zu Notion synchronisiert!');
}

async function updateNotionStats(){
    const now=new Date();
    const monthName=now.toLocaleString('de-DE',{month:'long',year:'numeric'});
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
    const monthEnd=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split('T')[0];

    const monthLessons=lessons.filter(l=>l.lesson_date>=monthStart&&l.lesson_date<=monthEnd&&!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]'));
    const markusLessons=monthLessons.filter(l=>l.teacher_id==='markus');
    const kseniaLessons=monthLessons.filter(l=>l.teacher_id==='ksenia');

    let totalRev=0,markusRev=0,kseniaRev=0,sessions45=0,sessions90=0;
    monthLessons.forEach(l=>{
        const client=clients.find(c=>c.name===l.client);
        const isMember=client?.is_member||false;
        const price=l.duration===90?(isMember?160:180):(isMember?80:100);
        totalRev+=price;
        if(l.teacher_id==='markus')markusRev+=price;
        else kseniaRev+=price;
        if(l.duration===90)sessions90++;else sessions45++;
    });

    const page={
        parent:{database_id:NOTION_STATS_DB},
        properties:{
            'Monat':{title:[{text:{content:monthName}}]},
            'Einheiten Gesamt':{number:monthLessons.length},
            'Einheiten Markus':{number:markusLessons.length},
            'Einheiten Ksenia':{number:kseniaLessons.length},
            'Umsatz Gesamt':{number:totalRev},
            'Umsatz Markus':{number:markusRev},
            'Umsatz Ksenia':{number:kseniaRev},
            '45min Sessions':{number:sessions45},
            '90min Sessions':{number:sessions90}
        }
    };
    await notionRequest('pages','POST',page);
    // log removed
}
// ===== END NOTION =====

let silentMode=false;
async function apiGet(t){if(DEMO_MODE)return[];try{const r=await fetch(API_URL+'/'+t+'?select=*',{headers:API_HEADERS});if(!r.ok){console.error('❌ API Error:',await r.text());return null;}return await r.json();}catch(e){console.error('❌ Fetch error:',e);if(!silentMode)toast('⚠️ Verbindungsfehler');return null;}}
async function apiPost(t,d){if(DEMO_MODE){toast('Demo - Änderungen werden nicht gespeichert');return{id:Date.now()};}try{const r=await fetch(API_URL+'/'+t,{method:'POST',headers:API_HEADERS,body:JSON.stringify(d)});if(!r.ok){console.error('❌ POST Error:',await r.text());toast('⚠️ Speichern fehlgeschlagen');return null;}return await r.json();}catch(e){console.error('❌ POST Fetch error:',e);toast('⚠️ Verbindungsfehler');return null;}}
async function apiPatch(t,id,d){if(DEMO_MODE){toast('Demo - Änderungen werden nicht gespeichert');return true;}try{const r=await fetch(API_URL+'/'+t+'?id=eq.'+id,{method:'PATCH',headers:API_HEADERS,body:JSON.stringify(d)});if(!r.ok)toast('⚠️ Update fehlgeschlagen');return r.ok;}catch(e){toast('⚠️ Verbindungsfehler');return false;}}
async function apiDelete(t,id){if(DEMO_MODE){toast('Demo - Änderungen werden nicht gespeichert');return true;}try{const r=await fetch(API_URL+'/'+t+'?id=eq.'+id,{method:'DELETE',headers:API_HEADERS});if(!r.ok)toast('⚠️ Löschen fehlgeschlagen');return r.ok;}catch(e){toast('⚠️ Verbindungsfehler');return false;}}
async function apiUpsert(t,d){if(DEMO_MODE){toast('Demo - Änderungen werden nicht gespeichert');return true;}try{const h={...API_HEADERS,'Prefer':'resolution=merge-duplicates'};const r=await fetch(API_URL+'/'+t,{method:'POST',headers:h,body:JSON.stringify(d)});if(!r.ok){const err=await r.text();console.error('❌ UPSERT failed:',err);}return r.ok;}catch(e){console.error('❌ UPSERT error:',e);return false;}}
let online=false,syncBlocked=false;
let teachers=[{id:'markus',name:'Markus',init:'M',color:'#193CB8',photo:null},{id:'ksenia',name:'Ksenia',init:'K',color:'#C11007',photo:null}];
let clients=[],lessons=[],chatMsgs=[],settings={prices:{45:100,90:180},memberPrice45:80,startHour:9,endHour:20,campStart:null,campEnd:null};
let trash=[];
let curTeacher='markus',selDate=new Date(),viewDate=new Date(),selDuration=45,lastBooking=null,curPhoto=null,curView='next',calCollapsed=true,statsView='week',statsPageOffset=0;
const defaultLocations=[{id:'home',name:'Zuhause',emoji:'🏠',currency:'EUR'},{id:'london',name:'London',emoji:'🇬🇧',currency:'GBP'}];
let locations=[...defaultLocations],dayLocations={};
let trips=[]; // Reisen: {id, name, location_id, start_date, end_date, start_time, end_time, venue_name, venue_address, maps_link, trainer_id}
let touchStartX=0;

// ===== LANGUAGE & i18n =====
let currentLang=localStorage.getItem('motusLang')||'de';
const i18n={
    de:{
        // Header & Navigation
        booking:'booking',
        dashboard:'Dashboard',
        day:'Tag',
        month:'Monat',
        refresh:'Aktualisieren...',
        // Clients
        clients:'Kunden',
        searchPlaceholder:'Suchen...',
        all:'Alle',
        members:'Members',
        active:'Aktiv',
        new:'Neu',
        // Stats
        statistics:'Statistiken',
        week:'Woche',
        year:'Jahr',
        thisWeek:'Diese Woche',
        totalRevenue:'Gesamt Einnahmen',
        units:'Einheiten',
        avgPerUnit:'Ø/Einheit',
        avgPerDay:'Ø/Tag',
        byTrainer:'Nach Trainer',
        abroad:'Ausland',
        guestAccounting:'Gasttrainer Abrechnung',
        campRevenue:'Camp Einnahmen',
        // Settings
        settings:'Einstellungen',
        quickActions:'Quick Actions',
        share:'Teilen',
        requests:'Anfragen',
        templates:'Vorlagen',
        camp:'Camp',
        registration:'Anmeldung',
        schedule:'Termine',
        participants:'Teilnehmer',
        period:'Zeitraum',
        setCampDate:'Camp Datum festlegen',
        prices:'Preise',
        campFees:'Camp & Tagesgebühren',
        general:'Allgemein',
        priceRates:'45 & 90 Min Tarife',
        workingHours:'Arbeitszeiten',
        dailyAvailability:'Tägliche Verfügbarkeit',
        guestTrainers:'Gasttrainer',
        newGuestTrainer:'Neuer Gasttrainer',
        locations:'Standorte',
        newLocation:'Neuer Standort',
        syncTools:'Sync & Tools',
        cloudStatus:'Cloud Status',
        connection:'Supabase Verbindung',
        online:'Online',
        offline:'Offline',
        sync:'Synchronisieren',
        loadFromCloud:'Daten von Cloud laden',
        forceUpload:'Force Upload',
        uploadLocal:'Lokale Daten hochladen',
        notionExport:'Notion Export',
        exportBookings:'Buchungen exportieren',
        csvExport:'CSV Export',
        dataForExcel:'Daten für Excel',
        flightTracking:'Flight Tracking',
        checkDuplicates:'Duplikate prüfen',
        mergeDuplicates:'Doppelte Clients mergen',
        repairNames:'Namen reparieren',
        matchBookings:'Buchungen abgleichen',
        trashSecurity:'Papierkorb & Sicherheit',
        trash:'Papierkorb',
        deletedItems:'Gelöschte Einträge (30 Tage)',
        appLock:'App-Sperre',
        faceIdPasskey:'Face ID / Passkey',
        language:'Sprache',
        chooseLanguage:'App-Sprache wählen',
        german:'Deutsch',
        english:'English',
        // Booking
        book:'Buchen',
        cancel:'Abbrechen',
        save:'Speichern',
        delete:'Löschen',
        edit:'Bearbeiten',
        minutes:'Minuten',
        // Time
        today:'Heute',
        yesterday:'Gestern',
        tomorrow:'Morgen',
        // Trainer Selection
        whoAreYou:'Wer bist du?',
        deviceRemember:'Dieses Gerät merkt sich deine Auswahl',
        trainer:'Trainer',
        // Misc
        noData:'Keine Daten verfügbar',
        error:'Fehler',
        success:'Erfolgreich',
        tryAgain:'Erneut versuchen'
    },
    en:{
        // Header & Navigation
        booking:'booking',
        dashboard:'Dashboard',
        day:'Day',
        month:'Month',
        refresh:'Refreshing...',
        // Clients
        clients:'Clients',
        searchPlaceholder:'Search...',
        all:'All',
        members:'Members',
        active:'Active',
        new:'New',
        // Stats
        statistics:'Statistics',
        week:'Week',
        year:'Year',
        thisWeek:'This Week',
        totalRevenue:'Total Revenue',
        units:'Units',
        avgPerUnit:'Avg/Unit',
        avgPerDay:'Avg/Day',
        byTrainer:'By Trainer',
        abroad:'Abroad',
        guestAccounting:'Guest Trainer Accounting',
        campRevenue:'Camp Revenue',
        // Settings
        settings:'Settings',
        quickActions:'Quick Actions',
        share:'Share',
        requests:'Requests',
        templates:'Templates',
        camp:'Camp',
        registration:'Registration',
        schedule:'Schedule',
        participants:'Participants',
        period:'Period',
        setCampDate:'Set camp date',
        prices:'Prices',
        campFees:'Camp & Day Fees',
        general:'General',
        priceRates:'45 & 90 Min Rates',
        workingHours:'Working Hours',
        dailyAvailability:'Daily Availability',
        guestTrainers:'Guest Trainers',
        newGuestTrainer:'New Guest Trainer',
        locations:'Locations',
        newLocation:'New Location',
        syncTools:'Sync & Tools',
        cloudStatus:'Cloud Status',
        connection:'Supabase Connection',
        online:'Online',
        offline:'Offline',
        sync:'Synchronize',
        loadFromCloud:'Load data from cloud',
        forceUpload:'Force Upload',
        uploadLocal:'Upload local data',
        notionExport:'Notion Export',
        exportBookings:'Export bookings',
        csvExport:'CSV Export',
        dataForExcel:'Data for Excel',
        flightTracking:'Flight Tracking',
        checkDuplicates:'Check Duplicates',
        mergeDuplicates:'Merge duplicate clients',
        repairNames:'Repair Names',
        matchBookings:'Match bookings',
        trashSecurity:'Trash & Security',
        trash:'Trash',
        deletedItems:'Deleted items (30 days)',
        appLock:'App Lock',
        faceIdPasskey:'Face ID / Passkey',
        language:'Language',
        chooseLanguage:'Choose app language',
        german:'Deutsch',
        english:'English',
        // Booking
        book:'Book',
        cancel:'Cancel',
        save:'Save',
        delete:'Delete',
        edit:'Edit',
        minutes:'Minutes',
        // Time
        today:'Today',
        yesterday:'Yesterday',
        tomorrow:'Tomorrow',
        // Trainer Selection
        whoAreYou:'Who are you?',
        deviceRemember:'This device will remember your choice',
        trainer:'Trainer',
        // Misc
        noData:'No data available',
        error:'Error',
        success:'Success',
        tryAgain:'Try again'
    }
};

function t(key){return i18n[currentLang][key]||i18n['de'][key]||key;}

function setAppLanguage(lang){
    currentLang=lang;
    localStorage.setItem('motusLang',lang);
    applyTranslations();
    // Save to cloud for this trainer
    saveTrainerLanguage(lang);
}

function applyTranslations(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key=el.dataset.i18n;
        if(i18n[currentLang][key])el.textContent=t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
        const key=el.dataset.i18nPlaceholder;
        if(i18n[currentLang][key])el.placeholder=t(key);
    });
}

function saveTrainerLanguage(lang){
    localStorage.setItem('motusLang_'+curTeacher,lang);
    localStorage.setItem('motusLang',lang);
}

function loadTrainerLanguage(){
    const trainerLang=localStorage.getItem('motusLang_'+curTeacher);
    if(trainerLang){
        currentLang=trainerLang;
        localStorage.setItem('motusLang',currentLang);
    }
}

function openLanguageModal(){
    const modal=document.getElementById('languageModal');
    if(!modal)return;
    // Update active state
    document.querySelectorAll('.lang-option').forEach(btn=>btn.classList.remove('active'));
    const activeBtn=document.getElementById(currentLang==='de'?'langBtnDe':'langBtnEn');
    if(activeBtn)activeBtn.classList.add('active');
    modal.classList.add('open');
}

function selectLanguage(lang){
    setAppLanguage(lang);
    // Update UI
    document.querySelectorAll('.lang-option').forEach(btn=>btn.classList.remove('active'));
    const activeBtn=document.getElementById(lang==='de'?'langBtnDe':'langBtnEn');
    if(activeBtn)activeBtn.classList.add('active');
    // Update display
    const display=document.getElementById('currentLangDisplay');
    if(display)display.textContent=lang.toUpperCase();
    // Close modal after short delay
    setTimeout(()=>closeModal('language'),300);
    toast(lang==='de'?'🇩🇪 Deutsch ausgewählt':'🇬🇧 English selected');
}

function updateLanguageDisplay(){
    const display=document.getElementById('currentLangDisplay');
    if(display)display.textContent=currentLang.toUpperCase();
}

function logoutTrainer(){
    if(!confirm('Trainer wechseln? Du kannst dich jederzeit wieder anmelden.')){return;}
    localStorage.removeItem('motusCurrentTrainer');
    isFirstTimeUser=true;
    document.getElementById('app').classList.remove('show');
    showTrainerSelection();
}

// ===== FIRST TIME LOGIN =====
let isFirstTimeUser=!localStorage.getItem('motusCurrentTrainer');

function showTrainerSelection(){
    const grid=document.getElementById('trainerSelectGrid');
    if(!grid)return;
    const mainTrainers=teachers.filter(t=>!t.is_guest);
    grid.innerHTML=mainTrainers.map(tr=>{
        const hasPhoto=tr.photo&&tr.photo.length>50;
        const avatarStyle=hasPhoto?`background-image:url(${tr.photo});border-color:${tr.color}`:`background:${tr.color};border-color:${tr.color}`;
        const avatarContent=hasPhoto?'':(tr.init||tr.name.charAt(0));
        return `<div class="trainer-select-btn" onclick="selectTrainerLogin('${tr.id}')">
            <div class="trainer-select-avatar" style="${avatarStyle}">${avatarContent}</div>
            <div class="trainer-select-info">
                <div class="trainer-select-name">${tr.name}</div>
                <div class="trainer-select-role">${t('trainer')}</div>
            </div>
            <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:#444;fill:none;stroke-width:2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
    }).join('');
    document.getElementById('trainerSelectScreen').classList.remove('hide');
}

function selectTrainerLogin(trainerId){
    curTeacher=trainerId;
    localStorage.setItem('motusCurrentTrainer',trainerId);
    isFirstTimeUser=false;currentLang='en';
    document.getElementById('trainerSelectScreen').classList.add('hide');
    // Load trainer's language preference
    loadTrainerLanguage();
    applyTranslations();
    updateLanguageDisplay();
    document.getElementById('app').classList.add('show');
    updateTrainerTheme();
    render();
    // Prompt Face ID setup for new users (if not already set up)
    if(!passkeyCredentialId){
        setTimeout(()=>promptFaceIdSetup(),800);
    }
}

function promptFaceIdSetup(){
    if(!window.PublicKeyCredential){return;}
    const isEn=currentLang==='en';
    const title=isEn?'Set up Face ID?':'Face ID einrichten?';
    const desc=isEn?'Protect your data with Face ID. The app locks automatically after 1 minute.':'Schütze deine Daten mit Face ID. Die App sperrt sich automatisch nach 1 Minute.';
    const btnYes=isEn?'Enable Face ID':'Face ID aktivieren';
    const btnNo=isEn?'Later':'Später';
    // Show Face ID setup prompt
    const modal=document.createElement('div');
    modal.className='modal open';
    modal.id='faceIdPromptModal';
    modal.innerHTML=`
        <div class="modal-sheet" style="max-width:340px;text-align:center;padding:32px 24px">
            <div style="font-size:48px;margin-bottom:16px">🔐</div>
            <h3 style="margin:0 0 12px;font-size:20px">${title}</h3>
            <p style="color:#71717a;font-size:14px;margin-bottom:24px;line-height:1.5">${desc}</p>
            <button class="btn btn-primary" style="width:100%;margin-bottom:12px" onclick="acceptFaceIdSetup()">${btnYes}</button>
            <button class="btn btn-secondary" style="width:100%;opacity:0.6" onclick="skipFaceIdSetup()">${btnNo}</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function acceptFaceIdSetup(){
    document.getElementById('faceIdPromptModal')?.remove();
    await setupPasskey();
    if(passkeyCredentialId){
        appLockEnabled=true;
        localStorage.setItem('motusAppLock','true');
        updateLockUI();
        toast('🔒 Face ID aktiviert');
    }
}

function skipFaceIdSetup(){
    document.getElementById('faceIdPromptModal')?.remove();
    toast('Du kannst Face ID später in Settings aktivieren');
}

// Passkey/WebAuthn functions
let passkeyCredentialId=localStorage.getItem('motusPasskeyId');
let appLockEnabled=localStorage.getItem('motusAppLock')==='true';

// Auto-lock after 5 minutes inactivity
let lastActivity=Date.now();
let autoLockTimer=null;
function resetActivityTimer(){
    lastActivity=Date.now();
    if(autoLockTimer)clearTimeout(autoLockTimer);
    if(appLockEnabled&&passkeyCredentialId&&!document.getElementById('lockScreen').classList.contains('hide'))return;
    if(appLockEnabled&&passkeyCredentialId){
        autoLockTimer=setTimeout(()=>{
            document.getElementById('lockScreen').classList.remove('hide');
            document.getElementById('app')?.classList.remove('show');
            setTimeout(()=>unlockWithPasskey(),300);
        },300000);
    }
}
document.addEventListener('touchstart',resetActivityTimer,{passive:true});
document.addEventListener('click',resetActivityTimer);
document.addEventListener('scroll',resetActivityTimer,{passive:true});

// Update header with current day info when scrolling
function updateHeaderDayInfo(){
    const subText=document.getElementById('headerSubText');
    const dayInfo=document.getElementById('headerDayInfo');
    const calPage=document.getElementById('calendarPage');
    if(!subText||!dayInfo||!calPage||!calPage.classList.contains('active'))return;
    if(typeof curView!=='undefined'&&curView==='day'){
        subText.style.display='';dayInfo.style.display='none';return;
    }
    const headers=document.querySelectorAll('.day-header-sticky');
    if(!headers.length){subText.style.display='';dayInfo.style.display='none';return;}
    let current=null;
    headers.forEach(h=>{
        if(h.getBoundingClientRect().top<=60)current=h;
    });
    if(current&&window.scrollY>80){
        const d=current.querySelector('.day-date');
        const u=current.querySelector('.day-units');
        const loc=current.querySelector('.day-location');
        let txt=(d?d.textContent:'')+' · '+(u?u.textContent:'');
        if(loc&&loc.textContent){
            const parts=loc.textContent.trim().split(' ');
            const emoji=parts[0];
            const name=parts.slice(1).join(' ');
            if(name)txt+=' '+name+' '+emoji;
        }
        dayInfo.textContent=txt;
        subText.style.display='none';dayInfo.style.display='';
    }else{
        subText.style.display='';dayInfo.style.display='none';
    }
}
window.addEventListener('scroll',updateHeaderDayInfo,{passive:true});


function base64ToBuffer(base64){
    const padded=base64.replace(/-/g,'+').replace(/_/g,'/')+'=='.slice(0,(4-base64.length%4)%4);
    const str=atob(padded);
    const buf=new Uint8Array(str.length);
    for(let i=0;i<str.length;i++)buf[i]=str.charCodeAt(i);
    return buf;
}
function bufferToBase64(buf){
    const arr=new Uint8Array(buf);
    let str='';for(let i=0;i<arr.length;i++)str+=String.fromCharCode(arr[i]);
    return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function unlockWithPasskey(){
    if(!window.PublicKeyCredential){
        document.getElementById('lockError').textContent='WebAuthn nicht unterstützt';
        return;
    }
    try{
        document.getElementById('lockError').textContent='';
        const challenge=new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const opts={
            challenge,
            timeout:60000,
            userVerification:'required',
            rpId:location.hostname==='localhost'?'localhost':location.hostname
        };
        if(passkeyCredentialId){
            opts.allowCredentials=[{id:base64ToBuffer(passkeyCredentialId),type:'public-key',transports:['internal']}];
        }
        const credential=await navigator.credentials.get({publicKey:opts});
        if(credential){
            document.getElementById('lockScreen').classList.add('hide');
            document.getElementById('app')?.classList.add('show');
            resetActivityTimer();
        }
    }catch(e){
        console.error('Auth error:',e);
        if(e.name==='NotAllowedError'){
            document.getElementById('lockError').textContent='Authentifizierung abgebrochen';
        }else{
            document.getElementById('lockError').textContent='Fehler: '+e.message;
        }
    }
}

async function setupPasskey(){
    if(!window.PublicKeyCredential){
        toast('⚠️ WebAuthn nicht unterstützt');
        return;
    }
    try{
        const userId=new Uint8Array(16);
        crypto.getRandomValues(userId);
        const challenge=new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const credential=await navigator.credentials.create({
            publicKey:{
                challenge,
                rp:{name:'mōtus studio',id:location.hostname==='localhost'?'localhost':location.hostname},
                user:{id:userId,name:'motus-user',displayName:'mōtus User'},
                pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
                authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'preferred',residentKey:'preferred'},
                timeout:60000
            }
        });
        if(credential){
            passkeyCredentialId=bufferToBase64(credential.rawId);
            localStorage.setItem('motusPasskeyId',passkeyCredentialId);
            toast('✅ Passkey eingerichtet!');
            updateLockUI();
        }
    }catch(e){
        console.error('Setup error:',e);
        toast('⚠️ '+e.message);
    }
}

function toggleSettingsSection(id){
    const section=document.getElementById(id);
    if(section)section.classList.toggle('collapsed');
}

function toggleAppLock(){
    if(!passkeyCredentialId){
        setupPasskey().then(()=>{
            if(passkeyCredentialId){
                appLockEnabled=true;
                localStorage.setItem('motusAppLock','true');
                updateLockUI();
            }
        });
    }else{
        appLockEnabled=!appLockEnabled;
        localStorage.setItem('motusAppLock',appLockEnabled?'true':'false');
        updateLockUI();
        toast(appLockEnabled?'🔒 App-Sperre aktiviert':'🔓 App-Sperre deaktiviert');
    }
}

function updateLockUI(){
    const toggle=document.getElementById('lockToggle');
    const setupItem=document.getElementById('setupPasskeyItem');
    const resetItem=document.getElementById('resetPasskeyItem');
    if(toggle)toggle.classList.toggle('active',appLockEnabled);
    if(setupItem)setupItem.style.display=passkeyCredentialId?'none':'flex';
    if(resetItem)resetItem.style.display=passkeyCredentialId?'flex':'none';
}

function resetPasskey(){
    if(confirm('Passkey wirklich zurücksetzen?')){
        localStorage.removeItem('motusPasskeyId');
        passkeyCredentialId=null;
        appLockEnabled=false;
        localStorage.setItem('motusAppLock','false');
        updateLockUI();
        toast('🔓 Passkey zurückgesetzt');
    }
}

async function init(){
    // DEMO MODE - isolated setup, only activates with ?demo in URL
    if(DEMO_MODE){
        teachers=DEMO_TRAINERS;
        clients=DEMO_CLIENTS;
        lessons=generateDemoLessons();
        settings.campStart='2025-12-23';
        settings.campEnd='2025-12-28';
        settings.campName='Winter Dance Camp 2025';
        settings.prices={45:100,90:180};
        settings.memberPrice45=80;
        curTeacher='anna';
        isFirstTimeUser=false;currentLang='en';
        selDate=new Date(2025,11,25); // Heute: 25. Dez
        viewDate=new Date(2025,11,25);
        setTimeout(()=>{
            document.getElementById('splash')?.classList.add('hide');
            document.getElementById('app')?.classList.add('show');
            updateTrainerTheme();
            render();
            applyTranslations();
        },800);
        return; // Exit early - don't run normal init
    }
    loadLocal();
    updateFlightApiStatus();
    // Desktop workspace mode - skip mobile UI
    const isDesktop=document.body.classList.contains('workspace');

    // Check for saved trainer (auto-login)
    const savedTrainer=localStorage.getItem('motusCurrentTrainer');
    if(savedTrainer){
        curTeacher=savedTrainer;
        isFirstTimeUser=false;currentLang='en';
        // Load trainer-specific language
        loadTrainerLanguage();
        applyTranslations();
        updateLanguageDisplay();
    }

    if(!isDesktop){
        updateTrainerTheme();
        render();
        updateTrashBadge();
        loadWeather();
        updateLockUI();
        setTimeout(()=>{
            document.getElementById('splash')?.classList.add('hide');
            // First time user - show trainer selection
            if(isFirstTimeUser){
                showTrainerSelection();
            }else if(appLockEnabled&&passkeyCredentialId){
                document.getElementById('lockScreen').classList.remove('hide');
                setTimeout(()=>unlockWithPasskey(),500);
            }else{
                document.getElementById('app')?.classList.add('show');
                applyTranslations();
                updateLanguageDisplay();
            }
        },1200);
        setupSwipe();
        setupStatsSwipe();
    }

    online=true;syncCloud();loadBookingRequests();
    // Mobile-specific UI setup
    if(!isDesktop){
        const calCont=document.getElementById('calContainer');
        const calBtn=document.getElementById('calToggleBtn');
        if(calCollapsed){
            calCont?.classList.add('collapsed');
        }else{
            calBtn?.classList.add('active');
        }
        // Gespeicherte Seite und View wiederherstellen
        const savedPage=localStorage.getItem('motusPage');
        if(savedPage&&['calendar','clients','stats','chat','settings'].includes(savedPage))showPage(savedPage);
        document.querySelectorAll('.view-btn-new').forEach(b=>b.classList.toggle('active',b.dataset.view===curView));
        document.querySelectorAll('.day-nav-btn').forEach(b=>b.style.display=curView==='next'?'none':'flex');
        const dnc=document.querySelector('.day-nav-center');if(dnc)dnc.style.display=curView==='next'?'none':'block';
        const dn=document.querySelector('.day-nav');if(dn)dn.style.display=curView==='next'?'none':'flex';
        syncNavPill();
    }
}

async function syncCloud(){
    if(syncBlocked){return;}
    // DEMO MODE - use demo data instead of API
    if(DEMO_MODE){
        setSync('online');
        teachers=DEMO_TRAINERS;
        clients=DEMO_CLIENTS;
        lessons=generateDemoLessons();
        settings.campStart='2025-01-10';
        settings.campEnd='2025-01-12';
        settings.campName='Winter Dance Camp 2025';
        curTeacher='anna';
        isFirstTimeUser=false;currentLang='en';
        localStorage.setItem('motusCurrentTrainer','anna');
        render();
        document.getElementById('splash')?.classList.add('hide');
        document.getElementById('app')?.classList.add('show');
        return;
    }
    // log removed
    setSync('syncing');
    try{
        const cloudLessons=await apiGet('lessons');
        const cloudClients=await apiGet('clients');
        const cloudChat=await apiGet('chat_messages');
        // log removed
        // log removed
        // log removed
        if(cloudLessons&&cloudLessons.length>0){
            // log removed
            lessons=cloudLessons.map(r=>{
                const local=lessons.find(l=>l.id===r.id);
                return {id:r.id,teacher:r.teacher_id,client:r.client_name,date:r.lesson_date,time:r.lesson_time?.slice(0,5),dur:r.duration,notes:r.notes,customPrice:r.custom_price||null,location:r.location||'home'};
            });
        }
        if(cloudClients&&cloudClients.length>0){
            clients=cloudClients.map(r=>({id:r.id,name:r.name,email:r.email,phone1:r.phone1,phone2:r.phone2,partner:r.partner,notes:r.notes,photo:r.photo,is_member:r.is_member,created_at:r.created_at}));
        }
        const cloudTeachers=await apiGet('teachers');
        if(cloudTeachers&&cloudTeachers.length>0){
            cloudTeachers.forEach(ct=>{
                const i=teachers.findIndex(t=>t.id===ct.id);
                if(i>=0){
                    // Update existing trainer
                    if(ct.photo)teachers[i].photo=ct.photo;
                    if(ct.color)teachers[i].color=ct.color;
                    if(ct.phone)teachers[i].phone=ct.phone;
                    if(ct.email)teachers[i].email=ct.email;
                    if(ct.preferred_language)teachers[i].preferred_language=ct.preferred_language;
                    teachers[i].is_guest=ct.is_guest||false;
                    teachers[i].is_active=ct.is_active!==false;
                    if(ct.is_guest){
                        teachers[i].sale_price_45=ct.sale_price_45;
                        teachers[i].sale_price_member_45=ct.sale_price_member_45;
                        teachers[i].payout_price_45=ct.payout_price_45;
                        teachers[i].payout_price_member_45=ct.payout_price_member_45;
                        teachers[i].payout_lecture=ct.payout_lecture;
                        teachers[i].start_date=ct.start_date;
                        teachers[i].end_date=ct.end_date;
                        // Travel fields
                        teachers[i].travel_cost=ct.travel_cost||0;
                        teachers[i].hotel_cost=ct.hotel_cost||0;
                        teachers[i].other_cost=ct.other_cost||0;
                        teachers[i].arrival_type=ct.arrival_type||ct.travel_type||null;
                        teachers[i].departure_type=ct.departure_type||null;
                        teachers[i].arrival_date=ct.arrival_date||null;
                        teachers[i].departure_date=ct.departure_date||null;
                        teachers[i].arrival_flight=ct.arrival_flight||ct.flight_number||null;
                        teachers[i].departure_flight=ct.departure_flight||null;
                        // Flight info cache from cloud
                        if(ct.arrival_flight_info)try{teachers[i].arrival_flight_info=JSON.parse(ct.arrival_flight_info);}catch(e){}
                        if(ct.departure_flight_info)try{teachers[i].departure_flight_info=JSON.parse(ct.departure_flight_info);}catch(e){}
                    }
                }else if(ct.is_guest){
                    // Add new guest trainer
                    const newGuest={
                        id:ct.id,name:ct.name,init:ct.name?.charAt(0)||'?',color:ct.color||'#8B5CF6',
                        photo:ct.photo,is_guest:true,is_active:ct.is_active!==false,
                        sale_price_45:ct.sale_price_45,sale_price_member_45:ct.sale_price_member_45,
                        payout_price_45:ct.payout_price_45,payout_price_member_45:ct.payout_price_member_45,
                        payout_lecture:ct.payout_lecture,start_date:ct.start_date,end_date:ct.end_date,
                        phone:ct.phone,email:ct.email,
                        travel_cost:ct.travel_cost||0,hotel_cost:ct.hotel_cost||0,other_cost:ct.other_cost||0,
                        travel_type:ct.travel_type||null,arrival_date:ct.arrival_date||null,
                        departure_date:ct.departure_date||null,flight_number:ct.flight_number||null
                    };
                    if(ct.arrival_flight_info)try{newGuest.arrival_flight_info=JSON.parse(ct.arrival_flight_info);}catch(e){}
                    if(ct.departure_flight_info)try{newGuest.departure_flight_info=JSON.parse(ct.departure_flight_info);}catch(e){}
                    teachers.push(newGuest);
                }
            });
            // log removed
        }
        if(cloudChat&&cloudChat.length>0){
            chatMsgs=cloudChat.map(r=>({id:r.id,from:r.from_teacher,text:r.message,time:new Date(r.created_at).toLocaleTimeString('de',{hour:'2-digit',minute:'2-digit'})}));
        }
        const cloudSettings=await apiGet('settings');
        if(cloudSettings&&cloudSettings[0]){
            const s=cloudSettings[0];
            if(s.price_45)settings.prices[45]=s.price_45;
            if(s.member_price_45)settings.memberPrice45=s.member_price_45;
            if(s.start_hour)settings.startHour=s.start_hour;
            if(s.end_hour)settings.endHour=s.end_hour;
            settings.campName=s.camp_name||null;
            settings.campStart=s.camp_start||null;
            settings.campEnd=s.camp_end||null;
            settings.campFullPrice=s.camp_full_price||0;
            settings.campDayPrice=s.camp_day_price||0;
            settings.campFullMemberPrice=s.camp_full_member_price||0;
            settings.campDayMemberPrice=s.camp_day_member_price||0;
            if(s.day_locations){
                try{
                    const cloudLocs=JSON.parse(s.day_locations);
                    Object.assign(dayLocations,cloudLocs);
                    localStorage.setItem('motusDayLocations',JSON.stringify(dayLocations));
                    // log removed
                }catch(e){}
            }
            if(s.custom_locations){
                try{
                    const cloudCustomLocs=JSON.parse(s.custom_locations);
                    if(cloudCustomLocs.length>0){
                        locations=[...defaultLocations,...cloudCustomLocs.filter(l=>l.id!=='home'&&l.id!=='london')];
                        localStorage.setItem('motusLocations',JSON.stringify(locations));
                        // log removed
                    }
                }catch(e){}
            }
            // Sync flight API key from app_config JSON (cloud is source of truth)
            if(s.app_config){
                try{
                    const cfg=JSON.parse(s.app_config);
                    if(cfg.flight_api_key){
                        FLIGHT_API_KEY=cfg.flight_api_key;
                        localStorage.setItem('flight_api_key',FLIGHT_API_KEY);
                    }
                }catch(e){}
            }
        }
        // Load trips from trips table
        const cloudTrips=await apiGet('trips');
        if(cloudTrips){
            trips=cloudTrips.map(t=>({
                id:t.id,
                trainer_id:t.trainer_id,
                name:t.name,
                location_id:t.location_id,
                start_date:t.start_date,
                end_date:t.end_date,
                start_time:t.start_time,
                end_time:t.end_time,
                venue_name:t.venue_name,
                venue_address:t.venue_address,
                maps_link:t.maps_link,
                price_45:t.price_45,
                archived:t.archived||false,
                selected_days:t.selected_days?JSON.parse(t.selected_days):[]
            }));
            localStorage.setItem('motusTrips',JSON.stringify(trips));
            // Clean up dayLocations for deleted/archived trips
            cleanupDayLocationsFromTrips();
        }
        saveLocal();await loadCampRegistrations();migrateLessonLocations();render();setSync('online');online=true;
        updateSyncInfo();
    }catch(e){console.error('❌ Sync error:',e);setSync('offline');online=false;}
}

function loadLocal(){
    try{
        const c=localStorage.getItem('motusClients'),l=localStorage.getItem('motusLessons'),m=localStorage.getItem('motusChatMsgs'),s=localStorage.getItem('motusSettings'),t=localStorage.getItem('motusTrainers'),dl=localStorage.getItem('motusDayLocations'),locs=localStorage.getItem('motusLocations'),tr=localStorage.getItem('motusTrash'),tp=localStorage.getItem('motusTrips');
        if(c)clients=JSON.parse(c);if(l)lessons=JSON.parse(l);if(m)chatMsgs=JSON.parse(m);if(s)settings=JSON.parse(s);if(t)teachers=JSON.parse(t);if(dl)dayLocations=JSON.parse(dl);if(locs)locations=JSON.parse(locs);if(tr)trash=JSON.parse(tr);if(tp)trips=JSON.parse(tp);
        cleanupTrash();
        // Auto-fix GROUP lessons without trainer - assign to active guest trainer (or first guest if no date match)
        const groupLessonsNoTrainer=lessons.filter(l=>(l.client.startsWith('[GROUP]')||l.client.includes('[GROUP]'))&&!l.teacher);
        if(groupLessonsNoTrainer.length>0){
            const guestTrainers=teachers.filter(t=>t.is_guest);
            let fixed=0;
            groupLessonsNoTrainer.forEach(lesson=>{
                const lessonDate=new Date(lesson.date+'T12:00');
                // First try to find guest trainer active on this date
                let activeGuest=guestTrainers.find(gt=>{
                    if(!gt.start_date||!gt.end_date)return false;
                    const start=new Date(gt.start_date+'T00:00');
                    const end=new Date(gt.end_date+'T23:59');
                    return lessonDate>=start&&lessonDate<=end;
                });
                // Fallback: use first guest trainer if no date match
                if(!activeGuest&&guestTrainers.length>0){
                    activeGuest=guestTrainers[0];
                }
                if(activeGuest){
                    lesson.teacher=activeGuest.id;
                    fixed++;
                }
            });
            if(fixed>0){
                localStorage.setItem('motusLessons',JSON.stringify(lessons));
            }
        }
        // Migrate old dayLocations (without trainer suffix) to new format
        const oldKeys=Object.keys(dayLocations).filter(k=>!k.includes('_'));
        if(oldKeys.length>0){oldKeys.forEach(k=>{dayLocations[k+'_markus']=dayLocations[k];delete dayLocations[k];});localStorage.setItem('motusDayLocations',JSON.stringify(dayLocations));}
        calCollapsed=localStorage.getItem('motusCalCollapsed')==='true';
        // Gespeicherten Trainer laden
        const savedTrainer=localStorage.getItem('motusCurrentTrainer');
        if(savedTrainer&&teachers.find(t=>t.id===savedTrainer)){
            curTeacher=savedTrainer;
        }
        // Gespeicherte View laden
        const savedView=localStorage.getItem('motusView');
        if(savedView&&(savedView==='day'||savedView==='next'))curView=savedView;
        // Bei next-View: Springe zum ersten Lesson
        if(curView==='next'){
            const today=fmtDate(new Date());
            const upcoming=lessons.filter(l=>l.date>=today&&l.teacher===curTeacher).sort((a,b)=>a.date.localeCompare(b.date));
            if(upcoming.length>0){selDate=new Date(upcoming[0].date+'T12:00');viewDate=new Date(selDate);}
        }
        // Camp Requests laden
        loadCampRequests();
        // Camp Registrations laden
        loadCampRegistrations();
        // Camp Pricing Preview
        updateCampPricingPreview();
    }catch(e){}
}
function saveLocal(){
    localStorage.setItem('motusClients',JSON.stringify(clients));
    localStorage.setItem('motusLessons',JSON.stringify(lessons));
    localStorage.setItem('motusChatMsgs',JSON.stringify(chatMsgs));
    localStorage.setItem('motusSettings',JSON.stringify(settings));
    localStorage.setItem('motusTrainers',JSON.stringify(teachers));
    localStorage.setItem('motusDayLocations',JSON.stringify(dayLocations));
    localStorage.setItem('motusLocations',JSON.stringify(locations));
    localStorage.setItem('motusTrash',JSON.stringify(trash));
    localStorage.setItem('motusTrips',JSON.stringify(trips));
}
function setSync(s){
    const dot=document.getElementById('syncDot'),info=document.getElementById('syncInfo');
    if(dot){dot.className='sync-dot '+s;dot.title=s==='online'?'Online':s==='offline'?'Offline':'Syncing...';}
    if(info)info.textContent=s==='online'?'Online':s==='offline'?'Offline':'Syncing...';
}

// Papierkorb (Trash) functions
let undoTimeout=null,lastDeleted=null;
function moveToTrash(type,item){
    if(!item)return;
    const now=Date.now();
    const trashItem={
        id:'trash_'+now+'_'+Math.random().toString(36).substr(2,5),
        type:type,
        data:JSON.parse(JSON.stringify(item)),
        deleted_at:now,
        expires_at:now+(30*24*60*60*1000)
    };
    trash.push(trashItem);
    lastDeleted=trashItem;
    saveLocal();
    updateTrashBadge();
}
function restoreFromTrash(trashId){
    const idx=trash.findIndex(t=>t.id===trashId);
    if(idx<0)return;
    const item=trash[idx];
    if(item.type==='lesson'){
        lessons.push(item.data);
        if(online)apiPost('lessons',{id:item.data.id,client_name:item.data.client,lesson_date:item.data.date,lesson_time:item.data.time,duration:item.data.dur||item.data.duration,teacher_id:item.data.teacher||'markus',custom_price:item.data.customPrice,location:item.data.location||'home',notes:item.data.notes});
    }else if(item.type==='client'){
        clients.push(item.data);
        if(online)apiPost('clients',item.data);
    }
    trash.splice(idx,1);
    saveLocal();render();updateTrashBadge();
    toast('Wiederhergestellt!');
}
function permanentDelete(trashId){
    const idx=trash.findIndex(t=>t.id===trashId);
    if(idx>=0){
        trash.splice(idx,1);
        saveLocal();
        renderTrashModal();
        updateTrashBadge();
    }
}
function emptyTrash(){
    if(!confirm('Papierkorb endgültig leeren?'))return;
    trash=[];
    saveLocal();
    renderTrashModal();
    updateTrashBadge();
    toast('Papierkorb geleert');
}
function cleanupTrash(){
    const now=Date.now();
    const before=trash.length;
    trash=trash.filter(t=>t.expires_at>now);
    if(trash.length!==before)saveLocal();
}
function updateTrashBadge(){
    const badge=document.getElementById('trashBadge');
    if(badge){
        badge.textContent=trash.length;
        badge.style.display=trash.length>0?'inline':'none';
    }
}
function showUndoToast(type){
    const t=document.getElementById('toast');
    const text=document.getElementById('toastText');
    t.className='toast undo';
    text.innerHTML='Gelöscht <button onclick="undoDelete()" style="margin-left:12px;background:#c9a227;color:#121212;border:none;padding:4px 12px;border-radius:6px;font-weight:600;cursor:pointer">Rückgängig</button>';
    t.classList.add('show');
    if(undoTimeout)clearTimeout(undoTimeout);
    undoTimeout=setTimeout(()=>{t.classList.remove('show');lastDeleted=null;},5000);
}
function undoDelete(){
    if(!lastDeleted)return;
    if(undoTimeout)clearTimeout(undoTimeout);
    restoreFromTrash(lastDeleted.id);
    lastDeleted=null;
    document.getElementById('toast').classList.remove('show');
}
function openTrash(){
    renderTrashModal();
    document.getElementById('trashModal').classList.add('open');
}
function renderTrashModal(){
    const list=document.getElementById('trashList');
    if(trash.length===0){
        list.innerHTML='<div style="text-align:center;padding:30px;color:#71717a">Papierkorb ist leer</div>';
        return;
    }
    const now=Date.now();
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html='';
    trash.slice().reverse().forEach(item=>{
        const daysAgo=Math.floor((now-item.deleted_at)/(24*60*60*1000));
        const agoText=daysAgo===0?'Heute':daysAgo===1?'Gestern':'vor '+daysAgo+' Tagen';
        if(item.type==='lesson'){
            const d=item.data;
            const dateObj=new Date(d.date+'T12:00:00');
            const dateStr=days[dateObj.getDay()]+', '+dateObj.getDate()+'.'+(dateObj.getMonth()+1)+'.';
            html+=`<div style="background:#1a1a1a;border-radius:12px;padding:14px;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                    <span style="font-size:20px">📅</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.client||'Unbekannt'}</div>
                        <div style="font-size:12px;color:#71717a">${dateStr} ${d.time} · ${d.duration} min</div>
                    </div>
                </div>
                <div style="font-size:11px;color:#52525b;margin-bottom:10px">Gelöscht ${agoText}</div>
                <div style="display:flex;gap:8px">
                    <button onclick="restoreFromTrash('${item.id}')" style="flex:1;padding:8px;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer">Wiederherstellen</button>
                    <button onclick="permanentDelete('${item.id}')" style="padding:8px 12px;background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:13px;cursor:pointer">🗑️</button>
                </div>
            </div>`;
        }else if(item.type==='client'){
            const c=item.data;
            html+=`<div style="background:#1a1a1a;border-radius:12px;padding:14px;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                    <span style="font-size:20px">👤</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name||'Unbekannt'}</div>
                        <div style="font-size:12px;color:#71717a">${c.phone1||'Keine Telefonnummer'}</div>
                    </div>
                </div>
                <div style="font-size:11px;color:#52525b;margin-bottom:10px">Gelöscht ${agoText}</div>
                <div style="display:flex;gap:8px">
                    <button onclick="restoreFromTrash('${item.id}')" style="flex:1;padding:8px;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;font-size:13px;font-weight:500;cursor:pointer">Wiederherstellen</button>
                    <button onclick="permanentDelete('${item.id}')" style="padding:8px 12px;background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;font-size:13px;cursor:pointer">🗑️</button>
                </div>
            </div>`;
        }
    });
    list.innerHTML=html;
}

function setupSwipe(){
    const c=document.getElementById('swipeContainer');
    let touchStartX=0,touchStartY=0,touchStartTime=0,touchTarget=null;
    c.addEventListener('touchstart',e=>{
        touchStartX=e.changedTouches[0].screenX;
        touchStartY=e.changedTouches[0].screenY;
        touchStartTime=Date.now();
        touchTarget=e.target;
    },{passive:true});
    c.addEventListener('touchend',e=>{
        const diffX=touchStartX-e.changedTouches[0].screenX;
        const diffY=Math.abs(touchStartY-e.changedTouches[0].screenY);
        const duration=Date.now()-touchStartTime;
        // Check for horizontal swipe (>50px horizontal, not too much vertical)
        if(Math.abs(diffX)>50&&diffY<100){
            if(curView==='next'){setView('day');}
            else{c.classList.add(diffX>0?'swipe-left':'swipe-right');setTimeout(()=>c.classList.remove('swipe-left','swipe-right'),200);navDay(diffX>0?1:-1);}
        }
        // Tap detection: short duration, minimal movement
        else if(duration<300&&Math.abs(diffX)<20&&diffY<20){
            // Find closest slot-card with onclick
            const card=touchTarget.closest('.slot-card');
            if(card&&!card.classList.contains('booked')&&!card.classList.contains('slot-pause')){
                const empty=card.querySelector('.slot-empty');
                if(empty){
                    const timeMatch=empty.textContent.match(/\d{1,2}:\d{2}/);
                    if(timeMatch)openBookingAt(timeMatch[0]);
                }
            }
        }
    },{passive:true});
}

function setupStatsSwipe(){
    const c=document.getElementById('statsPage');
    if(!c)return;
    let touchStartX=0,touchStartY=0;
    const views=['week','month','year'];
    c.addEventListener('touchstart',e=>{
        touchStartX=e.changedTouches[0].screenX;
        touchStartY=e.changedTouches[0].screenY;
    },{passive:true});
    c.addEventListener('touchend',e=>{
        const diffX=touchStartX-e.changedTouches[0].screenX;
        const diffY=Math.abs(touchStartY-e.changedTouches[0].screenY);
        if(Math.abs(diffX)>60&&diffY<80){
            const curIdx=views.indexOf(statsView);
            if(diffX>0&&curIdx<views.length-1){setStatsView(views[curIdx+1]);}
            else if(diffX<0&&curIdx>0){setStatsView(views[curIdx-1]);}
        }
    },{passive:true});
}

function navDay(dir){
    const trainer=teachers.find(t=>t.id===curTeacher);
    // Guest trainer date constraints
    if(trainer?.is_guest&&trainer.start_date&&trainer.end_date){
        const newDate=new Date(selDate);
        newDate.setDate(newDate.getDate()+dir);
        const guestStart=new Date(trainer.start_date+'T00:00');
        const guestEnd=new Date(trainer.end_date+'T23:59');
        if(newDate<guestStart||newDate>guestEnd)return; // Don't navigate outside range
        selDate=newDate;
    }else{
        selDate.setDate(selDate.getDate()+dir);
    }
    viewDate=new Date(selDate);render();
}
function selectDayFromList(ds){
    const newDate=new Date(ds+'T12:00');
    // Guest trainer date constraints
    const trainer=teachers.find(t=>t.id===curTeacher);
    if(trainer?.is_guest&&trainer.start_date&&trainer.end_date){
        const guestStart=new Date(trainer.start_date+'T00:00');
        const guestEnd=new Date(trainer.end_date+'T23:59');
        if(newDate<guestStart||newDate>guestEnd)return;
    }
    selDate=newDate;viewDate=new Date(selDate);render();
}
function setView(v){curView=v;document.querySelectorAll('.view-btn-new').forEach(b=>b.classList.toggle('active',b.dataset.view===v));document.querySelectorAll('.day-nav-btn').forEach(b=>b.style.display=v==='next'?'none':'flex');document.body.classList.toggle('view-day',v==='day');document.body.classList.toggle('view-next',v==='next');localStorage.setItem('motusView',v);syncNavPill();if(v==='next'){const today=fmtDate(new Date());const upcoming=lessons.filter(l=>l.date>=today&&l.teacher===curTeacher).sort((a,b)=>a.date.localeCompare(b.date));if(upcoming.length>0){selDate=new Date(upcoming[0].date+'T12:00');viewDate=new Date(selDate);}}render();}
function toggleNavView(){const nextView=curView==='next'?'day':'next';showPage('calendar');setView(nextView);}
function toggleMonthView(){goHome();toggleCalendar();}
function syncNavPill(){const btn=document.getElementById('navToggle');if(!btn)return;btn.innerHTML=curView==='next'?'<svg viewBox="0 0 24 24" width="28" height="28"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>':'<svg viewBox="0 0 24 24" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';btn.classList.toggle('tag-view',curView==='day');}
function toggleCalendar(){
    calCollapsed=!calCollapsed;
    localStorage.setItem('motusCalCollapsed',calCollapsed);
    document.getElementById('calContainer').classList.toggle('collapsed',calCollapsed);
    document.getElementById('calToggleBtn').classList.toggle('active',!calCollapsed);
}
function selectDay(dateStr){
    const newDate=new Date(dateStr+'T12:00');
    // Guest trainer date constraints
    const trainer=teachers.find(t=>t.id===curTeacher);
    if(trainer?.is_guest&&trainer.start_date&&trainer.end_date){
        const guestStart=new Date(trainer.start_date+'T00:00');
        const guestEnd=new Date(trainer.end_date+'T23:59');
        if(newDate<guestStart||newDate>guestEnd)return;
    }
    selDate=newDate;
    if(curView!=='day')setView('day');
    if(!calCollapsed){calCollapsed=true;localStorage.setItem('motusCalCollapsed','true');document.getElementById('calContainer').classList.add('collapsed');document.getElementById('calToggleBtn').classList.remove('active');}
    render();
}
function getWeekStart(d){const day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);return new Date(d.getFullYear(),d.getMonth(),diff,0,0,0,0);}
function fmtDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function fmtTime(h,m){return String(h).padStart(2,'0')+':'+String(m||0).padStart(2,'0');}
function fmtNum(n){return n.toLocaleString('de-DE');}
function timeToMin(t){const[h,m]=t.split(':').map(Number);return h*60+m;}
function minToTime(m){return fmtTime(Math.floor(m/60),m%60);}
function parseClientName(clientStr){
    if(!clientStr)return'';
    const emailMatch=clientStr.match(/^(.+?)\s*\(([^)]+@[^)]+)\)$/);
    return emailMatch?emailMatch[1].trim():clientStr;
}
function getPrice(dur,clientName,customPrice,teacherId,date,location){
    if(customPrice)return dur===90?customPrice*2:customPrice;
    // For guest trainers, use their payout price
    if(teacherId){
        const trainer=teachers.find(t=>t.id===teacherId);
        if(trainer&&trainer.is_guest&&trainer.payout_price_45){
            const base=trainer.payout_price_45;
            return dur===90?base*2:base;
        }
    }
    // Check for trip price if date is provided
    if(date){
        // First try with location, then try to find any trip for this date/trainer
        let trip=getActiveTripForDate(date,teacherId,location);
        // If no location provided but still no trip, check dayLocations
        if(!trip && !location){
            const dayKey = date + '_' + (teacherId || curTeacher);
            const dayLoc = dayLocations[dayKey];
            if(dayLoc && dayLoc !== 'home'){
                trip = getActiveTripForDate(date, teacherId, dayLoc);
            }
        }
        if(trip&&trip.price_45){
            const base=trip.price_45;
            return dur===90?base*2:base;
        }
    }
    const client=clientName?clients.find(c=>c.name===clientName):null;
    const isMember=client?.is_member;
    const base45=isMember?(settings.memberPrice45||80):(settings.prices[45]||100);
    if(dur===45)return base45;
    if(dur===90)return base45*2;
    return base45;
}
// Display price for booking modal - uses sale_price for guest trainers
function getDisplayPrice(dur,clientName,teacherId,date,isMemberOverride){
    // For guest trainers, use their SALE price (not payout)
    if(teacherId){
        const trainer=teachers.find(t=>t.id===teacherId);
        if(trainer&&trainer.is_guest){
            // Check if client is member for member pricing
            const client=clientName?clients.find(c=>c.name.toLowerCase()===clientName.toLowerCase()):null;
            const isMember=isMemberOverride!==undefined?isMemberOverride:client?.is_member;
            // Use member price if available and client is member
            const base=isMember&&trainer.sale_price_member_45?trainer.sale_price_member_45:(trainer.sale_price_45||100);
            return dur===90?base*2:base;
        }
    }
    // Fallback to regular getPrice
    return getPrice(dur,clientName,null,teacherId,date);
}
function getKW(d){const t=new Date(d);t.setHours(0,0,0,0);t.setDate(t.getDate()+3-(t.getDay()+6)%7);const w1=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-w1)/86400000-3+(w1.getDay()+6)%7)/7);}

function getDayKey(d,trainerId){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'_'+(trainerId||curTeacher);}
function getDayLocation(d,trainerId){const key=getDayKey(d,trainerId);return dayLocations[key]||'home';}
function setDayLocation(d,locId,trainerId){const key=getDayKey(d,trainerId||curTeacher);if(locId==='home')delete dayLocations[key];else dayLocations[key]=locId;saveLocal();renderLocationBadge();syncLocationsToCloud();}
async function syncLocationsToCloud(){if(!online)return;try{await apiPatch('settings','default',{day_locations:JSON.stringify(dayLocations)});}catch(e){}}
async function syncCustomLocationsToCloud(){if(!online)return;try{const customLocs=locations.filter(l=>l.id!=='home'&&l.id!=='london');await apiPatch('settings','default',{custom_locations:JSON.stringify(customLocs)});}catch(e){}}

// Migrate lesson locations from dayLocations
async function migrateLessonLocations(){
    const migrated=localStorage.getItem('motusLocationsMigrated');
    if(migrated)return;
    let count=0;
    lessons.forEach(l=>{
        const key=l.date+'_'+l.teacher;
        const dayLoc=dayLocations[key];
        if(dayLoc&&dayLoc!=='home'&&(!l.location||l.location==='home')){
            l.location=dayLoc;
            count++;
            if(online)apiPatch('lessons',l.id,{location:dayLoc});
        }
    });
    if(count>0){
        saveLocal();
        localStorage.setItem('motusLocationsMigrated','1');
        toast(`✈️ ${count} Lektionen mit Location aktualisiert`);
    }
}
function getLocationInfo(locId){return locations.find(l=>l.id===locId)||locations[0];}

function renderLocationBadge(){
const avatarFlag=document.getElementById('avatarFlag');
const locIconHome=document.getElementById('locIconHome');
const locFlat=document.getElementById('locFlat');
const locFlatFlag=document.getElementById('locFlatFlag');
const locFlatName=document.getElementById('locFlatName');
const locId=getDayLocation(selDate);
const info=getLocationInfo(locId);
if(locId==='home'){
    if(locIconHome)locIconHome.style.display='flex';
    if(locFlat)locFlat.style.display='none';
    if(avatarFlag)avatarFlag.style.display='none';
}else{
    if(locIconHome)locIconHome.style.display='none';
    if(locFlat)locFlat.style.display='flex';
    if(locFlatFlag)locFlatFlag.textContent=info.emoji;
    if(locFlatName)locFlatName.textContent=info.name;
    if(avatarFlag){avatarFlag.style.display='block';avatarFlag.textContent=info.emoji;}
}
}

function openLocationPicker(){
const loc=getDayLocation(selDate);
const html=locations.map(l=>`
<div class="location-option ${l.id===loc?'selected':''}" onclick="selectLocation('${l.id}')">
<span class="location-emoji">${l.emoji}</span>
<span class="location-name">${l.name}</span>
${l.id===loc?'<span class="location-check">✓</span>':''}
</div>
`).join('');
document.getElementById('locationList').innerHTML=html;
document.getElementById('locationModal').classList.add('open');
}

function selectLocation(locId){
setDayLocation(selDate,locId);
closeModal('location');
toast(getLocationInfo(locId).emoji+' '+getLocationInfo(locId).name+' für diesen Tag');
}

const FLAGS=['🏠','🇩🇪','🇬🇧','🇫🇷','🇮🇹','🇪🇸','🇳🇱','🇦🇹','🇨🇭','🇵🇱','🇺🇸','🇨🇦','🇦🇺','🇯🇵','🇰🇷','🇭🇰','🇸🇬','🇹🇭','🇦🇪','🇨🇳','🇮🇳','🇧🇷','🇲🇽','🇵🇹','🇬🇷','🇹🇷','🇷🇺','🇨🇿','🇭🇺','🇸🇪','🇩🇰','🇳🇴','🇫🇮','🇧🇪','🇮🇪','🇭🇷'];
const CITY_FLAGS={
'london':'🇬🇧','manchester':'🇬🇧','birmingham':'🇬🇧','liverpool':'🇬🇧','leeds':'🇬🇧','bristol':'🇬🇧','edinburgh':'🇬🇧','glasgow':'🇬🇧',
'paris':'🇫🇷','lyon':'🇫🇷','marseille':'🇫🇷','nizza':'🇫🇷','nice':'🇫🇷','bordeaux':'🇫🇷',
'rom':'🇮🇹','rome':'🇮🇹','mailand':'🇮🇹','milan':'🇮🇹','venedig':'🇮🇹','venice':'🇮🇹','florenz':'🇮🇹','florence':'🇮🇹','neapel':'🇮🇹','naples':'🇮🇹',
'madrid':'🇪🇸','barcelona':'🇪🇸','valencia':'🇪🇸','sevilla':'🇪🇸','malaga':'🇪🇸','ibiza':'🇪🇸','mallorca':'🇪🇸',
'amsterdam':'🇳🇱','rotterdam':'🇳🇱','utrecht':'🇳🇱','haag':'🇳🇱',
'wien':'🇦🇹','vienna':'🇦🇹','salzburg':'🇦🇹','innsbruck':'🇦🇹','graz':'🇦🇹',
'zürich':'🇨🇭','zurich':'🇨🇭','genf':'🇨🇭','geneva':'🇨🇭','basel':'🇨🇭','bern':'🇨🇭',
'warschau':'🇵🇱','warsaw':'🇵🇱','krakau':'🇵🇱','krakow':'🇵🇱','danzig':'🇵🇱','gdansk':'🇵🇱',
'new york':'🇺🇸','los angeles':'🇺🇸','chicago':'🇺🇸','miami':'🇺🇸','las vegas':'🇺🇸','san francisco':'🇺🇸','boston':'🇺🇸','seattle':'🇺🇸',
'sydney':'🇦🇺','melbourne':'🇦🇺','brisbane':'🇦🇺','perth':'🇦🇺',
'tokio':'🇯🇵','tokyo':'🇯🇵','osaka':'🇯🇵','kyoto':'🇯🇵',
'seoul':'🇰🇷','busan':'🇰🇷',
'hong kong':'🇭🇰','hongkong':'🇭🇰',
'singapur':'🇸🇬','singapore':'🇸🇬',
'bangkok':'🇹🇭','phuket':'🇹🇭',
'dubai':'🇦🇪','abu dhabi':'🇦🇪',
'peking':'🇨🇳','beijing':'🇨🇳','shanghai':'🇨🇳','shenzhen':'🇨🇳',
'taipei':'🇹🇼',
'mumbai':'🇮🇳','delhi':'🇮🇳','bangalore':'🇮🇳',
'tel aviv':'🇮🇱','jerusalem':'🇮🇱',
'kairo':'🇪🇬','cairo':'🇪🇬',
'kapstadt':'🇿🇦','cape town':'🇿🇦','johannesburg':'🇿🇦',
'toronto':'🇨🇦','vancouver':'🇨🇦','montreal':'🇨🇦',
'mexiko':'🇲🇽','mexico city':'🇲🇽','cancun':'🇲🇽',
'buenos aires':'🇦🇷',
'santiago':'🇨🇱',
'lima':'🇵🇪',
'bogota':'🇨🇴','medellin':'🇨🇴',
'havanna':'🇨🇺','havana':'🇨🇺',
'reykjavik':'🇮🇸',
'tallinn':'🇪🇪',
'riga':'🇱🇻',
'vilnius':'🇱🇹',
'belgrad':'🇷🇸','belgrade':'🇷🇸',
'sofia':'🇧🇬',
'tirana':'🇦🇱',
'skopje':'🇲🇰',
'sarajevo':'🇧🇦',
'ljubljana':'🇸🇮',
'bratislava':'🇸🇰',
'monaco':'🇲🇨',
'luxemburg':'🇱🇺','luxembourg':'🇱🇺',
'rio':'🇧🇷','sao paulo':'🇧🇷',
'lissabon':'🇵🇹','lisbon':'🇵🇹','porto':'🇵🇹',
'athen':'🇬🇷','athens':'🇬🇷','thessaloniki':'🇬🇷',
'istanbul':'🇹🇷','ankara':'🇹🇷','antalya':'🇹🇷',
'moskau':'🇷🇺','moscow':'🇷🇺','st. petersburg':'🇷🇺',
'prag':'🇨🇿','prague':'🇨🇿','brünn':'🇨🇿','brno':'🇨🇿',
'budapest':'🇭🇺',
'stockholm':'🇸🇪','göteborg':'🇸🇪','malmö':'🇸🇪',
'kopenhagen':'🇩🇰','copenhagen':'🇩🇰',
'oslo':'🇳🇴','bergen':'🇳🇴',
'helsinki':'🇫🇮',
'brüssel':'🇧🇪','brussels':'🇧🇪','antwerpen':'🇧🇪',
'dublin':'🇮🇪','cork':'🇮🇪',
'zagreb':'🇭🇷','split':'🇭🇷','dubrovnik':'🇭🇷',
'kiew':'🇺🇦','kiev':'🇺🇦','kyiv':'🇺🇦',
'bukarest':'🇷🇴','bucharest':'🇷🇴','sibiu':'🇷🇴','cluj':'🇷🇴','timisoara':'🇷🇴','iasi':'🇷🇴','brasov':'🇷🇴','constanta':'🇷🇴',
'berlin':'🇩🇪','münchen':'🇩🇪','munich':'🇩🇪','hamburg':'🇩🇪','frankfurt':'🇩🇪','köln':'🇩🇪','cologne':'🇩🇪','düsseldorf':'🇩🇪','stuttgart':'🇩🇪','dresden':'🇩🇪','leipzig':'🇩🇪','hannover':'🇩🇪','nürnberg':'🇩🇪'
};

function detectFlag(city){
const c=city.toLowerCase().trim();
return CITY_FLAGS[c]||null;
}

function autoDetectFlag(){
const city=document.getElementById('locName').value;
const flag=detectFlag(city);
if(flag){
document.getElementById('locEmoji').value=flag;
renderFlagPicker(flag);
}
}

function renderLocationSettings(){
const el=document.getElementById('locationList2');if(!el)return;
let h='';
locations.forEach(l=>{
const isDefault=(l.id==='home');
h+=`<div class="settings-item" onclick="${isDefault?'':'editLocation(\''+l.id+'\')'}">
<div class="settings-left">
<div class="settings-icon" style="background:rgba(201,162,39,.15);font-size:28px">${l.emoji}</div>
<div><span class="settings-label">${l.name}</span><span class="settings-desc">${isDefault?'Standard':'Klicken zum Bearbeiten'}</span></div>
</div>
<span class="settings-value">${isDefault?'🏠':''}</span>
</div>`;
});
el.innerHTML=h;
}

function openNewLocation(){
document.getElementById('newLocationTitle').textContent='Neuer Standort';
document.getElementById('locName').value='';
document.getElementById('locEmoji').value='🇩🇪';
document.getElementById('locEditId').value='';
document.getElementById('delLocBtn').style.display='none';
renderFlagPicker('🇩🇪');
document.getElementById('newLocationModal').classList.add('open');
}

function editLocation(id){
const loc=locations.find(l=>l.id===id);if(!loc||id==='home')return;
document.getElementById('newLocationTitle').textContent='Standort bearbeiten';
document.getElementById('locName').value=loc.name;
document.getElementById('locEmoji').value=loc.emoji;
document.getElementById('locEditId').value=id;
document.getElementById('delLocBtn').style.display='block';
renderFlagPicker(loc.emoji);
document.getElementById('newLocationModal').classList.add('open');
}

function renderFlagPicker(selected){
const el=document.getElementById('flagPicker');if(!el)return;
el.innerHTML=FLAGS.map(f=>`<div class="flag-opt${f===selected?' selected':''}" onclick="pickFlag('${f}')">${f}</div>`).join('');
}

function pickFlag(f){
document.getElementById('locEmoji').value=f;
document.querySelectorAll('.flag-opt').forEach(e=>e.classList.remove('selected'));
event.target.classList.add('selected');
}

function saveLocation(){
const name=document.getElementById('locName').value.trim();
const emoji=document.getElementById('locEmoji').value;
const editId=document.getElementById('locEditId').value;
if(!name){toast('⚠️ Name eingeben');return;}
if(editId){
const loc=locations.find(l=>l.id===editId);
if(loc){loc.name=name;loc.emoji=emoji;}
}else{
const id=name.toLowerCase().replace(/[^a-z0-9]/g,'')+'_'+Date.now();
locations.push({id,name,emoji,currency:'EUR'});
}
saveLocal();renderLocationSettings();closeModal('newLocation');syncCustomLocationsToCloud();
toast(emoji+' '+name+' gespeichert');
}

function deleteLocation(){
const editId=document.getElementById('locEditId').value;
if(!editId||editId==='home')return;
locations=locations.filter(l=>l.id!==editId);
Object.keys(dayLocations).forEach(k=>{if(dayLocations[k]===editId)delete dayLocations[k];});
saveLocal();renderLocationSettings();closeModal('newLocation');syncCustomLocationsToCloud();syncLocationsToCloud();
toast('Standort gelöscht');
}

// ==================== TRIPS (Reisen) ====================
let selectedTripLocation = null;
let selectedTripDays = [];

// ==================== TRIPS SUBMENU ====================

function openTripsSubmenu() {
    renderTripsSubmenu();
    document.getElementById('tripsSubmenu').classList.add('open');
}

function closeTripsSubmenu() {
    document.getElementById('tripsSubmenu').classList.remove('open');
}

function toggleTripsDropdown() {
    document.getElementById('tripsDropdown').classList.toggle('open');
}

function toggleArchivedTrips() {
    const section = document.getElementById('archivedSection');
    const list = document.getElementById('archivedList');
    const toggle = document.getElementById('archivedToggle');

    section.classList.toggle('open');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        list.style.display = 'none';
        toggle.textContent = '▶';
    }
}

function renderTripsSubmenu() {
    const today = new Date().toISOString().split('T')[0];
    const trainerTrips = trips.filter(t => t.trainer_id === curTeacher);

    // Separate active/upcoming and archived
    const activeTrips = trainerTrips.filter(t => !t.archived && t.end_date >= today).sort((a,b) => a.start_date.localeCompare(b.start_date));
    const archivedTrips = trainerTrips.filter(t => t.archived || t.end_date < today);

    // Update counts
    document.getElementById('submenuTripsCount').textContent = activeTrips.length;

    // Render trips dropdown
    const dropdown = document.getElementById('tripsDropdown');
    const selected = document.getElementById('tripsDropdownSelected');
    const list = document.getElementById('tripsDropdownList');

    if (activeTrips.length === 0) {
        selected.innerHTML = '<span class="dropdown-placeholder">Keine geplanten Reisen</span><span class="dropdown-arrow">▼</span>';
        list.innerHTML = '';
    } else {
        const activeTrip = activeTrips.find(t => t.start_date <= today && t.end_date >= today);
        const displayTrip = activeTrip || activeTrips[0];
        const loc = getLocationInfo(displayTrip.location_id);

        selected.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:20px">${loc.emoji}</span>
                <div>
                    <div style="font-size:13px;font-weight:500">${displayTrip.name}</div>
                    <div style="font-size:11px;color:#71717a">${formatTripDateRange(new Date(displayTrip.start_date+'T12:00'), new Date(displayTrip.end_date+'T12:00'))}</div>
                </div>
                ${activeTrip ? '<span class="active-badge" style="margin-left:8px">JETZT</span>' : ''}
            </div>
            <span class="dropdown-arrow">▼</span>
        `;

        list.innerHTML = activeTrips.map(trip => {
            const tripLoc = getLocationInfo(trip.location_id);
            const isActive = trip.start_date <= today && trip.end_date >= today;
            return `
                <div class="trip-dropdown-item ${isActive ? 'active' : ''}" onclick="editTrip('${trip.id}');closeTripsSubmenu()">
                    <span class="trip-flag">${tripLoc.emoji}</span>
                    <div class="trip-info">
                        <div class="trip-name">${trip.name}</div>
                        <div class="trip-dates">${formatTripDateRange(new Date(trip.start_date+'T12:00'), new Date(trip.end_date+'T12:00'))}</div>
                        ${trip.venue_name ? `<div class="trip-venue">📍 ${trip.venue_name}</div>` : ''}
                    </div>
                    ${isActive ? '<span class="active-badge">JETZT</span>' : ''}
                    <button class="edit-btn" onclick="event.stopPropagation();editTrip('${trip.id}');closeTripsSubmenu()">✏️</button>
                </div>
            `;
        }).join('');
    }

    // Render archived section
    const archivedSection = document.getElementById('archivedSection');
    const archivedCount = document.getElementById('archivedCount');
    const archivedList = document.getElementById('archivedList');

    if (archivedTrips.length > 0) {
        archivedSection.style.display = 'block';
        archivedCount.textContent = archivedTrips.length;
        archivedList.innerHTML = archivedTrips.map(trip => {
            const tripLoc = getLocationInfo(trip.location_id);
            const startDate = new Date(trip.start_date + 'T12:00');
            const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            const dateStr = `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
            return `
                <div class="archived-item">
                    <span class="flag">${tripLoc.emoji}</span>
                    <div class="archived-info">
                        <span class="name">${trip.name}</span>
                        <span class="date">${dateStr}</span>
                    </div>
                    <button class="restore-btn" onclick="event.stopPropagation();restoreTrip('${trip.id}')">↩️</button>
                </div>
            `;
        }).join('');
    } else {
        archivedSection.style.display = 'none';
    }
}

function renderTripsUI() {
    const timeline = document.getElementById('tripsTimelinePreview');
    const titleEl = document.getElementById('tripsTimelineTitle');
    const grid = document.getElementById('locationGrid');

    // Filter upcoming/active trips for current trainer
    const today = new Date().toISOString().split('T')[0];
    const trainerTrips = trips.filter(t => t.trainer_id === curTeacher);
    const upcomingTrips = trainerTrips.filter(t => !t.archived && t.end_date >= today).sort((a,b) => a.start_date.localeCompare(b.start_date));
    const activeTrip = upcomingTrips.find(t => t.start_date <= today && t.end_date >= today);

    // Update title with count badge
    if (titleEl) {
        if (upcomingTrips.length === 0) {
            titleEl.innerHTML = '📅 Geplante Reisen';
        } else {
            titleEl.innerHTML = `📅 Geplante Reisen <span class="trip-count-badge">${upcomingTrips.length}</span>`;
        }
    }

    // Render timeline preview
    if (timeline) {
        if (upcomingTrips.length === 0) {
            timeline.innerHTML = '<div class="timeline-empty">Keine Reisen geplant</div>';
        } else {
            // Build timeline with home gaps
            let timelineHTML = '';
            const maxShow = 4;
            const tripsToShow = upcomingTrips.slice(0, maxShow);

            tripsToShow.forEach((trip, index) => {
                const loc = getLocationInfo(trip.location_id);
                const isActive = activeTrip && activeTrip.id === trip.id;
                const startDate = new Date(trip.start_date + 'T12:00');
                const endDate = new Date(trip.end_date + 'T12:00');
                const dateStr = formatTripDateRange(startDate, endDate);
                const tripDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                // Calculate home days BETWEEN trips (not before first trip)
                if (index > 0) {
                    const prevTrip = tripsToShow[index - 1];
                    const prevEnd = new Date(prevTrip.end_date + 'T12:00');
                    const homeDays = Math.round((startDate - prevEnd) / (1000 * 60 * 60 * 24)) - 1;

                    if (homeDays > 0) {
                        timelineHTML += `<div class="timeline-item home">
                            <div class="timeline-item-content">
                                <span class="flag">🏠</span>
                                <div class="info">
                                    <div class="name">Zuhause</div>
                                </div>
                                <span class="days-badge home-badge">${homeDays}d</span>
                            </div>
                        </div>`;
                    }
                }

                // Show trip (clickable)
                timelineHTML += `<div class="timeline-item ${isActive ? 'active' : ''}" onclick="event.stopPropagation();editTrip('${trip.id}')" style="cursor:pointer">
                    <div class="timeline-item-content">
                        <span class="flag">${loc.emoji}</span>
                        <div class="info">
                            <div class="name">${trip.name}</div>
                            <div class="date">${dateStr}</div>
                        </div>
                        <span class="days-badge">${tripDays}d</span>
                        ${isActive ? '<span class="badge">JETZT</span>' : ''}
                    </div>
                </div>`;
            });

            if (upcomingTrips.length > maxShow) {
                timelineHTML += `<div class="timeline-item past"><div class="timeline-item-content"><span class="flag">...</span><div class="info"><div class="name">+${upcomingTrips.length - maxShow} weitere</div></div></div></div>`;
            }

            timeline.innerHTML = timelineHTML;
        }
    }

    // Render locations grid
    if (grid) {
        const tripCountByLoc = {};
        trainerTrips.forEach(t => {
            tripCountByLoc[t.location_id] = (tripCountByLoc[t.location_id] || 0) + 1;
        });

        grid.innerHTML = locations.map(loc => {
            const isHome = loc.id === 'home';
            const tripCount = tripCountByLoc[loc.id] || 0;
            return `<div class="location-card ${isHome ? 'home' : ''}" onclick="editLocation('${loc.id}')">
                ${isHome ? '<span class="default-badge">DEFAULT</span>' : ''}
                <div class="loc-flag">${loc.emoji}</div>
                <div class="loc-name">${loc.name}</div>
                <div class="loc-trips">${tripCount > 0 ? tripCount + ' Reise' + (tripCount > 1 ? 'n' : '') : (isHome ? 'Standard' : '')}</div>
            </div>`;
        }).join('');
    }
}

function formatTripDateRange(start, end) {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameMonth && sameYear) {
        return `${start.getDate()}. - ${end.getDate()}. ${months[start.getMonth()]} ${start.getFullYear()}`;
    } else if (sameYear) {
        return `${start.getDate()}. ${months[start.getMonth()]} - ${end.getDate()}. ${months[end.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()}. ${months[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()}. ${months[end.getMonth()]} ${end.getFullYear()}`;
}

function openNewTrip() {
    document.getElementById('tripModalTitle').textContent = 'Neue Reise';
    document.getElementById('tripId').value = '';
    document.getElementById('tripName').value = '';
    document.getElementById('tripStartDate').value = '';
    document.getElementById('tripEndDate').value = '';
    document.getElementById('tripStartTime').value = '09:00';
    document.getElementById('tripEndTime').value = '20:00';
    document.getElementById('tripVenueName').value = '';
    document.getElementById('tripVenueAddress').value = '';
    document.getElementById('tripMapsLink').value = '';
    document.getElementById('tripPrice45').value = '';
    document.getElementById('tripDeleteBtn').style.display = 'none';
    document.getElementById('tripDaysSection').style.display = 'none';

    selectedTripLocation = null;
    selectedTripDays = [];

    renderTripLocationSelector();
    setupTripDateListeners();

    document.getElementById('tripModal').classList.add('open');
    setTimeout(initPlacesAutocomplete,100);
}

function editTrip(id) {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    document.getElementById('tripModalTitle').textContent = 'Reise bearbeiten';
    document.getElementById('tripId').value = id;
    document.getElementById('tripName').value = trip.name;
    document.getElementById('tripStartDate').value = trip.start_date;
    document.getElementById('tripEndDate').value = trip.end_date;
    document.getElementById('tripStartTime').value = trip.start_time || '09:00';
    document.getElementById('tripEndTime').value = trip.end_time || '20:00';
    document.getElementById('tripVenueName').value = trip.venue_name || '';
    document.getElementById('tripVenueAddress').value = trip.venue_address || '';
    document.getElementById('tripMapsLink').value = trip.maps_link || '';
    document.getElementById('tripPrice45').value = trip.price_45 || '';
    document.getElementById('tripDeleteBtn').style.display = 'block';

    selectedTripLocation = trip.location_id;
    selectedTripDays = trip.selected_days || [];

    renderTripLocationSelector();
    setupTripDateListeners();
    renderTripDays();

    document.getElementById('tripModal').classList.add('open');
    setTimeout(initPlacesAutocomplete,100);
}

function closeTripModal() {
    document.getElementById('tripModal').classList.remove('open');
    // Also close submenu - no intermediate screen needed
    document.getElementById('tripsSubmenu').classList.remove('open');
}

function renderTripLocationSelector() {
    const container = document.getElementById('tripLocationSelector');
    if (!container) return;

    container.innerHTML = locations.filter(l => l.id !== 'home').map(loc =>
        `<div class="location-chip ${selectedTripLocation === loc.id ? 'selected' : ''}" onclick="selectTripLocation('${loc.id}')">
            <span class="chip-flag">${loc.emoji}</span>
            <span class="chip-name">${loc.name}</span>
        </div>`
    ).join('') + `<div class="location-chip add-new-chip" onclick="openNewLocation();closeTripModal()">
        <span class="chip-flag">+</span>
        <span class="chip-name">Neu</span>
    </div>`;
}

function selectTripLocation(id) {
    selectedTripLocation = id;
    renderTripLocationSelector();
}

function setupTripDateListeners() {
    const startInput = document.getElementById('tripStartDate');
    const endInput = document.getElementById('tripEndDate');

    const updateDays = () => {
        const start = startInput.value;
        const end = endInput.value;
        if (start && end && start <= end) {
            renderTripDays();
        }
    };

    startInput.onchange = updateDays;
    endInput.onchange = updateDays;
}

function renderTripDays() {
    const section = document.getElementById('tripDaysSection');
    const grid = document.getElementById('tripDaysGrid');
    const startDate = document.getElementById('tripStartDate').value;
    const endDate = document.getElementById('tripEndDate').value;

    if (!startDate || !endDate || startDate > endDate) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const start = new Date(startDate + 'T12:00');
    const end = new Date(endDate + 'T12:00');
    let html = '';

    // If no days selected yet, select all by default
    if (selectedTripDays.length === 0) {
        selectedTripDays = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            selectedTripDays.push(d.toISOString().split('T')[0]);
        }
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const isSelected = selectedTripDays.includes(dateStr);
        html += `<div class="day-chip ${isSelected ? 'selected' : ''}" onclick="toggleTripDay('${dateStr}')">
            <span class="day-name">${days[d.getDay()]}</span>
            <span class="day-num">${d.getDate()}</span>
        </div>`;
    }

    grid.innerHTML = html;
}

function toggleTripDay(dateStr) {
    const idx = selectedTripDays.indexOf(dateStr);
    if (idx >= 0) {
        selectedTripDays.splice(idx, 1);
    } else {
        selectedTripDays.push(dateStr);
    }
    renderTripDays();
}

function saveTrip() {
    const id = document.getElementById('tripId').value;
    const name = document.getElementById('tripName').value.trim();
    const startDate = document.getElementById('tripStartDate').value;
    const endDate = document.getElementById('tripEndDate').value;
    const startTime = document.getElementById('tripStartTime').value;
    const endTime = document.getElementById('tripEndTime').value;
    const venueName = document.getElementById('tripVenueName').value.trim();
    const venueAddress = document.getElementById('tripVenueAddress').value.trim();
    const mapsLink = document.getElementById('tripMapsLink').value.trim();
    const price45 = document.getElementById('tripPrice45').value.trim();

    if (!name) { toast('⚠️ Bezeichnung eingeben'); return; }
    if (!selectedTripLocation) { toast('⚠️ Standort auswählen'); return; }
    if (!startDate || !endDate) { toast('⚠️ Datum eingeben'); return; }
    if (startDate > endDate) { toast('⚠️ Startdatum muss vor Enddatum liegen'); return; }

    const tripData = {
        id: id || 'trip_' + Date.now(),
        name,
        location_id: selectedTripLocation,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        venue_name: venueName,
        venue_address: venueAddress,
        maps_link: mapsLink,
        price_45: price45 ? parseFloat(price45) : null,
        trainer_id: curTeacher,
        selected_days: selectedTripDays
    };

    if (id) {
        // Update existing
        const idx = trips.findIndex(t => t.id === id);
        if (idx >= 0) trips[idx] = tripData;
    } else {
        // Add new
        trips.push(tripData);
    }

    // Update dayLocations for all selected days
    selectedTripDays.forEach(dateStr => {
        const key = dateStr + '_' + curTeacher;
        dayLocations[key] = selectedTripLocation;
    });

    saveLocal();
    syncTripsToCloud();
    syncLocationsToCloud();
    renderTripsUI();
    closeTripModal();

    const loc = getLocationInfo(selectedTripLocation);
    toast(`✈️ ${loc.emoji} ${name} gespeichert`);
}

function deleteTrip() {
    const id = document.getElementById('tripId').value;
    if (!id) return;

    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    // Archive instead of delete (keep data for statistics)
    trip.archived = true;

    // Remove dayLocations for this trip's date range
    if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const key = dateStr + '_' + (trip.trainer_id || curTeacher);
            if (dayLocations[key] === trip.location_id) {
                delete dayLocations[key];
            }
        }
    }

    saveLocal();
    syncTripsToCloud();
    syncLocationsToCloud();
    renderTripsUI();
    closeTripModal();
    toast('📦 Reise archiviert');
}

function permanentlyDeleteTrip(id) {
    trips = trips.filter(t => t.id !== id);
    saveLocal();
    syncTripsToCloud();
    renderTripsUI();
    toast('🗑️ Reise endgültig gelöscht');
}

function restoreTrip(id) {
    const trip = trips.find(t => t.id === id);
    if (trip) {
        trip.archived = false;
        saveLocal();
        syncTripsToCloud();
        renderTripsUI();
        toast('✅ Reise wiederhergestellt');
    }
}

async function syncTripsToCloud() {
    if (!online) return;
    try {
        for (const trip of trips) {
            const tripData = {
                id: trip.id,
                trainer_id: trip.trainer_id || curTeacher,
                name: trip.name,
                location_id: trip.location_id,
                start_date: trip.start_date,
                end_date: trip.end_date,
                start_time: trip.start_time || null,
                end_time: trip.end_time || null,
                venue_name: trip.venue_name || null,
                venue_address: trip.venue_address || null,
                maps_link: trip.maps_link || null,
                price_45: trip.price_45 || null,
                archived: trip.archived || false
            };
            // Check if trip exists, then update or insert
            const existing = await fetch(API_URL + '/trips?id=eq.' + trip.id + '&select=id', { headers: API_HEADERS });
            const existingData = await existing.json();
            if (existingData && existingData.length > 0) {
                await apiPatch('trips', trip.id, tripData);
            } else {
                await apiPost('trips', tripData);
            }
        }
    } catch (e) {
        console.error('Trip sync error:', e);
    }
}

// Get active trip for a date
function getActiveTripForDate(dateStr, trainerId, locationId) {
    // First try to find a trip matching trainer
    let trip = trips.find(t =>
        t.trainer_id === (trainerId || curTeacher) &&
        t.start_date <= dateStr &&
        t.end_date >= dateStr &&
        (!t.selected_days || t.selected_days.length === 0 || t.selected_days.includes(dateStr))
    );
    // If no trip found and location is provided, try to find any trip for that location
    if (!trip && locationId && locationId !== 'home') {
        trip = trips.find(t =>
            t.location_id === locationId &&
            t.start_date <= dateStr &&
            t.end_date >= dateStr &&
            (!t.selected_days || t.selected_days.length === 0 || t.selected_days.includes(dateStr))
        );
    }
    return trip;
}

// Clean up dayLocations that belong to trips no longer in the active trips list
function cleanupDayLocationsFromTrips() {
    const activeTrips = trips.filter(t => !t.archived);
    let changed = false;

    // Get all location_ids from active trips
    const activeLocationIds = new Set(activeTrips.map(t => t.location_id));
    // Also keep default locations (home, london)
    activeLocationIds.add('home');
    activeLocationIds.add('london');

    // Check each dayLocation
    Object.keys(dayLocations).forEach(key => {
        const locId = dayLocations[key];
        // If this location doesn't belong to any active trip AND is not a default location
        if (!activeLocationIds.has(locId)) {
            // Check if this locId belongs to any trip at all
            const belongsToTrip = trips.some(t => t.location_id === locId);
            if (belongsToTrip) {
                // Trip was archived/deleted, remove this dayLocation
                delete dayLocations[key];
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem('motusDayLocations', JSON.stringify(dayLocations));
        syncLocationsToCloud();
    }
}

// ==================== END TRIPS ====================

function render(){
    // Skip mobile render if on desktop workspace
    if(document.body.classList.contains('workspace'))return;
    document.body.classList.toggle('view-day',curView==='day');
    document.body.classList.toggle('view-next',curView==='next');
    renderSlots(); // First: updates selDate in next view
    renderProfile(); // Then: renders week chart with correct date
    renderSwitch();
    renderCal();
    renderClients();
    renderStats();
    updateTrainerPopup();
    renderGuestTrainerList();
    renderGuestTrainerLinks();
    renderLocationBadge();
    renderLocationSettings();
    renderTripsUI();
    const pp=document.getElementById('pricePreview');if(pp)pp.textContent='€'+settings.prices[45]+' / M: €'+(settings.memberPrice45||80);
    const hp=document.getElementById('hoursPreview');if(hp)hp.textContent=settings.startHour+':00 - '+settings.endHour+':00';
    updateCampPreview();
    document.querySelectorAll('.day-nav-btn').forEach(b=>b.style.display=curView==='next'?'none':'flex');
    const dnc=document.querySelector('.day-nav-center');if(dnc)dnc.style.display=curView==='next'?'none':'block';
    const dn=document.querySelector('.day-nav');if(dn)dn.style.display=curView==='next'?'none':'flex';
    updateTrainerTheme();
}

// Graph zeigt IMMER die Woche des ausgewählten Tages (selDate)
function renderProfile(){
    const t=teachers.find(x=>x.id===curTeacher);
    if(!t)return;
    const pn=document.getElementById('profileName');if(pn)pn.textContent=t.name;
    const hdrAv=document.getElementById('headerAvatar');
    if(hdrAv){
        if(t.photo&&t.photo.length>10){hdrAv.style.backgroundImage='url('+t.photo+')';hdrAv.textContent='';hdrAv.style.backgroundColor='transparent';}
        else{hdrAv.style.backgroundImage='';hdrAv.textContent=t.init;hdrAv.style.backgroundColor=t.color;}
    }
    
    // Graph basiert auf View: Dashboard zeigt Woche der nächsten Stunde, Tag zeigt selDate
    const today=new Date();
    let chartDate=selDate;
    // Week chart stays on selected week in both views

    const ws=getWeekStart(chartDate);
    ws.setHours(0,0,0,0);
    
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let wc=0,wr=0,dayCounts=Array(7).fill(0);

    // Count current trainer's lessons + GROUP sessions (but not BLOCKED/PAUSE)
    lessons.filter(l=>l.teacher===curTeacher&&((!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]'))||l.client.startsWith('[GROUP]'))).forEach(l=>{
        const ld=new Date(l.date+'T12:00');
        const dayDiff=Math.floor((ld-ws)/(86400000));
        const units=Math.ceil(l.dur/45);
        if(dayDiff>=0&&dayDiff<7){
            wc+=units;wr+=getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location);
            dayCounts[dayDiff]+=units;
        }
    });
    
    const sw=document.getElementById('statWeek');if(sw)sw.textContent=wc;
    const sr=document.getElementById('statRev');if(sr)sr.textContent='€'+fmtNum(wr);
    
    const wc_el=document.getElementById('weekChart');
    if(wc_el){
        let h='';
        const maxUnits=12;
        // Guest trainer date constraints for visual indication
        const guestStart=t.is_guest&&t.start_date?new Date(t.start_date+'T00:00'):null;
        const guestEnd=t.is_guest&&t.end_date?new Date(t.end_date+'T23:59'):null;

        for(let i=0;i<7;i++){
            const d=new Date(ws.getTime()+i*86400000);
            const isToday=d.toDateString()===today.toDateString();
            const isSelected=d.toDateString()===chartDate.toDateString();
            const isSaturday=(i===5);
            const isSunday=(i===6);
            // Check if day is outside guest trainer range
            const isOutsideGuestRange=guestStart&&guestEnd&&(d<guestStart||d>guestEnd);
            const count=dayCounts[i];
            const fillPercent=Math.round((count/maxUnits)*100);
            // Farbskala: 0=empty, 1-2=green, 3-4=lime, 5-6=yellow, 7-8=orange, 9-10=red, 11-12=deep-red
            const colorClass=count===0?'empty':count<=2?'green':count<=4?'lime':count<=6?'yellow':count<=8?'orange':count<=10?'red':'deep-red';
            const color=isOutsideGuestRange?'#1a1a1a':count===0?'#333':count<=2?'#22c55e':count<=4?'#84cc16':count<=6?'#eab308':count<=8?'#f97316':count<=10?'#ef4444':'#dc2626';
            const classes=['ring-day',colorClass];
            if(isToday)classes.push('today');
            if(isSelected)classes.push('selected');
            if(isSaturday)classes.push('saturday');
            if(isSunday)classes.push('sunday');
            if(isOutsideGuestRange)classes.push('disabled');

            h+='<div class="'+classes.join(' ')+'" onclick="jumpToDay('+i+')">';
            h+='<div class="ring-wrap">';
            h+='<div class="ring-arc" style="background:conic-gradient('+color+' '+fillPercent+'%,#2a2a2a '+fillPercent+'%)"></div>';
            h+='<div class="ring-center">'+(count||'0')+'</div>';
            h+='</div>';
            h+='<span class="ring-label">'+days[i]+'</span>';
            h+='</div>';
        }
        wc_el.innerHTML=h;
    }
    
    // KW Label
    const labelEl=document.getElementById('weekNavLabel');
    if(labelEl){
        const kw=getKW(ws);
        labelEl.textContent='KW '+kw;
    }
}

// Klick auf Graph-Tag springt zu diesem Tag
function jumpToDay(dayIndex){
    const ws=getWeekStart(selDate);
    const targetDate=new Date(ws.getTime()+dayIndex*86400000);
    // Guest trainer date constraints
    const trainer=teachers.find(t=>t.id===curTeacher);
    if(trainer?.is_guest&&trainer.start_date&&trainer.end_date){
        const guestStart=new Date(trainer.start_date+'T00:00');
        const guestEnd=new Date(trainer.end_date+'T23:59');
        if(targetDate<guestStart||targetDate>guestEnd)return; // Don't jump to days outside range
    }
    selDate=targetDate;
    render();
}

function renderSwitch(){
    const sw=document.getElementById('avatarSwitch');
    if(!sw)return;
    const other=teachers.find(t=>t.id!==curTeacher);
    const si=document.getElementById('switchInit');
    if(other&&other.photo&&other.photo.length>10){sw.style.backgroundImage='url('+other.photo+')';sw.style.backgroundColor='transparent';if(si)si.textContent='';}
    else if(other){sw.style.backgroundImage='';sw.style.backgroundColor=other.color;if(si)si.textContent=other.init;}
}
function toggleTrainerPopup(e){
    e.stopPropagation();
    const popup=document.getElementById('trainerPopup');
    popup.classList.toggle('show');
    updateTrainerPopup();
}
function selectTrainer(id){
    if(window.trainerLongPressTriggered){window.trainerLongPressTriggered=false;return;}
    if(curTeacher!==id){
        curTeacher=id;
        localStorage.setItem('motusCurrentTrainer',curTeacher);
        const t=teachers.find(x=>x.id===id);
        // If guest trainer with start_date, jump to their first active day
        if(t&&t.is_guest&&t.start_date){
            selDate=new Date(t.start_date+'T12:00');
            viewDate=new Date(selDate);
        }
        updateTrainerTheme();
        render();
        toast('Gewechselt zu '+t.name);
    }
    document.getElementById('trainerPopup').classList.remove('show');
}
function updateTrainerPopup(){
    const popup=document.getElementById('trainerPopup');
    if(!popup)return;
    // Show ALL active trainers (not filtered by date) so guest trainers are always selectable
    const allTrainers=teachers.filter(t=>t.is_active!==false);
    popup.innerHTML=allTrainers.map(t=>{
        const isActive=t.id===curTeacher;
        const avatarStyle=t.photo&&t.photo.length>10?
            `background-image:url(${t.photo});background-size:cover;background-color:transparent`:
            `background:${t.color}`;
        const avatarText=t.photo&&t.photo.length>10?'':(t.init||t.name.charAt(0));
        const guestBadge=t.is_guest?'<span class="guest-trainer-badge" style="margin-left:6px;font-size:9px;">Gast</span>':'';
        const trainerLoc=getDayLocation(selDate,t.id);
        const locFlag=trainerLoc!=='home'?`<span style="margin-left:6px;font-size:12px">${getLocationInfo(trainerLoc).emoji}</span>`:'';
        return `<div class="trainer-option${isActive?' active':''}" data-trainer="${t.id}" onclick="selectTrainer('${t.id}')" oncontextmenu="event.preventDefault();openTrainerEdit('${t.id}')" ontouchstart="startTrainerLongPress('${t.id}')" ontouchend="cancelTrainerLongPress()" ontouchmove="cancelTrainerLongPress()">
            <div class="trainer-option-avatar" style="${avatarStyle}">${avatarText}</div>
            <span class="trainer-option-name">${t.name}${guestBadge}${locFlag}</span>
            <div class="trainer-option-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>`;
    }).join('');
}
function switchTrainer(){
    const newT=teachers.find(t=>t.id!==curTeacher);
    curTeacher=newT.id;
    localStorage.setItem('motusCurrentTrainer',curTeacher);
    updateTrainerTheme();
    render();
    toast('Gewechselt zu '+newT.name);
}
function updateTrainerTheme(){
    // Dezente Hintergrund-Anpassung je nach Trainer
    const t=teachers.find(x=>x.id===curTeacher);
    if(t){
        let bg;
        if(curTeacher==='markus'){
            bg='#121212';
        }else if(curTeacher==='ksenia'){
            bg='#140d0d';
        }else if(t.color){
            // Guest trainers: very subtle tint (95% dark + 5% color)
            const r=parseInt(t.color.slice(1,3),16);
            const g=parseInt(t.color.slice(3,5),16);
            const b=parseInt(t.color.slice(5,7),16);
            const darkR=Math.round(18*0.95+r*0.05);
            const darkG=Math.round(18*0.95+g*0.05);
            const darkB=Math.round(18*0.95+b*0.05);
            bg=`rgb(${darkR},${darkG},${darkB})`;
        }else{
            bg='#121212';
        }
        document.body.style.background=bg;
        const header=document.querySelector('.header');
        const nav=document.querySelector('.nav');
        if(header)header.style.background=bg;
        if(nav)nav.style.background=bg;
        // Update sticky headers too
        document.querySelectorAll('.day-header-sticky').forEach(el=>el.style.background=bg);
        document.querySelectorAll('.day-nav').forEach(el=>el.style.background=bg);
    }
}

function renderCal(){
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ct=document.getElementById('calTitle');if(ct)ct.textContent=months[viewDate.getMonth()]+' '+viewDate.getFullYear();
    const y=viewDate.getFullYear(),mo=viewDate.getMonth(),fd=new Date(y,mo,1).getDay(),st=fd===0?6:fd-1,nd=new Date(y,mo+1,0).getDate(),pd=new Date(y,mo,0).getDate(),ds=fmtDate(selDate);
    // Guest trainer date constraints
    const trainer=teachers.find(t=>t.id===curTeacher);
    const guestStart=trainer?.is_guest&&trainer.start_date?new Date(trainer.start_date+'T00:00'):null;
    const guestEnd=trainer?.is_guest&&trainer.end_date?new Date(trainer.end_date+'T23:59'):null;
    let dh='';for(let i=st-1;i>=0;i--)dh+='<div class="day other">'+(pd-i)+'</div>';
    for(let i=1;i<=nd;i++){
        const td=new Date(y,mo,i),tds=fmtDate(td),isT=td.toDateString()===new Date().toDateString(),isS=tds===ds&&!isT;
        const isOutsideGuestRange=guestStart&&guestEnd&&(td<guestStart||td>guestEnd);
        const cnt=lessons.filter(l=>l.date===tds&&l.teacher===curTeacher).reduce((sum,l)=>sum+Math.ceil(l.dur/45),0);
        const lvl=cnt>=9?'has intense':cnt>=7?'has busy':cnt>=5?'has':cnt?'light':'';
        const dayLoc=getDayLocation(td),locInfo=dayLoc!=='home'?getLocationInfo(dayLoc):null;
        dh+='<div class="day'+(isT?' today':'')+(isS?' sel':'')+(lvl?' '+lvl:'')+(locInfo?' travel':'')+(isOutsideGuestRange?' disabled':'')+'" onclick="selectDay(\''+tds+'\')">'+i+(locInfo?'<span class="day-flag">'+locInfo.emoji+'</span>':'')+'</div>';
    }
    document.getElementById('days').innerHTML=dh;
}

function renderSlots(){
    const daysDE=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],monsDE=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    const daysShort=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],mons=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let all=[];

    if(curView==='day'){
        const ds=fmtDate(selDate);
        lessons.filter(l=>l.date===ds&&l.teacher===curTeacher).forEach(l=>all.push({...l,dObj:new Date(l.date+'T12:00')}));
    }else if(curView==='next'){
        const startFrom=fmtDate(selDate);
        lessons.filter(l=>l.date>=startFrom&&l.teacher===curTeacher).forEach(l=>all.push({...l,dObj:new Date(l.date+'T12:00')}));
    }else{
        const y=viewDate.getFullYear(),m=viewDate.getMonth();
        lessons.filter(l=>{const d=new Date(l.date);return d.getMonth()===m&&d.getFullYear()===y&&l.teacher===curTeacher;}).forEach(l=>all.push({...l,dObj:new Date(l.date+'T12:00')}));
    }
    // Neues Datum-Format: Option 3 (Nummer | Tag / Monat Jahr)
    const sdEl=document.getElementById('schedDate');
    if(sdEl){
        const dayNum=selDate.getDate();
        const weekday=daysDE[selDate.getDay()];
        const monthYear=monsDE[selDate.getMonth()]+' '+selDate.getFullYear();
        sdEl.innerHTML='<span class="sched-date-num">'+dayNum+'</span><span class="sched-date-divider"></span><div class="sched-date-info"><span class="sched-date-weekday">'+weekday+'</span><span class="sched-date-month">'+monthYear+'</span></div>';
    }
    // Tages-Units anzeigen (nur im Tag-View)
    const dayDs=fmtDate(selDate);
    const dayLessonsCount=lessons.filter(l=>l.date===dayDs&&l.teacher===curTeacher&&!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]')).reduce((s,l)=>s+Math.ceil(l.dur/45),0);
    const dudEl=document.getElementById('dayUnitDisplay');
    if(dudEl)dudEl.textContent=curView==='day'&&dayLessonsCount>0?dayLessonsCount+' Einheiten':'';

    all.sort((a,b)=>a.date!==b.date?a.date.localeCompare(b.date):a.time.localeCompare(b.time));

    if(curView==='day'){
        const ds=fmtDate(selDate);
        // Include own lessons + blocked/pause lessons from any trainer
        const dl=lessons.filter(l=>l.date===ds&&(l.teacher===curTeacher||l.client.startsWith('[BLOCKED]')||l.client.startsWith('[PAUSE]')||l.client.startsWith('[GROUP]')));
        dl.sort((a,b)=>a.time.localeCompare(b.time));

        // Build occupied time map
        const occupied=new Map();
        dl.forEach(l=>{
            const lStartMin=timeToMin(l.time);
            const units=Math.ceil(l.dur/45);
            for(let u=0;u<units;u++){
                const slotHr=Math.floor((lStartMin+u*45)/60);
                occupied.set(slotHr,l);
            }
        });

        let h='';
        // Check for guest trainer arrivals/departures on this day
        h+=getGuestArrivalBanners(ds);
        const endMin=settings.endHour*60;

        if(dl.length===0){
            // No lessons - show hourly bookable slots
            for(let hr=settings.startHour;hr<settings.endHour;hr++){
                const tm=fmtTime(hr,0);
                h+='<div class="slot"><div class="slot-card" onclick="openBookingAt(\''+tm+'\')"><span class="slot-empty">+ '+tm+'</span></div></div>';
            }
        }else{
            // Build timeline with bookable slots before/after, only show pauses BETWEEN lessons
            let currentMin=settings.startHour*60;
            const firstLessonStart=timeToMin(dl[0].time);
            const lastLessonEnd=timeToMin(dl[dl.length-1].time)+dl[dl.length-1].dur;

            // Bookable slots BEFORE first lesson
            while(currentMin+45<=firstLessonStart){
                const slotTime=minToTime(currentMin);
                h+='<div class="slot"><div class="slot-card" onclick="openBookingAt(\''+slotTime+'\')"><span class="slot-empty">+ '+slotTime+'</span></div></div>';
                currentMin+=45;
            }

            // Lessons with gaps between them
            for(let i=0;i<dl.length;i++){
                const l=dl[i];
                const isBlocked=l.client.includes('[BLOCKED]');
                const isGroup=l.client.includes('[GROUP]');
                const isPause=l.client.includes('[PAUSE]');
                const lessonTrainer=teachers.find(t=>t.id===l.teacher);
                const trainerSuffix=lessonTrainer?' '+lessonTrainer.name:'';
                const parsedName=parseClientName(l.client);
                const displayName=isPause?l.client.replace(/\[PAUSE\]\s*/,'').trim()||'Pause':(isGroup?l.client.replace(/\[GROUP\]\s*/,'').trim()+trainerSuffix:(isBlocked?l.client.replace(/\[BLOCKED\]\s*/,'').trim()||'Blockiert':parsedName));
                const cl=(isBlocked||isGroup||isPause)?null:clients.find(c=>c.name===l.client||c.name===parsedName);
                const lEndMin=timeToMin(l.time)+l.dur;
                const blockBadge=(isBlocked||isGroup)?'<span class="block-badge" style="margin-left:4px"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>':'';
                const isMember=cl?.is_member;
                const memberRing=isMember?'border:2px solid #c9a227;box-shadow:0 0 12px rgba(201,162,39,0.5)':'';
                const memberCrown=isMember?'<div class="member-crown">★</div>':'';
                const avStyle=cl?.photo?'background-image:url('+cl.photo+');background-size:cover;'+memberRing:memberRing;
                const avContent=isPause?'<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#60a5fa;stroke-width:2;fill:none"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>':((isBlocked||isGroup)?'<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#14b8a6;stroke-width:2;fill:none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>':(cl?.photo?'':(parsedName.charAt(0)||'?')));
                const durClass=l.dur>=90?'lesson-dur dur-90':'lesson-dur';
                const tallClass=l.dur>=90?' booked-90':'';
                const styleClass=isPause?' lesson-pause':((isBlocked||isGroup)?' lesson-blocked':'');
                const trainerName=(isPause||isBlocked||isGroup)?teachers.find(t=>t.id===l.teacher)?.name:'';
                // For GROUP/BLOCKED: show trainer + camp participants count
                let metaText='';
                if(isPause){
                    metaText=trainerName||'';
                }else if(isBlocked||isGroup){
                    const campParts=getCampParticipantsForDate(l.date);
                    const partsBadge=campParts.length>0?'<span onclick="event.stopPropagation();showCampParticipants(\''+l.date+'\')" style="cursor:pointer;background:rgba(201,162,39,.2);color:#c9a227;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px">👫 '+campParts.length+'</span>':'';
                    metaText=(trainerName||'Gruppentraining')+partsBadge;
                }else{
                    metaText=l.notes||'';
                }
                // Show lesson
                h+='<div class="slot"><div class="slot-card booked'+tallClass+styleClass+'" data-lesson="'+l.id+'" onclick="editLesson(\''+l.id+'\')"><div class="lesson-time-range">'+l.time+' - '+minToTime(lEndMin)+'</div><div class="lesson-main"><div class="client-avatar-wrap"><div class="lesson-avatar" style="'+avStyle+'">'+avContent+'</div>'+memberCrown+'</div><div class="lesson-content"><div class="lesson-name">'+displayName+blockBadge+'</div>'+(metaText?'<div class="lesson-meta">'+metaText+'</div>':'')+'</div><div class="'+durClass+'"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+l.dur+'\'</div></div></div></div>';
                // Show gap BETWEEN lessons (not after last)
                if(i<dl.length-1){
                    const nextLesson=dl[i+1];
                    const nextStart=timeToMin(nextLesson.time);
                    const gap=nextStart-lEndMin;
                    if(gap>0&&gap<45){
                        const pauseStart=minToTime(lEndMin);
                        const pauseEnd=minToTime(nextStart);
                        h+='<div class="slot"><div class="slot-card booked lesson-pause"><div class="lesson-time-range">'+pauseStart+' - '+pauseEnd+'</div><div class="lesson-main"><div class="lesson-avatar"><svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#60a5fa;stroke-width:2;fill:none"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg></div><div class="lesson-content"><div class="lesson-name">Pause</div></div><div class="lesson-dur"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+gap+'\'</div></div></div></div>';
                    }else if(gap>=45){
                        let slotMin=lEndMin;
                        while(slotMin+45<=nextStart){
                            const slotTime=minToTime(slotMin);
                            h+='<div class="slot"><div class="slot-card" onclick="openBookingAt(\''+slotTime+'\')"><span class="slot-empty">+ '+slotTime+'</span></div></div>';
                            slotMin+=45;
                        }
                    }
                }
            }

            // Bookable slots AFTER last lesson
            let afterMin=lastLessonEnd;
            while(afterMin+45<=endMin){
                const slotTime=minToTime(afterMin);
                h+='<div class="slot"><div class="slot-card" onclick="openBookingAt(\''+slotTime+'\')"><span class="slot-empty">+ '+slotTime+'</span></div></div>';
                afterMin+=45;
            }
        }
        document.getElementById('slots').innerHTML=h;
    }else{
        if(!all.length){document.getElementById('slots').innerHTML='<p style="text-align:center;color:#71717a;padding:20px">Keine Stunden</p>';return;}
        let h='',ld='';
        all.forEach(l=>{
            const ds=fmtDate(l.dObj);
            if(ds!==ld){const dayLessons=all.filter(x=>fmtDate(x.dObj)===ds);const dayUnits=dayLessons.reduce((s,x)=>s+Math.ceil(x.dur/45),0);const dayLoc=getDayLocation(l.dObj,l.teacher);const locInfo=dayLoc!=='home'?getLocationInfo(dayLoc):null;h+='<div class="day-header-sticky" onclick="selectDayFromList(\''+ds+'\')" style="cursor:pointer"><span class="day-date">'+daysShort[l.dObj.getDay()]+', '+l.dObj.getDate()+'. '+mons[l.dObj.getMonth()]+'</span>'+(locInfo?'<span class="day-location">'+locInfo.emoji+' '+locInfo.name+'</span>':'')+'<span class="day-units">'+dayUnits+' Units</span></div>';ld=ds;}
            const isBlocked=l.client.includes('[BLOCKED]');
            const isGroup=l.client.includes('[GROUP]');
            const isPause=l.client.includes('[PAUSE]');
            const lessonTrainer2=teachers.find(t=>t.id===l.teacher);
            const trainerSuffix2=lessonTrainer2?' '+lessonTrainer2.name:'';
            const parsedName2=parseClientName(l.client);
            const displayName=isPause?l.client.replace(/\[PAUSE\]\s*/,'').trim()||'Pause':(isGroup?l.client.replace(/\[GROUP\]\s*/,'').trim()+trainerSuffix2:(isBlocked?l.client.replace(/\[BLOCKED\]\s*/,'').trim()||'Blockiert':parsedName2));
            const et=minToTime(timeToMin(l.time)+l.dur),cl=(isBlocked||isGroup||isPause)?null:clients.find(c=>c.name===l.client||c.name===parsedName2);
            const isMember=cl?.is_member;
            const memberRing=isMember?'border:2px solid #c9a227;box-shadow:0 0 12px rgba(201,162,39,0.5)':'';
            const memberCrown=isMember?'<div class="member-crown">★</div>':'';
            const avStyle=cl?.photo?'background-image:url('+cl.photo+');background-size:cover;'+memberRing:memberRing;
            const durClass=l.dur>=90?'lesson-dur dur-90':'lesson-dur';
            const tallClass=l.dur>=90?' booked-90':'';
            const blockBadge=(isBlocked||isGroup)?'<span class="block-badge" style="margin-left:4px"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>':'';
            const styleClass=isPause?' lesson-pause':((isBlocked||isGroup)?' lesson-blocked':'');
            const avContent=isPause?'<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#60a5fa;stroke-width:2;fill:none"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>':((isBlocked||isGroup)?'<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:#14b8a6;stroke-width:2;fill:none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>':(cl?.photo?'':parsedName2.charAt(0)));
            const trainerName2=(isPause||isBlocked||isGroup)?teachers.find(t=>t.id===l.teacher)?.name:'';
            // For GROUP/BLOCKED: show trainer + camp participants count
            let metaText2='';
            if(isPause){
                metaText2=trainerName2||'';
            }else if(isBlocked||isGroup){
                const campParts2=getCampParticipantsForDate(l.date);
                const partsBadge2=campParts2.length>0?'<span onclick="event.stopPropagation();showCampParticipants(\''+l.date+'\')" style="cursor:pointer;background:rgba(201,162,39,.2);color:#c9a227;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px">👫 '+campParts2.length+'</span>':'';
                metaText2=(trainerName2||'Gruppentraining')+partsBadge2;
            }else{
                metaText2=l.notes||'';
            }
            h+='<div class="slot"><div class="slot-card booked'+tallClass+styleClass+'" data-lesson="'+l.id+'" onclick="editLesson(\''+l.id+'\')"><div class="lesson-time-range">'+l.time+' - '+et+'</div><div class="lesson-main"><div class="client-avatar-wrap"><div class="lesson-avatar" style="'+avStyle+'">'+avContent+'</div>'+memberCrown+'</div><div class="lesson-content"><div class="lesson-name">'+displayName+blockBadge+'</div>'+(metaText2?'<div class="lesson-meta">'+metaText2+'</div>':'')+'</div><div class="'+durClass+'"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+l.dur+'\'</div></div></div></div>';
        });
        document.getElementById('slots').innerHTML=h;
    }
}

let clientFilter='all';
function setClientFilter(f){
    clientFilter=f;
    document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('active',c.dataset.filter===f));
    renderClients();
}

function getClientSessions(clientId){
    return lessons.filter(l=>l.client===clientId||clients.find(c=>c.id===clientId&&c.name===l.client)).length;
}

function getClientLastSession(clientId){
    const clientLessons=lessons.filter(l=>l.client===clientId||clients.find(c=>c.id===clientId&&c.name===l.client)).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(!clientLessons.length)return null;
    return new Date(clientLessons[0].date);
}

function renderClients(){
    const realClients=clients.filter(c=>!c.name.startsWith('[BLOCKED]'));
    const countEl=document.getElementById('clientCount');

    // Apply filter
    let filtered=realClients;
    const now=new Date();
    const thirtyDaysAgo=new Date(now.getTime()-30*24*60*60*1000);
    const sixtyDaysAgo=new Date(now.getTime()-60*24*60*60*1000);

    if(clientFilter==='member')filtered=realClients.filter(c=>c.is_member);
    else if(clientFilter==='active')filtered=realClients.filter(c=>{const last=getClientLastSession(c.id);return last&&last>=thirtyDaysAgo;});
    else if(clientFilter==='new')filtered=realClients.filter(c=>{const d=c.created_at?new Date(c.created_at):null;return d&&d>=sixtyDaysAgo;});

    if(countEl)countEl.textContent=filtered.length;

    if(!filtered.length){
        document.getElementById('clientList').innerHTML='<div style="text-align:center;padding:40px 20px;color:#71717a;"><svg viewBox="0 0 24 24" width="48" height="48" style="stroke:#52525b;fill:none;stroke-width:1.5;margin-bottom:12px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p style="font-size:15px;margin-bottom:4px;">Keine Kunden gefunden</p></div>';
        return;
    }

    // Sort: "new" filter by creation date (newest first), others alphabetically
    if(clientFilter==='new'){
        filtered.sort((a,b)=>{
            const aDate=a.created_at?new Date(a.created_at):new Date(0);
            const bDate=b.created_at?new Date(b.created_at):new Date(0);
            return bDate-aDate; // Newest first
        });
        // Render as list (same style as "Alle" but without alphabet groups)
        let html='';
        filtered.forEach(c=>{
            const sessions=getClientSessions(c.id);
            const lastSession=getClientLastSession(c.id);
            const lastStr=lastSession?lastSession.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}):'—';
            const sinceStr=c.created_at?new Date(c.created_at).toLocaleDateString('de-DE',{month:'short',year:'2-digit'}):'';
            const avStyle=c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':'';
            const memberClass=c.is_member?' member':'';
            const memberStar=c.is_member?'<span class="avatar-star">★</span>':'';
            html+='<div class="client-row'+memberClass+'" onclick="openClient(\''+c.id+'\')">';
            html+='<div class="client-avatar" style="'+avStyle+'">'+(c.photo?'':c.name.charAt(0))+memberStar+'</div>';
            html+='<div class="client-info"><div class="client-name">'+c.name+'</div>';
            html+='<div class="client-meta"><span>Letzte: '+lastStr+'</span>'+(sinceStr?'<span class="dot"></span><span>Seit '+sinceStr+'</span>':'')+'</div></div>';
            html+='<div class="client-stats"><div class="client-sessions">'+sessions+'</div><div class="client-sessions-label">Sessions</div></div>';
            html+='<span class="client-chevron">›</span></div>';
        });
        document.getElementById('clientList').innerHTML=html;
        return;
    }

    // Default: Sort alphabetically and group by first letter
    filtered.sort((a,b)=>a.name.localeCompare(b.name));
    const groups={};
    filtered.forEach(c=>{
        const letter=c.name.charAt(0).toUpperCase();
        if(!groups[letter])groups[letter]=[];
        groups[letter].push(c);
    });

    let html='';
    Object.keys(groups).sort().forEach(letter=>{
        html+='<div class="alpha-section"><div class="alpha-header">'+letter+'</div><div class="alpha-clients">';
        groups[letter].forEach(c=>{
            const sessions=getClientSessions(c.id);
            const lastSession=getClientLastSession(c.id);
            const lastStr=lastSession?lastSession.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}):'—';
            const sinceStr=c.created_at?new Date(c.created_at).toLocaleDateString('de-DE',{month:'short',year:'2-digit'}):'';
            const avStyle=c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':'';
            const memberClass=c.is_member?' member':'';
            const memberStar=c.is_member?'<span class="avatar-star">★</span>':'';
            html+='<div class="client-row'+memberClass+'" onclick="openClient(\''+c.id+'\')">';
            html+='<div class="client-avatar" style="'+avStyle+'">'+(c.photo?'':c.name.charAt(0))+memberStar+'</div>';
            html+='<div class="client-info"><div class="client-name">'+c.name+'</div>';
            html+='<div class="client-meta"><span>Letzte: '+lastStr+'</span>'+(sinceStr?'<span class="dot"></span><span>Seit '+sinceStr+'</span>':'')+'</div></div>';
            html+='<div class="client-stats"><div class="client-sessions">'+sessions+'</div><div class="client-sessions-label">Sessions</div></div>';
            html+='<span class="client-chevron">›</span></div>';
        });
        html+='</div></div>';
    });
    document.getElementById('clientList').innerHTML=html;
}

function setStatsView(v){statsView=v;statsPageOffset=0;document.querySelectorAll('.stats-toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===v));renderStats();}
function statsPageNav(dir){statsPageOffset+=dir;renderStats();}

let customRangeStart=null,customRangeEnd=null;
function openCustomRange(){
    const today=new Date();
    const lastMonth=new Date(today.getFullYear(),today.getMonth()-1,1);
    document.getElementById('customStart').value=fmtDate(lastMonth);
    document.getElementById('customEnd').value=fmtDate(today);
    document.getElementById('customRangeModal').classList.add('open');
}
function applyCustomRange(e){
    e.preventDefault();
    customRangeStart=new Date(document.getElementById('customStart').value+'T00:00');
    customRangeEnd=new Date(document.getElementById('customEnd').value+'T23:59:59');
    statsView='custom';
    document.querySelectorAll('.stats-toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.view==='custom'));
    closeModal('customRange');
    renderStats();
}

function renderStats(){
    let startDate,endDate,periods=[],label='';
    const mNames=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    
    if(statsView==='week'){
        // Basis-Woche von heute + offset
        const base=new Date();
        base.setDate(base.getDate()+statsPageOffset*7);
        startDate=getWeekStart(base);
        startDate.setHours(0,0,0,0);
        endDate=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()+6,23,59,59,999);
        const kw=getKW(startDate);
        label='KW '+kw+' ('+startDate.getDate()+'.'+(startDate.getMonth()+1)+' - '+endDate.getDate()+'.'+(endDate.getMonth()+1)+')';
        // 7 Tage für Chart
        const dayLabels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        for(let i=0;i<7;i++){
            const ds=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()+i,0,0,0,0);
            const de=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()+i,23,59,59,999);
            periods.push({start:ds,end:de,label:dayLabels[i]});
        }
    }else if(statsView==='month'){
        const base=new Date();
        base.setMonth(base.getMonth()+statsPageOffset);
        startDate=new Date(base.getFullYear(),base.getMonth(),1,0,0,0,0);
        endDate=new Date(base.getFullYear(),base.getMonth()+1,0,23,59,59,999);
        label=mNames[startDate.getMonth()]+' '+startDate.getFullYear();
        // 4 Wochen für Chart
        for(let i=0;i<4;i++){
            const ws=new Date(base.getFullYear(),base.getMonth(),1+i*7,0,0,0,0);
            const we=new Date(base.getFullYear(),base.getMonth(),1+i*7+6,23,59,59,999);
            periods.push({start:ws,end:we,label:'W'+(i+1)});
        }
    }else if(statsView==='custom'&&customRangeStart&&customRangeEnd){
        startDate=customRangeStart;
        endDate=customRangeEnd;
        const days=Math.ceil((endDate-startDate)/(1000*60*60*24));
        label=startDate.getDate()+'.'+(startDate.getMonth()+1)+' - '+endDate.getDate()+'.'+(endDate.getMonth()+1)+'.'+endDate.getFullYear();
        // Divide into ~7 periods
        const periodDays=Math.max(1,Math.ceil(days/7));
        for(let i=0;i<7&&i*periodDays<days;i++){
            const ps=new Date(startDate.getTime()+i*periodDays*24*60*60*1000);
            const pe=new Date(Math.min(startDate.getTime()+(i+1)*periodDays*24*60*60*1000-1,endDate.getTime()));
            periods.push({start:ps,end:pe,label:ps.getDate()+'.'+(ps.getMonth()+1)});
        }
    }else{
        const base=new Date();
        const year=base.getFullYear()+statsPageOffset;
        startDate=new Date(year,0,1,0,0,0,0);
        endDate=new Date(year,11,31,23,59,59,999);
        label='Jahr '+year;
        // 12 Monate für Chart
        for(let i=0;i<12;i++){
            const ms=new Date(year,i,1,0,0,0,0);
            const me=new Date(year,i+1,0,23,59,59,999);
            periods.push({start:ms,end:me,label:mNames[i].slice(0,3)});
        }
    }
    
    document.getElementById('statsPageLabel').textContent=label;
    
    let totalRev=0,totalUnits=0,totalMins=0,totalLessonCount=0;
    const byTeacher={};teachers.forEach(t=>byTeacher[t.id]={l:0,r:0,m:0,u:0});

    // Filter out blocked and pause lessons for stats (GROUP counts!)
    const countableLessons=lessons.filter(l=>(!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]'))||l.client.startsWith('[GROUP]'));

    // Get guest trainer IDs early for filtering
    const guestTrainerIds=teachers.filter(t=>t.is_guest).map(t=>t.id);

    countableLessons.forEach(l=>{
        const ld=new Date(l.date+'T12:00');
        if(ld>=startDate&&ld<=endDate){
            const isGuestLesson=guestTrainerIds.includes(l.teacher);
            const p=getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location);
            const units=Math.ceil(l.dur/45);
            // Only count non-guest lessons in totalRev and totalUnits
            if(!isGuestLesson){
                totalRev+=p;
                totalUnits+=units;
                totalMins+=l.dur;
                totalLessonCount++;
            }
            if(byTeacher[l.teacher]){
                byTeacher[l.teacher].l++;
                byTeacher[l.teacher].r+=p;
                byTeacher[l.teacher].m+=l.dur;
                byTeacher[l.teacher].u+=units;
            }
        }
    });

    // Calculate camp revenue if in period
    const campStartDate=settings.campStart?new Date(settings.campStart):null;
    const campEndDate=settings.campEnd?new Date(settings.campEnd):null;
    const campInPeriod=campStartDate&&campEndDate&&campRegistrations.length>0&&(
        (campStartDate>=startDate&&campStartDate<=endDate)||
        (campEndDate>=startDate&&campEndDate<=endDate)||
        (campStartDate<=startDate&&campEndDate>=endDate)
    );
    const campRev=campInPeriod?campRegistrations.reduce((sum,r)=>sum+(r.totalPrice||0),0):0;

    // Calculate guest trainer Studio Profit - same formula as Gasttrainer Abrechnung
    let guestProfit=0;
    teachers.filter(t=>t.is_guest).forEach(gt=>{
        const gtLessons=lessons.filter(l=>{
            const ld=new Date(l.date+'T12:00');
            return l.teacher===gt.id&&ld>=startDate&&ld<=endDate;
        });
        if(gtLessons.length>0){
            const lectures=gtLessons.filter(l=>l.client.includes('[GROUP]'));
            const privateLessons=gtLessons.filter(l=>!l.client.includes('[GROUP]')&&!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]'));
            // Payouts
            let privatePayout=0;
            privateLessons.forEach(l=>{
                privatePayout+=getGuestTrainerPayout(gt.id,l.dur,l.client);
            });
            const lecturePayout=lectures.length*(gt.payout_lecture||0);
            const totalPayout=privatePayout+lecturePayout;
            // Einnahmen (nur private lessons)
            let einnahmen=0;
            privateLessons.forEach(l=>{
                einnahmen+=getGuestTrainerPrice(gt.id,l.dur,l.client);
            });
            guestProfit+=einnahmen-totalPayout;
        }
    });

    // Total = lessons + camp + guest profit
    const grandTotal=totalRev+campRev+guestProfit;
    document.getElementById('totalRev').textContent='€'+fmtNum(grandTotal);

    // KPI Values
    document.getElementById('statsUnits').textContent=totalUnits;
    // Count unique active clients in period
    const activeClients=new Set();
    countableLessons.forEach(l=>{
        const ld=new Date(l.date+'T12:00');
        if(ld>=startDate&&ld<=endDate&&!l.client.startsWith('[')&&l.client){
            activeClients.add(l.client);
        }
    });
    document.getElementById('statsClients').textContent=activeClients.size;

    // Calculate trend vs previous period
    const trendEl=document.getElementById('statsTrend');
    let prevTotal=0;
    const periodLength=endDate.getTime()-startDate.getTime();
    const prevStart=new Date(startDate.getTime()-periodLength);
    const prevEnd=new Date(startDate.getTime()-1);
    countableLessons.forEach(l=>{
        const ld=new Date(l.date+'T12:00');
        if(ld>=prevStart&&ld<=prevEnd&&!guestTrainerIds.includes(l.teacher)){
            prevTotal+=getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location);
        }
    });
    if(prevTotal>0){
        const change=((grandTotal-prevTotal)/prevTotal*100).toFixed(0);
        if(change>0){
            trendEl.textContent='↑ +'+change+'%';
            trendEl.className='stats-trend';
            trendEl.style.display='inline-block';
        }else if(change<0){
            trendEl.textContent='↓ '+change+'%';
            trendEl.className='stats-trend negative';
            trendEl.style.display='inline-block';
        }else{
            trendEl.style.display='none';
        }
    }else{
        trendEl.style.display='none';
    }

    // New KPIs: Avg per unit and avg per day
    const avgUnit=totalUnits>0?Math.round(totalRev/totalUnits):0;
    const daysInPeriod=Math.ceil((endDate-startDate)/(1000*60*60*24))+1;
    const avgDay=(totalUnits/daysInPeriod).toFixed(1);
    document.getElementById('statsAvgUnit').textContent='€'+avgUnit;
    document.getElementById('statsAvgDay').textContent=avgDay;

    // Show camp stats card - only when camp dates overlap with viewed period
    const campCard=document.getElementById('campStatsCard');
    const campContent=document.getElementById('campStatsContent');
    const campValueEl=document.getElementById('campValue');

    if(campInPeriod&&campCard&&campContent){
        const totalCampRegs=campRegistrations.length;
        const totalCampPeople=campRegistrations.reduce((sum,r)=>sum+(r.type==='couple'?2:1),0);

        campCard.style.display='block';
        if(campValueEl)campValueEl.textContent='€'+fmtNum(campRev);
        let html='<div style="display:flex;align-items:center;gap:16px">';
        html+='<span style="font-size:36px">🏕️</span>';
        html+='<div><div style="font-size:24px;font-weight:700;color:#22c55e">€'+fmtNum(campRev)+'</div>';
        html+='<div style="font-size:12px;color:#666">'+totalCampRegs+' Anmeldungen · '+totalCampPeople+' Personen</div></div>';
        html+='</div>';
        campContent.innerHTML=html;
    }else if(campCard){
        campCard.style.display='none';
    }
    
    const chartData=periods.map(p=>{
        let m=0,k=0,g=0;
        countableLessons.forEach(l=>{
            const ld=new Date(l.date+'T12:00');
            if(ld>=p.start&&ld<=p.end){
                const price=getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location);
                if(l.teacher==='markus')m+=price;
                else if(l.teacher==='ksenia')k+=price;
                else g+=price; // Guest trainers
            }
        });
        return{label:p.label,markus:m,ksenia:k,guest:g,total:m+k+g,isSaturday:p.label==='Sa',isSunday:p.label==='So'};
    });
    const maxVal=Math.max(...chartData.map(d=>d.total),100);
    const chartTotal=chartData.reduce((s,d)=>s+d.total,0);
    
    // SVG Area Chart
    const w=320,h=120,pad=20;
    const n=chartData.length;
    const stepX=(w-pad*2)/(n-1||1);
    
    // Build path points
    let points=[];
    chartData.forEach((d,i)=>{
        const x=pad+i*stepX;
        const y=h-pad-(d.total/maxVal)*(h-pad*2);
        points.push({x,y:Math.min(y,h-pad)});
    });
    
    // Create smooth curve
    const linePath=points.map((p,i)=>i===0?'M'+p.x+','+p.y:'L'+p.x+','+p.y).join(' ');
    const areaPath=linePath+' L'+points[points.length-1].x+','+(h-pad)+' L'+pad+','+(h-pad)+' Z';
    
    let svg='<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">';
    svg+='<defs>';
    svg+='<linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c9a227" stop-opacity="0.6"/><stop offset="100%" stop-color="#c9a227" stop-opacity="0"/></linearGradient>';
    svg+='<linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#f5d742"/><stop offset="100%" stop-color="#c9a227"/></linearGradient>';
    svg+='</defs>';
    // Grid lines
    for(let i=0;i<4;i++){
        const gy=pad+i*((h-pad*2)/3);
        svg+='<line x1="'+pad+'" y1="'+gy+'" x2="'+(w-pad)+'" y2="'+gy+'" stroke="#333" stroke-width="0.5" stroke-dasharray="2,4"/>';
    }
    // Area & Line
    svg+='<path class="chart-area" d="'+areaPath+'"/>';
    svg+='<path class="chart-line" d="'+linePath+'"/>';
    // Dots
    points.forEach((p,i)=>{
        if(chartData[i].total>0){
            svg+='<circle class="chart-dot" cx="'+p.x+'" cy="'+p.y+'" r="4"/>';
        }
    });
    svg+='</svg>';
    svg+='<div class="chart-total">€'+chartTotal+'</div>';
    svg+='<div class="chart-labels">';
    chartData.forEach(d=>{
        const cls=d.isSaturday?'saturday':d.isSunday?'sunday':'';
        svg+='<span'+(cls?' class="'+cls+'"':'')+'>'+d.label+'</span>';
    });
    svg+='</div>';
    
    document.getElementById('chartContainer').innerHTML=svg;
    
    // Calculate max revenue for progress bars
    const maxTrainerRev=Math.max(...teachers.filter(t=>!t.is_guest).map(t=>byTeacher[t.id]?.r||0),1);
    document.getElementById('breakdown').innerHTML=teachers.filter(t=>!t.is_guest).map(t=>{
        const data=byTeacher[t.id];
        const pct=maxTrainerRev>0?Math.round((data.r/maxTrainerRev)*100):0;
        const avStyle=t.photo?'background-image:url('+t.photo+');background-size:cover;background-position:center':'background:'+t.color;
        return'<div class="stats-trainer-bar"><div class="stats-trainer-avatar" style="'+avStyle+'">'+(t.photo?'':(t.init||t.name.charAt(0)))+'</div><div class="stats-trainer-info"><div class="stats-trainer-name">'+t.name+' · '+data.u+' Einheiten</div><div class="stats-trainer-progress"><div class="stats-trainer-progress-fill" style="width:'+pct+'%;background:'+t.color+'"></div></div></div><div class="stats-trainer-amount">€'+fmtNum(data.r)+'</div></div>';
    }).join('');

    // Guest trainer accounting
    const guestTrainers=teachers.filter(t=>t.is_guest);
    const guestCard=document.getElementById('guestAccountingCard');
    const guestDiv=document.getElementById('guestAccounting');
    if(guestTrainers.length>0){
        let hasGuestLessons=false;
        let html='';
        let totalGuestProfit=0;
        guestTrainers.forEach(gt=>{
            const gtLessons=lessons.filter(l=>{
                const ld=new Date(l.date+'T12:00');
                return l.teacher===gt.id&&ld>=startDate&&ld<=endDate;
            });
            if(gtLessons.length>0){
                hasGuestLessons=true;
                // Separate private lessons and lectures (GROUP = lectures, everything else = private)
                const lectures=gtLessons.filter(l=>l.client.startsWith('[GROUP]')||l.client.includes('[GROUP]'));
                const privateLessons=gtLessons.filter(l=>!l.client.startsWith('[GROUP]')&&!l.client.includes('[GROUP]')&&!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[PAUSE]'));
                const privateUnits=privateLessons.reduce((s,l)=>s+Math.ceil(l.dur/45),0);
                const lectureCount=lectures.length;
                // Calculate payouts
                let privatePayout=0;
                privateLessons.forEach(l=>{
                    privatePayout+=getGuestTrainerPayout(gt.id,l.dur,l.client);
                });
                const lecturePayout=lectureCount*(gt.payout_lecture||0);
                const travelCost=gt.travel_cost||0;
                const totalPayout=privatePayout+lecturePayout+travelCost;
                const hotelCost=gt.hotel_cost||0;
                // Calculate studio income (what clients pay)
                let einnahmen=0;
                privateLessons.forEach(l=>{
                    einnahmen+=getGuestTrainerPrice(gt.id,l.dur,l.client);
                });
                const profit=einnahmen-totalPayout-hotelCost;
                totalGuestProfit+=profit;
                // Avatar with photo support
                const hasPhoto=gt.photo&&gt.photo.length>50;
                const avStyle=hasPhoto?`background-image:url(${gt.photo});background-size:cover;background-position:center`:`background:${gt.color}`;
                const avContent=hasPhoto?'':gt.name.charAt(0);
                // Date range for share text - use trainer's active dates
                const gtStart=gt.start_date?new Date(gt.start_date):null;
                const gtEnd=gt.end_date?new Date(gt.end_date):null;
                const dateRange=gtStart&&gtEnd?`${gtStart.getDate()}.${gtStart.getMonth()+1}. - ${gtEnd.getDate()}.${gtEnd.getMonth()+1}.${gtEnd.getFullYear()}`:'';
                const dateRangeEN=gtStart&&gtEnd?`${gtStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${gtEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`:'';
                html+=`<div class="guest-accounting-item">
                    <div class="guest-accounting-header">
                        <div class="guest-accounting-avatar" style="${avStyle}">${avContent}</div>
                        <div class="guest-accounting-name">${gt.name}</div>
                        <button onclick="openGuestSharePopup('${gt.id}',${privateUnits},${privatePayout},${lectureCount},${lecturePayout},${travelCost},${totalPayout},'${dateRange}','${dateRangeEN}','${(gt.phone||'').replace(/'/g,"\\'")}','${gt.name.replace(/'/g,"\\'")}')" style="margin-left:auto;background:#333;border:none;color:#fff;padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:12px"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Teilen</button>
                    </div>
                    <div class="guest-accounting-row"><span>📚 Private Lessons</span><span class="guest-accounting-value">${privateUnits} units × €${fmtNum(gt.payout_price_45||0)} = €${fmtNum(privatePayout)}</span></div>
                    ${lectureCount>0?`<div class="guest-accounting-row"><span>🎓 Lectures</span><span class="guest-accounting-value">${lectureCount} × €${fmtNum(gt.payout_lecture||0)} = €${fmtNum(lecturePayout)}</span></div>`:''}
                    ${travelCost>0?`<div class="guest-accounting-row"><span>✈️ Reisekosten</span><span class="guest-accounting-value">€${fmtNum(travelCost)}</span></div>`:''}
                    <div class="guest-accounting-row" style="border-top:1px solid #333;margin-top:8px;padding-top:8px"><span>💰 Auszahlung Trainer</span><span class="guest-accounting-value" style="color:#c9a227">€${fmtNum(totalPayout)}</span></div>
                    ${hotelCost>0?`<div class="guest-accounting-row"><span>🏨 Hotel (Studio zahlt)</span><span class="guest-accounting-value" style="color:#888">€${fmtNum(hotelCost)}</span></div>`:''}
                    <div class="guest-accounting-row"><span>💵 Einnahmen Studio</span><span class="guest-accounting-value">€${fmtNum(einnahmen)}</span></div>
                    <div class="guest-accounting-row profit"><span>📈 Studio Profit</span><span class="guest-accounting-value">€${fmtNum(profit)}</span></div>
                </div>`;
            }
        });
        if(hasGuestLessons){
            guestCard.style.display='block';
            guestDiv.innerHTML=html;
            document.getElementById('guestProfitValue').textContent='€'+fmtNum(totalGuestProfit);
        }else{
            guestCard.style.display='none';
        }
    }else{
        guestCard.style.display='none';
    }

    // Travel/Abroad stats
    const travelCard=document.getElementById('travelStatsCard');
    const travelDiv=document.getElementById('travelStats');

    // Only show locations from ACTIVE (non-archived) trips
    const activeTripsLocations=new Set(trips.filter(t=>!t.archived).map(t=>t.location_id));

    const travelLessons=lessons.filter(l=>{
        const ld=new Date(l.date+'T12:00');
        // Only show locations that have active trips (not archived)
        return ld>=startDate&&ld<=endDate&&l.location&&l.location!=='home'&&activeTripsLocations.has(l.location);
    });
    if(travelLessons.length>0){
        const byLoc={};
        travelLessons.forEach(l=>{
            const loc=l.location||'unknown';
            if(!byLoc[loc])byLoc[loc]={units:0,rev:0,lessons:[],trainers:{}};
            byLoc[loc].units+=Math.ceil(l.dur/45);
            byLoc[loc].rev+=getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location);
            byLoc[loc].lessons.push(l);
            // Track trainers
            if(l.teacher){
                if(!byLoc[loc].trainers[l.teacher])byLoc[loc].trainers[l.teacher]=0;
                byLoc[loc].trainers[l.teacher]+=Math.ceil(l.dur/45);
            }
        });
        const totalTravelRev=Object.values(byLoc).reduce((s,d)=>s+d.rev,0);
        document.getElementById('travelTotal').textContent='€'+fmtNum(totalTravelRev);
        let html='';
        Object.keys(byLoc).forEach(locId=>{
            const loc=getLocationInfo(locId);
            const data=byLoc[locId];
            // Get trainer names
            const trainerNames=Object.keys(data.trainers).map(tid=>{
                const t=teachers.find(x=>x.id===tid);
                return t?t.name:'?';
            }).join(', ');
            html+=`<div class="stats-travel-item"><span class="stats-travel-flag">${loc.emoji}</span><div class="stats-travel-info"><div class="stats-travel-name">${loc.name}</div><div class="stats-travel-units">${data.units} Einheiten · ${trainerNames}</div></div><span class="stats-travel-amount">€${fmtNum(data.rev)}</span></div>`;
        });
        travelCard.style.display='block';
        travelDiv.innerHTML=html;
    }else{
        travelCard.style.display='none';
    }
}

let guestShareData={};
let guestShareLang='de';
function openGuestSharePopup(trainerId,privateUnits,privatePayout,lectureCount,lecturePayout,travelCost,totalPayout,dateRangeDE,dateRangeEN,phone,name){
    guestShareData={trainerId,privateUnits,privatePayout,lectureCount,lecturePayout,travelCost,totalPayout,dateRangeDE,dateRangeEN,phone,name};
    guestShareLang='de';
    document.querySelectorAll('#guestShareModal .lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang==='de'));
    document.getElementById('guestShareTitle').textContent=name+' – Abrechnung';
    updateGuestSharePreview();
    document.getElementById('guestShareModal').classList.add('open');
}
function setGuestShareLang(lang){
    guestShareLang=lang;
    document.querySelectorAll('#guestShareModal .lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
    updateGuestSharePreview();
}
function getGuestShareText(){
    const d=guestShareData;
    const gt=teachers.find(t=>t.id===d.trainerId);
    if(!gt)return '';
    const dateRange=guestShareLang==='de'?d.dateRangeDE:d.dateRangeEN;
    let text='';
    if(guestShareLang==='de'){
        text=`Hey ${d.name}! 👋\n\nHier deine Abrechnung für ${dateRange}:\n\n`;
        if(d.privateUnits>0)text+=`📚 Privat-Stunden: ${d.privateUnits} Einheiten × €${fmtNum(gt.payout_price_45||0)} = €${fmtNum(d.privatePayout)}\n`;
        if(d.lectureCount>0)text+=`🎓 Lectures: ${d.lectureCount} × €${fmtNum(gt.payout_lecture||0)} = €${fmtNum(d.lecturePayout)}\n`;
        if(d.travelCost>0)text+=`✈️ Reisekosten: €${fmtNum(d.travelCost)}\n`;
        text+=`\n━━━━━━━━━━━━━━━━\n💰 Gesamt: €${fmtNum(d.totalPayout)}\n━━━━━━━━━━━━━━━━\n\nVielen Dank für deine Zeit bei uns im mōtus studio! 🙏`;
    }else{
        text=`Hey ${d.name}! 👋\n\nHere's your invoice for ${dateRange}:\n\n`;
        if(d.privateUnits>0)text+=`📚 Private lessons: ${d.privateUnits} units × €${fmtNum(gt.payout_price_45||0)} = €${fmtNum(d.privatePayout)}\n`;
        if(d.lectureCount>0)text+=`🎓 Lectures: ${d.lectureCount} × €${fmtNum(gt.payout_lecture||0)} = €${fmtNum(d.lecturePayout)}\n`;
        if(d.travelCost>0)text+=`✈️ Travel expenses: €${fmtNum(d.travelCost)}\n`;
        text+=`\n━━━━━━━━━━━━━━━━\n💰 Total: €${fmtNum(d.totalPayout)}\n━━━━━━━━━━━━━━━━\n\nThank you for your time with us at mōtus studio! 🙏`;
    }
    return text;
}
function updateGuestSharePreview(){
    const text=getGuestShareText();
    document.getElementById('guestSharePreview').innerHTML='<pre style="white-space:pre-wrap;font-size:13px;margin:0;line-height:1.5">'+text.replace(/\n/g,'<br>')+'</pre>';
    const phone=guestShareData.phone;
    const waBtn=document.getElementById('guestShareWaBtn');
    if(phone){
        const cleanPhone=phone.replace(/[^0-9+]/g,'');
        waBtn.href='https://wa.me/'+cleanPhone+'?text='+encodeURIComponent(text);
        waBtn.style.opacity='1';
        waBtn.style.pointerEvents='auto';
    }else{
        waBtn.href='#';
        waBtn.style.opacity='0.5';
        waBtn.style.pointerEvents='none';
    }
}
function copyGuestShareText(){
    const text=getGuestShareText();
    navigator.clipboard.writeText(text).then(()=>{
        toast(guestShareLang==='de'?'📋 Abrechnung kopiert!':'📋 Invoice copied!');
        closeModal('guestShare');
    }).catch(()=>toast('⚠️ Copy failed'));
}

function navPrev(){viewDate.setMonth(viewDate.getMonth()-1);render();}
function navNext(){viewDate.setMonth(viewDate.getMonth()+1);render();}
function showPage(n){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(n+'Page').classList.add('active');document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===n));localStorage.setItem('motusPage',n);}
let lastHomeClick=0;
function goHome(){
    const now=Date.now();
    const isDoubleClick=now-lastHomeClick<500;
    lastHomeClick=now;
    showPage('calendar');
    if(isDoubleClick){
        curView='next';
        document.querySelectorAll('.view-btn-new').forEach(b=>b.classList.toggle('active',b.dataset.view==='next'));
        syncNavPill();
        render();
        window.scrollTo({top:0});
    }else{
        selDate=new Date();
        viewDate=new Date();
        curView='day';
        document.querySelectorAll('.view-btn-new').forEach(b=>b.classList.toggle('active',b.dataset.view==='day'));
        syncNavPill();
        render();
        window.scrollTo({top:0,behavior:'smooth'});
    }
}
function closeModal(n){document.getElementById(n+'Modal').classList.remove('open');}

function openTrainerPhoto(){document.getElementById('trainerPhotoInput').click();}
function handleTrainerPhoto(e){
    const f=e.target.files[0];if(!f)return;
    const img=new Image();
    img.onload=()=>{
        const maxSize=150;
        let w=img.width,h=img.height;
        if(w>h){if(w>maxSize){h*=maxSize/w;w=maxSize;}}
        else{if(h>maxSize){w*=maxSize/h;h=maxSize;}}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL('image/jpeg',0.5);
        // log removed
        const i=teachers.findIndex(t=>t.id===curTeacher);
        if(i>=0){
            teachers[i].photo=compressed;
            saveLocal();render();toast('Foto gespeichert!');
            if(online)apiPatch('teachers',curTeacher,{photo:compressed});
        }
    };
    img.src=URL.createObjectURL(f);
}

function deleteTrainerPhoto(){
    const i=teachers.findIndex(t=>t.id===curTeacher);
    if(i>=0){
        teachers[i].photo=null;
        saveLocal();render();toast('Foto gelöscht!');
        if(online)apiPatch('teachers',curTeacher,{photo:null});
    }
}

function renderDurBtns(){
    const clientName=document.getElementById('bClient')?.value;
    const cl=clientName?clients.find(c=>c.name.toLowerCase()===clientName.toLowerCase()):null;
    const isMember=cl?.is_member;
    const travelPrice=parseInt(document.getElementById('bTravelPrice')?.value)||null;
    const dateStr=document.getElementById('bDate')?.value;
    document.getElementById('durBtns').innerHTML=[45,90].map(d=>{
        const price=travelPrice?(d===90?travelPrice*2:travelPrice):getDisplayPrice(d,clientName,curTeacher,dateStr,isMember);
        const memberHint=isMember&&!travelPrice?' <span style="color:#c9a227;font-size:10px">M</span>':'';
        const travelHint=travelPrice?' <span class="travel-icon">✈</span>':'';
        return'<div class="dur-btn-v2'+(d===selDuration?' active':'')+'" onclick="pickDur('+d+')"><div class="dur-time-v2">'+d+'min</div><div class="dur-price-v2">€'+price+travelHint+memberHint+'</div></div>';
    }).join('');
}
function toggleBlockMode(){
    const toggle=document.getElementById('blockToggle');
    toggle.classList.toggle('active');
    const isBlocked=toggle.classList.contains('active');
    toast(isBlocked?'🔒 Block AN':'🔓 Block AUS');
    document.getElementById('blockNameWrap').style.display=isBlocked?'block':'none';
    document.getElementById('bClient').required=!isBlocked;
    document.getElementById('bClient').style.display=isBlocked?'none':'block';
    if(isBlocked){
        document.getElementById('bClient').value='BLOCKED';
        // Disable pause toggle when block is active
        document.getElementById('pauseToggle').classList.remove('active');
        document.getElementById('pauseNameWrap').style.display='none';
        // Populate trainer dropdown
        const select=document.getElementById('bBlockTrainer');
        select.innerHTML='<option value="">— Kein Trainer —</option>'+getActiveTrainers().map(t=>`<option value="${t.id}"${t.id===curTeacher?' selected':''}>${t.name}${t.is_guest?' (Gast)':''}</option>`).join('');
    }
    else{
        // Check if we have a prefilled client name from camp overview
        if(window.prefillClientName){
            document.getElementById('bClient').value=window.prefillClientName;
            window.prefillClientName=null; // Clear after use
        }else{
            document.getElementById('bClient').value='';
        }
        document.getElementById('bClient').style.display='block';
    }
}

function togglePauseMode(){
    const toggle=document.getElementById('pauseToggle');
    toggle.classList.toggle('active');
    const isPause=toggle.classList.contains('active');
    toast(isPause?'☕ Pause AN':'☕ Pause AUS');
    document.getElementById('pauseNameWrap').style.display=isPause?'block':'none';
    document.getElementById('bClient').required=!isPause;
    document.getElementById('bClient').style.display=isPause?'none':'block';
    if(isPause){
        document.getElementById('bClient').value='PAUSE';
        document.getElementById('pauseForAll').checked=false;
        document.getElementById('bPauseTrainer').style.display='block';
        // Disable block toggle when pause is active
        document.getElementById('blockToggle').classList.remove('active');
        document.getElementById('blockNameWrap').style.display='none';
        // Populate trainer dropdown
        const select=document.getElementById('bPauseTrainer');
        select.innerHTML=getActiveTrainers().map(t=>`<option value="${t.id}"${t.id===curTeacher?' selected':''}>${t.name}${t.is_guest?' (Gast)':''}</option>`).join('');
    }
    else{
        if(window.prefillClientName){
            document.getElementById('bClient').value=window.prefillClientName;
            window.prefillClientName=null;
        }else{
            document.getElementById('bClient').value='';
        }
        document.getElementById('bClient').style.display='block';
    }
}

function togglePauseForAll(){
    const forAll=document.getElementById('pauseForAll').checked;
    document.getElementById('bPauseTrainer').style.display=forAll?'none':'block';
}

function openBooking(){document.getElementById('editId').value='';document.getElementById('bookingTitle').textContent='Neue Stunde';document.getElementById('bClient').value=window.prefillClientName||'';window.prefillClientName=null;document.getElementById('bClient').style.display='block';document.getElementById('bDate').value=fmtDate(selDate);document.getElementById('bTime').value='10:00';document.getElementById('bNotes').value='';document.getElementById('bTravelPrice').value='';document.getElementById('delBtn').style.display='none';document.getElementById('dupBtn').style.display='none';document.getElementById('bookingClientBtn').style.display='none';document.getElementById('bookingShareBtn').style.display='none';document.getElementById('blockToggle').classList.remove('active');document.getElementById('blockNameWrap').style.display='none';document.getElementById('bBlockName').value='';document.getElementById('pauseToggle').classList.remove('active');document.getElementById('pauseNameWrap').style.display='none';document.getElementById('bPauseName').value='';document.getElementById('bClient').required=true;document.getElementById('bookBtn').textContent='Buchen';selDuration=45;renderDurBtns();updateTravelPriceField();document.getElementById('recurringWrap').style.display='block';document.getElementById('recurringToggle').classList.remove('active');document.getElementById('recurringOpts').style.display='none';document.getElementById('recurringType').value='weekly';document.getElementById('recurringCount').value='4';document.getElementById('advancedSection')?.classList.remove('open');document.getElementById('clientHeroSection').style.display='flex';updateClientHero();updateBookingSubtitle();document.getElementById('bookingModal').classList.add('open');}
function toggleRecurring(){const toggle=document.getElementById('recurringToggle');const opts=document.getElementById('recurringOpts');toggle.classList.toggle('active');opts.style.display=toggle.classList.contains('active')?'block':'none';}

// === NEW MODAL V2 HELPER FUNCTIONS ===
function toggleAdvancedSection(){
    const section=document.getElementById('advancedSection');
    section.classList.toggle('open');
}

function updateClientHero(){
    const clientName=document.getElementById('bClient')?.value;
    const avatarEl=document.getElementById('bookingClientAvatar');
    const sessionsEl=document.getElementById('bookingClientSessions');
    const memberEl=document.getElementById('bookingClientMember');
    const editBtn=document.getElementById('bookingClientBtn');

    if(!clientName||clientName.length<2){
        avatarEl.textContent='?';
        avatarEl.style.backgroundImage='';
        sessionsEl.textContent='';
        memberEl.style.display='none';
        editBtn.style.display='none';
        return;
    }

    const cl=clients.find(c=>c.name.toLowerCase()===clientName.toLowerCase());
    if(cl){
        // Show client info
        const initials=cl.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        if(cl.photo){
            avatarEl.textContent='';
            avatarEl.style.backgroundImage='url('+cl.photo+')';
        }else{
            avatarEl.textContent=initials;
            avatarEl.style.backgroundImage='';
        }
        // Count sessions
        const sessionCount=lessons.filter(l=>l.client.toLowerCase()===cl.name.toLowerCase()).length;
        sessionsEl.textContent=sessionCount+' Sessions';
        // Member badge
        if(cl.is_member){
            memberEl.style.display='inline-flex';
        }else{
            memberEl.style.display='none';
        }
        editBtn.style.display='flex';
    }else{
        // New client
        const initials=clientName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        avatarEl.textContent=initials;
        avatarEl.style.backgroundImage='';
        sessionsEl.textContent='Neuer Kunde';
        memberEl.style.display='none';
        editBtn.style.display='none';
    }
}

function updateBookingSubtitle(){
    const dateStr=document.getElementById('bDate').value;
    const subtitleEl=document.getElementById('bookingSubtitle');
    if(!dateStr||!subtitleEl)return;
    const d=new Date(dateStr+'T12:00');
    const days=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    const months=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    subtitleEl.textContent=days[d.getDay()]+', '+d.getDate()+'. '+months[d.getMonth()]+' '+d.getFullYear();
}

function updateClientMemberBadge(){
    const toggle=document.getElementById('memberToggle');
    const badge=document.getElementById('clientMemberBadge');
    if(toggle&&badge){
        badge.style.display=toggle.classList.contains('active')?'inline-flex':'none';
    }
}

// === END NEW MODAL V2 HELPER FUNCTIONS ===
function updateTravelPriceField(){
    const dateStr=document.getElementById('bDate').value;
    const d=new Date(dateStr+'T12:00');
    const locId=getDayLocation(d);
    const wrap=document.getElementById('travelPriceWrap');
    const label=document.getElementById('travelPriceLabel');
    const flag=document.getElementById('travelFlag');
    const editId=document.getElementById('editId').value;
    const existingPrice=document.getElementById('bTravelPrice').value;
    // Show if: location is not home, OR editing a lesson with existing custom price
    if(locId!=='home'){
        const loc=getLocationInfo(locId);
        wrap.style.display='block';
        if(flag)flag.textContent=loc.emoji;
        label.textContent=loc.name+' Preis';
    }else if(editId&&existingPrice){
        wrap.style.display='block';
        if(flag)flag.textContent='💰';
        label.textContent='Sonderpreis';
    }else{
        wrap.style.display='none';
    }
}
function openBookingAt(t){
    openBooking();
    const clickedMin=timeToMin(t);
    const dateStr=fmtDate(selDate);
    const dayLessons=lessons.filter(l=>l.date===dateStr&&l.teacher===curTeacher);
    let bestTime=clickedMin;
    dayLessons.forEach(l=>{
        const lStart=timeToMin(l.time);
        const lEnd=lStart+l.dur;
        if(lStart<=clickedMin&&lEnd>clickedMin){
            bestTime=Math.max(bestTime,lEnd);
        }
    });
    document.getElementById('bTime').value=minToTime(bestTime);
}
function pickDur(d){selDuration=d;renderDurBtns();}
function showClientSuggestions(){const i=document.getElementById('bClient').value.toLowerCase(),a=document.getElementById('clientAutocomplete');if(i.length<1){a.classList.remove('show');return;}const m=clients.filter(c=>c.name.toLowerCase().includes(i)&&!c.name.startsWith('[BLOCKED]'));if(!m.length){a.classList.remove('show');return;}a.innerHTML=m.slice(0,5).map(c=>'<div class="autocomplete-item" onclick="selectClient(\''+c.name.replace(/'/g,"\\'")+'\')">'+c.name+'</div>').join('');a.classList.add('show');}
function selectClient(n){document.getElementById('bClient').value=n;document.getElementById('clientAutocomplete').classList.remove('show');renderDurBtns();updateClientHero();}

async function submitBooking(e){
    e.preventDefault();
    const id=document.getElementById('editId').value,date=document.getElementById('bDate').value,time=document.getElementById('bTime').value,notes=document.getElementById('bNotes').value.trim();
    const isBlocked=document.getElementById('blockToggle').classList.contains('active');
    const isPause=document.getElementById('pauseToggle').classList.contains('active');
    const blockTrainer=document.getElementById('bBlockTrainer')?.value||'';
    const blockName=document.getElementById('bBlockName').value.trim()||'Gruppentraining';
    const pauseName=document.getElementById('bPauseName').value.trim()||'Pause';
    let client;
    if(isPause){
        client='[PAUSE] '+pauseName;
    }else if(isBlocked){
        // If trainer selected → GROUP (counts), no trainer → BLOCKED (doesn't count)
        client=blockTrainer?'[GROUP] '+blockName:'[BLOCKED] '+blockName;
    }else{
        client=document.getElementById('bClient').value.trim();
    }
    // log removed
    if(!isBlocked&&!isPause&&(!client||client.length<2)){toast('⚠️ Client Name zu kurz');return;}
    const newStart=timeToMin(time),newEnd=newStart+selDuration;
    // Check 1: Conflict with blocked/group lessons (any trainer)
    const blockedConflict=lessons.find(l=>{
        if(l.date!==date||(!l.client.startsWith('[BLOCKED]')&&!l.client.startsWith('[GROUP]')))return false;
        if(id&&l.id===id)return false;
        const lStart=timeToMin(l.time),lEnd=lStart+l.dur;
        return(newStart<lEnd&&newEnd>lStart);
    });
    if(blockedConflict&&!isBlocked){toast('⚠️ Saal ist blockiert!');return;}
    // Check 2: Time slot conflict with current teacher
    const conflict=lessons.find(l=>{
        if(l.date!==date||l.teacher!==curTeacher)return false;
        if(id&&l.id===id)return false;
        const lStart=timeToMin(l.time),lEnd=lStart+l.dur;
        return(newStart<lEnd&&newEnd>lStart);
    });
    if(conflict){toast('⚠️ Zeit bereits belegt!');return;}
    // Check 3: Same client booked with OTHER teacher at same time
    if(!isBlocked&&!isPause){
        const clientLower=client.toLowerCase();
        const doubleBooking=lessons.find(l=>{
            if(l.date!==date||l.teacher===curTeacher)return false;
            if(l.client.toLowerCase()!==clientLower)return false;
            if(id&&l.id===id)return false;
            const lStart=timeToMin(l.time),lEnd=lStart+l.dur;
            return(newStart<lEnd&&newEnd>lStart);
        });
        if(doubleBooking){const otherTeacher=teachers.find(t=>t.id===doubleBooking.teacher)?.name||'anderem Trainer';toast('⚠️ '+client.split('/')[0]+' hat bereits Stunde bei '+otherTeacher+'!');return;}
    }
    // Check 4: Guest trainer date range validation
    const bookingTrainer=teachers.find(t=>t.id===curTeacher);
    if(bookingTrainer?.is_guest&&bookingTrainer.start_date&&bookingTrainer.end_date){
        const lessonDate=new Date(date+'T12:00');
        const guestStart=new Date(bookingTrainer.start_date+'T00:00');
        const guestEnd=new Date(bookingTrainer.end_date+'T23:59');
        if(lessonDate<guestStart||lessonDate>guestEnd){
            const fmtStart=new Date(bookingTrainer.start_date+'T12:00').toLocaleDateString('de-DE',{day:'numeric',month:'short'});
            const fmtEnd=new Date(bookingTrainer.end_date+'T12:00').toLocaleDateString('de-DE',{day:'numeric',month:'short'});
            toast('⚠️ '+bookingTrainer.name+' ist nur vom '+fmtStart+' bis '+fmtEnd+' verfügbar!');
            return;
        }
    }
    if(id){
        syncBlocked=true;
        const blockTrainerEdit=isBlocked?document.getElementById('bBlockTrainer').value:'';
        const pauseTrainerEdit=isPause?document.getElementById('bPauseTrainer').value:'';
        // For blocked/pause events: use selected trainer or empty (no trainer assigned)
        // For regular lessons: keep existing teacher or current teacher
        const teacherIdEdit=isPause?pauseTrainerEdit:(isBlocked?blockTrainerEdit:(lessons.find(l=>l.id===id)?.teacher||curTeacher));
        const travelPriceEdit=document.getElementById('bTravelPrice').value;const customPriceEdit=travelPriceEdit?parseInt(travelPriceEdit):null;const locEdit=getDayLocation(new Date(date+'T12:00'),teacherIdEdit);const idx=lessons.findIndex(l=>l.id===id);if(idx>=0)lessons[idx]={...lessons[idx],client,date,time,dur:selDuration,notes,teacher:teacherIdEdit,location:locEdit,customPrice:customPriceEdit};
        saveLocal();render();closeModal('booking');toast('Updated!');
        if(online){
            apiPatch('lessons',id,{teacher_id:teacherIdEdit||null,client_name:client,lesson_date:date,lesson_time:time,duration:selDuration,notes,custom_price:customPriceEdit,location:locEdit}).then(()=>{
                setTimeout(()=>{syncBlocked=false;},3000);
            }).catch(()=>{setTimeout(()=>{syncBlocked=false;},3000);});
        }else{setTimeout(()=>{syncBlocked=false;},1000);}
    }else{
        const blockTrainer=isBlocked?document.getElementById('bBlockTrainer').value:'';
        const pauseForAll=isPause&&document.getElementById('pauseForAll').checked;
        const pauseTrainer=isPause?(pauseForAll?'':document.getElementById('bPauseTrainer').value):'';
        const teacherId=isPause?pauseTrainer:(isBlocked?blockTrainer:curTeacher);
        const travelPrice=document.getElementById('bTravelPrice').value;const customPrice=travelPrice?parseInt(travelPrice):null;

        // Check for recurring
        const recurringActive=document.getElementById('recurringToggle').classList.contains('active')&&!isBlocked&&!isPause;
        const recurringType=document.getElementById('recurringType').value;
        const recurringCount=parseInt(document.getElementById('recurringCount').value);
        const daysInterval=recurringType==='weekly'?7:14;
        const lessonCount=recurringActive?recurringCount:1;

        const createdLessons=[];
        let baseDate=new Date(date+'T12:00');

        for(let i=0;i<lessonCount;i++){
            const lessonDate=new Date(baseDate);
            lessonDate.setDate(lessonDate.getDate()+(i*daysInterval));
            const lessonDateStr=fmtDate(lessonDate);
            const newId='l'+Date.now()+'_'+Math.random().toString(36).substr(2,5)+'_'+i;
            const loc=getDayLocation(lessonDate,teacherId);
            const lesson={id:newId,teacher:teacherId,client,date:lessonDateStr,time,dur:selDuration,notes,location:loc,customPrice};
            lessons.push(lesson);
            createdLessons.push(lesson);
            if(i===0)lastBooking=lesson;
        }

        if(!isBlocked&&!isPause){
            const existingClient=clients.find(c=>c.name.toLowerCase()===client.toLowerCase());
            if(!existingClient){
                const newClient={id:'c'+Date.now()+'_'+Math.random().toString(36).substr(2,5),name:client,phone1:'',phone2:'',notes:'',photo:null,created_at:new Date().toISOString()};
                clients.push(newClient);
                if(online)apiPost('clients',{id:newClient.id,name:newClient.name,phone1:'',phone2:'',notes:'',photo:null});
            }
        }
        syncBlocked=true;
        // log removed
        saveLocal();closeModal('booking');
        if(isPause){toast('☕ '+pauseName+' eingetragen!');}
        else if(isBlocked){toast('✅ '+blockName+' blockiert!');}
        else if(recurringActive){toast('🔄 '+lessonCount+' Termine erstellt!');}
        else{showSuccess();}
        render();
        // Save to cloud
        if(online){
            const savePromises=createdLessons.map((lesson,idx)=>
                apiPost('lessons',{teacher_id:teacherId||null,client_name:client,lesson_date:lesson.date,lesson_time:time,duration:selDuration,notes,custom_price:customPrice,location:lesson.location||'home'}).then((res)=>{
                    if(res&&res[0]&&res[0].id){
                        const localIdx=lessons.findIndex(l=>l.id===lesson.id);
                        if(localIdx>=0){lessons[localIdx].id=res[0].id;saveLocal();}
                        if(!isBlocked&&!isPause&&idx===0)syncBookingToNotion(lesson);
                    }
                })
            );
            Promise.all(savePromises).then(()=>{
                toast('☁️ Synchronisiert');
                setTimeout(()=>{syncBlocked=false;},3000);
            }).catch(e=>{console.error('❌ Save error:',e);toast('⚠️ Cloud-Fehler');setTimeout(()=>{syncBlocked=false;},3000);});
        }else{
            toast('📴 Offline - nur lokal gespeichert');
            setTimeout(()=>{syncBlocked=false;},1000);
        }
    }
}

function editLesson(id){const l=lessons.find(x=>x.id===id);if(!l)return;document.getElementById('editId').value=id;document.getElementById('bookingTitle').textContent='Bearbeiten';document.getElementById('bDate').value=l.date;document.getElementById('bTime').value=l.time;document.getElementById('bNotes').value=l.notes||'';document.getElementById('delBtn').style.display='flex';document.getElementById('dupBtn').style.display='flex';document.getElementById('bookBtn').textContent='Speichern';selDuration=l.dur;renderDurBtns();
    // Handle blocked, group and pause lessons
    const isBlocked=l.client.includes('[BLOCKED]');
    const isGroup=l.client.includes('[GROUP]');
    const isPause=l.client.includes('[PAUSE]');
    // Reset both toggles first
    document.getElementById('blockToggle').classList.remove('active');
    document.getElementById('blockNameWrap').style.display='none';
    document.getElementById('bBlockName').value='';
    document.getElementById('pauseToggle').classList.remove('active');
    document.getElementById('pauseNameWrap').style.display='none';
    document.getElementById('bPauseName').value='';
    if(isPause){
        document.getElementById('pauseToggle').classList.add('active');
        document.getElementById('pauseNameWrap').style.display='block';
        document.getElementById('bPauseName').value=l.client.replace('[PAUSE] ','');
        document.getElementById('bClient').value='[PAUSE]';
        document.getElementById('bClient').required=false;
        document.getElementById('bClient').style.display='none';
        document.getElementById('bookingClientBtn').style.display='none';
        document.getElementById('bookingShareBtn').style.display='none';
        const select=document.getElementById('bPauseTrainer');
        select.innerHTML='<option value="">— Kein Trainer —</option>'+getActiveTrainers().map(t=>`<option value="${t.id}"${t.id===l.teacher?' selected':''}>${t.name}${t.is_guest?' (Gast)':''}</option>`).join('');
    }else if(isBlocked||isGroup){
        document.getElementById('blockToggle').classList.add('active');
        document.getElementById('blockNameWrap').style.display='block';
        document.getElementById('bBlockName').value=isGroup?l.client.replace('[GROUP] ',''):l.client.replace('[BLOCKED] ','');
        document.getElementById('bClient').value='[BLOCKED]';
        document.getElementById('bClient').required=false;
        document.getElementById('bClient').style.display='none';
        document.getElementById('bookingClientBtn').style.display='none';
        document.getElementById('bookingShareBtn').style.display='none';
        const select=document.getElementById('bBlockTrainer');
        select.innerHTML='<option value="">— Kein Trainer —</option>'+getActiveTrainers().map(t=>`<option value="${t.id}"${t.id===l.teacher?' selected':''}>${t.name}${t.is_guest?' (Gast)':''}</option>`).join('');
        // Show camp participants for this date
        const campParts=getCampParticipantsForDate(l.date);
        const partsWrap=document.getElementById('campParticipantsInModal');
        const partsList=document.getElementById('campParticipantsList');
        if(campParts.length>0){
            partsWrap.style.display='block';
            partsList.innerHTML=campParts.map(p=>{
                const icon=p.type==='couple'?'👫':'👤';
                // Calculate days: for full camp use campStart/End, for partial use days array
                let numDays=0;
                if(p.daysType==='full'||!p.days||!p.days.length){
                    const cs=p.campStart||settings.campStart;
                    const ce=p.campEnd||settings.campEnd;
                    if(cs&&ce){
                        numDays=Math.round((new Date(ce)-new Date(cs))/(1000*60*60*24))+1;
                    }
                }else{
                    numDays=p.days.length;
                }
                const daysInfo=numDays>0?` (${numDays} Tage)`:'';
                return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #333"><span>${icon}</span><span style="flex:1">${p.name}</span><span style="font-size:12px;color:#71717a">${daysInfo}</span></div>`;
            }).join('');
        }else{
            partsWrap.style.display='none';
        }
    }else{
        document.getElementById('campParticipantsInModal').style.display='none';
        document.getElementById('bClient').value=l.client;
        document.getElementById('bClient').required=true;
        document.getElementById('bClient').style.display='block';
        document.getElementById('bookingClientBtn').style.display='flex';
        const shareBtn=document.getElementById('bookingShareBtn');
        const c=clients.find(x=>x.name===l.client);
        shareBtn.style.display=c?'flex':'none';
    }
    document.getElementById('bTravelPrice').value=l.customPrice||'';document.getElementById('recurringWrap').style.display='none';
    document.getElementById('advancedSection')?.classList.remove('open');
    document.getElementById('clientHeroSection').style.display=(isPause||isBlocked||isGroup)?'none':'flex';
    updateTravelPriceField();
    updateClientHero();
    updateBookingSubtitle();
    document.getElementById('bookingModal').classList.add('open');}

let shareClientName='',shareLang='de',shareSelectedIds=[],shareTrainer='';

function openShareModal(){
    // Get client name from context - check editing lesson first
    const editId=document.getElementById('editId')?.value;
    if(editId){
        const editingLesson=lessons.find(l=>l.id===editId);
        if(editingLesson)shareClientName=editingLesson.client;
    }else if(lastBooking){
        shareClientName=lastBooking.client;
    }else{
        shareClientName=document.getElementById('bClient')?.value||'';
    }
    // log removed
    if(!shareClientName||shareClientName.startsWith('[BLOCKED]')){toast('Kein Client ausgewählt');return;}

    shareLang='de';
    shareTrainer='all';
    document.querySelectorAll('#shareModal .share-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang==='de'));

    // Build trainer buttons - use case-insensitive matching with fallback
    const clientLower=shareClientName.toLowerCase().trim();
    let clientLessons=lessons.filter(l=>l.client.toLowerCase()===clientLower);
    if(!clientLessons.length)clientLessons=lessons.filter(l=>l.client.toLowerCase().includes(clientLower));
    const trainerIds=[...new Set(clientLessons.map(l=>l.teacher))];
    let tb='<button class="trainer-btn active" data-trainer="all" onclick="setShareTrainer(\'all\')">Alle</button>';
    trainerIds.forEach(tid=>{const tr=teachers.find(x=>x.id===tid);const name=tr?.name||tid;tb+='<button class="trainer-btn" data-trainer="'+tid+'" onclick="setShareTrainer(\''+tid+'\')">'+name+'</button>';});
    document.getElementById('shareTrainerBtns').innerHTML=tb;

    renderShareLessons();
    document.getElementById('shareModal').classList.add('open');
}

function renderShareLessons(){
    const today=new Date();today.setHours(0,0,0,0);
    const clientLower=shareClientName.toLowerCase().trim();
    // log removed
    // Try exact match first, then partial match
    let futLessons=lessons.filter(l=>l.client.toLowerCase()===clientLower&&new Date(l.date)>=today);
    if(!futLessons.length){
        // Try partial match (name might be slightly different)
        futLessons=lessons.filter(l=>l.client.toLowerCase().includes(clientLower)&&new Date(l.date)>=today);
        // log removed
    }
    // log removed
    if(shareTrainer!=='all')futLessons=futLessons.filter(l=>l.teacher===shareTrainer);
    futLessons.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));

    shareSelectedIds=futLessons.map(l=>l.id);

    const days=shareLang==='de'?['So','Mo','Di','Mi','Do','Fr','Sa']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let h='';
    futLessons.forEach(l=>{
        const d=new Date(l.date),et=minToTime(timeToMin(l.time)+l.dur);
        const tObj=teachers.find(x=>x.id===l.teacher)||teachers.find(x=>x.name?.toLowerCase()===l.teacher?.toLowerCase());
        const tName=tObj?.name||(l.teacher?.charAt(0).toUpperCase()+l.teacher?.slice(1))||'';
        const tColor=tObj?.color||'#c9a227';
        const tLabel=shareTrainer==='all'?' • '+tName:'';
        h+='<div class="share-lesson selected" style="border-left:4px solid '+tColor+'" onclick="toggleShareLesson(\''+l.id+'\')">';
        h+='<input type="checkbox" checked>';
        h+='<div class="share-lesson-info">';
        h+='<div class="share-lesson-date">'+days[d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1)+tLabel+'</div>';
        h+='<div class="share-lesson-time">'+l.time+'-'+et+' ('+l.dur+'min)</div>';
        h+='</div></div>';
    });
    document.getElementById('shareLessonsList').innerHTML=h||'<p style="color:#71717a;text-align:center">Keine Termine</p>';
    updateSharePreview();
}

function setShareTrainer(t){
    shareTrainer=t;
    document.querySelectorAll('#shareTrainerBtns .trainer-btn').forEach(b=>b.classList.toggle('active',b.dataset.trainer===t));
    renderShareLessons();
}

function toggleShareLesson(id){
    const idx=shareSelectedIds.indexOf(id);
    if(idx>-1)shareSelectedIds.splice(idx,1);else shareSelectedIds.push(id);
    document.querySelectorAll('.share-lesson').forEach(el=>{
        const lid=el.getAttribute('onclick').match(/'([^']+)'/)[1];
        const sel=shareSelectedIds.includes(lid);
        el.classList.toggle('selected',sel);
        el.querySelector('input').checked=sel;
    });
    updateSharePreview();
}

function setShareLang(lang){
    shareLang=lang;
    document.querySelectorAll('#shareModal .share-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
    renderShareLessons();
}

function updateSharePreview(){
    const selLessons=lessons.filter(l=>shareSelectedIds.includes(l.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    const msg=buildShareMessage(selLessons,shareLang);
    document.getElementById('sharePreview').textContent=msg||'Wähle mindestens einen Termin';

    const c=clients.find(x=>x.name===shareClientName);
    const ph=(c?.phone1||'').replace(/[^0-9]/g,'');
    const waMsg=msg.replace('!\n','! 👋\n').replace(shareLang==='de'?'Bis bald!':'See you soon!',shareLang==='de'?'Bis bald! 💃🕺':'See you soon! 💃🕺');
    document.getElementById('shareWaBtn').href='https://wa.me/'+(ph||'')+'?text='+encodeURIComponent(waMsg);
}

function buildShareMessage(selLessons,lang){
    if(!selLessons.length)return'';
    const daysDE=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    const daysEN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const days=lang==='de'?daysDE:daysEN;
    const firstName=shareClientName.split('/')[0].trim();
    const withDE='mit ',withEN='with ';

    const getTeacherName=(tid)=>{
        const t=teachers.find(x=>x.id===tid)||teachers.find(x=>x.name?.toLowerCase()===tid?.toLowerCase());
        if(t)return t.name;
        return tid?.charAt(0).toUpperCase()+tid?.slice(1)||'Trainer';
    };

    let msg=lang==='de'?'Hallo '+firstName+'!\n\n':'Hi '+firstName+'!\n\n';

    if(selLessons.length===1){
        const l=selLessons[0],d=new Date(l.date),et=minToTime(timeToMin(l.time)+l.dur);
        const tName=getTeacherName(l.teacher);
        msg+=lang==='de'?'Tanzstunde bestätigt:\n':'Dance lesson confirmed:\n';
        msg+=days[d.getDay()]+', '+d.getDate()+'.'+(d.getMonth()+1)+'\n'+l.time+'-'+et+' '+(lang==='de'?withDE:withEN)+tName;
    }else{
        msg+=lang==='de'?'Deine nächsten Termine:\n':'Your upcoming appointments:\n';
        selLessons.forEach(l=>{
            const d=new Date(l.date),et=minToTime(timeToMin(l.time)+l.dur);
            const tName=getTeacherName(l.teacher);
            msg+='\n'+days[d.getDay()]+', '+d.getDate()+'.'+(d.getMonth()+1)+'\n'+l.time+'-'+et+' '+(lang==='de'?withDE:withEN)+tName+'\n';
        });
    }
    msg+='\n'+(lang==='de'?'Bis bald!':'See you soon!')+'\nmōtus studio';
    return msg;
}

function copyShareText(){
    const selLessons=lessons.filter(l=>shareSelectedIds.includes(l.id));
    const msg=buildShareMessage(selLessons,shareLang);
    if(msg){navigator.clipboard.writeText(msg);toast('📋 '+(shareLang==='de'?'Kopiert!':'Copied!'));}
}

function openClientFromBookingEdit(){const clientName=document.getElementById('bClient').value;let c=clients.find(x=>x.name===clientName);if(!c)c=clients.find(x=>x.name.toLowerCase().includes(clientName.toLowerCase().split('/')[0].trim())||clientName.toLowerCase().includes(x.name.toLowerCase().split('/')[0].trim()));closeModal('booking');if(c){setTimeout(()=>openClient(c.id),100);}else{toast('Client nicht gefunden');}}

async function delLesson(){const id=document.getElementById('editId').value;if(!confirm('Delete?'))return;const deleted=lessons.find(l=>l.id===id);lessons=lessons.filter(l=>l.id!==id);moveToTrash('lesson',deleted);saveLocal();render();closeModal('booking');showUndoToast('lesson');if(online)apiDelete('lessons',id);}

function duplicateLesson(){
    const id=document.getElementById('editId').value;
    const l=lessons.find(x=>x.id===id);
    if(!l)return;
    // Find next free slot after this lesson
    const endMin=timeToMin(l.time)+l.dur;
    const nextTime=minToTime(endMin);
    // Check if slot is free
    const dayLessons=lessons.filter(x=>x.date===l.date&&x.teacher===curTeacher&&x.id!==id);
    let slotFree=true;
    dayLessons.forEach(x=>{
        const xStart=timeToMin(x.time);
        const xEnd=xStart+x.dur;
        if((endMin>=xStart&&endMin<xEnd)||(endMin+l.dur>xStart&&endMin<xEnd)){slotFree=false;}
    });
    // Set up new booking with same data
    closeModal('booking');
    setTimeout(()=>{
        openBooking();
        document.getElementById('bClient').value=l.client;
        document.getElementById('bDate').value=l.date;
        document.getElementById('bTime').value=slotFree?nextTime:l.time;
        document.getElementById('bNotes').value=l.notes||'';
        selDuration=l.dur;
        renderDurBtns();
        updateTravelPriceField();
        if(l.customPrice)document.getElementById('bTravelPrice').value=l.customPrice;
        toast('📋 Kopiert - Zeit anpassen falls nötig');
    },100);
}

function buildClientWaLink(clientName){const c=clients.find(x=>x.name===clientName),ph=(c?.phone1||'').replace(/[^0-9]/g,'');return ph?'https://wa.me/'+ph:'https://wa.me/';}

function showSuccess(){if(!lastBooking)return;const p=getPrice(lastBooking.dur,lastBooking.client),et=minToTime(timeToMin(lastBooking.time)+lastBooking.dur),d=new Date(lastBooking.date),days=['So','Mo','Di','Mi','Do','Fr','Sa'];document.getElementById('successSub').textContent=lastBooking.client;document.getElementById('successDetails').innerHTML='<div class="success-row"><span>Date</span><span>'+days[d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1)+'</span></div><div class="success-row"><span>Time</span><span>'+lastBooking.time+'-'+et+'</span></div><div class="success-row"><span>Duration</span><span>'+lastBooking.dur+'min</span></div><div class="success-row"><span>Price</span><span>€'+p+'</span></div>';document.getElementById('successModal').classList.add('open');}

function sendWhatsApp(){if(!lastBooking)return;const c=clients.find(x=>x.name===lastBooking.client),ph=(c?.phone1||'').replace(/[^0-9]/g,''),p=getPrice(lastBooking.dur,lastBooking.client),d=new Date(lastBooking.date),days=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],et=minToTime(timeToMin(lastBooking.time)+lastBooking.dur),msg='Hallo '+lastBooking.client.split('/')[0].trim()+'! 👋\n\nTanzstunde bestätigt:\n📅 '+days[d.getDay()]+', '+d.getDate()+'.'+(d.getMonth()+1)+'\n🕐 '+lastBooking.time+'-'+et+'\n💰 €'+p+'\n\nBis bald! 💃🕺\nmōtus studio';window.open(ph?'https://wa.me/'+ph+'?text='+encodeURIComponent(msg):'https://wa.me/?text='+encodeURIComponent(msg),'_blank');closeModal('success');}

function openClientFromBooking(){
    if(!lastBooking)return;
    const c=clients.find(x=>x.name===lastBooking.client);
    closeModal('success');
    if(c){setTimeout(()=>openClient(c.id),100);}
    else{toast('Client nicht gefunden');}
}

function filterClients(){
const q=document.getElementById('clientSearch').value.toLowerCase();
document.querySelectorAll('.client-row').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?'':'none');
document.querySelectorAll('.alpha-section').forEach(s=>{
const visibleRows=s.querySelectorAll('.client-row:not([style*="display: none"])');
s.style.display=visibleRows.length?'':'none';
});
}

function openNewClient(){document.getElementById('cId').value='';document.getElementById('cName').value='';document.getElementById('cEmail').value='';document.getElementById('cPhone1').value='';document.getElementById('cPhone2').value='';document.getElementById('cPartner').value='';document.getElementById('cNotes').value='';document.getElementById('memberToggle').classList.remove('active');curPhoto=null;const p=document.getElementById('photoPreview');p.style.backgroundImage='';p.textContent='';const icon=document.getElementById('clientPhotoIcon');if(icon)icon.style.display='block';document.getElementById('delPhotoBtn').style.display='none';document.getElementById('clientStats').innerHTML='';document.getElementById('clientHistory').innerHTML='';document.getElementById('delClientBtn').style.display='none';document.getElementById('clientShareBtn').style.display='none';updateClientMemberBadge();document.getElementById('clientModal').classList.add('open');}

function openClient(id){const c=clients.find(x=>x.id===id);if(!c)return;document.getElementById('cId').value=id;document.getElementById('cName').value=c.name;document.getElementById('cEmail').value=c.email||'';document.getElementById('cPhone1').value=c.phone1||'';document.getElementById('cPhone2').value=c.phone2||'';document.getElementById('cPartner').value=c.partner||'';document.getElementById('cNotes').value=c.notes||'';const mt=document.getElementById('memberToggle');if(c.is_member)mt.classList.add('active');else mt.classList.remove('active');curPhoto=c.photo;const p=document.getElementById('photoPreview');const icon=document.getElementById('clientPhotoIcon');if(curPhoto){p.style.backgroundImage='url('+curPhoto+')';if(icon)icon.style.display='none';document.getElementById('delPhotoBtn').style.display='block';}else{p.style.backgroundImage='';const initials=c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();if(icon)icon.style.display='block';document.getElementById('delPhotoBtn').style.display='none';}renderClientStats(c.name);renderClientHistory(c.name);document.getElementById('delClientBtn').style.display='block';document.getElementById('clientShareBtn').style.display='flex';updateClientMemberBadge();document.getElementById('clientModal').classList.add('open');}

function renderClientStats(n){const cl=lessons.filter(l=>l.client.toLowerCase()===n.toLowerCase()||parseClientName(l.client).toLowerCase()===n.toLowerCase());const units=cl.reduce((sum,l)=>sum+Math.ceil(l.dur/45),0);const rev=cl.reduce((s,l)=>s+getPrice(l.dur,l.client,l.customPrice,l.teacher,l.date,l.location),0);const fmtRev=rev.toLocaleString('de-DE');
// Calculate months active
const dates=cl.map(l=>l.date).sort();
const months=dates.length?Math.max(1,Math.ceil((new Date(dates[dates.length-1])-new Date(dates[0]))/(1000*60*60*24*30))):0;
document.getElementById('clientStats').innerHTML=units>0?'<div class="stats-grid-v2"><div><div class="stat-value">'+units+'</div><div class="stat-label">Sessions</div></div><div><div class="stat-value">€'+fmtRev+'</div><div class="stat-label">Umsatz</div></div><div><div class="stat-value">'+months+'</div><div class="stat-label">Monate</div></div></div>':'';}

function renderClientHistory(n){const cl=lessons.filter(l=>l.client.toLowerCase()===n.toLowerCase());if(!cl.length){document.getElementById('clientHistory').innerHTML='';return;}const t=new Date();t.setHours(0,0,0,0);const curYear=t.getFullYear();const past=cl.filter(l=>new Date(l.date)<t).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8),fut=cl.filter(l=>new Date(l.date)>=t).sort((a,b)=>a.date.localeCompare(b.date)),d=['So','Mo','Di','Mi','Do','Fr','Sa'];
let h='<div class="history-header"><span class="history-title">Termine ('+cl.length+')</span></div><div class="history-list">';
fut.forEach(l=>{const x=new Date(l.date);const showYear=x.getFullYear()!==curYear?'.'+x.getFullYear():'';const tr=teachers.find(t=>t.id===l.teacher);const tColor=tr?.color||'#444';const tInit=tr?.name?.charAt(0)||'?';h+='<div class="history-item future" onclick="closeModal(\'client\');editLesson(\''+l.id+'\')"><div class="history-trainer" style="background:'+tColor+'">'+tInit+'</div><div class="history-details"><span class="history-date">'+d[x.getDay()]+' '+x.getDate()+'.'+(x.getMonth()+1)+showYear+'</span><span class="history-time">'+l.time+' mit '+(tr?.name||l.teacher)+'</span></div><span class="history-dur">'+l.dur+'min</span></div>';});
past.forEach(l=>{const x=new Date(l.date);const showYear=x.getFullYear()!==curYear?'.'+x.getFullYear():'';const tr=teachers.find(t=>t.id===l.teacher);const tColor=tr?.color||'#444';const tInit=tr?.name?.charAt(0)||'?';h+='<div class="history-item past" onclick="closeModal(\'client\');editLesson(\''+l.id+'\')"><div class="history-trainer" style="background:'+tColor+'">'+tInit+'</div><div class="history-details"><span class="history-date">'+d[x.getDay()]+' '+x.getDate()+'.'+(x.getMonth()+1)+showYear+'</span><span class="history-time">'+l.time+' mit '+(tr?.name||l.teacher)+'</span></div><span class="history-dur">'+l.dur+'min</span></div>';});
h+='</div>';document.getElementById('clientHistory').innerHTML=h;}

function shareClientHistory(clientName){
const cl=lessons.filter(l=>l.client.toLowerCase()===clientName.toLowerCase());
const t=new Date();t.setHours(0,0,0,0);
const fut=cl.filter(l=>new Date(l.date)>=t);
if(!fut.length){toast('Keine kommenden Termine');return;}
// Use the same share modal as booking
shareClientName=clientName;
shareLang='de';
shareTrainer='all';
document.querySelectorAll('#shareModal .share-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang==='de'));
const trainerIds=[...new Set(fut.map(l=>l.teacher))];
let tb='<button class="trainer-btn active" data-trainer="all" onclick="setShareTrainer(\'all\')">Alle</button>';
trainerIds.forEach(tid=>{const tr=teachers.find(x=>x.id===tid);const name=tr?.name||tid;tb+='<button class="trainer-btn" data-trainer="'+tid+'" onclick="setShareTrainer(\''+tid+'\')">'+name+'</button>';});
document.getElementById('shareTrainerBtns').innerHTML=tb;
renderShareLessons();
closeModal('client');
document.getElementById('shareModal').classList.add('open');
}

function handlePhoto(e){
    const f=e.target.files[0];if(!f)return;
    const img=new Image();
    img.onload=()=>{
        const maxSize=150;
        let w=img.width,h=img.height;
        if(w>h){if(w>maxSize){h*=maxSize/w;w=maxSize;}}
        else{if(h>maxSize){w*=maxSize/h;h=maxSize;}}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        curPhoto=canvas.toDataURL('image/jpeg',0.5);
        const p=document.getElementById('photoPreview');
        p.style.backgroundImage='url('+curPhoto+')';
        const icon=document.getElementById('clientPhotoIcon');
        if(icon)icon.style.display='none';
        document.getElementById('delPhotoBtn').style.display='block';
    };
    img.src=URL.createObjectURL(f);
}

function deletePhoto(){
    curPhoto=null;
    const p=document.getElementById('photoPreview');
    p.style.backgroundImage='';
    const icon=document.getElementById('clientPhotoIcon');
    if(icon)icon.style.display='block';
    document.getElementById('delPhotoBtn').style.display='none';
    const id=document.getElementById('cId').value;
    if(id){
        const i=clients.findIndex(c=>c.id===id);
        if(i>=0){clients[i].photo=null;saveLocal();}
        if(online)apiPatch('clients',id,{photo:null});
    }
    toast('Foto gelöscht!');
}

let curGtPhoto=null;
function handleGtPhoto(e){
    const f=e.target.files[0];if(!f)return;
    const img=new Image();
    img.onload=()=>{
        const maxSize=150;
        let w=img.width,h=img.height;
        if(w>h){if(w>maxSize){h*=maxSize/w;w=maxSize;}}
        else{if(h>maxSize){w*=maxSize/h;h=maxSize;}}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        curGtPhoto=canvas.toDataURL('image/jpeg',0.5);
        // log removed
        const p=document.getElementById('gtPhotoPreview');
        p.style.backgroundImage='url('+curGtPhoto+')';
        p.classList.add('has-photo');p.innerHTML='';
        document.getElementById('delGtPhotoBtn').style.display='block';
    };
    img.src=URL.createObjectURL(f);
}

function deleteGtPhoto(){
    curGtPhoto=null;
    const p=document.getElementById('gtPhotoPreview');
    p.style.backgroundImage='';
    p.classList.remove('has-photo');
    p.innerHTML='<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
    document.getElementById('delGtPhotoBtn').style.display='none';
}

// Trainer Edit (Long Press)
let trainerLongPressTimer=null;
window.trainerLongPressTriggered=false;
let curTePhoto=null;
function startTrainerLongPress(id){
    window.trainerLongPressTriggered=false;
    trainerLongPressTimer=setTimeout(()=>{
        window.trainerLongPressTriggered=true;
        openTrainerEdit(id);
    },500);
}
function cancelTrainerLongPress(){
    if(trainerLongPressTimer){clearTimeout(trainerLongPressTimer);trainerLongPressTimer=null;}
}
function openTrainerEdit(id){
    cancelTrainerLongPress();
    document.getElementById('trainerPopup').classList.remove('show');
    const t=teachers.find(x=>x.id===id);
    if(!t)return;
    document.getElementById('teId').value=id;
    document.getElementById('teName').value=t.name;
    document.getElementById('tePhone').value=t.phone||'';
    document.getElementById('teEmail').value=t.email||'';
    curTePhoto=t.photo||null;
    const p=document.getElementById('tePhotoPreview');
    if(t.photo){
        p.style.backgroundImage='url('+t.photo+')';p.classList.add('has-photo');p.innerHTML='';
        document.getElementById('delTePhotoBtn').style.display='block';
    }else{
        p.style.backgroundImage='';p.classList.remove('has-photo');
        p.innerHTML='<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
        document.getElementById('delTePhotoBtn').style.display='none';
    }
    document.getElementById('trainerEditTitle').textContent=t.name+' bearbeiten';
    document.getElementById('trainerEditModal').classList.add('open');
}
function handleTePhoto(e){
    const f=e.target.files[0];if(!f)return;
    const img=new Image();
    img.onload=()=>{
        const maxSize=150;
        let w=img.width,h=img.height;
        if(w>h){if(w>maxSize){h*=maxSize/w;w=maxSize;}}
        else{if(h>maxSize){w*=maxSize/h;h=maxSize;}}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        curTePhoto=canvas.toDataURL('image/jpeg',0.5);
        const p=document.getElementById('tePhotoPreview');
        p.style.backgroundImage='url('+curTePhoto+')';
        p.classList.add('has-photo');p.innerHTML='';
        document.getElementById('delTePhotoBtn').style.display='block';
    };
    img.src=URL.createObjectURL(f);
}
function deleteTePhoto(){
    curTePhoto=null;
    const p=document.getElementById('tePhotoPreview');
    p.style.backgroundImage='';p.classList.remove('has-photo');
    p.innerHTML='<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
    document.getElementById('delTePhotoBtn').style.display='none';
}
async function saveTrainerEdit(){
    const id=document.getElementById('teId').value;
    const phone=document.getElementById('tePhone').value.trim();
    const email=document.getElementById('teEmail').value.trim();
    const i=teachers.findIndex(t=>t.id===id);
    if(i<0)return;
    teachers[i].photo=curTePhoto;
    teachers[i].phone=phone;
    teachers[i].email=email;
    saveLocal();
    if(online){
        await apiUpsert('teachers',{id:id,photo:curTePhoto,phone:phone||null,email:email||null});
    }
    updateTrainerPopup();
    render();
    closeModal('trainerEdit');
    toast('Trainer aktualisiert!');
}

function deleteClient(){
    const id=document.getElementById('cId').value;
    if(!id)return;
    if(!confirm('Client wirklich löschen?'))return;
    const i=clients.findIndex(c=>c.id===id);
    if(i>=0){
        const deleted=clients[i];
        clients.splice(i,1);
        moveToTrash('client',deleted);
    }
    if(online)apiDelete('clients',id);
    saveLocal();render();closeModal('client');showUndoToast('client');
}

async function saveClient(e){e.preventDefault();const id=document.getElementById('cId').value,isMember=document.getElementById('memberToggle').classList.contains('active'),name=document.getElementById('cName').value.trim();if(!name||name.length<2){toast('⚠️ Name zu kurz');return;}const data={name,email:document.getElementById('cEmail').value.trim(),phone1:document.getElementById('cPhone1').value.trim(),phone2:document.getElementById('cPhone2').value.trim(),partner:document.getElementById('cPartner').value.trim(),notes:document.getElementById('cNotes').value.trim(),photo:curPhoto,is_member:isMember};if(id){const i=clients.findIndex(c=>c.id===id);if(i>=0){const oldName=clients[i].name;clients[i]={...clients[i],...data};if(oldName!==name){const affected=lessons.filter(l=>l.client===oldName);affected.forEach(l=>{l.client=name;if(online)apiPatch('lessons',l.id,{client_name:name});});if(affected.length>0)toast(affected.length+' Buchungen aktualisiert');}}if(online)apiPatch('clients',id,data);}else{const newId='c'+Date.now()+'_'+Math.random().toString(36).substr(2,5);clients.push({id:newId,...data,created_at:new Date().toISOString()});if(online)apiPost('clients',{id:newId,...data});}saveLocal();render();closeModal('client');toast('Saved!');}

function openPrices(){document.getElementById('price45').value=settings.prices[45];document.getElementById('priceMember45').value=settings.memberPrice45||80;document.getElementById('pricesModal').classList.add('open');}
async function savePrices(e){e.preventDefault();settings.prices[45]=parseInt(document.getElementById('price45').value)||100;settings.memberPrice45=parseInt(document.getElementById('priceMember45').value)||80;saveLocal();render();closeModal('prices');toast('Gespeichert!');if(online)apiPatch('settings','default',{price_45:settings.prices[45],member_price_45:settings.memberPrice45});}

// Travel Price Bulk Apply Functions
function applyPriceToday(){
    const price=parseInt(document.getElementById('bTravelPrice').value);
    if(!price){toast('Bitte erst Preis eingeben');return;}
    const dateStr=document.getElementById('bDate').value;
    const dayLessons=lessons.filter(l=>l.date===dateStr&&!l.client.startsWith('['));
    if(!dayLessons.length){toast('Keine Stunden an diesem Tag');return;}
    let count=0;
    dayLessons.forEach(l=>{
        l.customPrice=price;
        count++;
        if(online)apiPatch('lessons',l.id,{custom_price:price});
    });
    saveLocal();
    toast(`€${price} auf ${count} Stunden angewendet`);
}

let priceRangePrice=0;
function openPriceRangeModal(){
    const price=parseInt(document.getElementById('bTravelPrice').value);
    if(!price){toast('Bitte erst Preis eingeben');return;}
    priceRangePrice=price;
    const dateStr=document.getElementById('bDate').value;
    document.getElementById('priceRangeFrom').value=dateStr;
    document.getElementById('priceRangeTo').value=dateStr;
    updatePriceRangePreview();
    document.getElementById('priceRangeModal').classList.add('open');
    document.getElementById('priceRangeFrom').onchange=updatePriceRangePreview;
    document.getElementById('priceRangeTo').onchange=updatePriceRangePreview;
}

function updatePriceRangePreview(){
    const from=document.getElementById('priceRangeFrom').value;
    const to=document.getElementById('priceRangeTo').value;
    if(!from||!to)return;
    const fromD=new Date(from+'T00:00');
    const toD=new Date(to+'T23:59');
    const matching=lessons.filter(l=>{
        if(l.client.startsWith('['))return false;
        const ld=new Date(l.date+'T12:00');
        return ld>=fromD&&ld<=toD;
    });
    const preview=document.getElementById('priceRangePreview');
    preview.innerHTML=`<strong>€${priceRangePrice}</strong> wird auf <strong>${matching.length} Stunden</strong> angewendet`;
}

function applyPriceRange(){
    const from=document.getElementById('priceRangeFrom').value;
    const to=document.getElementById('priceRangeTo').value;
    if(!from||!to){toast('Bitte Zeitraum wählen');return;}
    const fromD=new Date(from+'T00:00');
    const toD=new Date(to+'T23:59');
    const matching=lessons.filter(l=>{
        if(l.client.startsWith('['))return false;
        const ld=new Date(l.date+'T12:00');
        return ld>=fromD&&ld<=toD;
    });
    if(!matching.length){toast('Keine Stunden im Zeitraum');closeModal('priceRange');return;}
    matching.forEach(l=>{
        l.customPrice=priceRangePrice;
        if(online)apiPatch('lessons',l.id,{custom_price:priceRangePrice});
    });
    saveLocal();
    closeModal('priceRange');
    toast(`€${priceRangePrice} auf ${matching.length} Stunden angewendet`);
}

function openHours(){document.getElementById('startHour').value=settings.startHour;document.getElementById('endHour').value=settings.endHour;document.getElementById('hoursModal').classList.add('open');}
async function saveHours(e){e.preventDefault();settings.startHour=parseInt(document.getElementById('startHour').value)||9;settings.endHour=parseInt(document.getElementById('endHour').value)||20;saveLocal();render();closeModal('hours');toast('Saved!');if(online)apiPatch('settings','default',{start_hour:settings.startHour,end_hour:settings.endHour});}

function openCampSettings(){document.getElementById('campName').value=settings.campName||'';document.getElementById('campStart').value=settings.campStart||'';document.getElementById('campEnd').value=settings.campEnd||'';document.getElementById('campModal').classList.add('open');}
async function saveCampSettings(e){e.preventDefault();settings.campName=document.getElementById('campName').value||null;settings.campStart=document.getElementById('campStart').value||null;settings.campEnd=document.getElementById('campEnd').value||null;saveLocal();updateCampPreview();closeModal('camp');toast('Gespeichert!');if(online)apiPatch('settings','default',{camp_name:settings.campName,camp_start:settings.campStart,camp_end:settings.campEnd});}
function clearCampDates(){document.getElementById('campName').value='';document.getElementById('campStart').value='';document.getElementById('campEnd').value='';settings.campName=null;settings.campStart=null;settings.campEnd=null;saveLocal();updateCampPreview();closeModal('camp');toast('Zeitraum gelöscht');if(online)apiPatch('settings','default',{camp_name:null,camp_start:null,camp_end:null});}
function copyCampLink(){navigator.clipboard.writeText('https://motus-booking.pages.dev/camp');toast('Link kopiert!');}

let currentShareLink='';
let currentShareTitle='';
function showQrCode(type){
const links={
camp:'https://motus-booking.pages.dev/camp',
register:'https://motus-booking.pages.dev/camp-register'
};
const titles={
camp:'Camp Stundenplan',
register:'Camp Anmeldung'
};
currentShareLink=links[type]||'';
currentShareTitle=titles[type]||'Teilen';
document.getElementById('shareTitle').textContent=currentShareTitle;
document.getElementById('shareLinkText').textContent=currentShareLink;
generateQRCode(currentShareLink);
document.getElementById('shareModal2').classList.add('open');
}
function closeShareModal(){document.getElementById('shareModal2').classList.remove('open');}
// Static QR Codes as base64
const QR_CODES={
register:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0AQMAAAAHA5RxAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABfElEQVRYhc2XMa7CQAxEB6XYMkfIUfZmSbhZjrJHSJli9f1n7OQjvkSLYyEBDwrjmR0vwIdajNXQoQeKrRYgi89612ofbbD2OOLjMZEX+ykNZpu42cpv9HTOPjeOS9+4Bcew1+GYnpbPQ8dhRy/2PKb1Xd+v8/B5Pfskf/P/9/lfVR06Pv4Hwk34Ipex473aoeEu+iV7HoeralIV9JvyapO+WVyRUNz1AztWn+SsLL4cLlvk1ZnnPs80rlSIvGpzadKxI48/eARpcvoqdLRLxySOcsUBn1dMvl+A23GuYkocOeZK02/SN4tTX+YDX9bQFy/dU/iMqzqHVlzfaw+m8MLbCnUcTYoyubQR1WcWR+jI0fEk8DzaDumYyGefFpuMJW3bee9N4VEMB/l8UViMdkfuLTflWC/0v135kMXjvud78PC9jHFDJo/7OS1m2svT6zzmcve/94nqPszlXUFu63kSduRxxP9NnDe8696SxU+fd5+W9otFft6Nf6hfps356WQNQ9MAAAAASUVORK5CYII=',
camp:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0AQMAAAAHA5RxAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABhUlEQVRYhc2WMbKDMAxExbhwyRF8FN8MzM18FB+B0gWDsiv7Z36KtBEeGr+kENplJZEvZ1ecJuHMV2wStegAXnxDTbHlcApuSxe5AFZHHvVGgSKsc1Et16qXO8965qD2j0dw65akQ/350BE3mOroqXzq+3M+fA5f5dAT+Yf/f8/nUa3QseC7+4yDx/CdLlNIWnFBc3e+yenHF7QQBDdFP5V5VamvF9+1UWLLK71Zp9bRNx++8Ul15NXMc/bNi/MrRKssr9oWG3W0sHDiKPLoks3b1FGnjl7c8gGtUuZVkWTzReRxHLdbEqsO3V4Cfpv6unD4f0GMsouR+srU1413PpzLyAfkJyvmHPTiG/3PPYH5gJ/4MZr//XihjuwW6kR4nWK54cVNSrG5PE1f597rwsexEUczYdis+kRuJbds+dDY3P+54cDHvoets4Yxl2WtU18fPvZz7i3v5Jr+d+Xyt7dAVPOhLxeumjryCh+n+HHTMdveonM/D458+vy9t4iO/Hwa/3JeCcokUbZs7d4AAAAASUVORK5CYII='
};

function generateQRCode(data){
const container=document.getElementById('shareQrCode');
// Use static QR codes for known camp URLs
if(data.includes('camp-register')){
container.innerHTML='<img src="'+QR_CODES.register+'" alt="QR" style="width:180px;height:180px">';
}else if(data==='https://motus-booking.pages.dev/camp'){
container.innerHTML='<img src="'+QR_CODES.camp+'" alt="QR" style="width:180px;height:180px">';
}else{
// For trainer links: show placeholder with instructions (QR APIs unreliable on iOS)
container.innerHTML='<div style="width:180px;height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#888;font-size:13px;text-align:center;gap:8px"><svg viewBox="0 0 24 24" style="width:48px;height:48px;stroke:#555;fill:none;stroke-width:1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg><span>Link kopieren<br>oder WhatsApp nutzen</span></div>';
}
}
function copyShareLink(){
navigator.clipboard.writeText(currentShareLink);
toast('Link kopiert!');
}
function shareViaWhatsApp(){
const text=currentShareTitle+': '+currentShareLink;
window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
function openShareLink(){
window.open(currentShareLink,'_blank');
}

function openClientShare(){
const name=document.getElementById('cName').value;
if(!name){toast('Kein Client');return;}
closeModal('client');
shareClientName=name;
shareLang='de';
shareTrainer='all';
document.querySelectorAll('#shareModal .share-lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang==='de'));
const clientLower=name.toLowerCase().trim();
let clientLessons=lessons.filter(l=>l.client.toLowerCase()===clientLower);
if(!clientLessons.length)clientLessons=lessons.filter(l=>l.client.toLowerCase().includes(clientLower));
const trainerIds=[...new Set(clientLessons.map(l=>l.teacher))];
let tb='<button class="trainer-btn active" data-trainer="all" onclick="setShareTrainer(\'all\')">Alle</button>';
trainerIds.forEach(tid=>{const tr=teachers.find(x=>x.id===tid);const name=tr?.name||tid;tb+='<button class="trainer-btn" data-trainer="'+tid+'" onclick="setShareTrainer(\''+tid+'\')">'+name+'</button>';});
document.getElementById('shareTrainerBtns').innerHTML=tb;
renderShareLessons();
document.getElementById('shareModal').classList.add('open');
}

function copyShareCampLink(){
if(!shareClientName){toast('Kein Client');return;}
const firstName=shareClientName.split('/')[0].split('&')[0].trim();
const url='https://motus-booking.pages.dev/camp.html?client='+encodeURIComponent(firstName);
navigator.clipboard.writeText(url);
toast('Kalender-Link kopiert!');
}
function updateCampPreview(){const el=document.getElementById('campPreview');if(!el)return;if(settings.campStart&&settings.campEnd){const s=new Date(settings.campStart),e=new Date(settings.campEnd);el.textContent=s.getDate()+'.'+(s.getMonth()+1)+' - '+e.getDate()+'.'+(e.getMonth()+1);}else{el.textContent='Nicht gesetzt';}}

// ========== CAMP REQUESTS FUNKTIONEN ==========
let campRequests=[];
let parsedCampRequests=[];

function loadCampRequests(){
    const stored=localStorage.getItem('motusCampRequests');
    if(stored)campRequests=JSON.parse(stored);
    updateCampRequestsCount();
}

function saveCampRequestsLocal(){
    localStorage.setItem('motusCampRequests',JSON.stringify(campRequests));
    updateCampRequestsCount();
}

function updateCampRequestsCount(){
    const el=document.getElementById('campRequestsCount');
    if(el)el.textContent=campRequests.length;
}

// Get camp participants active on a specific date (from camp registrations)
function getCampParticipantsForDate(dateStr){
    // Use campRegistrations from Supabase
    const checkDate=new Date(dateStr);
    return campRegistrations.filter(reg=>{
        // Full camp: check if date is within camp period
        if(reg.daysType==='full'||!reg.days||!reg.days.length){
            const campStart=reg.campStart?new Date(reg.campStart):null;
            const campEnd=reg.campEnd?new Date(reg.campEnd):null;
            if(campStart&&campEnd){
                return checkDate>=campStart&&checkDate<=campEnd;
            }
            // Fallback to settings camp dates
            const settingsStart=settings.campStart?new Date(settings.campStart):null;
            const settingsEnd=settings.campEnd?new Date(settings.campEnd):null;
            if(settingsStart&&settingsEnd){
                return checkDate>=settingsStart&&checkDate<=settingsEnd;
            }
            return false;
        }
        // Partial days: check if dateStr is in the days array
        return reg.days.includes(dateStr);
    });
}

// Show camp participants for a date
function showCampParticipants(dateStr){
    const participants=getCampParticipantsForDate(dateStr);
    if(!participants.length){toast('Keine Teilnehmer');return;}
    const d=new Date(dateStr);
    const dateLabel=d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
    let html='<div style="background:#1a1a1a;border-radius:12px;padding:16px;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.5)">';
    html+='<div style="font-weight:600;margin-bottom:12px;color:#c9a227">👫 '+participants.length+' Teilnehmer - '+dateLabel+'</div>';
    html+='<div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">';
    participants.forEach(p=>{
        const typeIcon=p.type==='couple'?'👫':'👤';
        html+='<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#252525;border-radius:8px">';
        html+='<span style="font-size:18px">'+typeIcon+'</span>';
        html+='<span>'+p.name+'</span>';
        html+='</div>';
    });
    html+='</div>';
    html+='<div style="text-align:center;margin-top:12px;font-size:11px;color:#71717a">Tippen zum Schließen</div>';
    html+='</div>';
    // Show as popup
    const popup=document.createElement('div');
    popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;animation:fadeIn .2s';
    popup.innerHTML=html;
    popup.onclick=()=>popup.remove();
    document.body.appendChild(popup);
}

function openCampRequests(){
    document.getElementById('campMessageInput').value='';
    document.getElementById('parsedResult').style.display='none';
    parsedCampRequests=[];
    renderCampRequestsList();
    document.getElementById('campRequestsModal').classList.add('open');
}

function parseCampMessage(){
    const input=document.getElementById('campMessageInput').value.trim();
    if(!input){toast('Bitte Nachricht eingeben');return;}

    const lines=input.split('\n').map(l=>l.trim()).filter(l=>l);
    let startDate=null,endDate=null;

    // Trainer names to look for (including variations)
    const trainerMap={
        'ksenia':['ksenia','xenia','ksenija'],
        'markus':['markus','marcus','mark'],
        'kseniia':['kseniia'],
        'vasi':['vasi','vasili','vasily','vasiliy','vasile','constantine','constantin','const']
    };
    const trainerNames=Object.values(trainerMap).flat();

    // Helper: Check if line contains trainer info
    function hasTrainerInfo(line){
        const lower=line.toLowerCase();
        return trainerNames.some(t=>lower.includes(t)&&/\d/.test(lower));
    }

    // Helper: Check if line is a date
    function isDateLine(line){
        const lower=line.toLowerCase();
        return /arrive|ankunft|(\d{1,2})\s*(st|nd|rd|th)?\s*[-to]+\s*(\d{1,2})/.test(lower);
    }

    // Helper: Extract trainer requests from line
    function extractTrainers(line){
        const lower=line.toLowerCase();
        const reqs=[];
        for(const[trainerId,variants]of Object.entries(trainerMap)){
            for(const variant of variants){
                // Match "Ksenia 8", "8 hours of Ksenia", "Ksenia: 8", etc.
                const regex1=new RegExp(variant+'[\\s,:.]*([\\d]+)','i');
                const regex2=new RegExp('([\\d]+)\\s*(hours?|einheiten?|h)?\\s*(of)?\\s*'+variant,'i');
                const match=lower.match(regex1)||lower.match(regex2);
                if(match){
                    const units=parseInt(match[1]);
                    if(!reqs.find(r=>r.trainer===trainerId)){
                        reqs.push({trainer:trainerId,units});
                    }
                }
            }
        }
        return reqs;
    }

    // First pass: Extract date
    for(const line of lines){
        const lower=line.toLowerCase();
        const dateMatch=lower.match(/(arrive|ankunft)?\s*(\d{1,2})[\.\s]*(st|nd|rd|th)?[\s\-to]+(\d{1,2})[\.\s]*(st|nd|rd|th)?[\s,]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)?/i);
        if(dateMatch){
            const monthNames={jan:0,january:0,januar:0,feb:1,february:1,februar:1,mar:2,march:2,märz:2,apr:3,april:3,may:4,mai:4,jun:5,june:5,juni:5,jul:6,july:6,juli:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,oktober:9,nov:10,november:10,dec:11,december:11,dezember:11};
            const monthStr=(dateMatch[6]||'jan').toLowerCase().slice(0,3);
            const month=monthNames[monthStr]??0;
            const year=new Date().getFullYear()+(month<new Date().getMonth()?1:0);
            startDate=new Date(year,month,parseInt(dateMatch[2]));
            endDate=new Date(year,month,parseInt(dateMatch[4]));
        }
    }

    if(!startDate){
        startDate=settings.campStart?new Date(settings.campStart):new Date();
        endDate=settings.campEnd?new Date(settings.campEnd):new Date(startDate.getTime()+14*24*60*60*1000);
    }

    // Second pass: Group by couples
    const couples=[];
    let currentCouple=null;

    for(const line of lines){
        const lower=line.toLowerCase();
        if(isDateLine(line))continue;

        const trainerReqs=extractTrainers(line);

        if(trainerReqs.length>0){
            // Line has trainer info
            if(currentCouple){
                trainerReqs.forEach(tr=>{
                    const existing=currentCouple.requests.find(r=>r.trainer===tr.trainer);
                    if(existing)existing.units=tr.units;
                    else currentCouple.requests.push(tr);
                });
            }
        }else if(line.length>2&&!isDateLine(line)){
            // Likely a client name - start new couple
            let clientName=line.replace(/couple|family|paar|familie/gi,'').trim();
            const suffix=lower.includes('couple')||lower.includes('paar')?'Couple':
                         lower.includes('family')||lower.includes('familie')?'Family':'';
            clientName=(clientName+' '+suffix).trim();

            currentCouple={
                id:'cr_'+Date.now()+'_'+couples.length,
                clientName,
                startDate:startDate.toISOString().split('T')[0],
                endDate:endDate.toISOString().split('T')[0],
                requests:[],
                createdAt:new Date().toISOString()
            };
            couples.push(currentCouple);
        }
    }

    // If no couples found, create one with all trainer info
    if(couples.length===0){
        let allReqs=[];
        lines.forEach(line=>allReqs.push(...extractTrainers(line)));
        couples.push({
            id:'cr_'+Date.now(),
            clientName:'Unbekannt',
            startDate:startDate.toISOString().split('T')[0],
            endDate:endDate.toISOString().split('T')[0],
            requests:allReqs,
            createdAt:new Date().toISOString()
        });
    }

    parsedCampRequests=couples;

    // Show parsed results
    let html='<div style="font-size:13px;color:#71717a;margin-bottom:12px">📅 '+formatDateShort(startDate)+' - '+formatDateShort(endDate)+'</div>';
    html+='<div style="font-weight:600;margin-bottom:8px">'+couples.length+' Paar'+(couples.length>1?'e':'')+' erkannt:</div>';

    couples.forEach((c,i)=>{
        html+='<div style="background:#2a2a2a;padding:10px;border-radius:8px;margin-bottom:8px">';
        html+='<div style="font-weight:600;margin-bottom:6px">👤 '+c.clientName+'</div>';
        if(c.requests.length){
            html+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
            c.requests.forEach(r=>{
                const tName=r.trainer.charAt(0).toUpperCase()+r.trainer.slice(1);
                html+='<span style="background:#1a1a1a;padding:3px 8px;border-radius:6px;font-size:12px">'+tName+': '+r.units+'</span>';
            });
            html+='</div>';
        }else{
            html+='<div style="color:#f59e0b;font-size:12px">⚠️ Keine Einheiten</div>';
        }
        html+='</div>';
    });

    document.getElementById('parsedContent').innerHTML=html;
    document.getElementById('parsedResult').style.display='block';
}

function saveCampRequest(){
    if(!parsedCampRequests||!parsedCampRequests.length){toast('Nichts zu speichern');return;}
    parsedCampRequests.forEach(req=>campRequests.push(req));
    saveCampRequestsLocal();
    const count=parsedCampRequests.length;
    parsedCampRequests=[];
    document.getElementById('campMessageInput').value='';
    document.getElementById('parsedResult').style.display='none';
    renderCampRequestsList();
    toast('✅ '+count+' Request'+(count>1?'s':'')+' gespeichert');
}

function renderCampRequestsList(){
    const el=document.getElementById('campRequestsList');
    document.getElementById('campRequestsTotal').textContent=campRequests.length;

    if(!campRequests.length){
        el.innerHTML='<div class="anfragen-empty">Noch keine Requests</div>';
        return;
    }

    let html='';
    campRequests.forEach((req,idx)=>{
        const fulfillment=calculateFulfillment(req);
        const statusClass=fulfillment.complete?'complete':fulfillment.partial?'partial':'pending';

        html+='<div class="anfragen-item" onclick="openCampTracker('+idx+')">';
        html+='<div class="anfragen-item-header">';
        html+='<span class="anfragen-item-name">'+req.clientName+'</span>';
        html+='<span class="anfragen-item-status '+statusClass+'">'+fulfillment.bookedTotal+'/'+fulfillment.requestedTotal+'</span>';
        html+='</div>';
        html+='<div class="anfragen-item-date">'+formatDateShort(req.startDate)+' - '+formatDateShort(req.endDate)+'</div>';
        html+='<div class="anfragen-item-tags">';
        req.requests.forEach(r=>{
            const booked=fulfillment.byTrainer[r.trainer]||0;
            const ok=booked>=r.units;
            const tName=r.trainer.charAt(0).toUpperCase()+r.trainer.slice(1);
            html+='<span class="anfragen-tag '+(ok?'complete':'pending')+'">'+tName+' '+booked+'/'+r.units+'</span>';
        });
        html+='</div>';
        html+='</div>';
    });

    html+='<button class="anfragen-clear-btn" onclick="clearAllCampRequests()"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg><span>Alle löschen</span></button>';
    el.innerHTML=html;
}

function calculateFulfillment(req){
    const start=new Date(req.startDate);start.setHours(0,0,0,0);
    const end=new Date(req.endDate);end.setHours(23,59,59,999);

    // Clean client name for matching (remove Couple/Family, trim)
    const clientClean=req.clientName.toLowerCase()
        .replace(/couple|family|paar|familie/gi,'')
        .replace(/[\/\&]/g,' ')
        .trim()
        .split(/\s+/)[0]; // First word/name

    // Find lessons for this client in the date range
    const clientLessons=lessons.filter(l=>{
        const lessonDate=new Date(l.date);lessonDate.setHours(12,0,0,0);
        const lessonClient=(l.client||'').toLowerCase().replace(/[\/\&]/g,' ').trim();
        const lessonFirstName=lessonClient.split(/\s+/)[0];

        // Match if: first names match OR one contains the other
        const nameMatch=lessonFirstName===clientClean||
                       lessonClient.includes(clientClean)||
                       clientClean.includes(lessonFirstName);

        return lessonDate>=start&&lessonDate<=end&&nameMatch;
    });

    // Count units by trainer (normalize trainer ID)
    const byTrainer={};
    clientLessons.forEach(l=>{
        let trainerId=(l.teacher||'').toLowerCase();
        // Normalize guest trainer IDs (guest_vasi_123 → vasi)
        if(trainerId.startsWith('guest_')){
            trainerId=trainerId.split('_')[1];
        }
        const units=Math.ceil((l.dur||45)/45);
        byTrainer[trainerId]=(byTrainer[trainerId]||0)+units;
    });

    // Calculate totals
    let requestedTotal=0,bookedTotal=0,complete=true,partial=false;
    req.requests.forEach(r=>{
        requestedTotal+=r.units;
        const booked=byTrainer[r.trainer]||0;
        bookedTotal+=Math.min(booked,r.units);
        if(booked<r.units)complete=false;
        if(booked>0)partial=true;
    });

    return{byTrainer,requestedTotal,bookedTotal,complete,partial,clientLessons};
}

function openCampTracker(idx){
    const req=campRequests[idx];
    if(!req)return;

    const fulfillment=calculateFulfillment(req);
    document.getElementById('campTrackerPeriod').textContent=req.clientName+' • '+formatDateShort(req.startDate)+' - '+formatDateShort(req.endDate);

    let html='<div style="display:grid;gap:12px">';
    req.requests.forEach(r=>{
        const booked=fulfillment.byTrainer[r.trainer]||0;
        const pct=Math.min(100,Math.round(booked/r.units*100));
        const ok=booked>=r.units;
        const tName=r.trainer.charAt(0).toUpperCase()+r.trainer.slice(1);

        html+='<div style="background:#1a1a1a;border-radius:12px;padding:12px">';
        html+='<div style="display:flex;justify-content:space-between;margin-bottom:8px">';
        html+='<span style="font-weight:600">'+tName+'</span>';
        html+='<span style="color:'+(ok?'#22c55e':'#f59e0b')+'">'+booked+' / '+r.units+' Einheiten</span>';
        html+='</div>';
        html+='<div style="background:#333;border-radius:4px;height:8px;overflow:hidden">';
        html+='<div style="background:'+(ok?'#22c55e':'#f59e0b')+';height:100%;width:'+pct+'%;transition:width .3s"></div>';
        html+='</div>';
        if(!ok){
            html+='<div style="font-size:12px;color:#f59e0b;margin-top:6px">⚠️ Noch '+(r.units-booked)+' Einheiten offen</div>';
        }
        html+='</div>';
    });
    html+='</div>';

    html+='<button class="btn btn-danger" style="width:100%;margin-top:16px" onclick="deleteCampRequest('+idx+')">🗑️ Request löschen</button>';

    document.getElementById('campTrackerContent').innerHTML=html;
    closeModal('campRequests');
    document.getElementById('campTrackerModal').classList.add('open');
}

function deleteCampRequest(idx){
    campRequests.splice(idx,1);
    saveCampRequestsLocal();
    closeModal('campTracker');
    toast('Request gelöscht');
}

function clearAllCampRequests(){
    if(!confirm('Alle Requests löschen?'))return;
    campRequests=[];
    saveCampRequestsLocal();
    renderCampRequestsList();
    toast('Alle Requests gelöscht');
}

// ========== GASTTRAINER FUNKTIONEN ==========
function getGuestTrainers(){return teachers.filter(t=>t.is_guest===true);}
function getActiveTrainers(){
    const checkDate=selDate||new Date();
    checkDate.setHours(12,0,0,0);
    return teachers.filter(t=>{
        if(t.is_active===false)return false;
        // For guest trainers, check if within active date range
        if(t.is_guest){
            if(t.start_date){
                const start=new Date(t.start_date);
                start.setHours(0,0,0,0);
                if(checkDate<start)return false;
            }
            if(t.end_date){
                const end=new Date(t.end_date);
                end.setHours(23,59,59,999);
                if(checkDate>end)return false;
            }
        }
        return true;
    });
}
function formatDateShort(dateStr){if(!dateStr)return'';const d=new Date(dateStr);return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});}

function renderGuestTrainerList(){
const list=document.getElementById('guestTrainerList');
if(!list)return;
const guests=getGuestTrainers();
if(!guests.length){
list.innerHTML='<div style="padding:16px;text-align:center;color:#71717a;font-size:13px;">Noch keine Gasttrainer</div>';
return;
}
list.innerHTML=guests.map(g=>{
const dateRange=g.start_date&&g.end_date?`📅 ${formatDateShort(g.start_date)} - ${formatDateShort(g.end_date)}`:(g.start_date?`📅 ab ${formatDateShort(g.start_date)}`:'');
const flightNum=g.departure_flight||g.arrival_flight;
const flightData=g.departure_flight_info||g.arrival_flight_info;
const flightStatus=flightData?getFlightStatusText(flightData.status):'';
const flightType=g.departure_flight?'departure':'arrival';
const flightBadge=flightNum?`<div class="guest-flight-badge" onclick="event.stopPropagation();refreshGuestFlight('${g.id}')" title="Klicken zum Aktualisieren">✈️ ${flightNum}${flightStatus?' · '+flightStatus:''} <span style="opacity:0.5">🔄</span></div>`:'';
return `
<div class="guest-trainer-item">
<div class="guest-trainer-left" onclick="openGuestTrainer('${g.id}')">
<div class="guest-trainer-avatar" style="background:${g.color}">${g.name.charAt(0)}</div>
<div class="guest-trainer-info">
<div class="guest-trainer-name">${g.name}<span class="guest-trainer-badge">Gast</span></div>
<div class="guest-trainer-prices">Verkauf: €${g.sale_price_45||0} / Auszahlung: €${g.payout_price_45||0}</div>
${dateRange?`<div class="guest-trainer-dates" style="font-size:11px;color:#a1a1aa;margin-top:2px;">${dateRange}</div>`:''}
${flightBadge}
</div>
</div>
<div class="guest-link-btn" onclick="shareGuestTrainerLink('${g.id}','${g.name.replace(/'/g,"\\'")}')" title="Teilen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg></div>
<div class="guest-toggle${g.is_active?` active`:``}" onclick="toggleGuestTrainer('${g.id}')"></div>
</div>`;}).join('');
}

function selectGuestColor(color){
document.getElementById('gtColor').value=color;
document.querySelectorAll('#gtColorPicker .color-btn').forEach(b=>b.classList.toggle('selected',b.dataset.color===color));
}

function copyGuestTrainerLink(id){
const baseUrl=window.location.origin+'/trainer.html';
const link=`${baseUrl}?id=${id}`;
navigator.clipboard.writeText(link).then(()=>{
toast('Trainer-Link kopiert!');
}).catch(()=>{
prompt('Link kopieren:',link);
});
}

function shareGuestTrainerLink(id,name){
const baseUrl='https://motus-booking.pages.dev/trainer.html';
currentShareLink=`${baseUrl}?id=${id}`;
currentShareTitle=name+' Stundenplan';
document.getElementById('shareTitle').textContent=currentShareTitle;
document.getElementById('shareLinkText').textContent=currentShareLink;
generateQRCode(currentShareLink);
document.getElementById('shareModal2').classList.add('open');
}

function openCampPage(){
window.open(window.location.origin+'/camp.html','_blank');
}

// Camp Pricing
function openCampPricing(){
    document.getElementById('campFullPrice').value=settings.campFullPrice||'';
    document.getElementById('campDayPrice').value=settings.campDayPrice||'';
    document.getElementById('campFullMemberPrice').value=settings.campFullMemberPrice||'';
    document.getElementById('campDayMemberPrice').value=settings.campDayMemberPrice||'';
    document.getElementById('campPricingModal').classList.add('open');
}

async function saveCampPricing(e){
    e.preventDefault();
    settings.campFullPrice=parseInt(document.getElementById('campFullPrice').value)||0;
    settings.campDayPrice=parseInt(document.getElementById('campDayPrice').value)||0;
    settings.campFullMemberPrice=parseInt(document.getElementById('campFullMemberPrice').value)||0;
    settings.campDayMemberPrice=parseInt(document.getElementById('campDayMemberPrice').value)||0;
    saveLocal();
    updateCampPricingPreview();
    closeModal('campPricing');
    toast('Preise gespeichert!');
    if(online)apiPatch('settings','default',{camp_full_price:settings.campFullPrice,camp_day_price:settings.campDayPrice,camp_full_member_price:settings.campFullMemberPrice,camp_day_member_price:settings.campDayMemberPrice});
}

function updateCampPricingPreview(){
    const el=document.getElementById('campPricingPreview');
    if(!el)return;
    if(settings.campFullPrice||settings.campDayPrice){
        el.textContent='€'+(settings.campFullPrice||0)+' | €'+(settings.campDayPrice||0)+'/Tag';
    }else{
        el.textContent='Nicht gesetzt';
    }
}

// Camp Registrations
let campRegistrations=[];

async function loadCampRegistrations(){
    try{
        const res=await fetch(API_URL+'/camp_registrations?select=*&order=created_at.desc',{headers:API_HEADERS});
        if(res.ok){
            const data=await res.json();
            campRegistrations=data.map(r=>({
                id:r.id,
                name:r.name,
                email:r.email,
                phone:r.phone,
                type:r.type,
                daysType:r.days_type,
                days:r.days,
                trainers:r.trainers,
                totalPrice:r.total_price,
                status:r.status||'new',
                matchedTo:r.matched_to,
                createdAt:r.created_at
            }));
        }else{
            const err=await res.text();
            console.error('Load camp regs failed:',res.status,err);
        }
    }catch(e){
        console.error('Load registrations error:',e);
    }
    updateCampRegCount();
}

function updateCampRegCount(){
    const totalCount=campRegistrations.length;
    const newCount=campRegistrations.filter(r=>r.status==='new').length;
    const el=document.getElementById('campRegCount');
    if(el)el.textContent=totalCount;
    // Badge only shows NEW (unprocessed) registrations
    const badge=document.getElementById('navBadge');
    if(badge){badge.textContent=newCount;badge.style.display=newCount>0?'flex':'none';}
}

function copyRegisterLink(){
    navigator.clipboard.writeText('https://motus-booking.pages.dev/camp-register');
    toast('Anmeldelink kopiert!');
}

let currentRegTab='all';

async function openCampRegistrations(){
    await loadCampRegistrations();
    currentRegTab='all';
    updateCampStats();
    showRegTab('all');
    document.getElementById('campRegsModal').classList.add('open');
}

function updateCampStats(){
    let totalRegs=campRegistrations.length;
    let totalPeople=0;
    let totalUnits=0;
    let totalRevenue=0;
    let trainerUnits={};

    campRegistrations.forEach(reg=>{
        // Count people
        totalPeople+=reg.type==='couple'?2:1;

        // Count revenue
        totalRevenue+=reg.totalPrice||0;

        // Count units per trainer
        if(reg.trainers){
            reg.trainers.forEach(t=>{
                totalUnits+=t.units;
                if(!trainerUnits[t.trainerName])trainerUnits[t.trainerName]={requested:0,booked:0};
                trainerUnits[t.trainerName].requested+=t.units;
            });
        }
    });

    // Count booked lessons during camp period
    if(settings.campStart&&settings.campEnd){
        const campStartDate=new Date(settings.campStart);
        const campEndDate=new Date(settings.campEnd);
        lessons.forEach(l=>{
            const lessonDate=new Date(l.lesson_date);
            if(lessonDate>=campStartDate&&lessonDate<=campEndDate){
                const trainer=teachers.find(t=>t.id===l.teacher_id);
                if(trainer&&trainerUnits[trainer.name]){
                    trainerUnits[trainer.name].booked+=l.duration===90?2:1;
                }
            }
        });
    }

    // Update stats
    document.getElementById('statTotal').textContent=totalRegs;
    document.getElementById('statPeople').textContent=totalPeople;
    document.getElementById('statUnits').textContent=totalUnits;

    // Trainer summary
    let trainerHtml='<div style="font-size:13px;font-weight:600;margin-bottom:8px">📊 Trainer Übersicht</div>';
    trainerHtml+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    Object.entries(trainerUnits).forEach(([name,data])=>{
        const pct=data.requested>0?Math.round((data.booked/data.requested)*100):0;
        const color=pct>=100?'#22c55e':pct>50?'#f59e0b':'#ef4444';
        trainerHtml+=`<div style="background:#242424;padding:8px 12px;border-radius:8px;flex:1;min-width:120px">
            <div style="font-size:14px;font-weight:600">${name}</div>
            <div style="font-size:12px;color:${color}">${data.booked}/${data.requested} Einh. (${pct}%)</div>
        </div>`;
    });
    trainerHtml+='</div>';
    if(Object.keys(trainerUnits).length===0){
        trainerHtml='<div style="font-size:13px;color:#71717a;text-align:center">Keine Privatstunden gebucht</div>';
    }
    document.getElementById('trainerSummary').innerHTML=trainerHtml;
}

function showRegTab(tab){
    currentRegTab=tab;

    // Calculate completion for each registration
    let pendingCount=0;
    let doneCount=0;
    campRegistrations.forEach(reg=>{
        const completion=getRegCompletion(reg);
        if(completion>=100){
            doneCount++;
        }else{
            pendingCount++;
        }
    });

    const tabAll=document.getElementById('tabAll');
    const tabPending=document.getElementById('tabPending');
    const tabDone=document.getElementById('tabDone');

    tabAll.className='camp-tab'+(tab==='all'?' active':'');
    tabAll.textContent='Alle ('+campRegistrations.length+')';

    tabPending.className='camp-tab'+(tab==='pending'?' active':'');
    tabPending.textContent='Offen ('+pendingCount+')';

    tabDone.className='camp-tab'+(tab==='done'?' active':'');
    tabDone.textContent='Erledigt ('+doneCount+')';

    renderCampRegistrations();
}

function getRegCompletion(reg){
    if(!reg.trainers||!reg.trainers.length)return 100; // No lessons requested = complete

    const clientName=reg.matchedTo||reg.name;
    let totalRequested=0;
    let totalBooked=0;
    let bookedByTrainer={};

    reg.trainers.forEach(t=>{
        totalRequested+=t.units;
        bookedByTrainer[t.trainerName]=0;
    });

    // Count booked lessons during camp period
    if(settings.campStart&&settings.campEnd){
        const campStartDate=new Date(settings.campStart);
        const campEndDate=new Date(settings.campEnd);
        lessons.forEach(l=>{
            if(l.client_name&&l.client_name.toLowerCase().includes(clientName.toLowerCase().split(' ')[0])){
                const lessonDate=new Date(l.lesson_date);
                if(lessonDate>=campStartDate&&lessonDate<=campEndDate){
                    const trainer=teachers.find(t=>t.id===l.teacher_id);
                    if(trainer&&bookedByTrainer.hasOwnProperty(trainer.name)){
                        totalBooked+=l.duration===90?2:1;
                    }
                }
            }
        });
    }

    return totalRequested>0?Math.round((totalBooked/totalRequested)*100):100;
}

function renderCampRegistrations(){
    const container=document.getElementById('campRegsContent');
    if(!campRegistrations.length){
        container.innerHTML='<div class="camp-empty">Keine Anmeldungen vorhanden</div>';
        return;
    }

    // Filter by tab (based on booking completion, not assignment status)
    let filtered=campRegistrations;
    if(currentRegTab==='pending'){
        filtered=campRegistrations.filter(r=>getRegCompletion(r)<100);
    }else if(currentRegTab==='done'){
        filtered=campRegistrations.filter(r=>getRegCompletion(r)>=100);
    }

    if(!filtered.length){
        container.innerHTML='<div class="camp-empty">Keine Anmeldungen in dieser Kategorie</div>';
        return;
    }

    let html='';
    filtered.forEach((reg,idx)=>{
        const realIdx=campRegistrations.indexOf(reg);
        const statusColor=reg.status==='new'?'#ec4899':reg.status==='matched'?'#22c55e':'#71717a';
        const statusLabel=reg.status==='new'?'Neu':reg.status==='matched'?'Zugeordnet':'Bearbeitet';

        // Find matching clients
        const matches=findClientMatches(reg.name);
        const matchHtml=matches.length?
            `<div style="margin-top:8px;padding:8px;background:#242424;border-radius:8px">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px">Mögliche Matches:</div>
                ${matches.map(m=>{const safeName=m.name.replace(/'/g,"\\'").replace(/"/g,'&quot;');return `<button type="button" style="display:inline-block;background:#333;border:none;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;margin-right:4px;margin-bottom:4px;cursor:pointer;font-family:inherit" onclick="matchRegToClient(${realIdx},'${safeName}')">${m.name} (${m.score}%)</button>`;}).join('')}
            </div>`:
            `<div style="margin-top:8px;font-size:11px;color:#71717a">Kein Match gefunden - neuer Client</div>`;

        // Calculate booked units per trainer for this client
        const clientName=reg.matchedTo||reg.name;
        let bookedByTrainer={};
        let totalRequested=0;
        let totalBooked=0;

        if(reg.trainers){
            reg.trainers.forEach(t=>{
                totalRequested+=t.units;
                bookedByTrainer[t.trainerName]=0;
            });
        }

        // Find lessons for this client during camp period
        if(settings.campStart&&settings.campEnd&&reg.status==='matched'){
            const campStartDate=new Date(settings.campStart);
            const campEndDate=new Date(settings.campEnd);
            lessons.forEach(l=>{
                if(l.client_name&&l.client_name.toLowerCase().includes(clientName.toLowerCase().split(' ')[0])){
                    const lessonDate=new Date(l.lesson_date);
                    if(lessonDate>=campStartDate&&lessonDate<=campEndDate){
                        const trainer=teachers.find(t=>t.id===l.teacher_id);
                        if(trainer&&bookedByTrainer.hasOwnProperty(trainer.name)){
                            const units=l.duration===90?2:1;
                            bookedByTrainer[trainer.name]+=units;
                            totalBooked+=units;
                        }
                    }
                }
            });
        }

        // Completion percentage
        const completionPct=totalRequested>0?Math.round((totalBooked/totalRequested)*100):100;
        const completionColor=completionPct>=100?'#22c55e':completionPct>0?'#f59e0b':'#ef4444';

        const safeClientName=clientName.replace(/'/g,"\\'").replace(/"/g,'&quot;');
        const trainersHtml=reg.trainers&&reg.trainers.length?
            reg.trainers.map(t=>{
                const booked=bookedByTrainer[t.trainerName]||0;
                const done=booked>=t.units;
                const color=done?'#22c55e':booked>0?'#f59e0b':'#ef4444';
                return `<button type="button" onclick="jumpToTrainer('${t.trainerId}','${safeClientName}')" style="background:${color}15;border:1px solid ${color}50;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;color:inherit;font-family:inherit">${t.trainerName}: <b>${booked}/${t.units}</b></button>`;
            }).join(''):'<span style="font-size:12px;color:#52525b">Keine Privatstunden</span>';

        const typeLabel=reg.type==='single'?'👤 Single':'👫 Paar';
        // Check if matched client is a member
        const matchedClient=clients.find(c=>c.name===reg.matchedTo||c.name===reg.name);
        const isMember=matchedClient?.is_member;
        const memberBadge=isMember?'<span style="background:#c9a22730;color:#c9a227;padding:3px 8px;border-radius:5px;font-weight:600">★ Member</span>':'';
        const daysInfo=reg.daysType==='full'?'Ganzes Camp':(reg.days?.length||0)+' Tage';
        const daysDetail=reg.daysType!=='full'&&reg.days?reg.days.map(d=>{const dt=new Date(d);return dt.getDate()+'.'+(dt.getMonth()+1);}).join(', '):'';
        const dateStr=reg.createdAt?new Date(reg.createdAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';

        const borderColor=reg.status==='matched'?completionColor:statusColor;
        const progressBar=reg.status==='matched'&&totalRequested>0?`
            <div style="margin:10px 0">
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
                    <span style="color:#71717a">Buchungsfortschritt</span>
                    <span style="color:${completionColor};font-weight:600">${totalBooked}/${totalRequested} (${completionPct}%)</span>
                </div>
                <div style="background:#242424;height:6px;border-radius:3px;overflow:hidden">
                    <div style="background:${completionColor};height:100%;width:${Math.min(completionPct,100)}%;transition:width 0.3s"></div>
                </div>
            </div>`:'';

        html+=`<div style="background:#1a1a1a;border-radius:12px;padding:12px;margin-bottom:10px;border-left:3px solid ${borderColor}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <div>
                    <div style="font-size:15px;font-weight:600;margin-bottom:2px">${reg.name}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px">
                        <span style="background:#242424;padding:3px 8px;border-radius:5px">${typeLabel}</span>
                        <span style="background:#242424;padding:3px 8px;border-radius:5px">📅 ${daysInfo}</span>
                        <span style="background:rgba(201,162,39,0.15);color:#c9a227;padding:3px 8px;border-radius:5px;font-weight:600">${reg.totalPrice}€</span>
                        ${memberBadge}
                    </div>
                </div>
                <span style="font-size:10px;background:${borderColor}20;color:${borderColor};padding:3px 8px;border-radius:5px;white-space:nowrap">${reg.status==='matched'?(completionPct>=100?'✓ Fertig':completionPct+'%'):statusLabel}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${trainersHtml}</div>
            ${reg.status==='matched'&&totalRequested>0?`<div style="background:#242424;height:4px;border-radius:2px;overflow:hidden;margin-bottom:10px"><div style="background:${completionColor};height:100%;width:${Math.min(completionPct,100)}%"></div></div>`:''}
            ${reg.status==='new'&&matches.length?`<div style="margin-bottom:10px;padding:8px;background:#242424;border-radius:8px">
                <div style="font-size:11px;color:#71717a;margin-bottom:6px">✓ Vorhandene Clients:</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">${matches.map(m=>{const safeName=m.name.replace(/'/g,"\\'").replace(/"/g,'&quot;');return `<button type="button" class="btn" style="padding:6px 12px;font-size:12px;background:#22c55e30;border:1px solid #22c55e50;color:#22c55e" onclick="matchRegToClient(${realIdx},'${safeName}')">${m.name}</button>`;}).join('')}</div>
            </div>`:''}
            <div style="display:flex;gap:8px">
                ${reg.status==='new'?`<button class="btn btn-primary" style="flex:1;padding:10px;font-size:13px" onclick="createClientFromReg(${realIdx})">+ Neuer Client</button>`:`<button class="btn" style="flex:1;padding:10px;font-size:13px;background:#242424" onclick="showRegLessons(${realIdx})">📋 Stunden planen</button>`}
                <button class="btn" style="width:44px;padding:10px;font-size:13px;background:#242424" onclick="deleteRegistration(${realIdx})">🗑</button>
            </div>
        </div>`;
    });
    container.innerHTML=html;
}

function findClientMatches(regName){
    if(!regName)return[];
    // Clean registration name - split by / or &
    const nameParts=regName.toLowerCase().replace(/couple|family|paar|familie/gi,'').split(/[\/\&]/).map(n=>n.trim()).filter(n=>n);
    if(!nameParts.length)return[];

    const matches=[];
    clients.forEach(c=>{
        const clientParts=c.name.toLowerCase().split(/[\/\&]/).map(n=>n.trim());
        let score=0;

        // Check each part of the registration name against client parts
        nameParts.forEach(rp=>{
            const rpFirst=rp.split(/\s+/)[0]; // First name only
            clientParts.forEach(cp=>{
                const cpFirst=cp.split(/\s+/)[0];
                // Exact match
                if(cpFirst===rpFirst)score+=50;
                // Contains match
                else if(cp.includes(rpFirst)||rpFirst.includes(cpFirst))score+=30;
                // Similar (Levenshtein would be better but simple check)
                else if(cpFirst.length>2&&rpFirst.length>2&&(cpFirst.substring(0,3)===rpFirst.substring(0,3)))score+=15;
            });
        });

        if(score>20)matches.push({name:c.name,score:Math.min(score,100)});
    });

    return matches.sort((a,b)=>b.score-a.score).slice(0,3);
}

// Manual Camp Registration
let selectedCampDays=[];

function showCampClientSuggestions(){
    const input=document.getElementById('manualRegName');
    const container=document.getElementById('clientSuggestions');
    const val=input.value.toLowerCase().trim();

    if(val.length<2){
        container.style.display='none';
        return;
    }

    const matches=clients.filter(c=>c.name.toLowerCase().includes(val)).slice(0,5);
    if(!matches.length){
        container.style.display='none';
        return;
    }

    container.innerHTML=matches.map(c=>`<div onclick="selectClientSuggestion('${c.name.replace(/'/g,"\\'")}')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid #333;font-size:14px;display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background='#333'" onmouseout="this.style.background='transparent'">${c.name}${c.is_member?'<span style="color:#22c55e;font-size:12px">★ Member</span>':''}</div>`).join('');
    container.style.display='block';
}

function selectClientSuggestion(name){
    document.getElementById('manualRegName').value=name;
    document.getElementById('clientSuggestions').style.display='none';
    calcManualRegPrice();
}

function calcManualRegPrice(){
    const name=document.getElementById('manualRegName').value.trim().toLowerCase();
    const type=document.getElementById('manualRegType').value;
    const daysType=document.getElementById('manualRegDays').value;

    // Check if client is member - flexible matching
    let client=clients.find(c=>c.name.toLowerCase()===name);
    if(!client){
        // Try partial match on first name
        const firstName=name.split(/[\s\/\&]/)[0];
        if(firstName.length>=2){
            client=clients.find(c=>c.name.toLowerCase().includes(firstName));
        }
    }
    const isMember=client?.is_member||false;

    // Show member indicator
    const indicator=document.getElementById('memberIndicator');
    if(indicator){
        indicator.style.display=isMember?'inline':'none';
    }

    // Get camp prices based on member status
    const fullPrice=isMember?(settings.campFullMemberPrice||settings.campFullPrice||0):(settings.campFullPrice||0);
    const dayPrice=isMember?(settings.campDayMemberPrice||settings.campDayPrice||0):(settings.campDayPrice||0);

    // Calculate base price
    let basePrice=0;
    if(daysType==='full'){
        basePrice=fullPrice;
    }else{
        basePrice=dayPrice*selectedCampDays.length;
    }

    // Multiply by persons (couple = 2)
    const persons=type==='couple'?2:1;
    let total=basePrice*persons;

    document.getElementById('manualRegPrice').value=total||'';
}

function showManualRegForm(){
    document.getElementById('manualRegName').value='';
    document.getElementById('manualRegType').value='single';
    document.getElementById('manualRegPrice').value='';
    document.getElementById('manualRegDays').value='full';
    document.getElementById('manualRegTrainers').innerHTML='';
    document.getElementById('dayPickerContainer').style.display='none';
    document.getElementById('clientSuggestions').style.display='none';
    document.getElementById('memberIndicator').style.display='none';
    selectedCampDays=[];
    document.getElementById('manualRegModal').classList.add('open');
}

function toggleDayPicker(){
    const select=document.getElementById('manualRegDays');
    const container=document.getElementById('dayPickerContainer');
    if(select.value==='partial'){
        container.style.display='block';
        renderDayPicker();
    }else{
        container.style.display='none';
        selectedCampDays=[];
    }
    calcManualRegPrice();
}

function renderDayPicker(){
    const container=document.getElementById('dayPickerDays');
    if(!settings.campStart||!settings.campEnd){
        container.innerHTML='<div style="color:#ef4444;font-size:12px">Camp Zeitraum nicht gesetzt</div>';
        return;
    }
    const start=new Date(settings.campStart);
    const end=new Date(settings.campEnd);
    const days=['So','Mo','Di','Mi','Do','Fr','Sa'];
    let html='';
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
        const iso=d.toISOString().split('T')[0];
        const isSelected=selectedCampDays.includes(iso);
        const dayLabel=days[d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1);
        html+=`<button type="button" onclick="toggleCampDay('${iso}')" style="padding:8px 12px;border-radius:8px;border:none;font-size:12px;cursor:pointer;font-family:inherit;${isSelected?'background:#c9a227;color:#121212':'background:#333;color:#fff'}">${dayLabel}</button>`;
    }
    container.innerHTML=html;
}

function toggleCampDay(iso){
    const idx=selectedCampDays.indexOf(iso);
    if(idx>=0){
        selectedCampDays.splice(idx,1);
    }else{
        selectedCampDays.push(iso);
    }
    renderDayPicker();
    calcManualRegPrice();
}

function addManualRegTrainer(){
    const container=document.getElementById('manualRegTrainers');
    const idx=container.children.length;
    const trainerOptions=teachers.filter(t=>!t.is_guest).map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
    const html=`<div style="display:grid;grid-template-columns:1fr 80px 32px;gap:8px;align-items:center" data-trainer-row="${idx}">
        <select style="padding:10px;border-radius:8px;border:1px solid #333;background:#242424;color:#fff;font-size:13px">${trainerOptions}</select>
        <input type="number" placeholder="Units" min="1" value="2" style="padding:10px;border-radius:8px;border:1px solid #333;background:#242424;color:#fff;font-size:13px;text-align:center">
        <button type="button" onclick="this.parentElement.remove()" style="width:32px;height:32px;border-radius:8px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:16px">×</button>
    </div>`;
    container.insertAdjacentHTML('beforeend',html);
}

async function saveManualReg(){
    const name=document.getElementById('manualRegName').value.trim();
    const type=document.getElementById('manualRegType').value;
    const price=parseInt(document.getElementById('manualRegPrice').value)||0;
    const daysType=document.getElementById('manualRegDays').value;

    if(!name){toast('Name erforderlich');return;}
    if(!price){toast('Preis erforderlich');return;}
    if(daysType==='partial'&&selectedCampDays.length===0){toast('Bitte Tage auswählen');return;}

    // Collect trainers
    const trainerRows=document.querySelectorAll('[data-trainer-row]');
    const trainersData=[];
    trainerRows.forEach(row=>{
        const select=row.querySelector('select');
        const input=row.querySelector('input');
        const trainerId=select.value;
        const units=parseInt(input.value)||0;
        const trainer=teachers.find(t=>t.id===trainerId);
        if(trainer&&units>0){
            trainersData.push({trainerId:trainerId,trainerName:trainer.name,units:units});
        }
    });

    // Check if name matches existing client (auto-match)
    const nameLower=name.toLowerCase();
    const matchedClient=clients.find(c=>{
        const cName=c.name.toLowerCase();
        return cName===nameLower || cName.includes(nameLower) || nameLower.includes(cName);
    });
    const isMatched=!!matchedClient;
    const matchedTo=matchedClient?matchedClient.name:null;

    // Create registration object
    const newReg={
        id:'manual_'+Date.now(),
        name:name,
        type:type,
        totalPrice:price,
        daysType:daysType,
        days:daysType==='full'?[]:selectedCampDays.sort(),
        trainers:trainersData,
        status:isMatched?'matched':'new',
        matchedTo:matchedTo,
        createdAt:new Date().toISOString(),
        campStart:settings.campStart,
        campEnd:settings.campEnd,
        source:'manual'
    };

    // Save to Supabase
    let saveSuccess=false;
    try{
        const res=await fetch(API_URL+'/camp_registrations',{
            method:'POST',
            headers:{...API_HEADERS,'Content-Type':'application/json','Prefer':'return=representation'},
            body:JSON.stringify({
                name:newReg.name,
                type:newReg.type,
                total_price:newReg.totalPrice,
                days_type:newReg.daysType,
                days:newReg.days,
                trainers:newReg.trainers,
                status:newReg.status,
                matched_to:matchedTo,
                camp_start:newReg.campStart,
                camp_end:newReg.campEnd
            })
        });
        if(res.ok){
            const data=await res.json();
            newReg.id=data[0]?.id||newReg.id;
            saveSuccess=true;
        }else{
            const err=await res.text();
            console.error('Save reg failed:',res.status,err);
            toast('Fehler beim Speichern: '+res.status);
        }
    }catch(e){
        console.error('Save manual reg error:',e);
        toast('Fehler: '+e.message);
    }

    // Add to local array
    campRegistrations.unshift(newReg);

    closeModal('manualReg');
    updateCampStats();
    showRegTab(currentRegTab||'all');
    toast(isMatched?'Anmeldung gespeichert ✓ Verknüpft mit '+matchedTo:'Anmeldung gespeichert');
}

async function matchRegToClient(regIdx,clientName){
    const reg=campRegistrations[regIdx];
    if(!reg)return;
    if(reg.status==='matched'){toast('Bereits zugeordnet');return;}

    // Create camp request from registration
    const request={
        clientName:clientName,
        trainers:reg.trainers||[],
        startDate:reg.campStart,
        endDate:reg.campEnd,
        source:'registration'
    };

    campRequests.push(request);
    saveCampRequestsLocal();

    // Mark as matched
    reg.status='matched';
    reg.matchedTo=clientName;

    // Save to Supabase
    try{
        await fetch(API_URL+'/camp_registrations?id=eq.'+encodeURIComponent(reg.id),{
            method:'PATCH',
            headers:API_HEADERS,
            body:JSON.stringify({status:'matched',matched_to:clientName})
        });
    }catch(e){console.error('Update error:',e);}

    toast('Zugeordnet zu '+clientName);
    renderCampRegistrations();
    updateCampRegCount();
}

async function createClientFromReg(regIdx){
    const reg=campRegistrations[regIdx];
    if(!reg)return;
    if(reg.status==='matched'){toast('Bereits zugeordnet');return;}

    // Create new client
    const newClient={
        id:'c'+Date.now(),
        name:reg.name,
        phone1:reg.phone||'',
        phone2:'',
        notes:'📧 '+reg.email+'\n📅 Camp '+new Date(reg.createdAt).toLocaleDateString('de-DE')+(reg.trainers?.length?' | '+reg.trainers.map(t=>t.trainerName+': '+t.units+'E').join(', '):''),
        is_member:false,
        photo:null,
        created_at:new Date().toISOString()
    };

    clients.push(newClient);
    saveLocal();
    if(online)apiPost('clients',newClient);

    // Create camp request
    const request={
        clientName:reg.name,
        trainers:reg.trainers||[],
        startDate:reg.campStart,
        endDate:reg.campEnd,
        source:'registration'
    };
    campRequests.push(request);
    saveCampRequestsLocal();

    // Mark registration as processed
    reg.status='matched';
    reg.matchedTo=reg.name;

    // Save to Supabase
    try{
        await fetch(API_URL+'/camp_registrations?id=eq.'+encodeURIComponent(reg.id),{
            method:'PATCH',
            headers:API_HEADERS,
            body:JSON.stringify({status:'matched',matched_to:reg.name})
        });
    }catch(e){console.error('Update error:',e);}

    toast('Client angelegt: '+reg.name);
    renderCampRegistrations();
    updateCampRegCount();
}

async function deleteRegistration(idx){
    if(!confirm('Anmeldung löschen?'))return;
    const reg=campRegistrations[idx];
    campRegistrations.splice(idx,1);

    // Delete from Supabase
    if(reg&&reg.id){
        try{
            await fetch(API_URL+'/camp_registrations?id=eq.'+encodeURIComponent(reg.id),{
                method:'DELETE',
                headers:API_HEADERS
            });
        }catch(e){console.error('Delete error:',e);}
    }

    renderCampRegistrations();
    updateCampRegCount();
    toast('Gelöscht');
}

function showRegLessons(idx){
    const reg=campRegistrations[idx];
    if(!reg||!reg.trainers||!reg.trainers.length){
        toast('Keine Privatstunden gebucht');
        return;
    }
    closeModal('campRegs');

    // Build summary for alert/modal
    let summary='📋 Zu planen für '+reg.name+':\n\n';
    reg.trainers.forEach(t=>{
        summary+=`• ${t.trainerName}: ${t.units} Einheiten (à 45min)\n`;
    });
    summary+='\nZeitraum: '+(reg.campStart||'?')+' bis '+(reg.campEnd||'?');
    summary+='\n\n→ Klick auf einen Trainer-Chip um direkt zu buchen.';

    alert(summary);
}

function jumpToTrainer(trainerId,clientName){
    closeModal('campRegs');

    // Find trainer by ID or name
    let trainer=teachers.find(t=>t.id===trainerId);
    if(!trainer){
        // Try finding by name
        trainer=teachers.find(t=>t.name.toLowerCase().includes(trainerId.toLowerCase()));
    }

    // Switch to calendar view
    showPage('calendar');

    // Select the trainer
    if(trainer){
        selectedTeacher=trainer.id;
        document.querySelectorAll('.trainer-chip').forEach(c=>{
            c.classList.toggle('active',c.dataset.id===trainer.id);
        });
    }

    // Navigate to camp start date
    if(settings.campStart){
        curDate=new Date(settings.campStart);
    }

    // Store client name for pre-fill when user clicks a slot
    window.prefillClientName=clientName;

    render();
    toast('📅 '+clientName+' - freie Slots suchen');
}

function openGuestTrainerPage(id){
window.open(window.location.origin+'/trainer.html?id='+id,'_blank');
}

function renderGuestTrainerLinks(){
const container=document.getElementById('guestTrainerLinks');
if(!container)return;
const guests=getGuestTrainers();
if(!guests.length){
container.innerHTML='<div style="padding:16px;text-align:center;color:#71717a;font-size:13px;">No guest trainers</div>';
return;
}
container.innerHTML=guests.map(g=>`
<div class="settings-item" onclick="openGuestTrainerPage('${g.id}')">
<div class="settings-left">
<div class="settings-icon" style="background:${g.color}20"><div style="width:24px;height:24px;border-radius:50%;background:${g.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:12px">${g.name.charAt(0)}</div></div>
<div><span class="settings-label">${g.name} Portal</span><span class="settings-desc">Open guest trainer view</span></div>
</div>
<span class="settings-value">↗</span>
</div>
`).join('');
}

function openNewGuestTrainer(){
document.getElementById('gtId').value='';
document.getElementById('gtName').value='';
document.getElementById('gtPhone').value='';
document.getElementById('gtEmail').value='';
document.getElementById('gtStartDate').value='';
document.getElementById('gtEndDate').value='';
document.getElementById('gtSalePrice45').value='';
document.getElementById('gtSaleMember45').value='';
document.getElementById('gtPayoutPrice45').value='';
document.getElementById('gtPayoutMember45').value='';
document.getElementById('gtPayoutLecture').value='';
// Reset travel fields
document.getElementById('gtTravelCost').value='';
document.getElementById('gtHotelCost').value='';
document.getElementById('gtOtherCost').value='';
document.getElementById('gtArrivalDate').value='';
document.getElementById('gtDepartureDate').value='';
document.getElementById('gtArrivalFlight').value='';
document.getElementById('gtDepartureFlight').value='';
selectTripType('arrival',null);
selectTripType('departure',null);
document.getElementById('gtTravelAccordion').classList.remove('open');
updateTravelSummary();
// Reset all summaries
document.getElementById('gtZeitraumSummary').textContent='—';
document.getElementById('gtKontaktSummary').textContent='—';
document.getElementById('gtPreiseSummary').textContent='—';
// Open Zeitraum and Preise for new trainer, close others
document.getElementById('gtZeitraumAccordion').classList.add('open');
document.getElementById('gtKontaktAccordion').classList.remove('open');
document.getElementById('gtPreiseAccordion').classList.add('open');
curGtPhoto=null;
const p=document.getElementById('gtPhotoPreview');
p.style.backgroundImage='';p.classList.remove('has-photo');
p.innerHTML='<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
document.getElementById('delGtPhotoBtn').style.display='none';
selectGuestColor('#8B5CF6');
document.getElementById('guestTrainerTitle').textContent='Neuer Gasttrainer';
document.getElementById('delGuestTrainerBtn').style.display='none';
document.getElementById('guestTrainerModal').classList.add('open');
}

function openGuestTrainer(id){
const g=teachers.find(t=>t.id===id);
if(!g)return;
document.getElementById('gtId').value=id;
document.getElementById('gtName').value=g.name;
document.getElementById('gtPhone').value=g.phone||'';
document.getElementById('gtEmail').value=g.email||'';
document.getElementById('gtStartDate').value=g.start_date||'';
document.getElementById('gtEndDate').value=g.end_date||'';
document.getElementById('gtSalePrice45').value=g.sale_price_45||'';
document.getElementById('gtSaleMember45').value=g.sale_price_member_45||'';
document.getElementById('gtPayoutPrice45').value=g.payout_price_45||'';
document.getElementById('gtPayoutMember45').value=g.payout_price_member_45||'';
document.getElementById('gtPayoutLecture').value=g.payout_lecture||'';
// Travel fields
document.getElementById('gtTravelCost').value=g.travel_cost||'';
document.getElementById('gtHotelCost').value=g.hotel_cost||'';
document.getElementById('gtOtherCost').value=g.other_cost||'';
document.getElementById('gtArrivalDate').value=g.arrival_date||'';
document.getElementById('gtDepartureDate').value=g.departure_date||'';
document.getElementById('gtArrivalFlight').value=g.arrival_flight||g.flight_number||'';
document.getElementById('gtDepartureFlight').value=g.departure_flight||'';
selectTripType('arrival',g.arrival_type||g.travel_type||null);
selectTripType('departure',g.departure_type||null);
document.getElementById('gtTravelAccordion').classList.remove('open');
updateTravelSummary();
// Update all summaries
updateGtZeitraumSummary();
updateGtKontaktSummary();
updateGtPreiseSummary();
// Collapse accordions (expand only Zeitraum if dates set)
document.getElementById('gtZeitraumAccordion').classList.toggle('open',!!(g.start_date||g.end_date));
document.getElementById('gtKontaktAccordion').classList.remove('open');
document.getElementById('gtPreiseAccordion').classList.remove('open');
curGtPhoto=g.photo||null;
const p=document.getElementById('gtPhotoPreview');
if(g.photo){
p.style.backgroundImage='url('+g.photo+')';p.classList.add('has-photo');p.innerHTML='';
document.getElementById('delGtPhotoBtn').style.display='block';
}else{
p.style.backgroundImage='';p.classList.remove('has-photo');
p.innerHTML='<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
document.getElementById('delGtPhotoBtn').style.display='none';
}
selectGuestColor(g.color||'#8B5CF6');
document.getElementById('guestTrainerTitle').textContent='Gasttrainer bearbeiten';
document.getElementById('delGuestTrainerBtn').style.display='flex';
document.getElementById('guestTrainerModal').classList.add('open');
}

function toggleGtAccordion(id){
document.getElementById(id).classList.toggle('open');
}

function updateGtZeitraumSummary(){
const start=document.getElementById('gtStartDate').value;
const end=document.getElementById('gtEndDate').value;
const el=document.getElementById('gtZeitraumSummary');
if(start&&end){
const s=new Date(start);
const e=new Date(end);
el.textContent=s.getDate()+'.'+(s.getMonth()+1)+'. – '+e.getDate()+'.'+(e.getMonth()+1)+'.';
}else if(start){
const s=new Date(start);
el.textContent='ab '+s.getDate()+'.'+(s.getMonth()+1)+'.';
}else{
el.textContent='—';
}
}

function updateGtKontaktSummary(){
const phone=document.getElementById('gtPhone').value;
const email=document.getElementById('gtEmail').value;
const el=document.getElementById('gtKontaktSummary');
if(phone&&email)el.textContent='✓ Telefon & Email';
else if(phone)el.textContent='✓ Telefon';
else if(email)el.textContent='✓ Email';
else el.textContent='—';
}

function updateGtPreiseSummary(){
const sale=document.getElementById('gtSalePrice45').value;
const payout=document.getElementById('gtPayoutPrice45').value;
const el=document.getElementById('gtPreiseSummary');
if(sale&&payout)el.textContent='€'+sale+' / €'+payout;
else if(sale)el.textContent='€'+sale;
else el.textContent='—';
}

function toggleTravelAccordion(){
document.getElementById('gtTravelAccordion').classList.toggle('open');
}

function selectTripType(trip,type){
document.querySelectorAll('.travel-type-mini-btn[data-trip="'+trip+'"]').forEach(b=>b.classList.toggle('selected',b.dataset.type===type));
document.getElementById(trip==='arrival'?'gtArrivalType':'gtDepartureType').value=type||'';
updateTravelSummary();
}

function updateTravelSummary(){
const arrDate=document.getElementById('gtArrivalDate').value;
const depDate=document.getElementById('gtDepartureDate').value;
const arrType=document.getElementById('gtArrivalType').value;
const travelCost=parseFloat(document.getElementById('gtTravelCost').value)||0;
const hotelCost=parseFloat(document.getElementById('gtHotelCost').value)||0;
const otherCost=parseFloat(document.getElementById('gtOtherCost').value)||0;
const total=travelCost+hotelCost+otherCost;
// Update tag
const tagEl=document.getElementById('gtSummaryTag');
if(arrType==='flight')tagEl.textContent='✈️ Flug';
else if(arrType==='train')tagEl.textContent='🚆 Zug';
else if(arrType==='car')tagEl.textContent='🚗 Auto';
else tagEl.textContent='—';
// Update dates
const datesEl=document.getElementById('gtSummaryDates');
if(arrDate&&depDate){
const arr=new Date(arrDate);
const dep=new Date(depDate);
datesEl.textContent=arr.getDate()+'.'+(arr.getMonth()+1)+'. → '+dep.getDate()+'.'+(dep.getMonth()+1)+'.';
}else if(arrDate){
const arr=new Date(arrDate);
datesEl.textContent=arr.getDate()+'.'+(arr.getMonth()+1)+'.';
}else{
datesEl.textContent='Keine Daten';
}
// Update total
document.getElementById('gtSummaryTotal').textContent='€'+total;
}

async function trackFlight(trip){
const flightInput=document.getElementById(trip==='arrival'?'gtArrivalFlight':'gtDepartureFlight');
const dateInput=document.getElementById(trip==='arrival'?'gtArrivalDate':'gtDepartureDate');
const statusEl=document.getElementById(trip+'FlightStatus');
const btn=event.target;
const flightNumber=flightInput.value.trim();
const flightDate=dateInput.value;
if(!flightNumber){toast('Bitte Flugnummer eingeben');return;}
if(!FLIGHT_API_KEY){
const key=prompt('RapidAPI Key eingeben:\n(Einmalig - wird gespeichert)');
if(key){FLIGHT_API_KEY=key;localStorage.setItem('flight_api_key',key);}
else return;
}
btn.classList.add('loading');
statusEl.innerHTML='<span style="color:#888">Laden...</span>';
statusEl.classList.add('show');
try{
const data=await fetchFlightStatus(flightNumber,flightDate);
if(data){
const isArrival=trip==='arrival';
const info=isArrival?data.arrival:data.departure;
const otherInfo=isArrival?data.departure:data.arrival;
let html='<div class="flight-info">';
html+=getFlightStatusBadge(data.status,info.delay);
html+='<div class="flight-route" style="margin-top:8px">'+data.airline+' · '+(otherInfo.iata||'?')+' → '+(info.iata||'?')+'</div>';
html+='<div class="flight-times">';
html+='<span>Geplant: <strong>'+formatFlightTime(info.scheduled)+'</strong></span>';
if(info.estimated&&info.estimated!==info.scheduled){
html+='<span>Erwartet: <strong style="color:'+(info.delay>0?'#ef4444':'#22c55e')+'">'+formatFlightTime(info.estimated)+'</strong></span>';
}
if(info.gate){html+='<span>Gate: <strong>'+info.gate+'</strong></span>';}
if(info.terminal){html+='<span>Terminal: <strong>'+info.terminal+'</strong></span>';}
html+='</div></div>';
statusEl.innerHTML=html;
}else{
statusEl.innerHTML='<span style="color:#ef4444">Flug nicht gefunden</span>';
}
}catch(e){
statusEl.innerHTML='<span style="color:#ef4444">Fehler: '+e.message+'</span>';
}
btn.classList.remove('loading');
}

function getGuestArrivalBanners(dateStr){
let html='';
const guestTrainers=teachers.filter(t=>t.is_guest);
guestTrainers.forEach(g=>{
// Check arrival
if(g.arrival_date===dateStr){
const type=g.arrival_type||g.travel_type||'car';
const icon=type==='flight'?'🛬':type==='train'?'🚆':'🚗';
const storedInfo=g.arrival_flight_info;
let flightDetails='';
let statusBadge='';
if(type==='flight'&&g.arrival_flight){
flightDetails=g.arrival_flight;
if(storedInfo){
const route=(storedInfo.departure?.iata||'')+(storedInfo.arrival?.iata?' → '+storedInfo.arrival.iata:'');
if(route)flightDetails+=' · '+route;
const time=formatFlightTime(storedInfo.arrival?.scheduled);
if(time)flightDetails+=' · '+time;
if(storedInfo.arrival?.terminal)flightDetails+=' · T'+storedInfo.arrival.terminal;
const st=storedInfo.status;
const delay=storedInfo.arrival?.delay||0;
if(st==='landed'||st==='arrived')statusBadge='<span class="flight-status-badge landed">✓</span>';
else if(st==='active'||st==='enroute'||st==='airborne')statusBadge='<span class="flight-status-badge active">✈️</span>';
else if(st==='cancelled')statusBadge='<span class="flight-status-badge cancelled">✗</span>';
else if(delay>0)statusBadge='<span class="flight-status-badge delayed">+'+delay+'</span>';
}
}else{
flightDetails=getTravelTypeName(type);
}
const clickHandler=type==='flight'&&g.arrival_flight?'onclick="showStoredFlightInfo(\''+g.id+'\',\'arrival\')"':'';
html+='<div class="arrival-banner" '+clickHandler+'><span class="icon">'+icon+'</span><div class="info"><div class="name">'+g.name+' kommt an</div><div class="flight">'+flightDetails+'</div></div>'+statusBadge+(type==='flight'&&!storedInfo?'<span class="flight-track-hint">📡</span>':'')+'</div>';
}
// Check departure
if(g.departure_date===dateStr){
const type=g.departure_type||g.travel_type||'car';
const icon=type==='flight'?'🛫':type==='train'?'🚆':'🚗';
const storedInfo=g.departure_flight_info;
let flightDetails='';
let statusBadge='';
if(type==='flight'&&g.departure_flight){
flightDetails=g.departure_flight;
if(storedInfo){
const route=(storedInfo.departure?.iata||'')+(storedInfo.arrival?.iata?' → '+storedInfo.arrival.iata:'');
if(route)flightDetails+=' · '+route;
const time=formatFlightTime(storedInfo.departure?.scheduled);
if(time)flightDetails+=' · '+time;
if(storedInfo.departure?.terminal)flightDetails+=' · T'+storedInfo.departure.terminal;
const st=storedInfo.status;
const delay=storedInfo.departure?.delay||0;
if(st==='landed'||st==='arrived')statusBadge='<span class="flight-status-badge landed">✓</span>';
else if(st==='active'||st==='enroute'||st==='airborne')statusBadge='<span class="flight-status-badge active">✈️</span>';
else if(st==='cancelled')statusBadge='<span class="flight-status-badge cancelled">✗</span>';
else if(delay>0)statusBadge='<span class="flight-status-badge delayed">+'+delay+'</span>';
}
}else{
flightDetails=getTravelTypeName(type);
}
const clickHandler=type==='flight'&&g.departure_flight?'onclick="showStoredFlightInfo(\''+g.id+'\',\'departure\')"':'';
html+='<div class="arrival-banner departure" '+clickHandler+'><span class="icon">'+icon+'</span><div class="info"><div class="name">'+g.name+' reist ab</div><div class="flight">'+flightDetails+'</div></div>'+statusBadge+(type==='flight'&&!storedInfo?'<span class="flight-track-hint">📡</span>':'')+'</div>';
}
});
return html;
}

function getTravelTypeName(type){
if(type==='flight')return 'Flug';
if(type==='train')return 'Zug';
if(type==='car')return 'Auto';
return '';
}

async function saveGuestTrainer(e){
e.preventDefault();
const id=document.getElementById('gtId').value;
const name=document.getElementById('gtName').value.trim();
const color=document.getElementById('gtColor').value;
const phone=document.getElementById('gtPhone').value.trim();
const email=document.getElementById('gtEmail').value.trim();
const salePrice45=parseInt(document.getElementById('gtSalePrice45').value)||0;
const saleMember45=parseInt(document.getElementById('gtSaleMember45').value)||0;
const payoutPrice45=parseInt(document.getElementById('gtPayoutPrice45').value)||0;
const payoutMember45=parseInt(document.getElementById('gtPayoutMember45').value)||0;
const payoutLecture=parseInt(document.getElementById('gtPayoutLecture').value)||0;
const startDate=document.getElementById('gtStartDate').value||null;
const endDate=document.getElementById('gtEndDate').value||null;
// Travel fields
const travelCost=parseFloat(document.getElementById('gtTravelCost').value)||0;
const hotelCost=parseFloat(document.getElementById('gtHotelCost').value)||0;
const otherCost=parseFloat(document.getElementById('gtOtherCost').value)||0;
const arrivalType=document.getElementById('gtArrivalType').value||null;
const departureType=document.getElementById('gtDepartureType').value||null;
const arrivalDate=document.getElementById('gtArrivalDate').value||null;
const departureDate=document.getElementById('gtDepartureDate').value||null;
const arrivalFlight=document.getElementById('gtArrivalFlight').value.trim()||null;
const departureFlight=document.getElementById('gtDepartureFlight').value.trim()||null;
if(!name){toast('Name erforderlich');return;}
const existingTrainer=id?teachers.find(t=>t.id===id):null;
const guestData={
id:id||'guest_'+name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now(),
name:name,
color:color,
phone:phone,
email:email,
photo:curGtPhoto,
is_guest:true,
is_active:existingTrainer?.is_active!==false,
sale_price_45:salePrice45,
sale_price_member_45:saleMember45,
payout_price_45:payoutPrice45,
payout_price_member_45:payoutMember45,
payout_lecture:payoutLecture,
start_date:startDate,
end_date:endDate,
travel_cost:travelCost,
hotel_cost:hotelCost,
other_cost:otherCost,
arrival_type:arrivalType,
departure_type:departureType,
arrival_date:arrivalDate,
departure_date:departureDate,
arrival_flight:arrivalFlight,
departure_flight:departureFlight,
arrival_flight_info:null,
departure_flight_info:null
};
// Fetch flight info if API key is set
if(FLIGHT_API_KEY){
if(arrivalType==='flight'&&arrivalFlight&&arrivalDate){
fetchFlightStatus(arrivalFlight,arrivalDate).then(info=>{
if(info){
guestData.arrival_flight_info=info;
const idx=teachers.findIndex(t=>t.id===guestData.id);
if(idx>=0)teachers[idx].arrival_flight_info=info;
saveLocal();render();
}
});
}
if(departureType==='flight'&&departureFlight&&departureDate){
fetchFlightStatus(departureFlight,departureDate).then(info=>{
if(info){
guestData.departure_flight_info=info;
const idx=teachers.findIndex(t=>t.id===guestData.id);
if(idx>=0)teachers[idx].departure_flight_info=info;
saveLocal();render();
}
});
}
}
if(id){
const idx=teachers.findIndex(t=>t.id===id);
if(idx>=0){teachers[idx]={...teachers[idx],...guestData,id:id};}
}else{
teachers.push(guestData);
}
saveLocal();
renderGuestTrainerList();
renderGuestTrainerLinks();
render();
closeModal('guestTrainer');
toast('Gasttrainer gespeichert!'+(FLIGHT_API_KEY&&(arrivalFlight||departureFlight)?' Fluginfo wird geladen...':''));
if(online){
const upsertData={
id:guestData.id,name:guestData.name,initials:name.charAt(0),color:guestData.color,
photo:curGtPhoto,
is_guest:true,is_active:guestData.is_active,
phone:phone||null,email:email||null,
sale_price_45:salePrice45,sale_price_member_45:saleMember45,
payout_price_45:payoutPrice45,payout_price_member_45:payoutMember45,
payout_lecture:payoutLecture,start_date:startDate,end_date:endDate,
travel_cost:travelCost,hotel_cost:hotelCost,other_cost:otherCost,
arrival_type:arrivalType,departure_type:departureType,
arrival_date:arrivalDate,departure_date:departureDate,
arrival_flight:arrivalFlight,departure_flight:departureFlight
};
await apiUpsert('teachers',upsertData);
}
}

async function toggleGuestTrainer(id){
const g=teachers.find(t=>t.id===id);
if(!g)return;
g.is_active=!g.is_active;
saveLocal();
renderGuestTrainerList();
renderGuestTrainerLinks();
render();
toast(g.is_active?'Gasttrainer aktiviert':'Gasttrainer deaktiviert');
if(online)await apiPatch('teachers',id,{is_active:g.is_active});
}

async function deleteGuestTrainer(){
const id=document.getElementById('gtId').value;
if(!id)return;
if(!confirm('Gasttrainer wirklich löschen?'))return;
// Try cloud delete first to ensure sync
let cloudDeleted=false;
if(online){
    cloudDeleted=await apiDelete('teachers',id);
    if(!cloudDeleted){
        if(!confirm('⚠️ Verbindungsfehler - Trainer wird nur lokal gelöscht und könnte auf anderen Geräten noch erscheinen. Trotzdem fortfahren?'))return;
    }
}else{
    if(!confirm('⚠️ Offline - Trainer wird nur lokal gelöscht. Auf anderen Geräten noch sichtbar. Fortfahren?'))return;
}
teachers=teachers.filter(t=>t.id!==id);
saveLocal();
renderGuestTrainerList();
renderGuestTrainerLinks();
render();
closeModal('guestTrainer');
toast(cloudDeleted?'Gasttrainer gelöscht':'Lokal gelöscht (nicht synchronisiert)');
}

function getGuestTrainerPrice(trainerId,dur,clientName){
const t=teachers.find(x=>x.id===trainerId);
if(!t||!t.is_guest)return getPrice(dur,clientName);
const client=clientName?clients.find(c=>c.name===clientName):null;
const isMember=client?.is_member;
const base45=isMember?(t.sale_price_member_45||t.sale_price_45||100):(t.sale_price_45||100);
return dur===90?base45*2:base45;
}

function getGuestTrainerPayout(trainerId,dur,clientName){
const t=teachers.find(x=>x.id===trainerId);
if(!t||!t.is_guest)return 0;
const client=clientName?clients.find(c=>c.name===clientName):null;
const isMember=client?.is_member;
const base45=isMember?(t.payout_price_member_45||t.payout_price_45||80):(t.payout_price_45||80);
return dur===90?base45*2:base45;
}
// ========== ENDE GASTTRAINER ==========

function exportCSV(){const m=viewDate.getMonth(),y=viewDate.getFullYear(),ml=lessons.filter(l=>{const d=new Date(l.date);return d.getMonth()===m&&d.getFullYear()===y;});let csv='Datum,Zeit,Client,Trainer,Dauer,Preis\n';ml.forEach(l=>{csv+=l.date+','+l.time+','+l.client+','+l.teacher+','+l.dur+'min,€'+getPrice(l.dur,l.client,l.customPrice)+'\n';});const total=ml.reduce((s,l)=>s+getPrice(l.dur,l.client,l.customPrice),0);csv+='\nTotal,,,,'+ml.length+' lessons,€'+total;const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='motus-'+y+'-'+(m+1)+'.csv';a.click();toast('Exported!');}

function toast(m){const t=document.getElementById('toast');t.className='toast';if(m.includes('⚠️'))t.classList.add('warning');if(m.includes('❌'))t.classList.add('error');document.getElementById('toastText').textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove('open');});
document.addEventListener('click',e=>{
    if(!e.target.closest('.form-group'))document.getElementById('clientAutocomplete')?.classList.remove('show');
    if(!e.target.closest('.header-avatar-wrap'))document.getElementById('trainerPopup')?.classList.remove('show');
});
async function forceSync(){
    if(!online){toast("Not connected!");return;}
    setSync("syncing");toast("⬆️ Uploading all data...");
    let uploaded=0;
    try{
        for(const l of lessons){
            const res=await apiUpsert('lessons',{id:l.id,teacher_id:l.teacher,client_name:l.client,lesson_date:l.date,lesson_time:l.time,duration:l.dur,notes:l.notes});
            if(res)uploaded++;
        }
        for(const c of clients){
            // log removed
            const res=await apiUpsert('clients',{id:c.id,name:c.name,phone1:c.phone1||'',phone2:c.phone2||'',notes:c.notes||'',photo:c.photo||null,is_member:c.is_member||false});
            if(res)uploaded++;
        }
        await apiPatch('settings','default',{day_locations:JSON.stringify(dayLocations)});
        // log removed
        setSync("online");toast("✅ Uploaded "+uploaded+" items!");
    }catch(e){console.error(e);toast("Sync failed!");setSync("offline");}
}
function jumpToToday(){selDate=new Date();viewDate=new Date();render();toast("Today!");}

// Finde und merge doppelte Clients
function checkDuplicates(){
    const nameMap=new Map();
    clients.forEach(c=>{
        const key=c.name.toLowerCase().trim();
        if(!nameMap.has(key))nameMap.set(key,[]);
        nameMap.get(key).push(c);
    });
    let dupes=0,merged=0;
    nameMap.forEach((group,name)=>{
        if(group.length>1){
            dupes+=group.length-1;
            // Keep the one with most data (phone, notes, photo)
            group.sort((a,b)=>{
                const scoreA=(a.phone1?1:0)+(a.phone2?1:0)+(a.notes?1:0)+(a.photo?2:0);
                const scoreB=(b.phone1?1:0)+(b.phone2?1:0)+(b.notes?1:0)+(b.photo?2:0);
                return scoreB-scoreA;
            });
            const keep=group[0];
            const toDelete=group.slice(1);
            toDelete.forEach(dup=>{
                // Update all lessons from duplicate to keeper
                lessons.filter(l=>l.client===dup.name).forEach(l=>{
                    l.client=keep.name;
                    if(online)apiPatch('lessons',l.id,{client_name:keep.name});
                });
                // Delete duplicate client
                clients=clients.filter(c=>c.id!==dup.id);
                if(online)apiDelete('clients',dup.id);
                merged++;
                // log removed
            });
        }
    });
    if(dupes===0){toast('✅ Keine Duplikate gefunden!');return;}
    saveLocal();render();
    toast('✅ '+merged+' Duplikate gemerged!');
}

// Repariere Namen in Buchungen die nicht mehr zu Clients passen
function repairNames(){
    const clientNames=clients.map(c=>c.name);
    const orphanedLessons=lessons.filter(l=>!clientNames.includes(l.client));
    if(!orphanedLessons.length){toast('✅ Alles in Ordnung!');return;}
    let fixed=0;
    orphanedLessons.forEach(l=>{
        const oldName=l.client.toLowerCase();
        const match=clients.find(c=>{
            const cName=c.name.toLowerCase();
            const oldFirst=oldName.split(/[\/\s]/)[0].trim();
            const cFirst=cName.split(/[\/\s]/)[0].trim();
            return cName.includes(oldFirst)||oldName.includes(cFirst)||
                   oldFirst.slice(0,4)===cFirst.slice(0,4);
        });
        if(match){
            // log removed
            l.client=match.name;
            if(online)apiPatch('lessons',l.id,{client_name:match.name});
            fixed++;
        }else{
            // log removed
        }
    });
    saveLocal();render();
    if(fixed>0)toast('✅ '+fixed+' Buchungen repariert!');
    else toast('⚠️ '+orphanedLessons.length+' ohne Match - manuell prüfen');
}

// Manual sync with toast
async function manualSync(){
    await syncCloud();
    toast('✅ Synced!');
}

function updateSyncInfo(){
    const info=document.getElementById('syncInfo');
    if(info)info.textContent=lessons.length+'L · '+clients.length+'C';
}

// Wetter-Widget (Pommelsbrunn, Bayern)
const WEATHER_LAT=49.5;
const WEATHER_LON=11.5;
const weatherIcons={
    0:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    1:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    2:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    3:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    45:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    48:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    51:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/></svg>',
    53:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/></svg>',
    55:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
    61:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
    63:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="22"/></svg>',
    65:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="22"/></svg>',
    71:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    73:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    75:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    77:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    80:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
    81:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="22"/></svg>',
    82:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="19" x2="8" y2="22"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="22"/></svg>',
    85:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    86:'<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l.5 4M12 15l.5 4M16 15l.5 4" stroke-dasharray="1 2"/></svg>',
    95:'<svg viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>',
    96:'<svg viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>',
    99:'<svg viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>'
};
async function loadWeather(){
    try{
        const cached=localStorage.getItem('motusWeather');
        if(cached){
            const data=JSON.parse(cached);
            if(Date.now()-data.time<1800000){updateWeatherUI(data);return;}
        }
        const res=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+WEATHER_LAT+'&longitude='+WEATHER_LON+'&current=temperature_2m,weather_code&timezone=Europe/Berlin');
        if(!res.ok)return;
        const json=await res.json();
        const weatherData={
            temp:Math.round(json.current.temperature_2m),
            code:json.current.weather_code,
            time:Date.now()
        };
        localStorage.setItem('motusWeather',JSON.stringify(weatherData));
        updateWeatherUI(weatherData);
    }catch(e){}
}
function updateWeatherUI(data){
    const iconEl=document.getElementById('weatherIcon');
    const tempEl=document.getElementById('weatherTemp');
    if(iconEl&&data.code!==undefined){
        iconEl.innerHTML=weatherIcons[data.code]||weatherIcons[2];
    }
    if(tempEl&&data.temp!==undefined){
        tempEl.textContent=data.temp+'°';
    }
}

// ===== SHARE AVAILABILITY =====
let shareAvailDates = [];
let shareAvailTrainer = null;
let shareAvailDuration = 45;
let shareAvailLang = 'de';
let shareAvailLink = '';
let shareAvailMsg = '';
let bookingRequests = [];
let adjustedBookingTimes = {}; // Store time adjustments per request: { reqId: { slotIndex: adjustedTime } }
let shareCalDate = new Date();

function setShareAvailLang(lang) {
    shareAvailLang = lang;
    document.querySelectorAll('#shareAvailModal .share-lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
    });
    // Reset link when language changes
    document.getElementById('shareAvailLinkBox').style.display = 'none';
    document.getElementById('shareAvailMsgBox').style.display = 'none';
    document.getElementById('shareAvailGenBtn').style.display = 'flex';
    document.getElementById('shareAvailCopyBtn').style.display = 'none';
    document.getElementById('shareAvailWaBtn').style.display = 'none';
}

function renderShareCal() {
    const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    const y = shareCalDate.getFullYear(), mo = shareCalDate.getMonth();
    document.getElementById('shareCalTitle').textContent = months[mo] + ' ' + y;

    const fd = new Date(y, mo, 1).getDay();
    const st = fd === 0 ? 6 : fd - 1; // Monday start
    const nd = new Date(y, mo + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    let html = '';
    // Empty days before month start
    for (let i = 0; i < st; i++) {
        html += '<div style="padding:8px;color:#333">.</div>';
    }
    // Days of month
    for (let i = 1; i <= nd; i++) {
        const d = new Date(y, mo, i);
        const ds = fmtDate(d);
        const isPast = d < today;
        const isSelected = shareAvailDates.includes(ds);
        const isToday = d.toDateString() === today.toDateString();

        let style = 'padding:8px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:all .2s;';
        if (isPast) {
            style += 'color:#333;cursor:default;';
        } else if (isSelected) {
            style += 'background:#c9a227;color:#121212;';
        } else if (isToday) {
            style += 'background:#242424;color:#fff;border:1px solid #c9a227;';
        } else {
            style += 'background:#1a1a1a;color:#fff;';
        }

        const onclick = isPast ? '' : `onclick="toggleShareAvailDate('${ds}')"`;
        html += `<div style="${style}" ${onclick}>${i}</div>`;
    }

    document.getElementById('shareCalDays').innerHTML = html;
}

function navShareCal(dir) {
    shareCalDate.setMonth(shareCalDate.getMonth() + dir);
    renderShareCal();
}

function toggleShareAvailDate(dateStr) {
    const idx = shareAvailDates.indexOf(dateStr);
    if (idx >= 0) {
        shareAvailDates.splice(idx, 1);
    } else {
        shareAvailDates.push(dateStr);
    }
    shareAvailDates.sort();
    renderShareCal();
    updateShareAvailUI();
}

function updateShareAvailUI() {
    const daysDiv = document.getElementById('shareAvailDays');
    if (shareAvailDates.length === 0) {
        daysDiv.innerHTML = '<span style="color:#52525b;font-size:13px">Keine Tage ausgewählt</span>';
    } else {
        const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        daysDiv.innerHTML = shareAvailDates.map(d => {
            const dt = new Date(d + 'T12:00:00');
            return `<span style="background:#c9a227;color:#121212;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600">${days[dt.getDay()]} ${dt.getDate()}.${dt.getMonth()+1}<span style="cursor:pointer;margin-left:4px" onclick="event.stopPropagation();toggleShareAvailDate('${d}')">×</span></span>`;
        }).join('');
    }
    // Reset link when dates change
    document.getElementById('shareAvailLinkBox').style.display = 'none';
    document.getElementById('shareAvailGenBtn').style.display = 'block';
    document.getElementById('shareAvailCopyBtn').style.display = 'none';
    document.getElementById('shareAvailWaBtn').style.display = 'none';
}

function openShareAvailability() {
    // Reset state
    shareCalDate = new Date();

    // Populate trainer buttons
    const trainersDiv = document.getElementById('shareAvailTrainers');
    const activeTrainers = teachers.filter(t => !t.is_guest || t.is_active === true);
    trainersDiv.innerHTML = activeTrainers.map(t =>
        `<button class="trainer-btn ${shareAvailTrainer === t.id ? 'active' : ''}" onclick="setShareTrainerAvail('${t.id}')" style="border-left:4px solid ${t.color || '#c9a227'}">${t.name}</button>`
    ).join('');
    if (!shareAvailTrainer && activeTrainers.length) {
        shareAvailTrainer = activeTrainers[0].id;
        trainersDiv.querySelector('.trainer-btn')?.classList.add('active');
    }

    renderShareCal();
    updateShareAvailUI();
    document.getElementById('shareAvailModal').classList.add('open');
}

function setShareTrainerAvail(id) {
    shareAvailTrainer = id;
    document.querySelectorAll('#shareAvailTrainers .trainer-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    // Reset link box
    document.getElementById('shareAvailLinkBox').style.display = 'none';
    document.getElementById('shareAvailMsgBox').style.display = 'none';
    document.getElementById('shareAvailGenBtn').style.display = 'flex';
    document.getElementById('shareAvailCopyBtn').style.display = 'none';
    document.getElementById('shareAvailWaBtn').style.display = 'none';

    // For guest trainers: jump to their first active day and pre-select their days
    const trainer = teachers.find(t => t.id === id);
    if (trainer && trainer.is_guest) {
        const today = new Date();
        today.setHours(0,0,0,0);
        // Find all future lessons for this guest trainer
        const guestLessons = lessons.filter(l => l.teacher === id && new Date(l.date + 'T12:00') >= today);
        if (guestLessons.length > 0) {
            // Sort by date
            guestLessons.sort((a, b) => a.date.localeCompare(b.date));
            // Get unique dates
            const uniqueDates = [...new Set(guestLessons.map(l => l.date))];
            // Jump to first date's month
            const firstDate = new Date(uniqueDates[0] + 'T12:00');
            shareCalDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
            // Pre-select all guest trainer's dates
            shareAvailDates = uniqueDates;
            renderShareCal();
            updateShareAvailUI();
        } else {
            // Guest trainer has no future lessons
            shareAvailDates = [];
            shareCalDate = new Date();
            renderShareCal();
            updateShareAvailUI();
        }
    } else {
        // Regular trainer - reset dates and go to current month
        shareAvailDates = [];
        shareCalDate = new Date();
        renderShareCal();
        updateShareAvailUI();
    }
}

function generateAvailLink() {
    if (shareAvailDates.length === 0) {
        toast('⚠️ Bitte Tage auswählen');
        return;
    }
    if (!shareAvailTrainer) {
        toast('⚠️ Bitte Trainer auswählen');
        return;
    }
    const expiry = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60); // 3 days
    const baseUrl = window.location.origin + '/book.html';
    shareAvailLink = `${baseUrl}?t=${shareAvailTrainer}&d=${shareAvailDates.join(',')}&dur=${shareAvailDuration}&exp=${expiry}&lang=${shareAvailLang}`;

    document.getElementById('shareAvailLinkText').textContent = shareAvailLink;
    document.getElementById('shareAvailLinkBox').style.display = 'block';

    // Generate customer message
    const trainer = teachers.find(t => t.id === shareAvailTrainer);
    const tName = trainer?.name || 'Trainer';
    const datesFormatted = shareAvailDates.map(d => {
        const dt = new Date(d);
        return dt.toLocaleDateString('de-DE', {weekday: 'short', day: 'numeric', month: 'short'});
    }).join(', ');

    shareAvailMsg = shareAvailLang === 'de'
        ? `Hallo! 👋\n\nHier ist dein persönlicher Buchungslink für deine Tanzstunde bei ${tName}:\n\n🔗 ${shareAvailLink}\n\n📅 Verfügbare Tage: ${datesFormatted}\n⏱️ Der Link ist 3 Tage gültig.\n\nKlicke einfach auf den Link und wähle deinen Wunschtermin aus.\n\nBis bald! 💃🕺`
        : `Hello! 👋\n\nHere is your personal booking link for your dance lesson with ${tName}:\n\n🔗 ${shareAvailLink}\n\n📅 Available days: ${datesFormatted}\n⏱️ The link is valid for 3 days.\n\nJust click the link and choose your preferred time.\n\nSee you soon! 💃🕺`;

    document.getElementById('shareAvailMsgText').textContent = shareAvailMsg;
    document.getElementById('shareAvailMsgBox').style.display = 'block';

    document.getElementById('shareAvailGenBtn').style.display = 'none';
    document.getElementById('shareAvailCopyBtn').style.display = 'flex';
    document.getElementById('shareAvailWaBtn').style.display = 'flex';
}

function copyAvailLink() {
    navigator.clipboard.writeText(shareAvailMsg);
    toast('📋 Nachricht kopiert!');
}

function shareAvailWhatsApp() {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareAvailMsg), '_blank');
}

// ===== BOOKING REQUESTS =====
async function loadBookingRequests() {
    try {
        const res = await fetch(API_URL + '/booking_requests?select=*&order=created_at.desc', { headers: API_HEADERS });
        if (res.ok) {
            bookingRequests = await res.json();
            updateBookingRequestsBadge();
        }
    } catch (e) {}
}

function updateBookingRequestsBadge() {
    const pending = bookingRequests.filter(r => r.status === 'pending').length;
    // Update badge in Quick Links
    const badge = document.getElementById('bookingRequestsQuickBadge');
    if (badge) {
        badge.textContent = pending;
        badge.style.display = pending > 0 ? 'flex' : 'none';
    }
}

function openBookingRequests() {
    renderBookingRequests();
    document.getElementById('bookingRequestsModal').classList.add('open');
}

function findSimilarClients(name, email) {
    if (!name) return [];
    const nameLower = name.toLowerCase().trim();
    const firstName = nameLower.split(/[\s\/\&]/)[0];

    return clients.filter(c => {
        const cNameLower = c.name.toLowerCase();
        const cFirstName = cNameLower.split(/[\s\/\&]/)[0];

        // Exact match
        if (cNameLower === nameLower) return true;
        // First name match
        if (cFirstName === firstName && firstName.length >= 2) return true;
        // Contains match
        if (cNameLower.includes(firstName) && firstName.length >= 3) return true;
        if (firstName.includes(cFirstName) && cFirstName.length >= 3) return true;
        // Email match
        if (email && c.email && c.email.toLowerCase() === email.toLowerCase()) return true;

        return false;
    }).slice(0, 3);
}

function renderBookingRequests() {
    const list = document.getElementById('bookingRequestsList');
    const pending = bookingRequests.filter(r => r.status === 'pending');

    if (pending.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">Keine offenen Anfragen</div>';
        return;
    }

    const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    list.innerHTML = pending.map(r => {
        const trainer = teachers.find(t => t.id === r.trainer_id);
        const slots = r.requested_slots || [];
        const dur = r.duration || 45;

        // Parse name to extract email if stored as "Name (email)"
        let displayName = r.name;
        let displayEmail = '';
        const emailMatch = r.name.match(/^(.+?)\s*\(([^)]+@[^)]+)\)$/);
        if (emailMatch) {
            displayName = emailMatch[1].trim();
            displayEmail = emailMatch[2].trim();
        }

        // Find similar clients from database
        const suggestions = findSimilarClients(displayName, displayEmail);
        const exactMatch = suggestions.find(c => c.name.toLowerCase() === displayName.toLowerCase());

        const slotsHtml = slots.map((s, slotIdx) => {
            const d = new Date(s.date + 'T12:00:00');
            // Get adjusted time if exists, otherwise use original
            const adjustedTime = adjustedBookingTimes[r.id]?.[slotIdx] || s.time.slice(0,5);
            const startMin = parseInt(adjustedTime.slice(0,2))*60 + parseInt(adjustedTime.slice(3,5));
            const endMin = startMin + dur;
            const endTime = String(Math.floor(endMin/60)).padStart(2,'0') + ':' + String(endMin%60).padStart(2,'0');
            // Check if slot is already booked (with adjusted time)
            const isBooked = lessons.some(l => l.date === s.date && l.time === adjustedTime && l.teacher === r.trainer_id);
            const statusColor = isBooked ? '#ef4444' : '#22c55e';
            const statusText = isBooked ? 'Belegt' : 'Frei';
            const isAdjusted = adjustedTime !== s.time.slice(0,5);
            return `<div style="background:#242424;padding:12px 14px;border-radius:10px;margin:6px 0;border-left:3px solid ${statusColor}">
                <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:8px">${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px">
                    <button onclick="adjustBookingTime('${r.id}',${slotIdx},-15)" style="width:40px;height:40px;border-radius:10px;border:none;background:#333;color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#333'">−15</button>
                    <div style="min-width:100px;text-align:center">
                        <div style="font-size:22px;font-weight:700;color:${isAdjusted ? '#60a5fa' : '#c9a227'}">${adjustedTime}</div>
                        ${isAdjusted ? `<div style="font-size:10px;color:#71717a;text-decoration:line-through">${s.time.slice(0,5)}</div>` : ''}
                    </div>
                    <button onclick="adjustBookingTime('${r.id}',${slotIdx},15)" style="width:40px;height:40px;border-radius:10px;border:none;background:#333;color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#333'">+15</button>
                </div>
                <div style="font-size:13px;color:#a1a1aa;text-align:center">bis ${endTime} Uhr</div>
                <div style="font-size:11px;color:${statusColor};margin-top:4px;text-align:center">${statusText}</div>
            </div>`;
        }).join('');

        // Build suggestions HTML - only show if there are similar clients but not exact match
        let suggestionsHtml = '';
        if (suggestions.length > 0 && !exactMatch) {
            suggestionsHtml = `
                <div style="background:#1a2332;border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:12px;margin-bottom:12px">
                    <div style="font-size:11px;color:#60a5fa;text-transform:uppercase;margin-bottom:8px;font-weight:600">💡 Vorschläge aus Datenbank</div>
                    ${suggestions.map(c => `
                        <div onclick="confirmBookingWithClient('${r.id}','${c.id}')" style="display:flex;align-items:center;gap:10px;padding:8px;margin:4px 0;background:#27272a;border-radius:8px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#27272a'">
                            <div style="width:32px;height:32px;border-radius:50%;background:#3a3a3a;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#c9a227;${c.photo ? `background-image:url(${c.photo});background-size:cover` : ''}">${c.photo ? '' : c.name.charAt(0)}</div>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:13px;font-weight:500;color:#fff">${c.name}</div>
                                ${c.email ? `<div style="font-size:11px;color:#71717a;overflow:hidden;text-overflow:ellipsis">${c.email}</div>` : ''}
                            </div>
                            ${c.is_member ? '<span style="background:rgba(201,162,39,0.2);color:#c9a227;padding:2px 6px;border-radius:4px;font-size:10px">★</span>' : ''}
                            <div style="color:#60a5fa;font-size:11px">→</div>
                        </div>
                    `).join('')}
                </div>`;
        } else if (exactMatch) {
            suggestionsHtml = `
                <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
                    <span style="color:#22c55e">✓</span>
                    <span style="font-size:12px;color:#22c55e">Kunde "${exactMatch.name}" existiert bereits</span>
                    ${exactMatch.is_member ? '<span style="background:rgba(201,162,39,0.2);color:#c9a227;padding:2px 6px;border-radius:4px;font-size:10px">★ Member</span>' : ''}
                </div>`;
        }

        return `<div style="padding:16px;background:#1a1a1a;border-radius:12px;margin-bottom:12px;border-left:4px solid ${trainer?.color || '#c9a227'}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                    <div style="font-weight:600;font-size:16px">${displayName}</div>
                    <div style="font-size:13px;color:#71717a">${trainer?.name || 'Trainer'} • ${r.duration || 45} min</div>
                </div>
                <div style="font-size:11px;color:#52525b">${new Date(r.created_at).toLocaleDateString('de-DE')}</div>
            </div>
            ${displayEmail ? `<div style="font-size:13px;color:#a1a1aa;margin-bottom:8px">✉️ ${displayEmail}</div>` : ''}
            ${r.phone ? `<div style="font-size:13px;color:#a1a1aa;margin-bottom:8px">📱 ${r.phone}</div>` : ''}
            ${r.notes ? `<div style="font-size:13px;color:#a1a1aa;margin-bottom:8px">📝 ${r.notes}</div>` : ''}
            ${suggestionsHtml}
            <div style="margin-bottom:12px">${slotsHtml}</div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" style="flex:1;padding:10px" onclick="confirmBookingRequest('${r.id}')">${exactMatch ? '✓ Mit ' + exactMatch.name : '+ Neuer Kunde'}</button>
                <button class="btn btn-secondary" style="flex:1;padding:10px" onclick="rejectBookingRequest('${r.id}')">✗ Ablehnen</button>
            </div>
        </div>`;
    }).join('');
}

function adjustBookingTime(reqId, slotIdx, minutes) {
    const req = bookingRequests.find(r => r.id === reqId);
    if (!req || !req.requested_slots[slotIdx]) return;

    // Initialize storage for this request if needed
    if (!adjustedBookingTimes[reqId]) {
        adjustedBookingTimes[reqId] = {};
    }

    // Get current time (adjusted or original)
    const originalTime = req.requested_slots[slotIdx].time.slice(0,5);
    const currentTime = adjustedBookingTimes[reqId][slotIdx] || originalTime;

    // Parse current time and adjust
    const [hours, mins] = currentTime.split(':').map(Number);
    let totalMins = hours * 60 + mins + minutes;

    // Clamp to valid range (06:00 - 22:00)
    totalMins = Math.max(6 * 60, Math.min(22 * 60, totalMins));

    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    const newTime = String(newHours).padStart(2, '0') + ':' + String(newMins).padStart(2, '0');

    // Store adjusted time
    adjustedBookingTimes[reqId][slotIdx] = newTime;

    // Re-render booking requests
    renderBookingRequests();
}

function getAdjustedSlots(reqId) {
    const req = bookingRequests.find(r => r.id === reqId);
    if (!req) return [];

    return req.requested_slots.map((s, idx) => ({
        date: s.date,
        time: adjustedBookingTimes[reqId]?.[idx] || s.time.slice(0,5)
    }));
}

async function confirmBookingWithClient(reqId, clientId) {
    const req = bookingRequests.find(r => r.id === reqId);
    const existingClient = clients.find(c => c.id === clientId);
    if (!req || !existingClient) return;

    await finalizeBookingConfirmation(req, existingClient.name, existingClient.email || '', existingClient);
}

async function confirmBookingRequest(reqId) {
    const req = bookingRequests.find(r => r.id === reqId);
    if (!req) return;

    // Parse name to extract email if stored as "Name (email)"
    let clientName = req.name;
    let clientEmail = '';
    const emailMatch = req.name.match(/^(.+?)\s*\(([^)]+@[^)]+)\)$/);
    if (emailMatch) {
        clientName = emailMatch[1].trim();
        clientEmail = emailMatch[2].trim();
    }

    // Check for exact match - if found, use that client
    const exactMatch = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (exactMatch) {
        await finalizeBookingConfirmation(req, exactMatch.name, exactMatch.email || clientEmail, exactMatch);
    } else {
        // No exact match - create new client
        await finalizeBookingConfirmation(req, clientName, clientEmail, null);
    }
}

function showDuplicateClientModal(req, clientName, clientEmail, matches) {
    const modal = document.createElement('div');
    modal.id = 'duplicateClientModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

    let matchesHtml = matches.map(m => `
        <div class="duplicate-match" onclick="selectExistingClient('${m.id}')" style="background:#1a2332;border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s">
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:44px;height:44px;border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;font-weight:600;color:#c9a227;font-size:18px">${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : m.name.charAt(0)}</div>
                <div style="flex:1">
                    <div style="font-weight:600;color:#fff">${m.name}</div>
                    ${m.email ? `<div style="font-size:12px;color:#71717a">✉️ ${m.email}</div>` : ''}
                    ${m.phone1 ? `<div style="font-size:12px;color:#71717a">📱 ${m.phone1}</div>` : ''}
                    ${m.is_member ? '<span style="background:rgba(201,162,39,0.2);color:#c9a227;padding:2px 6px;border-radius:4px;font-size:10px;margin-top:4px;display:inline-block">★ Member</span>' : ''}
                </div>
                <div style="color:#60a5fa;font-size:12px">Auswählen →</div>
            </div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div style="background:#0a0a0a;border-radius:16px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto;border:1px solid #27272a">
            <div style="padding:20px;border-bottom:1px solid #27272a">
                <div style="font-size:18px;font-weight:600;color:#fff;margin-bottom:4px">⚠️ Mögliche Übereinstimmung</div>
                <div style="font-size:13px;color:#71717a">Es existiert möglicherweise bereits ein Kunde mit diesem Namen</div>
            </div>

            <div style="padding:20px;border-bottom:1px solid #27272a">
                <div style="font-size:12px;color:#71717a;margin-bottom:8px;text-transform:uppercase">Neue Anfrage</div>
                <div style="background:#27272a;border-radius:10px;padding:12px">
                    <div style="font-weight:600;color:#fff">${clientName}</div>
                    ${clientEmail ? `<div style="font-size:12px;color:#71717a;margin-top:2px">✉️ ${clientEmail}</div>` : ''}
                    ${req.phone ? `<div style="font-size:12px;color:#71717a;margin-top:2px">📱 ${req.phone}</div>` : ''}
                </div>
            </div>

            <div style="padding:20px;border-bottom:1px solid #27272a">
                <div style="font-size:12px;color:#71717a;margin-bottom:12px;text-transform:uppercase">Vorhandene Kunden</div>
                ${matchesHtml}
            </div>

            <div style="padding:20px;display:flex;flex-direction:column;gap:10px">
                <button onclick="createNewClientFromBooking()" style="width:100%;padding:14px;background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3);border-radius:10px;font-size:14px;font-weight:500;cursor:pointer">
                    + Neuen Kunden erstellen
                </button>
                <button onclick="closeDuplicateModal()" style="width:100%;padding:12px;background:transparent;color:#71717a;border:1px solid #27272a;border-radius:10px;font-size:14px;cursor:pointer">
                    Abbrechen
                </button>
            </div>
        </div>
    `;

    // Store data for callback
    window._pendingBookingReq = req;
    window._pendingClientName = clientName;
    window._pendingClientEmail = clientEmail;

    document.body.appendChild(modal);
}

function closeDuplicateModal() {
    const modal = document.getElementById('duplicateClientModal');
    if (modal) modal.remove();
    window._pendingBookingReq = null;
    window._pendingClientName = null;
    window._pendingClientEmail = null;
}

async function selectExistingClient(clientId) {
    const req = window._pendingBookingReq;
    const existingClient = clients.find(c => c.id === clientId);
    if (!req || !existingClient) return;

    closeDuplicateModal();
    await finalizeBookingConfirmation(req, existingClient.name, existingClient.email, existingClient);
}

async function createNewClientFromBooking() {
    const req = window._pendingBookingReq;
    const clientName = window._pendingClientName;
    const clientEmail = window._pendingClientEmail;
    if (!req) return;

    closeDuplicateModal();
    await finalizeBookingConfirmation(req, clientName, clientEmail, null);
}

async function finalizeBookingConfirmation(req, clientName, clientEmail, existingClient) {
    // Create client if not using existing
    if (!existingClient) {
        const newClient = {
            id: 'c' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: clientName,
            email: clientEmail,
            phone1: req.phone || '',
            phone2: '',
            notes: req.notes || '',
            photo: null,
            is_member: false,
            created_at: new Date().toISOString()
        };
        clients.push(newClient);
        if (online) {
            await apiPost('clients', {
                id: newClient.id,
                name: newClient.name,
                email: newClient.email,
                phone1: newClient.phone1,
                phone2: '',
                notes: newClient.notes,
                photo: null,
                is_member: false
            });
        }
    }

    // Use the correct client name for lessons
    const lessonClientName = existingClient ? existingClient.name : clientName;

    // Create lessons for each slot - use adjusted times if available
    const slots = req.requested_slots || [];
    let created = 0;
    const createdAppointments = []; // Track created appointments for email

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
        const slot = slots[slotIdx];
        // Get adjusted time if available, otherwise use original
        const slotTime = adjustedBookingTimes[req.id]?.[slotIdx] || slot.time.slice(0,5);

        // Check if slot is still available
        const conflict = lessons.find(l =>
            l.date === slot.date &&
            l.teacher === req.trainer_id &&
            l.time === slotTime
        );

        if (!conflict) {
            // Get location from dayLocations or trip
            const dayKey = slot.date + '_' + req.trainer_id;
            let lessonLocation = dayLocations[dayKey] || 'home';
            // Also check if there's an active trip for this date
            const activeTrip = getActiveTripForDate(slot.date, req.trainer_id);
            if (activeTrip && activeTrip.location_id) {
                lessonLocation = activeTrip.location_id;
            }

            const newLesson = {
                id: 'l' + Date.now() + '_' + Math.random().toString(36).slice(2,7) + '_' + created,
                teacher: req.trainer_id,
                client: lessonClientName,
                date: slot.date,
                time: slotTime,
                dur: req.duration || 45,
                notes: req.notes || '',
                location: lessonLocation
            };
            lessons.push(newLesson);

            // Track for email notification
            createdAppointments.push({
                date: slot.date,
                time: slotTime,
                duration: req.duration || 45
            });

            if (online) {
                await apiPost('lessons', {
                    teacher_id: newLesson.teacher,
                    client_name: newLesson.client,
                    lesson_date: newLesson.date,
                    lesson_time: newLesson.time,
                    duration: newLesson.dur,
                    notes: newLesson.notes,
                    location: newLesson.location
                });
            }
            created++;
        }
    }

    // Update request status
    await fetch(API_URL + '/booking_requests?id=eq.' + req.id, {
        method: 'PATCH',
        headers: API_HEADERS,
        body: JSON.stringify({ status: 'confirmed' })
    });

    // Clean up adjusted times for this request
    delete adjustedBookingTimes[req.id];

    // Send confirmation email if appointments were created
    if (createdAppointments.length > 0) {
        const trainer = teachers.find(t => t.id === req.trainer_id);
        const trainerName = trainer?.name || 'mōtus studio';
        const emailSent = await sendBookingConfirmationEmail(
            clientEmail,
            lessonClientName,
            createdAppointments,
            trainerName
        );
        if (emailSent) {
            console.log('Bestätigungs-E-Mail erfolgreich gesendet an', clientEmail);
        }
    }

    // Refresh
    await loadBookingRequests();
    renderBookingRequests();
    saveLocal();
    render();

    toast(`✅ ${created} Termin(e) gebucht für ${lessonClientName}`);
}

async function rejectBookingRequest(reqId) {
    if (!confirm('Anfrage wirklich ablehnen?')) return;

    await fetch(API_URL + '/booking_requests?id=eq.' + reqId, {
        method: 'PATCH',
        headers: API_HEADERS,
        body: JSON.stringify({ status: 'rejected' })
    });

    // Clean up adjusted times for this request
    delete adjustedBookingTimes[reqId];

    await loadBookingRequests();
    renderBookingRequests();
    toast('Anfrage abgelehnt');
}

// ===== EMAIL NOTIFICATIONS =====
async function sendBookingConfirmationEmail(clientEmail, clientName, appointments, trainerName) {
    // Skip if EmailJS not configured
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
        console.log('EmailJS nicht konfiguriert - keine E-Mail gesendet');
        return false;
    }

    // Skip if no email address
    if (!clientEmail) {
        console.log('Keine E-Mail-Adresse vorhanden');
        return false;
    }

    // Local date arrays for formatting
    const emailDays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const emailMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    // Format appointments for email
    const appointmentsList = appointments.map(a => {
        const d = new Date(a.date + 'T12:00:00');
        const dayName = emailDays[d.getDay()];
        const dayNum = d.getDate();
        const monthName = emailMonths[d.getMonth()];
        const year = d.getFullYear();
        return `${dayName}, ${dayNum}. ${monthName} ${year} um ${a.time} Uhr (${a.duration} Min)`;
    }).join('\n');

    try {
        // Check if EmailJS is available
        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS nicht geladen - E-Mail wird übersprungen');
            return false;
        }

        // Initialize EmailJS if not already done
        if (!window.emailjsInitialized) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            window.emailjsInitialized = true;
        }

        // Send email via EmailJS
        const emailParams = {
            to_email: (clientEmail || '').trim(),
            to_name: (clientName || '').trim(),
            trainer_name: (trainerName || '').trim(),
            appointments: appointmentsList,
            appointment_count: appointments.length
        };
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);

        console.log('Bestätigungs-E-Mail gesendet:', response);
        return true;
    } catch (error) {
        console.error('Fehler beim E-Mail-Versand:', error);
        return false;
    }
}

// Calendar swipe navigation
(function(){
    let touchStartX=0,touchEndX=0;
    const minSwipe=50;
    document.addEventListener('touchstart',e=>{
        const cal=e.target.closest('.cal, #calContainer');
        if(cal&&curView==='day')touchStartX=e.changedTouches[0].screenX;
        else touchStartX=0;
    },{passive:true});
    document.addEventListener('touchend',e=>{
        if(!touchStartX)return;
        touchEndX=e.changedTouches[0].screenX;
        const diff=touchEndX-touchStartX;
        if(Math.abs(diff)>minSwipe){
            if(diff>0)navPrev();
            else navNext();
        }
        touchStartX=0;
    },{passive:true});
})();

window.onload=init;
setInterval(()=>{if(online&&!document.hidden)syncCloud();},30000);

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&online)syncCloud();});

// Register Service Worker for PWA
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').then(()=>{}).catch(()=>{});}

// ===== PULL TO REFRESH =====
(function(){
    const ptr=document.getElementById('pullToRefresh');
    if(!ptr)return;
    let startY=0,currentY=0,pulling=false,refreshing=false;
    const threshold=80;

    function getScrollTop(){
        const page=document.querySelector('.page.active');
        if(!page)return window.scrollY;
        return page.scrollTop||window.scrollY;
    }

    document.addEventListener('touchstart',e=>{
        if(refreshing)return;
        if(getScrollTop()>5)return;
        startY=e.touches[0].pageY;
        pulling=true;
    },{passive:true});

    document.addEventListener('touchmove',e=>{
        if(!pulling||refreshing)return;
        currentY=e.touches[0].pageY;
        const diff=currentY-startY;
        if(diff>0&&getScrollTop()<=0){
            const progress=Math.min(diff/threshold,1);
            ptr.style.transform=`translateX(-50%) translateY(${Math.min(diff*0.5,50)}px)`;
            ptr.classList.toggle('visible',diff>20);
            ptr.querySelector('.ptr-text').textContent=diff>threshold?'Loslassen...':'Ziehen...';
        }
    },{passive:true});

    document.addEventListener('touchend',async()=>{
        if(!pulling)return;
        const diff=currentY-startY;
        pulling=false;

        if(diff>threshold&&!refreshing){
            refreshing=true;
            ptr.classList.add('refreshing');
            ptr.querySelector('.ptr-text').textContent='Aktualisieren...';
            ptr.style.transform='translateX(-50%) translateY(40px)';

            try{
                silentMode=true;
                await syncCloud();
                await loadBookingRequests();
                silentMode=false;
                renderAll();
            }catch(e){
                silentMode=false;
                console.error('Refresh error:',e);
            }

            setTimeout(()=>{
                ptr.classList.remove('visible','refreshing');
                ptr.style.transform='translateX(-50%) translateY(0)';
                refreshing=false;
                toast('Aktualisiert');
            },600);
        }else{
            ptr.classList.remove('visible');
            ptr.style.transform='translateX(-50%) translateY(0)';
        }
        startY=0;currentY=0;
    },{passive:true});

// === GOOGLE PLACES AUTOCOMPLETE ===
let placesAutocomplete=null;
function initPlacesAutocomplete(){
    const input=document.getElementById('tripVenueAddress');
    if(!input||!window.google||!google.maps||!google.maps.places)return;
    if(placesAutocomplete)return; // Already initialized

    placesAutocomplete=new google.maps.places.Autocomplete(input,{
        types:['establishment','geocode'],
        fields:['formatted_address','geometry','name','place_id']
    });

    placesAutocomplete.addListener('place_changed',()=>{
        const place=placesAutocomplete.getPlace();
        if(!place.geometry)return;

        // Fill address
        const address=place.formatted_address||'';
        input.value=address;

        // Auto-fill venue name if empty
        const venueNameInput=document.getElementById('tripVenueName');
        if(venueNameInput&&!venueNameInput.value.trim()&&place.name){
            venueNameInput.value=place.name;
        }

        // Auto-generate Google Maps link
        const mapsLinkInput=document.getElementById('tripMapsLink');
        if(mapsLinkInput&&place.place_id){
            mapsLinkInput.value='https://www.google.com/maps/place/?q=place_id:'+place.place_id;
        }

        toast('Adresse übernommen');
    });
}

// Init when Google API loads
function checkAndInitPlaces(){
    if(window.google&&google.maps&&google.maps.places){
        initPlacesAutocomplete();
    }else{
        setTimeout(checkAndInitPlaces,500);
    }
}
setTimeout(checkAndInitPlaces,1000);
})();
