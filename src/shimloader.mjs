// Load the correct JavaScript shim
let mod;
if (typeof Bun === 'undefined') {
  mod = await import('mg-dbx-napi/node');
}
else {
  mod = await import('mg-dbx-napi/bun');
}
let server = mod.server;
let mglobal = mod.mglobal;
let mclass = mod.mclass;
export {
  server,
  mglobal,
  mclass
}
