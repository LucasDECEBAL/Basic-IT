import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || resolve(root, 'data/basic-it.sqlite');
mkdirSync(dirname(resolve(dbPath)), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','accueil','coach')), coach_id INTEGER, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS auth(token TEXT PRIMARY KEY, employee_id INTEGER REFERENCES employees(id), expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS coaches(id INTEGER PRIMARY KEY, name TEXT, specialty TEXT, bio TEXT, initials TEXT);
CREATE TABLE IF NOT EXISTS offers(id INTEGER PRIMARY KEY, name TEXT, price INTEGER, description TEXT, conditions TEXT, bookable INTEGER);
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY, discipline TEXT NOT NULL, starts TEXT NOT NULL, duration INTEGER NOT NULL, coach_id INTEGER REFERENCES coaches(id), capacity INTEGER NOT NULL, price INTEGER NOT NULL, status TEXT DEFAULT 'available', level TEXT, equipment TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY, reference TEXT UNIQUE NOT NULL, token TEXT UNIQUE NOT NULL, class_id INTEGER REFERENCES classes(id), first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, status TEXT NOT NULL, payment_status TEXT NOT NULL, amount INTEGER NOT NULL, source TEXT NOT NULL, expires INTEGER, idempotency TEXT UNIQUE NOT NULL, created TEXT NOT NULL, attended INTEGER DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking ON bookings(class_id, email) WHERE status IN ('pending','confirmed');
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, type TEXT NOT NULL, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, name TEXT, email TEXT, subject TEXT, message TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const one = (sql, ...args) => db.prepare(sql).get(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
const token = () => randomBytes(32).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
function passwordHash(value) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`; }
function passwordMatches(value, stored) { const [salt, digest] = stored.split(':'); return timingSafeEqual(scryptSync(value, salt, 64), Buffer.from(digest, 'hex')); }
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function textField(value, label, min = 1, max = 120) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) fail(`${label} : saisissez entre ${min} et ${max} caractères.`);
  return value.trim();
}
function integer(value, label, min, max) { const n = Number(value); if (!Number.isInteger(n) || n < min || n > max) fail(`${label} invalide.`); return n; }
function participant(body) {
  const email = textField(body.email, 'E-mail', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Saisissez une adresse e-mail valide.');
  return { first: textField(body.first_name, 'Prénom', 1, 60), last: textField(body.last_name, 'Nom', 1, 60), email, phone: body.phone ? textField(body.phone, 'Téléphone', 3, 30) : '' };
}
function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } }
function expire() { run("UPDATE bookings SET status='expired', payment_status='expired' WHERE status='pending' AND expires<=?", Date.now()); }
function event(type) { run('INSERT INTO events(type,created) VALUES (?,?)', type, new Date().toISOString()); }
// Convertir une heure civile de Paris en instant UTC, y compris lors des changements d'heure.
function parisInstant(day, hour) {
  const target = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(instant).map(p => [p.type, p.value]));
    instant += target - Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  }
  return new Date(instant).toISOString();
}
const disciplines = [
  ['Musculation encadrée', 'Tous niveaux', 'Serviette, tenue de sport et gourde.', 'Apprenez les bons mouvements et progressez à votre rythme sur le plateau de musculation. Votre coach ajuste les exercices à votre niveau.'],
  ['HIIT', 'Intermédiaire', 'Chaussures de salle, serviette et gourde.', 'Des intervalles courts et des récupérations actives pour travailler le cardio et la force. Des variantes sont proposées à chaque exercice.'],
  ['Cycling', 'Tous niveaux', 'Chaussures de sport, serviette et gourde.', 'Prenez le rythme sur un vélo en salle. Résistance et cadence s’adaptent à vos sensations, avec un accompagnement tout au long de la séance.'],
  ['Mobilité', 'Tous niveaux', 'Tenue souple et gourde. Tapis fourni.', 'Prenez le temps de bouger mieux. Un travail guidé de mobilité articulaire et de respiration pour retrouver de l’aisance dans vos mouvements.'],
  ['Circuit training', 'Tous niveaux', 'Chaussures de salle, serviette et gourde.', 'Passez d’un atelier à l’autre dans un entraînement varié. Renforcement et cardio se complètent, avec un effort adapté à chacun.'],
  ['Coaching individuel', 'Sur mesure', 'Tenue de sport, serviette et gourde.', 'Un rendez-vous de 60 minutes consacré à vos objectifs, vos mouvements et votre progression. Cette offre se réserve sur demande.']
];
if (!one('SELECT id FROM coaches LIMIT 1')) {
  const coaches = [
    ['Alex Martin','Force & musculation','Une approche progressive, des mouvements maîtrisés et des objectifs adaptés à chaque séance.','AM'],
    ['Sarah Laurent','HIIT & circuit training','De l’énergie et des variantes pour vous accompagner dans chaque intervalle.','SL'],
    ['Mehdi Bernard','Cycling & endurance','Le goût de l’effort régulier, avec une attention particulière au rythme de chacun.','MB'],
    ['Léa Moreau','Mobilité & récupération','Du mouvement conscient pour gagner en aisance et retrouver de bonnes sensations.','LM']
  ];
  coaches.forEach(c => run('INSERT INTO coaches(name,specialty,bio,initials) VALUES (?,?,?,?)', ...c));
  [
    ['Séance collective',1500,'Une séance au choix parmi les cours collectifs. Coach et matériel de salle inclus.','Sans engagement. Annulation et remboursement simulé jusqu’à 24 h avant la séance.',1],
    ['Carnet de 10 séances',12000,'Dix séances collectives, soit 12 € la séance. Accompagnement et matériel inclus.','Offre sur demande. Validité de démonstration : 6 mois. Achat en ligne non disponible.',0],
    ['Coaching individuel',4500,'60 minutes en tête-à-tête avec un coach, un programme adapté à vos objectifs.','Sur demande et selon disponibilité du coach. Achat en ligne non disponible.',0]
  ].forEach(o => run('INSERT INTO offers(name,price,description,conditions,bookable) VALUES (?,?,?,?,?)', ...o));
  const accounts = [['Administrateur démo','admin@basic-it.test','admin',null],['Accueil démo','accueil@basic-it.test','accueil',null],['Alex Martin','coach@basic-it.test','coach',1]];
  accounts.forEach(a => run('INSERT INTO employees(name,email,password,role,coach_id) VALUES (?,?,?,?,?)', a[0],a[1],passwordHash('DemoSport2027!'),a[2],a[3]));
  Object.entries({ address: 'Adresse à compléter avant publication', phone: 'Téléphone à configurer', email: 'E-mail à configurer', hours: 'Lundi au vendredi : 7 h – 22 h · Samedi et dimanche : 9 h – 18 h', company: 'Basic IT', missed_calls: '0' }).forEach(([k,v]) => run('INSERT INTO settings(key,value) VALUES (?,?)',k,v));
}
function seedClasses() {
  // À chaque démarrage, compléter les jours futurs manquants sans modifier les réservations existantes.
  const today = new Date(new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date()) + 'T00:00:00Z');
  for (let d = 0; d < 14; d++) {
    const day = new Date(today); day.setUTCDate(day.getUTCDate() + d);
    for (let slot = 0; slot < 2; slot++) {
      const starts = parisInstant(day, slot ? 18 : 10);
      if (Date.parse(starts) <= Date.now() || one('SELECT id FROM classes WHERE starts=?',starts)) continue;
      const index = (d * 2 + slot) % 5, def = disciplines[index], coachId = [1,2,3,4,2][index];
      const n = Number(run('INSERT INTO classes(discipline,starts,duration,coach_id,capacity,price,status,level,equipment,description) VALUES (?,?,?,?,?,?,?,?,?,?)',def[0],starts,index===1?45:60,coachId,12,1500,d===2&&slot===1?'cancelled':'available',def[1],def[2],def[3]).lastInsertRowid);
      const occupied = d === 1 && slot === 1 ? 12 : d === 0 ? 10 : 3 + ((d + slot) % 5);
      if (d !== 2 || slot !== 1) for (let i=0;i<occupied;i++) {
        run('INSERT INTO bookings(reference,token,class_id,first_name,last_name,email,phone,status,payment_status,amount,source,expires,idempotency,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',`DEMO-${n}-${i}`,token(),n,`Participant ${i+1}`,'Fictif',`participant${i+1}@example.test`,'','confirmed','succeeded',1500,i%2?'accueil':'online',null,token(),new Date().toISOString());
      }
    }
  }
}
seedClasses();
function classes() {
  expire();
  return all(`SELECT c.*,co.name AS coach,co.initials,c.capacity-(SELECT COUNT(*) FROM bookings b WHERE b.class_id=c.id AND b.status IN ('confirmed','pending')) AS remaining FROM classes c JOIN coaches co ON co.id=c.coach_id ORDER BY starts`);
}
function getClass(id) { const c=classes().find(c=>c.id===Number(id)); if (!c) fail('Séance introuvable.',404); return c; }
function book(body, source = 'online') {
  const p=participant(body), key=textField(body.idempotency,'Identifiant de tentative',12,150);
  return transaction(()=>{
    expire();
    const existing=one('SELECT * FROM bookings WHERE idempotency=?',key);
    if(existing) { if(existing.email!==p.email||existing.class_id!==Number(body.class_id)) fail('Cet identifiant de tentative est déjà utilisé.',409); return existing; }
    const c=getClass(body.class_id);
    if(Date.parse(c.starts)<=Date.now()) fail('Cette séance est passée. Choisissez une prochaine séance.',409);
    if(c.status==='cancelled') fail('Cette séance est annulée. Choisissez une autre séance.',409);
    if(c.discipline==='Coaching individuel') fail('Le coaching individuel se réserve sur demande.',409);
    if(c.remaining<1) fail('Cette séance est complète. Choisissez un autre créneau.',409);
    if(one("SELECT id FROM bookings WHERE class_id=? AND email=? AND status IN ('confirmed','pending')",c.id,p.email)) fail('Une réservation existe déjà pour cet e-mail et cette séance. Utilisez son lien personnel.',409);
    const personalToken=token(),reference=`BIT-${randomBytes(5).toString('hex').toUpperCase()}`;
    run('INSERT INTO bookings(reference,token,class_id,first_name,last_name,email,phone,status,payment_status,amount,source,expires,idempotency,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',reference,personalToken,c.id,p.first,p.last,p.email,p.phone,'pending','pending',c.price,source,Date.now()+10*60*1000,key,new Date().toISOString());
    event('booking_started');
    return one('SELECT * FROM bookings WHERE token=?',personalToken);
  });
}
function bookingByToken(value) { expire(); const b=one('SELECT * FROM bookings WHERE token=?',value); if(!b) fail('Lien personnel invalide ou réservation introuvable.',404); return b; }
function bookingView(b) { return {...b, session:getClass(b.class_id), demo:true, email_sent:false}; }
function pay(value, outcome) {
  return transaction(()=>{
    const b=bookingByToken(value);
    if(b.status==='confirmed'&&b.payment_status==='succeeded') return bookingView(b);
    if(b.status!=='pending'||b.payment_status!=='pending') fail('Cette tentative n’est plus active. Revenez au planning pour réserver.',409);
    const c=getClass(b.class_id);
    if(c.status==='cancelled'||Date.parse(c.starts)<=Date.now()) fail('La séance n’est plus disponible.',409);
    if(outcome==='pending') return bookingView(b);
    if(!['succeeded','declined'].includes(outcome)) fail('Résultat de paiement invalide.');
    run('UPDATE bookings SET status=?,payment_status=?,expires=NULL WHERE id=?',outcome==='succeeded'?'confirmed':'cancelled',outcome,b.id);
    if(outcome==='succeeded') event('payment_confirmed');
    return bookingView(bookingByToken(value));
  });
}
function cancel(value) {
  return transaction(()=>{
    const b=bookingByToken(value);
    if(['cancelled','expired'].includes(b.status)) return bookingView(b);
    if(b.status==='confirmed'&&Date.parse(getClass(b.class_id).starts)-Date.now()<86400000) fail('Le délai de 24 heures est dépassé. L’annulation et le remboursement ne sont plus possibles.',409);
    run("UPDATE bookings SET status='cancelled',payment_status=?,expires=NULL WHERE id=?",b.payment_status==='succeeded'?'refunded':b.payment_status==='pending'?'cancelled':b.payment_status,b.id);
    event('booking_cancelled'); return bookingView(bookingByToken(value));
  });
}
const rates = new Map();
function rate(req, group, limit=60) {
  const key=group+':'+req.socket.remoteAddress, now=Date.now(), prev=rates.get(key);
  const value=prev&&prev.until>now?prev:{count:0,until:now+60000}; value.count++; rates.set(key,value);
  if(rates.size>10000) for(const [k,v] of rates) if(v.until<now) rates.delete(k);
  if(value.count>limit) fail('Trop de tentatives. Réessayez dans une minute.',429);
}
function employee(req, roles=['admin','accueil','coach']) {
  const cookie=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('basic_session='))?.slice(14);
  const user=cookie&&one('SELECT e.id,e.name,e.email,e.role,e.coach_id,e.active FROM auth a JOIN employees e ON e.id=a.employee_id WHERE a.token=? AND a.expires>?',hash(cookie),Date.now());
  if(!user||!user.active) fail('Connectez-vous à l’espace salarié.',401);
  if(!roles.includes(user.role)) fail('Votre profil ne permet pas cette action.',403);
  return user;
}
function scopedClass(user,id) { const c=getClass(id); if(user.role==='coach'&&c.coach_id!==user.coach_id) fail('Cette séance appartient à un autre coach.',403); return c; }
async function bodyOf(req) { let raw=''; for await (const part of req) {raw+=part; if(Buffer.byteLength(raw)>20000) fail('Formulaire trop volumineux.',413);} try {return JSON.parse(raw||'{}');} catch {fail('Le formulaire reçu est invalide.');} }
const headers={ 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
function send(res,status,data,extra={}) {res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8',...extra});res.end(JSON.stringify(data));}
async function api(req,res,url) {
  const path=url.pathname, method=req.method;
  if(!['GET','HEAD'].includes(method)) {
    // Un navigateur doit provenir de notre origine. Les scripts sans Origin sont également refusés.
    const origin=req.headers.origin;
    let parsedOrigin;try{parsedOrigin=new URL(origin);}catch{fail('Origine du formulaire refusée. Rechargez le site.',403);}
    if(!['http:','https:'].includes(parsedOrigin.protocol) || parsedOrigin.host!==req.headers.host) fail('Origine du formulaire refusée. Rechargez le site.',403);
    if(!req.headers['content-type']?.startsWith('application/json')) fail('Format de formulaire refusé.',415);
    rate(req,'write',100);
  }
  if(path==='/api/public'&&method==='GET') {
    const settings=Object.fromEntries(all('SELECT * FROM settings').map(v=>[v.key,v.value])); delete settings.missed_calls;
    return send(res,200,{demo:true,coaches:all('SELECT * FROM coaches'),offers:all('SELECT * FROM offers'),classes:classes().filter(c=>Date.parse(c.starts)>Date.now()),disciplines:disciplines.map(d=>({name:d[0],level:d[1],equipment:d[2],description:d[3]})),settings});
  }
  if(path==='/api/events'&&method==='POST') {rate(req,'events',50);const b=await bodyOf(req);if(['planning_viewed','class_viewed','payment_started'].includes(b.type)) event(b.type);return send(res,200,{ok:true});}
  if(path==='/api/bookings'&&method==='POST') {rate(req,'bookings',20);return send(res,201,bookingView(book(await bodyOf(req))));}
  const personal=path.match(/^\/api\/bookings\/([\w-]{40,50})(?:\/(pay|cancel|calendar))?$/);
  if(personal) {
    const b=bookingByToken(personal[1]);
    if(method==='GET'&&!personal[2]) return send(res,200,bookingView(b));
    if(method==='POST'&&personal[2]==='pay') return send(res,200,pay(personal[1],(await bodyOf(req)).outcome));
    if(method==='POST'&&personal[2]==='cancel') return send(res,200,cancel(personal[1]));
    if(method==='GET'&&personal[2]==='calendar') {
      if(b.status!=='confirmed') fail('Seules les réservations confirmées peuvent être ajoutées au calendrier.',409);
      const c=getClass(b.class_id),stamp=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
      const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Basic IT//Demonstration//FR','BEGIN:VEVENT',`UID:${b.reference}@basic-it.test`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(c.starts)}`,`DTEND:${stamp(Date.parse(c.starts)+c.duration*60000)}`,`SUMMARY:Basic IT - ${c.discipline}`, 'DESCRIPTION:Séance fictive de démonstration. Aucun paiement réel.','END:VEVENT','END:VCALENDAR',''].join('\r\n');
      res.writeHead(200,{...headers,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="${b.reference}.ics"`});return res.end(content);
    }
  }
  if(path==='/api/contact'&&method==='POST') {
    rate(req,'contact',5);const b=await bodyOf(req);if(b.website) fail('Formulaire refusé.');
    const email=participant({first_name:b.name,last_name:'Contact',email:b.email}).email;
    run('INSERT INTO messages(name,email,subject,message,created) VALUES (?,?,?,?,?)',textField(b.name,'Nom',2,120),email,textField(b.subject,'Objet',2,120),textField(b.message,'Message',10,3000),new Date().toISOString());
    return send(res,201,{message:'Votre message de démonstration est enregistré. Aucun e-mail n’a été envoyé.'});
  }
  if(path==='/api/login'&&method==='POST') {
    rate(req,'login',8); const b=await bodyOf(req), email=textField(b.email,'E-mail',5,254).toLowerCase(),pwd=textField(b.password,'Mot de passe',1,256);
    const user=one('SELECT * FROM employees WHERE email=? AND active=1',email);
    if(!user||!passwordMatches(pwd,user.password)) fail('E-mail ou mot de passe incorrect.',401);
    const session=token();run('INSERT INTO auth(token,employee_id,expires) VALUES (?,?,?)',hash(session),user.id,Date.now()+8*3600000);
    return send(res,200,{ok:true},{'Set-Cookie':`basic_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='1'?'; Secure':''}`});
  }
  if(path==='/api/logout'&&method==='POST') {
    const raw=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('basic_session='))?.slice(14);
    if(raw) run('DELETE FROM auth WHERE token=?',hash(raw));
    return send(res,200,{ok:true},{'Set-Cookie':'basic_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  }
  if(path.startsWith('/api/staff')) {
    const user=employee(req); expire();
    if(path==='/api/staff'&&method==='GET') {
      const list=classes().filter(c=>user.role!=='coach'||c.coach_id===user.coach_id);
      const bookings=all(`SELECT b.id,b.reference,b.class_id,b.first_name,b.last_name,b.email,b.phone,b.status,b.payment_status,b.amount,b.source,b.created,b.attended,c.discipline,c.starts,co.name AS coach FROM bookings b JOIN classes c ON c.id=b.class_id JOIN coaches co ON co.id=c.coach_id ${user.role==='coach'?'WHERE c.coach_id=?':''} ORDER BY b.created DESC`,...(user.role==='coach'?[user.coach_id]:[]));
      const settings=user.role==='admin'?Object.fromEntries(all('SELECT * FROM settings').map(v=>[v.key,v.value])):null;
      return send(res,200,{user,classes:list,bookings,employees:user.role==='admin'?all('SELECT id,name,email,role,coach_id,active FROM employees'):[],events:user.role==='admin'?all('SELECT type,COUNT(*) AS count FROM events GROUP BY type'):[],messages:user.role==='admin'?all('SELECT * FROM messages ORDER BY id DESC LIMIT 100'):[],settings});
    }
    if(path==='/api/staff/bookings'&&method==='POST') {
      employee(req,['admin','accueil']); const b=await bodyOf(req);const created=book(b,'accueil');
      return send(res,201,b.payment_status==='succeeded'?pay(created.token,'succeeded'):bookingView(created));
    }
    const attendance=path.match(/^\/api\/staff\/bookings\/(\d+)\/attendance$/);
    if(attendance&&method==='POST') {
      const b=one('SELECT * FROM bookings WHERE id=?',+attendance[1]);if(!b) fail('Réservation introuvable.',404);scopedClass(user,b.class_id);
      if(b.status!=='confirmed') fail('La réservation doit être confirmée pour renseigner une présence.',409);
      const body=await bodyOf(req);run('UPDATE bookings SET attended=? WHERE id=?',body.attended?1:0,b.id);return send(res,200,{ok:true});
    }
    const staffCancel=path.match(/^\/api\/staff\/bookings\/(\d+)\/cancel$/);
    if(staffCancel&&method==='POST') {employee(req,['admin','accueil']); const b=one('SELECT * FROM bookings WHERE id=?',+staffCancel[1]);if(!b)fail('Réservation introuvable.',404);return send(res,200,cancel(b.token));}
    if(path==='/api/staff/export'&&method==='GET') {
      employee(req,['admin','accueil']); const rows=all('SELECT reference,first_name,last_name,email,class_id,status,payment_status,source,amount,attended FROM bookings ORDER BY id');
      // Neutraliser également les formules de tableur dans les champs saisis.
      const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
      const csv='\uFEFF'+['Référence;Prénom;Nom;E-mail;Séance;Réservation;Paiement;Origine;Centimes;Présence',...rows.map(r=>Object.values(r).map(cell).join(';'))].join('\r\n');
      res.writeHead(200,{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="reservations-demo.csv"'});return res.end(csv);
    }
    if(path==='/api/staff/classes'&&method==='POST') {
      employee(req,['admin']);const b=await bodyOf(req);return send(res,201,saveClass(b));
    }
    const classRoute=path.match(/^\/api\/staff\/classes\/(\d+)$/);
    if(classRoute&&method==='PATCH') {employee(req,['admin']);const b=await bodyOf(req);return send(res,200,saveClass(b,+classRoute[1]));}
    if(path==='/api/staff/employees'&&method==='POST') {
      employee(req,['admin']);const b=await bodyOf(req);const p=participant({first_name:b.name,last_name:'Salarié',email:b.email});
      if(!['admin','accueil','coach'].includes(b.role)) fail('Profil invalide.');
      const coachId=b.role==='coach'?integer(b.coach_id,'Coach',1,4):null;
      run('INSERT INTO employees(name,email,password,role,coach_id) VALUES (?,?,?,?,?)',textField(b.name,'Nom',2,100),p.email,passwordHash(textField(b.password,'Mot de passe',12,128)),b.role,coachId);
      return send(res,201,{ok:true});
    }
    const emp=path.match(/^\/api\/staff\/employees\/(\d+)$/);
    if(emp&&method==='PATCH') {
      employee(req,['admin']);const b=await bodyOf(req),id=+emp[1];if(id===user.id) fail('Votre propre compte ne peut pas être modifié ici.');
      if(!one('SELECT id FROM employees WHERE id=?',id)) fail('Salarié introuvable.',404);
      if(!['admin','accueil','coach'].includes(b.role)) fail('Profil invalide.');
      run('UPDATE employees SET role=?,coach_id=?,active=? WHERE id=?',b.role,b.role==='coach'?integer(b.coach_id,'Coach',1,4):null,b.active?1:0,id);run('DELETE FROM auth WHERE employee_id=?',id);return send(res,200,{ok:true});
    }
    if(path==='/api/staff/settings'&&method==='PATCH') {
      employee(req,['admin']);const b=await bodyOf(req);
      transaction(()=>{for(const key of ['address','phone','email','hours','missed_calls']) if(b[key]!==undefined) {const value=key==='missed_calls'?String(integer(b[key],'Appels manqués',0,999999)):textField(b[key],key,1,500); run('UPDATE settings SET value=? WHERE key=?',value,key);}});
      return send(res,200,{ok:true});
    }
    const offer=path.match(/^\/api\/staff\/offers\/(\d+)$/);
    if(offer&&method==='PATCH') {
      employee(req,['admin']);const b=await bodyOf(req);if(!one('SELECT id FROM offers WHERE id=?',+offer[1]))fail('Offre introuvable.',404);
      transaction(()=>{run('UPDATE offers SET price=?,description=?,conditions=? WHERE id=?',integer(b.price,'Prix en centimes',100,100000),textField(b.description,'Description',10,1000),textField(b.conditions,'Conditions',10,1000),+offer[1]);});return send(res,200,{ok:true});
    }
    fail('Action introuvable.',404);
  }
  fail('Ressource introuvable.',404);
}
function saveClass(b,id) {
  return transaction(()=>{
    const old=id?getClass(id):null;
    const discipline=textField(b.discipline,'Discipline'); if(!disciplines.some(d=>d[0]===discipline))fail('Discipline inconnue.');
    const starts=new Date(b.starts);if(!Number.isFinite(starts.getTime())||starts.getTime()<=Date.now())fail('Choisissez une date et une heure futures.');
    const capacity=integer(b.capacity,'Capacité',1,100),coach=integer(b.coach_id,'Coach',1,4),duration=integer(b.duration,'Durée',15,180),price=integer(b.price,'Prix en centimes',100,100000);
    if(!['available','cancelled'].includes(b.status)) fail('Statut de séance invalide.');
    const occupied=old?old.capacity-old.remaining:0;if(capacity<occupied)fail(`Au moins ${occupied} places sont déjà réservées.`,409);
    const def=disciplines.find(d=>d[0]===discipline);
    if(id) run('UPDATE classes SET discipline=?,starts=?,duration=?,coach_id=?,capacity=?,price=?,status=?,level=?,equipment=?,description=? WHERE id=?',discipline,starts.toISOString(),duration,coach,capacity,price,b.status,def[1],def[2],def[3],id);
    else id=Number(run('INSERT INTO classes(discipline,starts,duration,coach_id,capacity,price,status,level,equipment,description) VALUES (?,?,?,?,?,?,?,?,?,?)',discipline,starts.toISOString(),duration,coach,capacity,price,b.status,def[1],def[2],def[3]).lastInsertRowid);
    if(b.status==='cancelled') {run("UPDATE bookings SET status='cancelled',payment_status=CASE WHEN payment_status='succeeded' THEN 'refunded' WHEN payment_status='pending' THEN 'cancelled' ELSE payment_status END,expires=NULL WHERE class_id=? AND status IN ('confirmed','pending')",id);}
    return getClass(id);
  });
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')) return await api(req,res,url);
    if(!['GET','HEAD'].includes(req.method)) fail('Méthode non autorisée.',405);
    const path=resolve(root,'public','.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(resolve(root,'public')+'/')&&!path.startsWith(resolve(root,'public')+'\\')) fail('Accès interdit.',403);
    if(!existsSync(path)) fail('Page introuvable.',404);
    const content=readFileSync(path);res.writeHead(200,{...headers,'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':path.includes('assets')?'public, max-age=86400':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
  } catch(e) {
    const isConstraint=e.message?.includes('UNIQUE constraint');
    const status=e.status||(isConstraint?409:500);
    if(status===500) console.error(e);
    send(res,status,{error:isConstraint?'Cette donnée existe déjà. Vérifiez l’e-mail ou la réservation.':status===500?'Une erreur est survenue. Réessayez dans un instant.':e.message});
  }
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`Basic IT : http://${process.env.HOST||'127.0.0.1'}:${server.address().port} (démonstration)`));
