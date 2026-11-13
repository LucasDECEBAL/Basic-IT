import { test, expect } from '@playwright/test';

async function choose(page,request) {
  const data=await (await request.get('/api/public')).json();
  const c=data.classes.find(c=>c.remaining>=2&&c.status!=='cancelled'&&Date.parse(c.starts)-Date.now()>2*86400000);
  await page.goto('/#/seance/'+c.id);
  await page.getByRole('link',{name:'Réserver cette séance'}).click();
  await expect(page.getByLabel('Prénom',{exact:true})).toBeVisible();
  return c;
}
async function coordinates(page,email) {
  await page.getByLabel('Prénom',{exact:true}).fill('Camille');
  await page.getByLabel('Nom',{exact:true}).fill('Fictif');
  await page.getByLabel('Adresse e-mail',{exact:false}).fill(email);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Continuer vers le paiement'}).click();
  await expect(page.getByRole('heading',{name:'PRÊT À BOUGER.'})).toBeVisible();
}
async function login(page,role) {
  await page.goto('/#/salaries');
  await page.getByLabel('Adresse e-mail',{exact:true}).fill(role+'@basic-it.test');
  await page.getByLabel('Mot de passe',{exact:true}).fill('DemoSport2027!');
  await page.getByRole('button',{name:'Se connecter',exact:false}).click();
  await expect(page.getByRole('heading',{name:/BONJOUR/})).toBeVisible();
}
test('Accueil : images locales, liens, polices et rendu ordinateur',async({page})=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('VOTRE PROCHAIN');
  await page.getByRole('link',{name:'Aller au contenu'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('heading',{level:1})).toContainText('VOTRE PROCHAIN');
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('a[href="#"],button:not([disabled]):empty').count()).toBe(0);
  await page.screenshot({path:'test-results/accueil-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
test('Planning : filtres, état vide et remise à zéro',async({page,request})=>{
  const count=(await (await request.get('/api/public')).json()).classes.length;
  await page.goto('/#/planning');await expect(page.locator('.session-row').first()).toBeVisible();
  await page.getByRole('combobox',{name:'Discipline',exact:true}).selectOption('Mobilité');
  await expect(page.locator('.session-info h3').first()).toHaveText('Mobilité');
  await page.getByRole('combobox',{name:'Coach',exact:true}).selectOption({label:'Alex Martin'});
  await expect(page.getByRole('heading',{name:'Pas de séance sur ce créneau.'})).toBeVisible();
  await page.getByRole('button',{name:'Voir toutes les séances'}).click();
  await expect(page.locator('.session-row')).toHaveCount(count);
});
test('Paiement : attente, refus, reprise et conservation des coordonnées',async({page,request})=>{
  await choose(page,request);await coordinates(page,`refus-${Date.now()}@example.test`);
  await expect(page.getByText('Total TTC',{exact:true})).toBeVisible();
  await page.getByLabel('Résultat à simuler').selectOption('pending');
  await page.getByRole('button',{name:/Simuler le paiement/}).click();
  await expect(page.getByRole('status').filter({hasText:'Paiement toujours en attente'})).toBeVisible();
  await page.getByLabel('Résultat à simuler').selectOption('declined');
  await page.getByRole('button',{name:/Simuler le paiement/}).click();
  await expect(page.getByRole('heading',{name:'ON RÉESSAIE ?'})).toBeVisible();
  await page.getByRole('link',{name:'Revenir à la réservation'}).click();
  await expect(page.getByLabel('Prénom',{exact:true})).toHaveValue('Camille');
  await expect(page.getByLabel('Nom',{exact:true})).toHaveValue('Fictif');
});
test('Réservation complète : paiement réussi, rechargement, calendrier, annulation',async({page,request})=>{
  await choose(page,request);await coordinates(page,`succes-${Date.now()}@example.test`);
  await page.getByRole('button',{name:/Simuler le paiement/}).click();
  await expect(page.getByRole('heading',{name:'C’EST DANS LE PLANNING.'})).toBeVisible();
  await page.reload();await expect(page.getByText('Réussi (simulation)',{exact:true})).toBeVisible();
  const download=page.waitForEvent('download');await page.getByRole('link',{name:'Ajouter à mon calendrier'}).click();expect((await download).suggestedFilename()).toMatch(/\.ics$/);
  await page.getByRole('button',{name:'Annuler ma réservation',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Confirmer',exact:true}).click();
  await expect(page.getByText('Remboursé (simulation)',{exact:true})).toBeVisible();
});
test('Mobile : menu, pages sans débordement, navigation au clavier',async({page,request})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await page.screenshot({path:'test-results/accueil-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Menu'}).click();await page.getByRole('navigation',{name:'Navigation principale'}).getByRole('link',{name:'Planning',exact:true}).click();
  await expect(page.locator('#filters')).toBeVisible();
  for(const route of ['planning','offres','salle','contact','legal','confidentialite','conditions','cookies','retrouver','salaries']) {
    await page.goto('/#/'+route);await expect(page.locator('main[aria-busy]')).toHaveCount(0);await expect(page.getByRole('heading',{level:1})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
  }
  await choose(page,request);
  await page.getByLabel('Prénom',{exact:true}).focus();await page.keyboard.type('Clavier');await page.keyboard.press('Tab');await page.keyboard.type('Fictif');await page.keyboard.press('Tab');await page.keyboard.type(`clavier-${Date.now()}@example.test`);await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Space');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Continuer vers le paiement'})).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'PRÊT À BOUGER.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/paiement-mobile.png',fullPage:true});
});
test('Accueil salarié : réservation et recherche de participant',async({page})=>{
  await login(page,'accueil');await expect(page.getByRole('button',{name:'Paramètres',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Réservations',exact:true}).click();await page.getByRole('button',{name:'Réserver à l’accueil +'}).click();
  const form=page.locator('#frontdesk-form');await form.getByLabel('Prénom',{exact:true}).fill('AccueilTest');await form.getByLabel('Nom',{exact:true}).fill('Fictif');await form.getByLabel('E-mail',{exact:true}).fill(`accueil-${Date.now()}@example.test`);await form.getByRole('button',{name:'Enregistrer la réservation'}).click();
  await expect(page.getByRole('link',{name:'Ouvrir sa confirmation et son lien personnel'})).toBeVisible();
  await page.getByLabel('Rechercher un participant').fill('AccueilTest');await expect(page.locator('#booking-rows tr')).toHaveCount(1);
  await page.getByRole('checkbox',{name:'Présence de AccueilTest Fictif'}).check();
  await expect(page.getByRole('status').filter({hasText:'Présence enregistrée'})).toBeVisible();
});
test('Coach : séances personnelles, présence et droits limités',async({page})=>{
  await login(page,'coach');await expect(page.getByRole('button',{name:'Salariés',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Séances',exact:true}).click();await expect(page.getByRole('button',{name:'Créer une séance +'})).toHaveCount(0);
  await expect(page.locator('tbody tr td:nth-child(3)').first()).toHaveText('Alex Martin');
  expect(await page.locator('tbody tr td:nth-child(3)').allTextContents()).toEqual(expect.arrayContaining(['Alex Martin']));
  await page.getByRole('button',{name:'Participants',exact:true}).first().click();
  await expect(page.getByLabel('Rechercher un participant')).toBeVisible();await expect(page.getByRole('button',{name:'Réserver à l’accueil +'})).toHaveCount(0);
});
test('Administrateur : création puis modification d’une séance et pages de gestion',async({page})=>{
  await login(page,'admin');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/espace-salarie.png',fullPage:true});
  await page.getByRole('button',{name:'Séances',exact:true}).click();await page.getByRole('button',{name:'Créer une séance +'}).click();
  const form=page.locator('#session-form'),d=new Date(Date.now()+8*86400000).toISOString().slice(0,10);
  await form.getByLabel('Date et heure (Paris)').fill(d+'T14:30');await form.getByLabel('Capacité').fill('8');await form.getByRole('button',{name:'Créer la séance'}).click();
  await expect(page.getByRole('status').filter({hasText:'Séance enregistrée'})).toBeVisible();
  const row=page.locator('tr').filter({hasText:'14:30'});await row.getByRole('button',{name:'Modifier',exact:true}).click();
  await page.locator('#session-form').getByLabel('Capacité').fill('9');await page.getByRole('button',{name:'Enregistrer les modifications'}).click();
  await page.getByRole('button',{name:'Confirmer',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Séance enregistrée'})).toBeVisible();
  for(const tab of ['Salariés','Offres','Paramètres']){await page.getByRole('button',{name:tab,exact:true}).click();await expect(page.locator('#staff-content')).not.toBeEmpty();}
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Se déconnecter'}).click();await expect(page.getByRole('button',{name:'Se connecter',exact:false})).toBeVisible();
});
