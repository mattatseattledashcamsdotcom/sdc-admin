#!/usr/bin/env node
// push-groups.js — creates all option groups and assigns products in one shot
// Usage: node push-groups.js YOUR_ADMIN_PASSWORD

const WORKER = 'https://sdc-worker.solitary-truth-a9af.workers.dev';
const SECRET = process.argv[2];
if (!SECRET) { console.error('Usage: node push-groups.js PASSWORD'); process.exit(1); }

async function req(method, path, body) {
  const res = await fetch(`${WORKER}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}
const post = (path, body) => req('POST', path, body);
const put  = (path, body) => req('PUT',  path, body);

// ── Product IDs ───────────────────────────────────────────────────────────
const P = {
  HK4:    { pid: 'gid://shopify/Product/7437467058253', vid: 'gid://shopify/ProductVariant/41611558453325' },
  HK6:    { pid: 'gid://shopify/Product/7576580423757', vid: 'gid://shopify/ProductVariant/42140035219533' },
  SD128:  { pid: 'gid://shopify/Product/7437466992717', vid: 'gid://shopify/ProductVariant/41611558387789' },
  SD256:  { pid: 'gid://shopify/Product/7437466927181', vid: 'gid://shopify/ProductVariant/41611558289485' },
  SD512:  { pid: 'gid://shopify/Product/7437467582541', vid: 'gid://shopify/ProductVariant/41611558977613' },
  VSD128: { pid: 'gid://shopify/Product/7744067895373', vid: 'gid://shopify/ProductVariant/42797871398989' },
  VSD256: { pid: 'gid://shopify/Product/7744067862605', vid: 'gid://shopify/ProductVariant/42797871366221' },
  VSD512: { pid: 'gid://shopify/Product/7744067665997', vid: 'gid://shopify/ProductVariant/42797870874701' },
  REMOTE: { pid: 'gid://shopify/Product/7437467189325', vid: 'gid://shopify/ProductVariant/41611558584397' },
  LTE:    { pid: 'gid://shopify/Product/7652792696909', vid: 'gid://shopify/ProductVariant/42533991612493' },
  EURO:   { pid: 'gid://shopify/Product/7509895970893', vid: 'gid://shopify/ProductVariant/41880940511309' },
};

// Bundled install SKU variants ($100 cheaper — for camera buyers)
const INSTALL = {
  '1ch': 'gid://shopify/ProductVariant/42026033938509', // $149.99
  '2ch': 'gid://shopify/ProductVariant/42026033971277', // $249.99
  '3ch': 'gid://shopify/ProductVariant/42026034004045', // $269.99
  'bat': 'gid://shopify/ProductVariant/42026034233421', // $149.99
  'wat': 'gid://shopify/ProductVariant/42034505416781', // $399.00 — waterproof rear (A229SW)
};

// ── Accessory builders ────────────────────────────────────────────────────
const accReq = (p, section, byo=1) => ({
  type:'required', shopify_product_id:p.pid, default_variant_id:p.vid,
  section_label:section, note:null, byo_enabled:byo, is_locked:0, preselected:0,
});
const accOpt = (p) => ({
  type:'optional', shopify_product_id:p.pid, default_variant_id:p.vid,
  section_label:null, note:null, byo_enabled:0, is_locked:0, preselected:0,
});

const hwk4 = () => accReq(P.HK4, 'Hardwire Kit');
const hwk6 = () => accReq(P.HK6, 'Hardwire Kit');
const viofoSD   = () => [accReq(P.SD128,'SD Card'), accReq(P.SD256,'SD Card'), accReq(P.SD512,'SD Card')];
const vueroidSD = () => [accReq(P.VSD128,'SD Card'), accReq(P.VSD256,'SD Card'), accReq(P.VSD512,'SD Card')];

// ── Groups ────────────────────────────────────────────────────────────────
const GROUPS = [
  // VIOFO Standard (HK4)
  { name:'VIOFO 1-Channel (HK4)',             ch:1, sku:INSTALL['1ch'],
    acc:[hwk4(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7517492772941','gid://shopify/Product/7683637837901'] },

  { name:'VIOFO 2-Channel (HK4)',             ch:2, sku:INSTALL['2ch'],
    acc:[hwk4(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7437467254861','gid://shopify/Product/7437467484237','gid://shopify/Product/7545249005645'] },

  { name:'VIOFO A229SW 2-Channel (Waterproof)', ch:2, sku:INSTALL['wat'],
    acc:[hwk4(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7545242812493'] },

  { name:'VIOFO 3-Channel (HK4)',             ch:3, sku:INSTALL['3ch'],
    acc:[hwk4(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7437467418701','gid://shopify/Product/7596546457677','gid://shopify/Product/7545237831757'] },

  // VIOFO A329S Series (HK6)
  { name:'VIOFO A329S 1-Channel (HK6)',       ch:1, sku:INSTALL['1ch'],
    acc:[hwk6(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7517493297229'] },

  { name:'VIOFO A329S 2-Channel (HK6)',       ch:2, sku:INSTALL['2ch'],
    acc:[hwk6(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7511462182989','gid://shopify/Product/7437467648077'] },

  { name:'VIOFO A329S 3-Channel (HK6)',       ch:3, sku:INSTALL['3ch'],
    acc:[hwk6(), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7511463788621','gid://shopify/Product/7511464869965'] },

  // Thinkware (HWK in box)
  { name:'Thinkware 2-Channel',               ch:2, sku:INSTALL['2ch'],
    acc:[...viofoSD(), accOpt(P.LTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7593701834829'] },

  // Vueroid (HWK in box)
  { name:'Vueroid 2-Channel',                 ch:2, sku:INSTALL['2ch'],
    acc:[...vueroidSD(), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7703929782349','gid://shopify/Product/7437467517005'] },

  { name:'Vueroid 3-Channel',                 ch:3, sku:INSTALL['3ch'],
    acc:[...vueroidSD(), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7703952097357'] },

  // Battery packs
  { name:'Battery Pack',                      ch:0, sku:INSTALL['bat'],
    acc:[accOpt(P.EURO)],
    cams:['gid://shopify/Product/7683635970125','gid://shopify/Product/7683640361037'] },

  // BYO — product IS the labor, install_sku_id null, SD+HWK optional
  { name:'BYO 1-Channel Install',             ch:1, sku:null,
    acc:[accReq(P.HK4,'Hardwire Kit'), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7461021876301'] },

  { name:'BYO 2-Channel Install',             ch:2, sku:null,
    acc:[accReq(P.HK4,'Hardwire Kit'), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7461021909069'] },

  { name:'BYO 3-Channel Install',             ch:3, sku:null,
    acc:[accReq(P.HK4,'Hardwire Kit'), ...viofoSD(), accOpt(P.REMOTE), accOpt(P.EURO)],
    cams:['gid://shopify/Product/7461022859341'] },
];

const BASE_META = {
  flow_type: 'standard',
  block_req_visible: 1, block_req_expanded: 1,
  block_opt_visible: 1, block_opt_expanded: 0,
  block_upsell_visible: 0, block_upsell_expanded: 0,
  wte_content: null, confirmation_turnaround: '12 business hours',
};

(async () => {
  console.log(`\nCreating ${GROUPS.length} groups → ${WORKER}\n`);
  for (const g of GROUPS) {
    try {
      // Step 1: create group (POST doesn't save accessories)
      const created = await post('/admin/groups', {
        ...BASE_META, name: g.name, channel_count: g.ch, install_sku_id: g.sku,
      });

      // Step 2: PUT to save accessories
      await put(`/admin/groups/${created.id}`, {
        ...BASE_META, name: g.name, channel_count: g.ch, install_sku_id: g.sku,
        accessories: g.acc, upsells: [],
      });

      // Step 3: assign products
      await post('/admin/camera-assignments', { shopify_product_ids: g.cams, group_id: created.id });

      console.log(`  ok  ${g.name}  (${g.cams.length} product${g.cams.length>1?'s':''})`);
    } catch (e) {
      console.log(`  ERR ${g.name}: ${e.message}`);
    }
  }
  console.log('\nDone. Check Product Configurator to verify.\n');
})();
