//
//   ----------------------------------------------------------------------------
//   | Package:     mgsi_node                                                   |
//   | OS:          Unix/Windows                                                |
//   | Description: A Node.js superserver                                       |
//   | Author:      Chris Munt cmunt@mgateway.com                               |
//   |                         chris.e.munt@gmail.com                           |
//   | Copyright(c) 2023 - 2024 MGateway Ltd                                    |
//   | Surrey UK.                                                               |
//   | All rights reserved.                                                     |
//   |                                                                          |
//   | http://www.mgateway.com                                                  |
//   |                                                                          |
//   | Licensed under the Apache License, Version 2.0 (the "License"); you may  |
//   | not use this file except in compliance with the License.                 |
//   | You may obtain a copy of the License at                                  |
//   |                                                                          |
//   | http://www.apache.org/licenses/LICENSE-2.0                               |
//   |                                                                          |
//   | Unless required by applicable law or agreed to in writing, software      |
//   | distributed under the License is distributed on an "AS IS" BASIS,        |
//   | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
//   | See the License for the specific language governing permissions and      |
//   | limitations under the License.                                           |
//   |                                                                          |
//   ----------------------------------------------------------------------------
//

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import net from 'node:net';
import os from 'node:os';
import process from 'node:process';
import child_process from 'node:child_process'

const cpus = os.cpus().length;

const dbx = require('mg-dbx-napi.node');


const DBX_VERSION_MAJOR = 1;
const DBX_VERSION_MINOR = 0;
const DBX_VERSION_BUILD = 2;
const DBX_BUFFER_SIZE = 3641145; // or 32768
const DBX_CMND_OPEN = 1;

let port = 7041;
let primary = true;
let verbose = "";
let vlevel = 0;
let node_path = process.argv[0];
let mod_name = process.argv[1];

if (process.argv.length > 2) {
  port = parseInt(process.argv[2]);
}
if (process.argv.length > 3) {
  verbose = process.argv[3].toLowerCase();;
}
if (verbose === 'verbose') {
  vlevel = 1;
}
if (port === 1000000) {
   primary = false;
}

if (primary) {
  console.log('mgsi_node server version %d.%d.%d for Node.js %s; CPUs=%d; pid=%d;', DBX_VERSION_MAJOR, DBX_VERSION_MINOR, DBX_VERSION_BUILD, process.version, cpus, process.pid);

  let server = net.createServer();
  let workers = new Map();

  process.on( 'SIGINT', async function() {
    console.log('*** CTRL & C detected: shutting down gracefully...');

    if (workers.size > 0) {
      for (const [key, worker] of workers) {
        console.log('signalling worker ' + worker.pid + ' to stop: key = ' + key);
        worker.send('<<stop>>');
        workers.delete(key);
      }
      setTimeout(() => {
        process.exit();
      }, 1000);
    }
    else {
      process.exit();
    }
  });

  server.on('connection', (conn) => {    
    let remote_address = conn.remoteAddress + ':' + conn.remotePort;
    if (vlevel === 1) {
      console.log('mgsi_node new client connection from %s', remote_address);
    }
    conn.on('data', (d) => {
      let worker = child_process.fork(mod_name, [1000000, verbose], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

      workers.set(worker.pid, worker);

      worker.on('message', message => {
        if (message === 'ready!') {
          worker.send(d, conn);
          return;
        }

        if (message === 'stopping') {
          if (vlevel === 1) {
            console.log('master process removing stopped worker from Map');
          }
          workers.delete(worker.pid);
        }

      });
    });
  });

  server.listen(port, () => {    
    console.log('mgsi_node server listening on %j;', server.address());  
  });
}
else {
  dbx.init();
  process.on( 'SIGINT', function() {
    console.log('*** CTRL & C detected in worker');
  });

  process.on( 'SIGTERM', function() {
    console.log('*** SIGTERM detected in worker');
  });

  const evTarget = new EventTarget();

  let data_properties = { len: 0, type: 0, sort: 0 };
  let buffer = new Uint8Array(DBX_BUFFER_SIZE);
  function block_add_string(buffer, offset, data, data_len, data_sort, data_type) {
    offset = block_add_size(buffer, offset, data_len, data_sort, data_type);
    for (let i = 0; i < data_len; i++) {
      buffer[offset++] = data.charCodeAt(i);
    }
    return offset;
  }

  function block_add_size(buffer, offset, data_len, data_sort, data_type) {
    offset = set_size(buffer, offset, data_len);
    buffer[offset] = ((data_sort * 20) + data_type);
    return (offset + 1);
  }

  function block_add_chunk(buffer, offset, data, data_len) {
    offset = set_size(buffer, offset, data_len);
    for (let i = 0; i < data_len; i++) {
      buffer[offset++] = data.charCodeAt(i);
    }
    return offset;
  }

  function add_head(buffer, offset, data_len, cmnd) {
    offset = set_size(buffer, offset, data_len);
    buffer[offset] = cmnd;
    return (offset + 1);
   }

  function block_get_size(buffer, offset, data_properties) {
    data_properties.len = get_size(buffer, offset);
    data_properties.sort = buffer[offset + 4];
    data_properties.type = data_properties.sort % 20;
    data_properties.sort = Math.floor(data_properties.sort / 20);
    return data_properties.len;
  }

  function set_term(buffer, offset) {
    buffer[offset + 0] = 255;
    buffer[offset + 1] = 255;
    buffer[offset + 2] = 255;
    buffer[offset + 3] = 255;
    return (offset + 4);
  }

  function set_size(buffer, offset, data_len) {
    buffer[offset + 0] = (data_len >> 0);
    buffer[offset + 1] = (data_len >> 8);
    buffer[offset + 2] = (data_len >> 16);
    buffer[offset + 3] = (data_len >> 24);
    return (offset + 4);
  }

  function get_size(buffer, offset) {
    return ((buffer[offset + 0]) | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24));
  }

  process.on('message', (data, conn) => {

    if (data === '<<stop>>') {
      console.log('stop child process ' + process.pid);
      evTarget.dispatchEvent(new Event('stop'));
      setTimeout(() => {
        process.exit();
      }, 1000);
      return;
    }

    let remote_address = conn.remoteAddress + ':' + conn.remotePort;
    if (vlevel === 1) {
      console.log('mgsi_node new worker process created pid=%d; client=%s', process.pid, remote_address);
    }

    // turn the Nagle algorithm off
    conn.setNoDelay();
    // tell the web server what we are
    let offset = 0;
    let zv = "Node.js " + process.version;
    offset = block_add_string(buffer, offset, zv, zv.length, 0, 0);
    conn.write(buffer.slice(0, offset));

    conn.on('data', async (data) => {
      let offset = 0;
      let tlen = get_size(data, offset);
      let cmnd = data[4];
      offset += 5;
      let obufsize = get_size(data, offset);
      let utf16 = data[offset + 5];
      offset += 5;
      let idx = get_size(data, offset);
      offset += 5;
      if (vlevel === 1) {
        console.log('>>> Request: command=%d, data_length=%d;', cmnd, tlen);
      }
      let len = 0;
      let str = "";
      if (cmnd === DBX_CMND_OPEN) {
        for (let argc = 0; argc < 100; argc++) {
          len = block_get_size(data, offset, data_properties)
          //console.log(' >>> item argc=%d; offset=%d; len=%d; type=%d; sort=%d;', argc, offset, len, data_properties.type, data_properties.sort);
          offset += 5;
          if (argc === 15) { // replace 'tcp' with local 'api'
            data[offset] = 97;
            data[offset + 1] = 112;
            data[offset + 2] = 105;
          }
          str = data.slice(offset, offset + len).toString();
          //console.log('     >>> data=%s', str);
          offset += len;
          if (data_properties.sort === 9) {
            break;
          }
        }
      }

      const pdata = dbx.command(data, tlen, cmnd, 1);
      len = get_size(data, 0);
      offset = len + 5;
      conn.write(data.slice(0, offset), 'binary');

    });

    conn.on('close', () => {
      if (vlevel === 1) {
        console.log('connection closed');
      }
      process.send('stopping');
      evTarget.dispatchEvent(new Event('stop'));
      setTimeout(() => {
        process.exit();
      }, 2000);
    });

    conn.on('error', (err) => {
      console.log('Connection error: %s', err.message);
    });
  });

  process.send('ready!');

}
