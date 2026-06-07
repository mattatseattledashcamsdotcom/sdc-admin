#!/usr/bin/env node
// One-off: creates just the Battery Pack group
// Usage: node push-battery-group.js YOUR_ADMIN_PASSWORD

const WORKER = 'https://sdc-worker.solitary-truth-a9af.workers.dev';
const SECRET = process.argv[2];
if (!SECRET) { console.error('Usage: node push-battery-group.js PASSWORD'); process.exit(1); }

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

const EURO = { pid: 'gid://shopify/Product/7509895970893', vid: 'gid://shopify/ProductVariant/41880940511309' };
const BASE = {
  flow_type: 'standard',
  block_req_visible: 1, block_req_expanded: 1,
  block_opt_visible: 1, block_opt_expanded: 0,
  block_upsell_visible: 0, block_upsell_expanded: 0,
  wte_content: null, confirmation_turnaround: '12 business hours',
};

(async () => {
  const created = await req('POST', '/admin/groups', {
    ...BASE, name: 'Battery Pack', channel_count: 0,
    install_sku_id: 'gid://shopify/ProductVariant/42026034233421',
  });
  console.log(`Created: ${created.id}`);

  await req('PUT', `/admin/groups/${created.id}`, {
    ...BASE, name: 'Battery Pack', channel_count: 0,
    install_sku_id: 'gid://shopify/ProductVariant/42026034233421',
    accessories: [{ type:'optional', shopify_product_id:EURO.pid, default_variant_id:EURO.vid,
                    section_label:null, note:null, byo_enabled:0, is_locked:0, preselected:0 }],
    upsells: [],
  });

  await req('POST', '/admin/camera-assignments', {
    shopify_product_ids: [
      'gid://shopify/Product/7683635970125', // VIOFO BP100
      'gid://shopify/Product/7683640361037', // iVolt Xtra
    ],
    group_id: created.id,
  });

  console.log('Battery Pack created and cameras assigned.');
})();
