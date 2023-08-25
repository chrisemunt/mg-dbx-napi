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

#ifndef MG_DBX_NAPI_H
#define MG_DBX_NAPI_H

#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <stdlib.h>
#include <time.h>
/*
#define NAPI_VERSION 3
#define NAPI_EXPERIMENTAL
*/
#include <node_api.h>

#define MAJORVERSION             1
#define MINORVERSION             1
#define MAINTVERSION             3
#define BUILDNUMBER              3

#define MGNAPI_VERSION_MAJOR     "1"
#define MGNAPI_VERSION_MINOR     "1"
#define MGNAPI_VERSION_BUILD     "3"

#define MGNAPI_VERSION           MGNAPI_VERSION_MAJOR "." MGNAPI_VERSION_MINOR "." MGNAPI_VERSION_BUILD
#define MGNAPI_COMPANYNAME       "M/Gateway Developments Ltd\0"
#define MGNAPI_FILEDESCRIPTION   "Node-API based interface to InterSystems IRIS/Cache and YottaDB\0"
#define MGNAPI_FILEVERSION       MGNAPI_VERSION
#define MGNAPI_INTERNALNAME      "mg-dbx-napi\0"
#define MGNAPI_LEGALCOPYRIGHT    "Copyright 2021-2023, M/Gateway Developments Ltd\0"
#define MGNAPI_ORIGINALFILENAME  "mg-dbx-napi\0"
#define MGNAPI_PLATFORM          PROCESSOR_ARCHITECTURE
#define MGNAPI_PRODUCTNAME       "mg-dbx-napi\0"
#define MGNAPI_PRODUCTVERSION    MGNAPI_VERSION
#define MGNAPI_BUILD             MGNAPI_VERSION

#if defined(_WIN32)

#define BUILDING_NODE_EXTENSION     1
#if defined(_MSC_VER)
/* Check for MS compiler later than VC6 */
#if (_MSC_VER >= 1400)
#define _CRT_SECURE_NO_DEPRECATE    1
#define _CRT_NONSTDC_NO_DEPRECATE   1
#endif
#endif
#endif

#if defined(_WIN32)
#define MGNAPI_EXTFUN(a)    __declspec(dllexport) a __cdecl
#else
#define MGNAPI_EXTFUN(a)    a
#endif

MGNAPI_EXTFUN(napi_value)  mgnapi_init          (napi_env env, napi_callback_info info);
MGNAPI_EXTFUN(napi_value)  mgnapi_version       (napi_env env, napi_callback_info info);
MGNAPI_EXTFUN(napi_value)  mgnapi_dbversion     (napi_env env, napi_callback_info info);
MGNAPI_EXTFUN(napi_value)  mgnapi_command       (napi_env env, napi_callback_info info);
MGNAPI_EXTFUN(napi_value)  mgnapi_benchmark     (napi_env env, napi_callback_info info);
MGNAPI_EXTFUN(napi_value)  mgnapi_benchmarkex   (napi_env env, napi_callback_info info);

#endif

