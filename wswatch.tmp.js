const WebSocket = require('ws');
const url = process.argv[2];
const ws = new WebSocket(url);
ws.on('open', () => console.log('WS OPEN'));
ws.on('message', (d) => {
  const s = d.toString();
  try { const j = JSON.parse(s); console.log('FRAME type=' + (j.type || j.event || '?') + ' ' + s.slice(0, 120)); }
  catch { console.log('FRAME raw ' + s.slice(0, 120)); }
});
ws.on('close', (c) => console.log('WS CLOSED code=' + c));
ws.on('error', (e) => console.log('WS ERROR ' + e.message));
setTimeout(() => { ws.close(); process.exit(0); }, 150000);
