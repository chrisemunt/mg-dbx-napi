//
//   ----------------------------------------------------------------------------
//   | Package:     mg_dbx_napi                                                 |
//   | OS:          Unix/Windows                                                |
//   | Description: An Interface to InterSystems Cache/IRIS and YottaDB         |
//   | Author:      Chris Munt cmunt@mgateway.com                               |
//   |                         chris.e.munt@gmail.com                           |
//   | Copyright(c) 2019 - 2024 MGateway Ltd                                    |
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

let dbx;
let arch = process.arch;
if (arch === 'x64' && process.platform === 'win32') arch = 'win';
if (['win', 'arm64', 'x64'].includes(arch)) {
   dbx = require('mg-dbx-napi/' + arch);
}
else {
   // throw an error - platform not supported
}

//const dbx = require('mg-dbx-napi.node');

const DBX_VERSION_MAJOR       = 1;
const DBX_VERSION_MINOR       = 4;
const DBX_VERSION_BUILD       = 9;

const DBX_DSORT_INVALID       = 0;
const DBX_DSORT_DATA          = 1;
const DBX_DSORT_SUBSCRIPT     = 2;
const DBX_DSORT_GLOBAL        = 3;
const DBX_DSORT_EOD           = 9;
const DBX_DSORT_STATUS        = 10;
const DBX_DSORT_ERROR         = 11;

const DBX_DTYPE_NONE          = 0;
const DBX_DTYPE_STR           = 1;
const DBX_DTYPE_STR8          = 2;
const DBX_DTYPE_STR16         = 3;
const DBX_DTYPE_INT           = 4;
const DBX_DTYPE_INT64         = 5;
const DBX_DTYPE_DOUBLE        = 6;
const DBX_DTYPE_OREF          = 7;
const DBX_DTYPE_NULL          = 10;

const DBX_CMND_OPEN           = 1;
const DBX_CMND_CLOSE          = 2;
const DBX_CMND_NSGET          = 3;
const DBX_CMND_NSSET          = 4;

const DBX_CMND_GSET           = 11;
const DBX_CMND_GGET           = 12;
const DBX_CMND_GNEXT          = 13;
const DBX_CMND_GNEXTDATA      = 131;
const DBX_CMND_GPREVIOUS      = 14;
const DBX_CMND_GPREVIOUSDATA  = 141;
const DBX_CMND_GDELETE        = 15;
const DBX_CMND_GDEFINED       = 16;
const DBX_CMND_GINCREMENT     = 17;
const DBX_CMND_GLOCK          = 18;
const DBX_CMND_GUNLOCK        = 19
const DBX_CMND_GMERGE         = 20;

const DBX_CMND_GNNODE         = 21;
const DBX_CMND_GNNODEDATA     = 211;
const DBX_CMND_GPNODE         = 22;
const DBX_CMND_GPNODEDATA     = 221;

const DBX_CMND_FUNCTION       = 31;

const DBX_CMND_CCMETH         = 41;
const DBX_CMND_CGETP          = 42;
const DBX_CMND_CSETP          = 43;
const DBX_CMND_CMETH          = 44;
const DBX_CMND_CCLOSE         = 45;

const DBX_CMND_GNAMENEXT      = 51;
const DBX_CMND_GNAMEPREVIOUS  = 52;

const DBX_CMND_TSTART         = 61;
const DBX_CMND_TLEVEL         = 62;
const DBX_CMND_TCOMMIT        = 63;
const DBX_CMND_TROLLBACK      = 64;

const DBX_CMND_SQLEXEC        = 71;
const DBX_CMND_SQLROW         = 72;
const DBX_CMND_SQLCLEANUP     = 73;

const DBX_CMND_TIMEOUT        = 101;
const DBX_CMND_CHARSET        = 102;
const DBX_CMND_LOGLEVEL       = 103;
const DBX_CMND_LOGMESSAGE     = 104;

const DBX_SQL_MGSQL           = 1;
const DBX_SQL_ISCSQL          = 2;

const DBX_INPUT_BUFFER_SIZE = 3641145; // or 32768

class server {
   type = "";
   path = "";
   host = "";
   tcp_port = 0;
   username = "";
   password = "";
   nspace = "";
   env_vars = "";
   debug = "";
   server = "";
   server_software = "";
   error_message = "";
   chset = "utf-8";
   use = "";
   timeout = 60;
   init = 0;
   index = 0;
   sql_index = 0;
   utf16 = false;
   buffer = [0, 0, 0, 0, 0, 0, 0, 0];
   buffer_size = [0, 0, 0, 0, 0, 0, 0, 0];

   constructor(...args) {
     this.buffer[0] = new Uint8Array(DBX_INPUT_BUFFER_SIZE);
      this.buffer_size[0] = DBX_INPUT_BUFFER_SIZE;
      return;
   }

   get_buffer() {
      let bidx = 0;
      return bidx;
   }

   release_buffer(bidx) {
      return bidx;
   }

   version() {
      return dbx.version();
   }

   dbversion() {
      if (this.init === 0) {
         const ret = dbx.init();
         this.init ++;
      }
      return dbx.dbversion();
   }

   charset(chset) {
      let offset = 0;
      let request = { command: DBX_CMND_CHARSET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      chset.toLowerCase();
      if (chset === 'utf-8' || chset === 'utf-16' || chset === 'ascii') {
         this.chset = chset;
      }
      if (this.chset === 'utf-16') {
         this.utf16 = true;
      }
      else {
         this.utf16 = false;
      }

      if (this.init === 0) {
         return this.chset();
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_string(this.buffer[bidx], offset, chset, chset.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.utf16);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, this.utf16);
      add_head(this.buffer[bidx], 0, offset, request.command);
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   settimeout(ntimeout) {
      let offset = 0;
      let request = { command: DBX_CMND_TIMEOUT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (ntimeout > 3) {
         this.timeout = ntimeout;
      }

      if (this.init === 0) {
         return this.chset();
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_string(this.buffer[bidx], offset, ntimeout.toString(), ntimeout.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, this.utf16);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   geterrormessage() {
      return this.error_message;
   }

   open(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_OPEN, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         const ret = dbx.init();
         this.init ++;
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      if (args.length > 0) {
         if (typeof args[0] === 'object') {
            if (args[0].hasOwnProperty('type')) {
               this.type = args[0].type.toLowerCase();
            }
            if (args[0].hasOwnProperty('path')) {
               this.path = args[0].path;
            }
            if (args[0].hasOwnProperty('host')) {
               this.host = args[0].host;
            }
            if (args[0].hasOwnProperty('tcp_port')) {
               this.tcp_port = args[0].tcp_port;
            }
            if (args[0].hasOwnProperty('username')) {
               this.username = args[0].username;
            }
            if (args[0].hasOwnProperty('password')) {
               this.password = args[0].password;
            }
            if (args[0].hasOwnProperty('namespace')) {
               this.nspace = args[0].namespace;
            }
            if (args[0].hasOwnProperty('env_vars')) {
               if (typeof args[0].env_vars === 'object') {
                  let envvars = '';
                  for (const name in args[0].env_vars) {
                     envvars = envvars + name + '=' + args[0].env_vars[name] + '\n';
                  }
                  envvars = envvars + '\n';
                  this.env_vars = envvars;
               }
               else {
                  this.env_vars = args[0].env_vars;
               }
            }
            if (args[0].hasOwnProperty('debug')) {
               this.debug = args[0].debug;
            }
            if (args[0].hasOwnProperty('timeout')) {
               this.timeout = args[0].timeout;
            }
            if (args[0].hasOwnProperty('charset')) {
               let chset = args[0].charset.toLowerCase();
               if (chset === 'utf-8' || chset === 'utf-16' || chset === 'ascii') {
                  this.chset = chset;
               }
            }
            if (args[0].hasOwnProperty('use')) {
               let use = args[0].use.toLowerCase();
               if (use === 'api' || use === 'tcp' || use === 'net') {
                  this.use = use;
               }
            }
         }
      }

      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, this.type, this.type.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.path, this.path.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.host, this.host.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.tcp_port.toString(), this.tcp_port.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.username, this.username.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.password, this.password.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.nspace, this.nspace.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.debug, this.debug.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.env_vars, this.env_vars.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.server, this.server.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.server_software, this.server_software.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.timeout.toString(), this.timeout.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.chset, this.chset.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, this.use, this.use.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);

      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }

      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   close(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CLOSE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);

      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }

      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   namespace(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_NSGET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      if (args.length > 0) {
         request.command = DBX_CMND_NSSET;
         offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
         const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      }

      request.command = DBX_CMND_NSGET;
      offset = 0;
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);

      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }

      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   set(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GSET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   get(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GGET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   delete(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GDELETE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   defined(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GDEFINED, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   next(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GNEXT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   previous(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GPREVIOUS, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   increment(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GINCREMENT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   lock(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GLOCK, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   unlock(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GUNLOCK, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   tstart(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_TSTART, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   tlevel(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_TLEVEL, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   tcommit(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_TCOMMIT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   trollback(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_TROLLBACK, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc --;
         }
      }

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer[bidx].length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   function(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_FUNCTION, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }
 
   sleep(msecs) {
      let result = 0;

      result = dbx.sleep(msecs);
      return result;
   }

   classmethod(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CCMETH, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.init === 0) {
         return "";
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      if (request.async) {
         async_command(this, this.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      if (result.type === DBX_DTYPE_OREF) {
         const cls = new mclass(this);
         cls.class_name = args[0];
         cls.oref = request.result_data;
         return cls;
      }

      return request.result_data;
   }
   
   sql(sql_query) {
      const query = new mcursor(this, sql_query);
      return query;
   }

   benchmark(...args) {
      let i = 0;
      let data = "";

      if (this.init === 0) {
         const ret = dbx.init();
         this.init ++;
      }

      let argc = args.length;
      if (argc < 1) {
         return data;
      }
      let context = 0;
      if (argc > 1) {
         context = args[1];
      }

      let bidx = this.get_buffer();
      let istring = args[0];

      for (i = 0; i < istring.length; i ++) {
         this.buffer[bidx][i] = istring.charCodeAt(i);
      }
      this.buffer[bidx][i] = 0;

      if (context === 1) {
         const pdata = dbx.benchmark(this.buffer[bidx], i, 0, 0);
         data = pdata;
      }
      else {
         data = "output string";
      }
      this.release_buffer(bidx);

      return data;
   }

   benchmarkex(...args) {
      let offset = 0;
      let request = { command: 0, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
      let data = 0;

      if (this.init === 0) {
         return data;
      }

      let argc = args.length;
      if (argc < 1) {
         return data;
      }
      let command = 0;
      if (argc === 1) {
         request.command = DBX_CMND_GGET;
      }
      else if (argc === 3) {
         request.command = DBX_CMND_GSET;
      }
      if (request.command === 0) {
         return data;
      }

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      const pdata = dbx.benchmarkex(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   pack_arguments(buffer, offset, index, args, request, context) {
      let str = "";

      if (context === 0) {
         offset = block_add_size(buffer, offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
         offset = block_add_size(buffer, offset, buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
         offset = block_add_size(buffer, offset, index, DBX_DSORT_DATA, DBX_DTYPE_INT);
      }

      request.argc = args.length;
      if (request.argc > 1) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc--;
         }
      }

      for (let argn = 0; argn < request.argc; argn++) {
        //console.log(argn, " = ", args[argn], " : ", typeof args[argn]);
        // v1.4.7
        if (typeof args[argn] === 'number')  
          str = args[argn].toString();
        else
          str = args[argn];
         if (argn == 0)
            offset = block_add_string(buffer, offset, str, str.length, DBX_DSORT_GLOBAL, DBX_DTYPE_STR, this.utf16);
         else
            offset = block_add_string(buffer, offset, str, str.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.utf16);
      }

      offset = block_add_string(buffer, offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
      add_head(buffer, 0, offset, request.command);

      return offset;
   }

   get_result(pbuffer, pdata, request) {
      let data_properties = { len: 0, type: 0, sort: 0 };

      this.error_message = "";
      block_get_size(pbuffer, 0, data_properties);
      //console.log("mg_dbx_napi.js data_view data properties %d => %j", request.command, data_properties);
      if (data_properties.sort === DBX_DSORT_ERROR) {
         if (data_properties.len === 0) {
            request.error_message = ""
         }
         else {
            request.error_message = pdata;
            if (request.error_message === "") {
               request.error_message = "Database Error";
            }
         }
         this.error_message = request.error_message;
      }
      else {
         if (data_properties.len === 0) {
            request.result_data = ""
         }
         else {
            request.result_data = pdata;
         }
         if (request.command === DBX_CMND_GNEXTDATA || request.command === DBX_CMND_GPREVIOUSDATA) {
            let offset = 5;
            block_get_size(pbuffer, offset, data_properties);
            offset += 5;
            let data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
            offset += data_properties.len;
            block_get_size(pbuffer, offset, data_properties);
            offset += 5;
            let key = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
            request.result_data = { "key": key, "data": data };
         }
         else if (request.command === DBX_CMND_GNNODE || request.command === DBX_CMND_GNNODEDATA || request.command === DBX_CMND_GPNODE || request.command === DBX_CMND_GPNODEDATA) {
            let key = "";
            let offset = 5;
            block_get_size(pbuffer, offset, data_properties);
            if (data_properties.sort != DBX_DSORT_EOD) {
               offset += 5;
               let data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
               offset += data_properties.len;
               if (request.command === DBX_CMND_GNNODEDATA || request.command === DBX_CMND_GPNODEDATA) {
                  request.result_data = { "data": data, "key": [] };
               }
               else {
                  request.result_data = { "key": [] };
               }
               for (let keyn = 0; ; keyn++) {
                  block_get_size(pbuffer, offset, data_properties);
                  offset += 5;
                  if (data_properties.sort === DBX_DSORT_EOD) {
                     break;
                  }
                  key = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
                  offset += data_properties.len;
                  request.result_data.key.push(key);
                  if (keyn > 5) {
                     break;
                  }
               }
            }
         }
         else if (request.command === DBX_CMND_SQLEXEC) {
            let col_data = [];
            let offset = 5;
            block_get_size(pbuffer, offset, data_properties);
            offset += 4;
            block_get_size(pbuffer, offset, data_properties);
            //console.log("mg_dbx_napi.js SQL data properties => ", data_properties);
            offset += 5;
            let data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
            offset += data_properties.len;
            if (data_properties.sort === DBX_DSORT_ERROR) {
               request.result_data = { "sqlcode": -1, "sqlstate": "HY000", "error": data, "columns": [] };
            }
            else {
               let sql_no_cols = parseInt(data)
               request.result_data = { "sqlcode": 0, "sqlstate": "00000", "columns": [] };
               for (let n = 0; n < sql_no_cols; n++) {
                  block_get_size(pbuffer, offset, data_properties);
                  offset += 5;
                  data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
                  col_data = data.split("|");
                  request.result_data.columns.push({ "name": col_data[0], "type": col_data[1] });
                  offset += data_properties.len;
               }
            }
         }
         else if (request.command === DBX_CMND_SQLROW && data_properties.len > 0) {
            let col_data = [];
            let offset = 5;
            block_get_size(pbuffer, offset, data_properties);
            let len = data_properties.len;
            offset += 4;
            block_get_size(pbuffer, offset, data_properties);
            //console.log("mg_dbx_napi.js SQL data properties => ", data_properties);
            offset += 5;
            let data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
            offset += data_properties.len;
            if (data_properties.sort === DBX_DSORT_ERROR) {
               request.result_data = { "sqlcode": 0, "sqlstate": "", "error": data, "columns": [] };
               request.error_message = data;
            }
            else {
               request.result_data = { "sqlcode": 0, "sqlstate": "00000", "sql_row_no": data, "values": [] };
               for (let n = 0; offset < (len + 5); n++) {
                  block_get_size(pbuffer, offset, data_properties);
                  offset += 5;
                  data = Buffer.from(pbuffer.slice(offset, offset + data_properties.len)).toString();
                  request.result_data.values.push(data);
                  offset += data_properties.len;
               }
            }
         }
      }
      request.type = data_properties.type;
      return request.result_data;
   }

   setloglevel(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_LOGLEVEL, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      let bidx = this.get_buffer();
      offset = this.pack_arguments(this.buffer[bidx], offset, this.index, args, request, 0);
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

   logmessage(message, title) {
      let offset = 0;
      let request = { command: DBX_CMND_LOGMESSAGE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      let bidx = this.get_buffer();
      offset = block_add_size(this.buffer[bidx], offset, offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_size(this.buffer[bidx], offset, this.index, DBX_DSORT_DATA, DBX_DTYPE_INT);
      offset = block_add_string(this.buffer[bidx], offset, message, message.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, title, title.length, DBX_DSORT_DATA, DBX_DTYPE_STR, 0);
      offset = block_add_string(this.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.buffer[bidx], 0, offset, request.command);
      const pdata = dbx.command(this.buffer[bidx], offset, request.command, 0);
      this.get_result(this.buffer[bidx], pdata, request);
      this.release_buffer(bidx);

      return request.result_data;
   }

}

class mglobal {
   db;
   global_name = "";
   base_buffer;
   base_offset = 0;

   constructor(db, ...args) {
      let request = { command: 0, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
      this.db = db;
      this.base_buffer = new Uint8Array(DBX_INPUT_BUFFER_SIZE);
      this.base_offset = 0;
      this.base_offset = this.db.pack_arguments(this.base_buffer, this.base_offset, this.db.index, args, request, 0);
      this.base_offset -= 5;
      if (args.length > 0) {
         this.global_name = args[0];
      }
      return;
   }

   set(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GSET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
     }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   get(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GGET, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   delete(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GDELETE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   defined(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GDEFINED, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   next(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GNEXT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   previous(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GPREVIOUS, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   increment(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GINCREMENT, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   lock(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GLOCK, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   unlock(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_GUNLOCK, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   merge(...args) {
      let offset = 0;
      let sort = 0;
      let str = "";
      let request = { command: DBX_CMND_GMERGE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);

      for (let argn = 0; argn < args.length; argn ++) {
         if (typeof args[argn] === "object" && args[argn].constructor.name == "mglobal") {
            offset = block_copy(this.db.buffer[bidx], offset, args[argn].base_buffer, 15, args[argn].base_offset);
         }
         else if (typeof args[argn] === "string") {
            str = args[argn];
            offset = block_add_string(this.db.buffer[bidx], offset, str, str.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         }
         else {
            str = args[argn].toString();
            offset = block_add_string(this.db.buffer[bidx], offset, str, str.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         }
      }

      offset = block_add_string(this.db.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
      add_head(this.db.buffer[bidx], 0, offset, request.command);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   reset(...args) {
      let request = { command: 0, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
      this.base_offset = 0;
      this.base_offset = this.db.pack_arguments(this.base_buffer, this.base_offset, this.db.index, args, request, 0);
      this.base_offset -= 5;
      if (args.length > 0) {
         this.global_name = args[0];
      }
      return;
   }

}

class mclass {
   db;
   class_name = "";
   oref = "";
   base_buffer;
   base_offset = 0;

   constructor(db, ...args) {
      this.db = db;
      this.base_buffer = new Uint8Array(DBX_INPUT_BUFFER_SIZE);
      this.base_offset = 0;

      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, db.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      if (args.length > 0) {
         this.class_name = args[0];
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.class_name, this.class_name.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         if (args.length > 1 && this.db.init > 0) {
            let offset = 0;
            let request = { command: DBX_CMND_CCMETH, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
            let bidx = this.db.get_buffer();

            offset = this.db.pack_arguments(this.db.buffer[bidx], offset, db.index, args, request, 0);
            const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
            this.db.get_result(this.db.buffer[bidx], pdata, request);
            this.db.release_buffer(bidx);

            if (result.type === DBX_DTYPE_OREF) {
               this.oref = request.result_data;
            }
         }
      }
      return;
   }

   classmethod(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CCMETH, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      if (result.type === DBX_DTYPE_OREF) {
         this.oref = request.result_data;
      }
      return request.result_data;
   }

   method(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CMETH, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, 15);
      offset = block_add_string(this.db.buffer[bidx], offset, this.oref, this.oref.length, DBX_DSORT_DATA, DBX_DTYPE_OREF, 0);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   getproperty(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CGETP, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, 15);
      offset = block_add_string(this.db.buffer[bidx], offset, this.oref, this.oref.length, DBX_DSORT_DATA, DBX_DTYPE_OREF, 0);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   setproperty(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CSETP, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, 15);
      offset = block_add_string(this.db.buffer[bidx], offset, this.oref, this.oref.length, DBX_DSORT_DATA, DBX_DTYPE_OREF, 0);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   closeinstance(...args) {
      let offset = 0;
      let request = { command: DBX_CMND_CCLOSE, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, 15);
      offset = block_add_string(this.db.buffer[bidx], offset, this.oref, this.oref.length, DBX_DSORT_DATA, DBX_DTYPE_OREF, 0);
      offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 1);
      if (request.async) {
         async_command(this.db, this.db.buffer[bidx], offset, request, 0, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   reset(...args) {
      this.base_offset = 0;

      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.db.index, DBX_DSORT_DATA, DBX_DTYPE_INT);

      if (args.length > 0) {
         this.class_name = args[0];
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.class_name, this.class_name.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         if (args.length > 1 && this.db.init > 0) {
            let offset = 0;
            let request = { command: DBX_CMND_CCMETH, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
            let bidx = this.db.get_buffer();

            offset = this.db.pack_arguments(this.db.buffer[bidx], offset, this.db.index, args, request, 0);
            const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
            this.db.get_result(this.db.buffer[bidx], pdata, request);
            this.db.release_buffer(bidx);

            if (result.type === DBX_DTYPE_OREF) {
               this.oref = request.result_data;
            }
         }
      }
      return;
   }
}

class mcursor {
   db;
   context = 0;
   globaldirectory = false;
   multilevel = false;
   getdata = false;
   global_name = "";
   base_buffer;
   base_offset = 0;
   base_offset_first = 0;
   base_offset_last = 0;
   counter = 0;

   sql_query = ""
   sql_type = 0;
   sql_no = 0;
   sql_no_cols = 0;
   sql_row_no = "";
   sqlcode = 0;
   sqlstate = "00000";
   sqlcols = [];

   constructor(db, ...args) {
      this.db = db;
      this.base_buffer = new Uint8Array(DBX_INPUT_BUFFER_SIZE);

      this.reset(args);

      return;
   }

   reset(args) {
      let request = { command: 0, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
      this.base_offset = 0;
      this.base_offset_last = 0;
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_offset, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.base_buffer.length, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.base_offset = block_add_size(this.base_buffer, this.base_offset, this.db.index, DBX_DSORT_DATA, DBX_DTYPE_INT);
      this.global_name = "";

      if (args.length > 1) {
         if (args[1].hasOwnProperty('globaldirectory')) {
            this.globaldirectory = args[1].globaldirectory;
         }
         if (args[1].hasOwnProperty('multilevel')) {
            this.multilevel = args[1].multilevel;
         }
         if (args[1].hasOwnProperty('getdata')) {
            this.getdata = args[1].getdata;
         }
      }
      if (this.globaldirectory == true) {
         if (args[0].hasOwnProperty('global')) {
            this.global_name = args[0].global;
            if (this.global_name === "^") {
               this.global_name = "";
            }
            this.context = 9;
         }
      }
      else {
         if (args[0].hasOwnProperty('global')) {
            this.global_name = args[0].global;
            if (this.multilevel == true) {
               this.context = 2;
            }
            else {
               this.context = 1;
            }
         }
         else if (args[0].hasOwnProperty('sql')) {
            this.sql_query = args[0].sql;
            this.sql_type = DBX_SQL_MGSQL;
            if (args[0].hasOwnProperty('type')) {
               let type = args[0].type.toLowerCase();
               if (type === 'intersystems' || type === 'cache' || type === 'iris') {
                  this.sql_type = DBX_SQL_ISCSQL;
               }
            }
            this.base_offset_first = this.base_offset;
            this.context = 11;
            this.sql_no = ++this.db.sql_index;
         }
      }
      if (this.context == 1 || this.context == 2) {
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.global_name, this.global_name.length, DBX_DSORT_GLOBAL, DBX_DTYPE_STR, this.db.utf16);
         this.base_offset_first = this.base_offset;
         if (args[0].hasOwnProperty('key')) {
            for (let keyn = 0; keyn < args[0].key.length; keyn++) {
               this.base_offset_last = this.base_offset;
               this.base_offset = block_add_string(this.base_buffer, this.base_offset, args[0].key[keyn], args[0].key[keyn].length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
            }
         }
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
         add_head(this.base_buffer, 0, this.base_offset, request.command);
      }
      else if (this.context == 9) {
         this.counter = 0;
         this.base_offset_first = this.base_offset;
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.global_name, this.global_name.length, DBX_DSORT_GLOBAL, DBX_DTYPE_STR, this.db.utf16);
         this.base_offset_last = this.base_offset;
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.counter.toString(), this.counter.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
         this.base_offset = block_add_string(this.base_buffer, this.base_offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
         add_head(this.base_buffer, 0, this.base_offset, request.command);
      }

      return;
   }

   execute(...args) {
      let offset = 0;
      let context = 1; // binary response
      let request = { command: DBX_CMND_SQLEXEC, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      this.sql_no_cols = 0;
      this.sql_row_no = "";
      this.sqlcode = 0;
      this.sqlstate = "00000";

      let params = "";
      let routine = "";
      if (this.db.utf16 === true) {
         params = params + ";utf16";
      }
      if (this.sql_type === DBX_SQL_ISCSQL) {
         routine = "sqleisc^%zmgsis";
      }
      else {
         routine = "sqlemg^%zmgsis";
      }

      if (this.db.type === 'yottadb') {
         routine = "sqlemg^%zmgsis";
      }

      request.argc = args.length;
      if (request.argc > 0) {
         if (typeof args[request.argc - 1] === "function") {
            request.async = 1;
            request.argc--;
         }
      }

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset_first);
      offset = block_add_string(this.db.buffer[bidx], offset, routine, routine.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
      offset = block_add_string(this.db.buffer[bidx], offset, this.sql_no.toString(), this.sql_no.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
      offset = block_add_string(this.db.buffer[bidx], offset, this.sql_query, this.sql_query.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
      offset = block_add_string(this.db.buffer[bidx], offset, params, params.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
      offset = block_add_string(this.db.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0);
      add_head(this.db.buffer[bidx], 0, offset, DBX_CMND_FUNCTION); // on the M side this is a function call

      if (request.async) {
         async_command(this, this.db.buffer[bidx], offset, request, context, args[request.argc]);
         return null;
      }
      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, context);
      this.db.get_result(this.db.buffer[bidx], pdata, request);

      this.sqlcols.length = 0;
      if (request.result_data.hasOwnProperty('columns')) {
         this.sql_no_cols = request.result_data.columns.length;
         for (let n = 0; n < this.sql_no_cols; n++) {
            this.sqlcols.push(request.result_data.columns[n]);
         }
      }
      this.db.release_buffer(bidx);

      return request.result_data;
   }

   cleanup() {
      let offset = 0;
      let context = 1; // binary response
      let request = { command: DBX_CMND_SQLCLEANUP, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };

      if (this.db.init === 0) {
         return "";
      }

      this.sql_no_cols = 0;
      this.sql_row_no = "";
      this.sqlcode = 0;
      this.sqlstate = "00000";

      let params = "";
      let routine = "sqldel^%zmgsis";
      params = params + ";utf16";

      let bidx = this.db.get_buffer();
      offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset_first);
      offset = block_add_string(this.db.buffer[bidx], offset, routine, routine.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
      offset = block_add_string(this.db.buffer[bidx], offset, this.sql_no.toString(), this.sql_no.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
      offset = block_add_string(this.db.buffer[bidx], offset, params, params.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
      offset = block_add_string(this.db.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
      add_head(this.db.buffer[bidx], 0, offset, DBX_CMND_FUNCTION); // on the M side this is a function call

      const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, context);
      this.db.get_result(this.db.buffer[bidx], pdata, request);
      this.db.release_buffer(bidx);

      return request.result_data;

   }

   next() {
      return this.next_ex(1);
   }

   previous() {
      return this.next_ex(-1);
   }

   next_ex(direction) {
      let offset = 0;
      let request = { command: 0, argc: 0, async: 0, result_data: "", error_message: "", type: 0 };
      let result = null;

      if (this.db.init === 0) {
         return null;
      }

      let bidx = this.db.get_buffer();
      if (this.context === 1) {
         if (this.getdata) {
            if (direction === -1) {
               request.command = DBX_CMND_GPREVIOUSDATA;
            }
            else {
               request.command = DBX_CMND_GNEXTDATA;
            }
         }
         else {
            if (direction === -1) {
               request.command = DBX_CMND_GPREVIOUS;
            }
            else {
               request.command = DBX_CMND_GNEXT;
            }
         }
         offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
         this.db.buffer[bidx][4] = request.command;
         const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
         this.db.get_result(this.db.buffer[bidx], pdata, request);
         if (request.error_message === "") {
            if (this.getdata) {
               this.base_offset = block_add_string(this.base_buffer, this.base_offset_last, request.result_data.key, request.result_data.key.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
               if (request.result_data.key != "") {
                  result = request.result_data;
               }
            }
            else {
               this.base_offset = block_add_string(this.base_buffer, this.base_offset_last, request.result_data, request.result_data.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
               if (request.result_data != "") {
                  result = request.result_data;
               }
            }
            this.base_offset = block_add_string(this.base_buffer, this.base_offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
            add_head(this.base_buffer, 0, this.base_offset, request.command);
         }
         this.db.release_buffer(bidx);
      }
      else if (this.context === 2) {
         if (this.getdata) {
            if (direction === -1) {
               request.command = DBX_CMND_GPNODEDATA;
            }
            else {
               request.command = DBX_CMND_GNNODEDATA;
            }
         }
         else {
            if (direction === -1) {
               request.command = DBX_CMND_GPNODE;
            }
            else {
               request.command = DBX_CMND_GNNODE;
            }
         }
         offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
         this.db.buffer[bidx][4] = request.command;
         const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
         this.db.get_result(this.db.buffer[bidx], pdata, request);
         if (request.error_message === "") {
            if (request.result_data.hasOwnProperty('key')) {
               if (request.result_data.key.length > 0 && request.result_data.key[0].length > 0) {
                  result = request.result_data;
                  this.base_offset = this.base_offset_first;
                  for (let keyn = 0; keyn < request.result_data.key.length; keyn++) {
                     this.base_offset = block_add_string(this.base_buffer, this.base_offset, request.result_data.key[keyn], request.result_data.key[keyn].length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
                  }
               }
            }

            this.base_offset = block_add_string(this.base_buffer, this.base_offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
            add_head(this.base_buffer, 0, this.base_offset, request.command);
         }
         this.db.release_buffer(bidx);
      }
      else if (this.context === 9) {
         let context = 1;
         if (direction === -1) {
            request.command = DBX_CMND_GNAMEPREVIOUS;
         }
         else {
            request.command = DBX_CMND_GNAMENEXT;
         }
         offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset);
         this.db.buffer[bidx][4] = request.command;
         const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, 0);
         this.db.get_result(this.db.buffer[bidx], pdata, request);
         if (request.error_message === "") {
            this.base_offset = block_add_string(this.base_buffer, this.base_offset_first, request.result_data, request.result_data.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
            if (request.result_data != "") {
               result = request.result_data;
            }
            this.counter++;
            this.base_offset = block_add_string(this.base_buffer, this.base_offset, this.counter.toString(), this.counter.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
            this.base_offset = block_add_string(this.base_buffer, this.base_offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
            add_head(this.base_buffer, 0, this.base_offset, request.command);
         }
         this.db.release_buffer(bidx);
      }
      else if (this.context === 11) {
         let context = 1; // binary response

         request.command = DBX_CMND_SQLROW;

         this.sqlcode = 0;
         this.sqlstate = "00000";

         let params = "";
         let routine = "";
         if (direction === 1) {
            params = "+1"
         }
         else {
            params = "+1"
         }
         if (this.db.utf16 === true) {
            params = params + ";utf16";
         }
         routine = "sqlrow^%zmgsis";

         let bidx = this.db.get_buffer();
         offset = block_copy(this.db.buffer[bidx], offset, this.base_buffer, 0, this.base_offset_first);
         offset = block_add_string(this.db.buffer[bidx], offset, routine, routine.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         offset = block_add_string(this.db.buffer[bidx], offset, this.sql_no.toString(), this.sql_no.toString().length, DBX_DSORT_DATA, DBX_DTYPE_INT, 0);
         offset = block_add_string(this.db.buffer[bidx], offset, this.sql_row_no, this.sql_row_no.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         offset = block_add_string(this.db.buffer[bidx], offset, params, params.length, DBX_DSORT_DATA, DBX_DTYPE_STR, this.db.utf16);
         offset = block_add_string(this.db.buffer[bidx], offset, "", 0, DBX_DSORT_EOD, DBX_DTYPE_STR, 0)
         add_head(this.db.buffer[bidx], 0, offset, DBX_CMND_FUNCTION); // on the M side this is a function call

         const pdata = dbx.command(this.db.buffer[bidx], offset, request.command, context);
         this.db.get_result(this.db.buffer[bidx], pdata, request);
         if (request.error_message === "") {
            if (request.result_data != "") {
               if (request.result_data.hasOwnProperty('sql_row_no')) {
                  this.sql_row_no = request.result_data.sql_row_no;
               }
               result = {};
               if (request.result_data.hasOwnProperty('values') && request.result_data.values.length === this.sql_no_cols) {
                  for (let n = 0; n < this.sql_no_cols; n++) {
                     Object.defineProperty(result, this.sqlcols[n].name, { "value": request.result_data.values[n], enumerable: true , writeble: true, configurable: true});
                  }
               }
            }
         }
         this.db.release_buffer(bidx);
      }

      return result;
   }
}
async function async_command(db, buffer, buffer_size, request, context, callback) {
   let promise = new Promise((resolve, reject) => {
      const pdata = dbx.command(buffer, buffer_size, request.command, context);
      db.get_result(buffer, pdata, request);
      db.release_buffer(0);
      resolve(request.result_data);
   });
   let result_data = await promise
   if (request.error_message === "") {
      callback(false, result_data);
   }
   else {
      callback(true, result_data);
   }

   return;
}

function block_copy(buffer_to, offset, buffer_from, from, to) {
   for (let i = from; i < to; i ++) {
      buffer_to[offset ++] = buffer_from[i];
   }
   return offset;
}

function block_add_string(buffer, offset, data, data_len, data_sort, data_type, utf16) {
   if (utf16) {
      data = Buffer.from(data.toString(), 'utf8');
      data_len = data.length;
      // console.log(data_len, " = ", data, " : ", typeof data);
   }
   offset = block_add_size(buffer, offset, data_len, data_sort, data_type);
   if (typeof data === 'string') {
      for (let i = 0; i < data_len; i++) {
         buffer[offset++] = data.charCodeAt(i);
      }
   }
   else {
      for (let i = 0; i < data_len; i++) {
         buffer[offset++] = data[i];
      }
   }
   return offset;
}

function block_add_buffer(buffer, offset, data, data_len, data_sort, data_type) {
   offset = block_add_size(buffer, offset, data_len, data_sort, data_type);
   for (let i = 0; i < data_len; i++) {
      buffer[offset++] = data[i];
   }
   return offset;
}

function block_add_size(buffer, offset, data_len, data_sort, data_type) {
   buffer[offset + 0] = (data_len >> 0);
   buffer[offset + 1] = (data_len >> 8);
   buffer[offset + 2] = (data_len >> 16);
   buffer[offset + 3] = (data_len >> 24);
   buffer[offset + 4] = ((data_sort * 20) + data_type);
   return (offset + 5);
}

function add_head(buffer, offset, data_len, cmnd) {
   buffer[offset + 0] = (data_len >> 0);
   buffer[offset + 1] = (data_len >> 8);
   buffer[offset + 2] = (data_len >> 16);
   buffer[offset + 3] = (data_len >> 24);
   buffer[offset + 4] = cmnd;
   return (offset + 5);
}

function block_get_size(buffer, offset, data_properties) {
   data_properties.len = ((buffer[offset + 0]) | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24));
   data_properties.sort = buffer[offset + 4];
   data_properties.type = data_properties.sort % 20;
   data_properties.sort = Math.floor(data_properties.sort / 20);
   return data_properties;
}


export {
   server,
   mglobal,
   mclass,
   mcursor
};
