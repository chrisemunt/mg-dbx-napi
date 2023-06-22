/*
   ----------------------------------------------------------------------------
   | mg-dbx-napi.node                                                         |
   | Description: A Node-API based interface to InterSystems Cache/IRIS       |
   |              and YottaDB                                                 |
   | Author:      Chris Munt cmunt@mgateway.com                               |
   |                         chris.e.munt@gmail.com                           |
   | Copyright (c) 2019-2023 MGateway Ltd                                     |
   | Surrey UK.                                                               |
   | All rights reserved.                                                     |
   |                                                                          |
   | http://www.mgateway.com                                                  |
   |                                                                          |
   | Licensed under the Apache License, Version 2.0 (the "License"); you may  |
   | not use this file except in compliance with the License.                 |
   | You may obtain a copy of the License at                                  |
   |                                                                          |
   | http://www.apache.org/licenses/LICENSE-2.0                               |
   |                                                                          |
   | Unless required by applicable law or agreed to in writing, software      |
   | distributed under the License is distributed on an "AS IS" BASIS,        |
   | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
   | See the License for the specific language governing permissions and      |
   | limitations under the License.                                           |
   |                                                                          |
   ----------------------------------------------------------------------------
*/

/*
   Development Diary (in brief):

Version 1.0.1 11 January 2023:
   First release.

Version 1.0.2 12 January 2023:
   Remove the need to prefix global names with the '^' character for API-based connections to YottaDB.
   Allow the environment variables required for binding to the YottaDB API to be specified as name/value pairs in a separate JSON object.

Version 1.0.2b 22 June 2023:
   Documentation update.

*/

#include "mg-dbx-napi.h"
#include "mg_dba.h"

char gbuffer[CACHE_MAXLOSTSZ + 7];

#if defined(_WIN32)
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved)
{
   switch (fdwReason)
   {
   case DLL_PROCESS_ATTACH:
      mg_init_critical_section((void*) &dbx_global_mutex);
      break;
   case DLL_THREAD_ATTACH:
      break;
   case DLL_THREAD_DETACH:
      break;
   case DLL_PROCESS_DETACH:
      mg_delete_critical_section((void*) &dbx_global_mutex);
      break;
   }
   return TRUE;
}
#endif /* #if defined(_WIN32) */

napi_value mgnapi_init(napi_env env, napi_callback_info info)
{
   dbx_init();
   return nullptr;
}

napi_value mgnapi_version(napi_env env, napi_callback_info info)
{
   napi_status status;
   napi_value output;

#if defined(_WIN32)
   sprintf_s(gbuffer, CACHE_MAXLOSTSZ, "%s", MGNAPI_VERSION);
#else
   sprintf(gbuffer, "%s", MGNAPI_VERSION);
#endif
   status = napi_create_string_utf8(env, gbuffer, NAPI_AUTO_LENGTH, &output);
   if (status != napi_ok) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &output);
      return output;
   }
   return output;
}


napi_value mgnapi_dbversion(napi_env env, napi_callback_info info)
{
   int index;
   napi_status status;
   napi_value output;

   index = 0;
   dbx_version(index, gbuffer, 256);
   status = napi_create_string_utf8(env, gbuffer, NAPI_AUTO_LENGTH, &output);
   if (status != napi_ok) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &output);
      return output;
   }
   return output;
}


napi_value mgnapi_command(napi_env env, napi_callback_info info)
{
   int n, dsort, dtype, input_len, command, context;
   unsigned long len;
   unsigned char *input, *output;
   DBXSTR block;
   napi_status status;
   size_t argc = 4;
   napi_value argv[8];
   napi_value result;
   unsigned char *xdata;
   size_t xlen;

   input = (unsigned char *) gbuffer;
   output = (unsigned char *) gbuffer;

   status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

   if (argc < 4) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &result);
      return result;
   }

   status = napi_get_buffer_info(env, argv[0], (void **) &xdata, (size_t *) &xlen);
   status = napi_get_value_int32(env, argv[1], (int32_t *) &input_len);
   status = napi_get_value_int32(env, argv[2], (int32_t *) &command);
   status = napi_get_value_int32(env, argv[3], (int32_t *) &context);

   input = xdata;
/*
   for (n = 0; n < input_len; n ++) {
      input[n] = xdata[n];
   }
*/
   memset(output, 0, 5);

   switch (command) {
      case DBX_CMND_OPEN:
         dbx_open(input, output);
         break;
      case DBX_CMND_CLOSE:
         dbx_close(input, output);
         break;
      case DBX_CMND_GSET:
         dbx_set(input, output);
         break;
      case DBX_CMND_GGET:
         dbx_get(input, output);
         break;
      case DBX_CMND_GDELETE:
         dbx_delete(input, output);
         break;
      case DBX_CMND_GDEFINED:
         dbx_defined(input, output);
         break;
      case DBX_CMND_GNEXT:
         dbx_next(input, output);
         break;
      case DBX_CMND_GPREVIOUS:
         dbx_previous(input, output);
         break;
      case DBX_CMND_GINCREMENT:
         dbx_increment(input, output);
         break;
      case DBX_CMND_GMERGE:
         dbx_merge(input, output);
         break;
      case DBX_CMND_GLOCK:
         dbx_lock(input, output);
         break;
      case DBX_CMND_GUNLOCK:
         dbx_unlock(input, output);
         break;
      case DBX_CMND_TSTART:
         dbx_tstart(input, output);
         break;
      case DBX_CMND_TLEVEL:
         dbx_tlevel(input, output);
         break;
      case DBX_CMND_TCOMMIT:
         dbx_tcommit(input, output);
         break;
      case DBX_CMND_TROLLBACK:
         dbx_trollback(input, output);
         break;
      case DBX_CMND_FUNCTION:
         dbx_function(input, output);
         break;
      case DBX_CMND_CCMETH:
         dbx_classmethod(input, output);
         break;
      case DBX_CMND_CGETP:
         dbx_getproperty(input, output);
         break;
      case DBX_CMND_CSETP:
         dbx_setproperty(input, output);
         break;
      case DBX_CMND_CMETH:
         dbx_method(input, output);
         break;
      case DBX_CMND_CCLOSE:
         dbx_closeinstance(input, output);
         break;
      default:
         memset(output, 0, 10);
         break;
   }

   block.buf_addr = (char *) output;
   block.len_alloc = 0;
   block.len_used = 0;
   len = mg_get_block_size(&block, 0, &dsort, &dtype);

   if (dsort == DBX_DSORT_ERROR) {
      output[len + 5] = '\0';
   }
   else {
      output[len + 5] = '\0';
   }

   for (n = 0; n < 5; n ++) {
      xdata[n] = output[n];
   }
   status = napi_create_string_utf8(env, (char *) output + 5, (size_t) len, &result);
   if (status != napi_ok) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &result);
      return result;
   }
   return result;
}


napi_value mgnapi_benchmark(napi_env env, napi_callback_info info)
{
   char input[256];
   napi_status status;
   size_t argc = 1, res = 1;
   napi_value argv[1];
   napi_value output;

   *input = '\0';
   status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
   if (argc > 0) {
      status = napi_get_value_string_utf8(env, argv[0], input, 250, &res);
   }
/*
   printf("\r\nargc=%d; res=%d; input_len=%d; %s", (int) argc, (int) res, (int) strlen(input), input);
*/
   status = napi_create_string_utf8(env, "output string", NAPI_AUTO_LENGTH, &output);
   if (status != napi_ok) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &output);
      return output;
   }
   return output;
}


napi_value mgnapi_benchmarkex(napi_env env, napi_callback_info info)
{
   int n, dsort, dtype, input_len, dlen, glen, slen, command, context, offset, goffset, soffset, margc;
   unsigned long len, max, cnt;
   unsigned char *input, *output;
   char buffer[CACHE_MAXSTRLEN], *pbuffer;
   DBXSTR block;
   napi_status status;
   size_t argc = 4;
   napi_value argv[8];
   napi_value result;
   unsigned char *xdata;
   size_t xlen;
   DBXSTR str;
   DBXSTR args[32];

   input = (unsigned char *) gbuffer;
   output = (unsigned char *) gbuffer;

   status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);

   if (argc < 4) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &result);
      return result;
   }

   status = napi_get_buffer_info(env, argv[0], (void **) &xdata, (size_t *) &xlen);
   status = napi_get_value_int32(env, argv[1], (int32_t *) &input_len);
   status = napi_get_value_int32(env, argv[2], (int32_t *) &command);
   status = napi_get_value_int32(env, argv[3], (int32_t *) &context);

   input = xdata;

   str.buf_addr = (char *) input;
   str.len_alloc = input_len + 256;
   str.len_used = input_len;

   margc = 0;
   offset = 15;
   pbuffer = buffer;
   dlen = 0;
   slen = 0;
   max = 0;
   for (n = 0; n < 32; n ++) {
      len = (int) mg_get_block_size(&str, offset, &dsort, &dtype);
      offset += 5;

      printf("\r\nn=%d; len=%d; offset=%d; sort=%d; type=%d; str=%s;", n, len, offset, dsort, dtype, str.buf_addr + offset);
      if (dsort == DBX_DSORT_EOD) {
         break;
      }
      margc ++;
      if (n == 0) {
         goffset = offset;
         glen = len;
      }
      else if (n == 1) {
         strncpy(buffer, str.buf_addr + offset, len);
         buffer[len] = '\0';
         max = (unsigned long) strtol(buffer, NULL, 10);
         soffset = offset;
         slen = len;
         for (cnt = 0; cnt < slen; cnt ++) {
            str.buf_addr[soffset + cnt] = '0';
         }
         dtype = DBX_DTYPE_INT;
         str.buf_addr[soffset - 1] = (unsigned char) ((dsort * 20) + dtype);
      }
      else if (n == 2) {
/*
         if (len < CACHE_MAXSTRLEN) {
            strncpy(pbuffer, str.buf_addr + offset, len);
            buffer[len] = '\0';
         }
*/
         dlen = len;
      }
      offset += len;
   }

   if (margc == 1) {

      printf("\r\nGET margc=%d; n=%d; len_used=%d\r\n", margc, n, str.len_used);

         str.len_used = goffset + glen;
      printf("\r\nGET margc=%d; n=%d; len_used=%d\r\n", margc, n, str.len_used);

         mg_add_block_data(&str, (unsigned char *) "", (unsigned long) 0, DBX_DSORT_DATA, DBX_DTYPE_STR);

      printf("\r\nGET add "" margc=%d; n=%d; len_used=%d\r\n", margc, n, str.len_used);

         mg_add_block_data(&str, (unsigned char *) "", (unsigned long) 0, DBX_DSORT_EOD, DBX_DTYPE_STR);

      printf("\r\nGET add EOD margc=%d; n=%d; len_used=%d\r\n", margc, n, str.len_used);

for (n = 0; n < 32; n ++) {
   printf(" %d %c", (int) input[n], (char) input[n]);
}

printf("\r\n****now add final size ***\r\n");

      mg_add_block_head_size(&str, (unsigned long) str.len_used, DBX_CMND_GNEXTDATA);

for (n = 0; n < 32; n ++) {
   printf(" %d %c", (int) input[n], (char) input[n]);
}

printf("\r\n*******\r\n");
         dbx_next_data(input, output);

for (n = 0; n < 32; n ++) {
   printf(" %d %c", (int) output[n], (char) output[n]);
}

   }
   else if (margc == 3) {
      printf("\r\nSET margc=%d; n=%d; max=%ld; str=%s", margc, n, max, buffer);
      for (cnt = 0; cnt < max; cnt ++) {
         sprintf(buffer, "%u", cnt);
         len = strlen(buffer);
         memcpy((void *) (str.buf_addr + (soffset + (slen - len))), (void *) buffer, len);
      printf("\r\nSET cnt=%d; str=%s", cnt, str.buf_addr + soffset);

         dbx_set(input, output);
      }
   }

/*
   for (n = 0; n < input_len; n ++) {
      input[n] = xdata[n];
   }
*/
   memset(output, 0, 5);
   block.buf_addr = (char *) output;
   block.len_alloc = 0;
   block.len_used = 0;
   len = mg_get_block_size(&block, 0, &dsort, &dtype);

   if (dsort == DBX_DSORT_ERROR) {
      output[len + 5] = '\0';
   }
   else {
      output[len + 5] = '\0';
   }
len = 2;
{
int n;
   DBXSTR block;
   char buffer[256];

   sprintf(buffer, "%d", 37);
   block.buf_addr = (char *) output;
   block.len_alloc = 256;
   block.len_used = 0;
//printf("\r\n output=%p; xdata=%p;", output, xdata);
   mg_add_block_data(&block, (unsigned char *) buffer, (unsigned long) 2, DBX_DSORT_DATA, DBX_DTYPE_STR);
/*
printf("\r\n Z output=%p; xdata=%p;", output, xdata);
for (n = 0; n < 15; n ++) {
   printf("\r\nn=%d %d %c", n, (unsigned char) output[n], output[n]);
}
*/

}
   for (n = 0; n < 5; n ++) {
      xdata[n] = output[n];
   }
//*(output + 5) = '7';
   status = napi_create_string_utf8(env, (char *) output + 5, (size_t) len, &result);
   if (status != napi_ok) {
      napi_create_string_utf8(env, (char *) "", (size_t) 0, &result);
      return result;
   }
   return result;
}

#define DECLARE_NAPI_METHOD(name, func) {name, 0, func, 0, 0, 0, napi_default, 0}

extern "C" {

#if defined(_WIN32)
   napi_value __declspec(dllexport) napi_register_module_v1(napi_env env, napi_value exports)
#else
   napi_value napi_register_module_v1(napi_env env, napi_value exports)
#endif
   {
      napi_status status;
      napi_property_descriptor desc;

      desc = DECLARE_NAPI_METHOD("init", mgnapi_init);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      desc = DECLARE_NAPI_METHOD("version", mgnapi_version);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      desc = DECLARE_NAPI_METHOD("dbversion", mgnapi_dbversion);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      desc = DECLARE_NAPI_METHOD("command", mgnapi_command);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      desc = DECLARE_NAPI_METHOD("benchmark", mgnapi_benchmark);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      desc = DECLARE_NAPI_METHOD("benchmarkex", mgnapi_benchmarkex);
      status = napi_define_properties(env, exports, 1, &desc);
      assert(status == napi_ok);

      return exports;
   }
}

