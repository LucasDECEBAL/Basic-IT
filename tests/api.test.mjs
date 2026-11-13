import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('Parcours métier, persistance et sécurité de la démonstration',async t=>{
  const directory=mkdtempSync(join(tmpdir(),'basic-it-')),database=join(directory,'test.sqlite');
  let child,base;
  async function start() {
    child=spawn(process.execPath,['server.mjs'],{env:{...process.env,DB_PATH:database,PORT:'0',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
    base=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127.0.0.1:\d+/);if(match)resolve(match[0]);});child.on('error',reject);child.on('exit',code=>reject(new Error('Serveur arrêté : '+code)));});
  }
  async function stop(){if(child&&!child.killed){const closed=new Promise(resolve=>child.once('exit',resolve));child.kill();await closed;}}
  async function request(path,method='GET',body,cookie,withOrigin=true) {
    const response=await fetch(base+path,{method,headers:{...(method!=='GET'?{'Content-Type':'application/json',...(withOrigin?{Origin:base}:{})}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,json:response.headers.get('content-type')?.includes('application/json')?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  const client=(classId,extra={})=>({class_id:classId,first_name:'Camille',last_name:'Fictif',email:`test-${crypto.randomUUID()}@example.test`,idempotency:crypto.randomUUID(),...extra});
  const login=async role=>{const r=await request('/api/login','POST',{email:`${role}@basic-it.test`,password:'DemoSport2027!'});assert.equal(r.status,200);return r.cookie;};
  let publicData,admin,accueil,coach,booking,target;
  try {
    await start();
    await t.test('Données publiques cohérentes et sans informations clients',async()=>{
      const r=await request('/api/public');assert.equal(r.status,200);publicData=r.json;
      assert.ok(publicData.classes.length>=26);assert.equal(publicData.coaches.length,4);assert.equal(publicData.disciplines.length,6);
      assert.ok(publicData.classes.some(c=>c.remaining===0));assert.ok(publicData.classes.some(c=>c.status==='cancelled'));
      assert.ok(!JSON.stringify(publicData).includes('participant1@'));assert.ok(!('employees' in publicData));
      target=publicData.classes.find(c=>c.remaining>=3&&Date.parse(c.starts)-Date.now()>86400000);
    });
    await t.test('Accès non autorisés et origine du formulaire refusés',async()=>{
      assert.equal((await request('/api/staff')).status,401);
      assert.equal((await request('/api/staff/export')).status,401);
      assert.equal((await request('/api/bookings','POST',client(target.id),null,false)).status,403);
      assert.equal((await request('/data/basic-it.sqlite')).status,404);
    });
    await t.test('Séances complètes, annulées et passées refusées côté serveur',async()=>{
      for(const c of [publicData.classes.find(c=>c.remaining===0),publicData.classes.find(c=>c.status==='cancelled')])assert.equal((await request('/api/bookings','POST',client(c.id))).status,409);
      const db=new DatabaseSync(database);const info=db.prepare("INSERT INTO classes(discipline,starts,duration,coach_id,capacity,price,status,level,equipment,description) VALUES ('HIIT','2020-01-01T10:00:00Z',45,1,12,1500,'available','Tous niveaux','Gourde','Test passé')").run();db.close();
      assert.equal((await request('/api/bookings','POST',client(Number(info.lastInsertRowid)))).status,409);
    });
    await t.test('Validation du participant et total connu avant paiement',async()=>{
      assert.equal((await request('/api/bookings','POST',client(target.id,{email:'invalide'}))).status,400);
      const r=await request('/api/bookings','POST',client(target.id));assert.equal(r.status,201);booking=r.json;
      assert.equal(booking.amount,target.price);assert.equal(booking.status,'pending');assert.equal(booking.payment_status,'pending');
      assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining-1);
    });
    await t.test('Paiement en attente puis refusé : aucune confirmation, place libérée',async()=>{
      let r=await request(`/api/bookings/${booking.token}/pay`,'POST',{outcome:'pending'});assert.equal(r.json.status,'pending');
      r=await request(`/api/bookings/${booking.token}/pay`,'POST',{outcome:'declined'});assert.equal(r.json.status,'cancelled');assert.equal(r.json.payment_status,'declined');
      assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining);
    });
    await t.test('Double clic et paiements répétés : une seule réservation',async()=>{
      const body=client(target.id);const results=await Promise.all([request('/api/bookings','POST',body),request('/api/bookings','POST',body)]);
      assert.equal(results[0].json.reference,results[1].json.reference);booking=results[0].json;
      const outcomes=await Promise.all([request(`/api/bookings/${booking.token}/pay`,'POST',{outcome:'succeeded'}),request(`/api/bookings/${booking.token}/pay`,'POST',{outcome:'succeeded'})]);
      for(const r of outcomes){assert.equal(r.status,200);assert.equal(r.json.status,'confirmed');}
      assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining-1);
      assert.equal((await request('/api/bookings','POST',client(target.id,{email:body.email}))).status,409);
    });
    await t.test('Lien personnel et calendrier, sans accès par référence publique',async()=>{
      assert.equal((await request('/api/bookings/'+booking.reference)).status,404);
      assert.equal((await request('/api/bookings/'+'x'.repeat(43))).status,404);
      const cal=await request(`/api/bookings/${booking.token}/calendar`);assert.equal(cal.status,200);assert.match(cal.json,/BEGIN:VCALENDAR/);assert.match(cal.json,/DTSTART:.*Z/);
    });
    await t.test('Annulation à plus de 24 h, remboursement simulé et stock restauré',async()=>{
      const r=await request(`/api/bookings/${booking.token}/cancel`,'POST',{});assert.equal(r.json.status,'cancelled');assert.equal(r.json.payment_status,'refunded');
      assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining);
    });
    await t.test('Délai d’annulation de 24 h appliqué par le serveur',async()=>{
      const soon=(await request('/api/public')).json.classes.find(c=>Date.parse(c.starts)-Date.now()<86400000&&c.remaining>0&&c.status!=='cancelled');assert.ok(soon);
      const b=(await request('/api/bookings','POST',client(soon.id))).json;await request(`/api/bookings/${b.token}/pay`,'POST',{outcome:'succeeded'});
      assert.equal((await request(`/api/bookings/${b.token}/cancel`,'POST',{})).status,409);
    });
    await t.test('Expiration d’un paiement abandonné libère sa place',async()=>{
      const b=(await request('/api/bookings','POST',client(target.id))).json;
      const db=new DatabaseSync(database);db.prepare('UPDATE bookings SET expires=? WHERE id=?').run(Date.now()-1000,b.id);db.close();
      const r=await request('/api/bookings/'+b.token);assert.equal(r.json.status,'expired');
      assert.equal((await request(`/api/bookings/${b.token}/pay`,'POST',{outcome:'succeeded'})).status,409);
      assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining);
    });
    await t.test('Trois profils authentifiés et droits serveur distincts',async()=>{
      admin=await login('admin');accueil=await login('accueil');coach=await login('coach');
      const c=(await request('/api/staff','GET',null,coach)).json;
      assert.equal(c.user.role,'coach');assert.ok(c.classes.every(v=>v.coach_id===1));assert.equal(c.employees.length,0);assert.equal(c.settings,null);
      assert.equal((await request('/api/staff/settings','PATCH',{address:'Test'},accueil)).status,403);
      assert.equal((await request('/api/staff/classes','POST',{},coach)).status,403);
      assert.equal((await request('/api/staff/bookings','POST',client(target.id),coach)).status,403);
      assert.equal((await request('/api/staff/export','GET',null,coach)).status,403);
    });
    await t.test('Réservation accueil : même stock et présence persistante',async()=>{
      const r=await request('/api/staff/bookings','POST',client(target.id,{payment_status:'succeeded'}),accueil);assert.equal(r.status,201);assert.equal(r.json.source,'accueil');assert.equal(r.json.status,'confirmed');
      const b=r.json;assert.equal((await request('/api/public')).json.classes.find(c=>c.id===target.id).remaining,target.remaining-1);
      assert.equal((await request(`/api/staff/bookings/${b.id}/attendance`,'POST',{attended:true},accueil)).status,200);
      assert.equal((await request('/api/staff','GET',null,admin)).json.bookings.find(v=>v.id===b.id).attended,1);
      if(b.session.coach_id!==1)assert.equal((await request(`/api/staff/bookings/${b.id}/attendance`,'POST',{attended:true},coach)).status,403);
      assert.match((await request('/api/staff/export','GET',null,accueil)).json,/Référence/);
    });
    await t.test('Concurrence sur la dernière place : un seul gagnant',async()=>{
      const template={discipline:'HIIT',starts:new Date(Date.now()+5*86400000).toISOString(),duration:45,coach_id:1,capacity:1,price:1500,status:'available'};
      const c=(await request('/api/staff/classes','POST',template,admin)).json;
      const results=await Promise.all([request('/api/bookings','POST',client(c.id)),request('/api/bookings','POST',client(c.id))]);
      assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal((await request('/api/public')).json.classes.find(v=>v.id===c.id).remaining,0);
    });
    await t.test('Administration : modification, capacité protégée, annulation remboursée',async()=>{
      const c=(await request('/api/public')).json.classes.find(v=>v.id===target.id);
      assert.equal((await request('/api/staff/classes/'+c.id,'PATCH',{...c,capacity:1},admin)).status,409);
      assert.equal((await request('/api/staff/classes/'+c.id,'PATCH',{...c,status:'cancelled'},admin)).status,200);
      const related=(await request('/api/staff','GET',null,admin)).json.bookings.filter(b=>b.class_id===c.id);
      assert.ok(related.every(b=>!['confirmed','pending'].includes(b.status)));assert.ok(related.some(b=>b.payment_status==='refunded'));
    });
    await t.test('Contact, offres et paramètres modifiables sans envoi externe',async()=>{
      assert.equal((await request('/api/contact','POST',{name:'Camille Fictif',email:'camille@example.test',subject:'Une question',message:'Une question de démonstration.'})).status,201);
      assert.equal((await request('/api/staff/settings','PATCH',{missed_calls:3},admin)).status,200);
      const offer=publicData.offers[0];assert.equal((await request('/api/staff/offers/'+offer.id,'PATCH',{...offer,price:1600},admin)).status,200);
      const refreshed=(await request('/api/staff','GET',null,admin)).json;assert.equal(refreshed.messages.length,1);assert.equal(refreshed.settings.missed_calls,'3');
    });
    await t.test('Persistance après deux redémarrages et déconnexion effective',async()=>{
      const before=(await request('/api/staff','GET',null,admin)).json.bookings.length;
      for(let i=0;i<2;i++){await stop();await start();assert.equal((await request('/api/staff','GET',null,admin)).json.bookings.length,before);}
      await request('/api/logout','POST',{},admin);assert.equal((await request('/api/staff','GET',null,admin)).status,401);
    });
  }finally{await stop();rmSync(directory,{recursive:true,force:true});}
});
