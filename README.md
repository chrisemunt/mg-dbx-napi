# mg-dbx-napi

High speed Synchronous and Asynchronous access to InterSystems Cache/IRIS and YottaDB from Node.js or Bun.

Chris Munt <cmunt@mgateway.com>  
10 November 2023, MGateway Ltd [http://www.mgateway.com](http://www.mgateway.com)

* Verified to work with Node.js and the Bun JavaScript engine.
* Two connectivity models to the InterSystems or YottaDB database are provided: High performance via the local database API or network based.
* [Release Notes](#relnotes) can be found at the end of this document.

Contents

* [Overview](#overview)
* [Installing mg-dbx-napi](#install)
* [Connecting to the database](#connect)
* [Invocation of database commands](#dbcommands)
* [Invocation of database functions](#dbfunctions)
* [Cursor based data retrieval](#cursors)
* [Transaction Processing](#tprocessing)
* [Direct access to InterSystems classes (IRIS and Cache)](#dbclasses)
* [License](#license)

## <a name="overview">Overview</a>

This solution provides **Node.js** and **Bun** applications with high-performance access to InterSystems database products and the YottaDB database.

**Node.js** was released in 2009 and is based on the Google V8 JavaScript engine.  It has always been possible to extend the functionality of Node.js by creating add-on modules that work directly to the V8 C++ API.  With Node.js version 8, the third iteration of a new C++ API was released - Node-API.  This API is intrinsically part of Node.js and, as such, is independent of the underlying JavaScript implementation.  A key design goal of this new API was that it should be Application Binary Interface (ABI) stable across versions of Node.js.  In other words, it should not be necessary to recompile add-on modules based on Node-API when the underlying Node.js platform is upgraded to a new version.  By contrast, Node.js add-ons based on the native V8 API need to be recompiled every time the underlying Node.js/V8 engine is upgraded.

2022 saw the release of a new server-oriented JavaScript engine in beta form - **Bun**.  Bun is based on Apple's JavaScriptCore engine which is used in the Safari web browser.  Bun promised better performance than Node.js - up to 3x faster has been claimed.  In order to hit the ground running, Bun natively implements hundreds of Node.js APIs, including around 90% of the Node-API functions.  Therefore, in theory, Bun should be able to use add-on modules developed for Node.js provided they are based on Node-API.

**mg-dbx-napi** is based on Node-API and is designed to work with both Node.js and Bun.  It offers applications the same functionality as the earlier [mg-dbx](https://github.com/chrisemunt/mg-dbx) module for Node.js which is based on the native V8 API.

**mg-dbx-napi** provides us with the opportunity to explore a high-performance JavaScript engine (Bun) working with the high-performance databases provided by InterSystems and YottaDB but in a way that is compatible with our current **mg-dbx** add-on solution for Node.js.  We will be writing more about this in due course!

Those familiar with **mg-dbx** will know that applications engage directly with the functionality provided by the **mg-dbx.node** add-on.  With **mg-dbx-napi.node**, a JavaScript _shim_ is supplied for both Node.js and Bun to provide a common application interface for the two JavaScript engines.  **mg-dbx-napi.node** is itself an add-on written in C++ and manages the interface to the database and is common to both Node.js and Bun.

The Node.js _shim_ is provided as a JavaScript module:

       MyNodeApplication.js -> mg_dbx_napi.js -> mg-dbx-napi.node

The Bun _shim_ is provided as a TypeScript module:

       MyBunApplication.js -> mg_dbx_napi.ts -> mg-dbx-napi.node


## <a name="install">Installing mg-dbx-napi</a>

Assuming that Node.js is already installed and a C++ compiler is available to the installation process:

       npm install mg-dbx-napi

This command will create the **mg-dbx-napi** addon (*mg-dbx-napi.node*).


### Installing the M support routines (also known as the DB Superserver)

The M support routines are required for:

* Network based access to databases.
* Direct access to SQL (either via the API or via the network).
* The Merge command under YottaDB (either via the API or via the network).

If none of the above apply you do not need to install these routines - proceed to  [Connecting to the database](#connect). 

Two M routines need to be installed (%zmgsi and %zmgsis).  These can be found in the *Service Integration Gateway* (**mgsi**) GitHub source code repository ([https://github.com/chrisemunt/mgsi](https://github.com/chrisemunt/mgsi)).  Note that it is not necessary to install the whole *Service Integration Gateway*, just the two M routines held in that repository.

#### Installation for InterSystems Cache/IRIS

Log in to the %SYS Namespace and install the **zmgsi** routines held in **/isc/zmgsi\_isc.ro**.

       do $system.OBJ.Load("/isc/zmgsi_isc.ro","ck")

Change to your development UCI and check the installation:

       do ^%zmgsi

       MGateway Ltd - Service Integration Gateway
       Version: 4.5; Revision 30 (10 November 2023)


#### Installation for YottaDB

The instructions given here assume a standard 'out of the box' installation of **YottaDB** (version 1.38) deployed in the following location:

       /usr/local/lib/yottadb/r138

The primary default location for routines:

       /root/.yottadb/r1.38_x86_64/r

Copy all the routines (i.e. all files with an 'm' extension) held in the GitHub **/yottadb** directory to:

       /root/.yottadb/r1.38_x86_64/r

Change directory to the following location and start a **YottaDB** command shell:

       cd /usr/local/lib/yottadb/r138
       ./ydb

Link all the **zmgsi** routines and check the installation:

       do ylink^%zmgsi

       do ^%zmgsi

       MGateway Ltd - Service Integration Gateway
       Version: 4.5; Revision 30 (10 November 2023)

Note that the version of **zmgsi** is successfully displayed.

Finally, add the following lines to the interface file (**zmgsi.ci** in the example used in the db.open() method).

       sqlemg: ydb_string_t * sqlemg^%zmgsis(I:ydb_string_t*, I:ydb_string_t *, I:ydb_string_t *)
       sqlrow: ydb_string_t * sqlrow^%zmgsis(I:ydb_string_t*, I:ydb_string_t *, I:ydb_string_t *)
       sqldel: ydb_string_t * sqldel^%zmgsis(I:ydb_string_t*, I:ydb_string_t *)
       ifc_zmgsis: ydb_string_t * ifc^%zmgsis(I:ydb_string_t*, I:ydb_string_t *, I:ydb_string_t*)

A copy of this file can be downloaded from the **/unix** directory of the  **mgsi** GitHub repository [here](https://github.com/chrisemunt/mgsi)

### Starting the DB Superserver (for network based connectivity only)

The default TCP server port for **zmgsi** is **7041**.  If you wish to use an alternative port then modify the following instructions accordingly.

* For InterSystems DB servers the concurrent TCP service should be started in the **%SYS** Namespace.

Start the DB Superserver using the following command:

       do start^%zmgsi(0) 

To use a server TCP port other than 7041, specify it in the start-up command (as opposed to using zero to indicate the default port of 7041).

* For YottaDB, as an alternative to starting the DB Superserver from the command prompt, Superserver processes can be started via the **xinetd** daemon.  Instructions for configuring this option can be found in the **mgsi** repository [here](https://github.com/chrisemunt/mgsi)


## <a name="connect">Connecting to the database</a>

Most **mg-dbx-napi** methods are capable of operating either synchronously or asynchronously. For an operation to complete asynchronously, simply supply a suitable callback as the last argument in the call.

The first step is to include the **mg-dbx-napi** classes to your JavaScript project.  For example:

       import {server, mglobal, mclass, mcursor} from 'mg-dbx-napi';

The **server** class will always be required.  For classes **mglobal**, **mclass** and **mcursor**, just import the ones that you need.

Creating an instance of the **server** class:

       let db = new server();

### Open a connection to the database

First create a JavaScript container object (defined as **db** in the examples) as described in the [Connecting to the database](#Connect) section.

In the following examples, modify all paths (and any user names and passwords) to match those of your own installation.

#### InterSystems Cache

##### API based connectivity

Assuming Cache is installed under **/opt/cache20181/**

           var open = db.open({
               type: "Cache",
               path:"/opt/cache20181/mgr",
               username: "_SYSTEM",
               password: "SYS",
               namespace: "USER"
             });

##### Network based connectivity

Assuming Cache is accessed via **localhost** listening on TCP port **7041**

           var open = db.open({
               type: "Cache",
               host: "localhost",
               tcp_port: 7041,
               username: "_SYSTEM",
               password: "SYS",
               namespace: "USER"
             });

#### InterSystems IRIS

##### API based connectivity

Assuming IRIS is installed under **/opt/IRIS20181/**

           var open = db.open({
               type: "IRIS",
               path:"/opt/IRIS20181/mgr",
               username: "_SYSTEM",
               password: "SYS",
               namespace: "USER"
             });

##### Network based connectivity

Assuming IRIS is accessed via **localhost** listening on TCP port **7041**

           var open = db.open({
               type: "IRIS",
               host: "localhost",
               tcp_port: 7041,
               username: "_SYSTEM",
               password: "SYS",
               namespace: "USER"
             });

#### YottaDB

##### API based connectivity

Assuming an 'out of the box' YottaDB installation under **/usr/local/lib/yottadb/r138**.

           const envvars = {
              ydb_dir: '/root/.yottadb',
              ydb_rel: 'r1.38_x86_64',
              ydb_gbldir: '/root/.yottadb/r1.38_x86_64/g/yottadb.gld',
              ydb_routines: '/root/.yottadb/r1.38_x86_64/o*(/root/.yottadb/r1.38_x86_64/r /root/.yottadb/r) /usr/local/lib/yottadb/r138/libyottadbutil.so',
              ydb_ci: '/usr/local/lib/yottadb/r138/zmgsi.ci'
           }

           var open = db.open({
               type: "YottaDB",
               path: "/usr/local/lib/yottadb/r138",
               env_vars: envvars
             });

* Note that (as with **mg-dbx**) you can still supply the environment variables as a string of _name=value_ pairs each separated by a linefeed character and terminated by a double linefeed.

##### Network based connectivity

Assuming YottaDB is accessed via **localhost** listening on TCP port **7041**

           var open = db.open({
               type: "YottaDB",
               host: "localhost",
               tcp_port: 7041,
             });


#### Additional (optional) properties for the open() method

* **timeout**: The timeout (in seconds) to be applied to database operations invoked via network based connections.  The default value is 10 seconds.


### Return the version of mg-dbx-napi

       var result = db.version();

Example:

       console.log("\nmg-dbx-napi Version: " + db.version());


### Returning (and optionally changing) the current directory (or Namespace)

       current_namespace = db.namespace([<new_namespace>]);

Example 1 (Get the current Namespace): 

       var nspace = db.namespace();

* Note this will return the current Namespace for InterSystems databases and the value of the current global directory for YottaDB (i.e. $ZG).

Example 2 (Change the current Namespace): 

       var new_nspace = db.namespace("SAMPLES");

* If the operation is successful this method will echo back the new Namespace name.  If not successful, the method will return the name of the current (unchanged) Namespace.


### Close database connection

       db.close();
 

## <a name="dbcommands">Invocation of database commands</a>

Database commands can either be invoked directly from a database object or via a mglobal container object.  The latter approach does give slightly better performance - particularly in cases where the same global reference is repeatedly used.

mglobal container objects can be created as described in the [Connecting to the database](#Connect) section.

Example (using a global named "Person"):

Node.js:

       let person = new dbx.mglobal(db, "Person");

Bun:

       let person = new mglobal(db, "Person");


### Set a record

_Using a global object:_

       var result = mglobal.set(<key>, <data>);
      
Example:

       person.set(1, "John Smith");

_Alternatively:_

       var result = db.set(<global name>, <key>, <data>);
      
Example:

       db.set("Person", 1, "John Smith");


### Get a record

_Using a global object:_

       var result = mglobal.get(<key>);
      
Example:

       var name = person.get(1);

_Alternatively:_

       var result = db.get(<global name>, <key>);
      
Example:

       var name = db.get("Person", 1);


### Delete a record

_Using a global object:_

       var result = mglobal.delete(<key>);
      
Example:

       var result = person.delete(1);

_Alternatively:_

       var result = db.delete(<global name>, <key>);
      
Example:

       var result = db.delete("Person", 1);


### Check whether a record is defined

_Using a global object:_

       var result = mglobal.defined(<key>);
      
Example:

       var result = person.defined(1);

_Alternatively:_

       var result = db.defined(<global name>, <key>);
      
Example:

       var result = db.defined("Person", 1);


### Parse a set of records (in order)

_Using a global object:_

       var result = mglobal.next(<key>);
      
Example:

       var key = "";
       while ((key = person.next(key)) != "") {
          console.log("\nPerson: " + key + ' : ' + person.get(key));
       }


_Alternatively:_

       var result = db.next(<global name>, <key>);
      
Example:

       var key = "";
       while ((key = db.next("Person", key)) != "") {
          console.log("\nPerson: " + key + ' : ' + db.get("Person", key));
       }


### Parse a set of records (in reverse order)

_Using a global object:_

       var result = mglobal.previous(<key>);
      
Example:

       var key = "";
       while ((key = person.previous(key)) != "") {
          console.log("\nPerson: " + key + ' : ' + person.get(key));
       }


_Alternatively:_

       var result = db.previous(<global name>, <key>);
      
Example:

       var key = "";
       while ((key = db.previous("Person", key)) != "") {
          console.log("\nPerson: " + key + ' : ' + db.get("Person", key));
       }


### Increment the value of a global node

_Using a global object:_

       var result = mglobal.increment(<key>, <increment_value>);
      
Example (increment the value of the "counter" node by 1.5 and return the new value):

       var result = person.increment("counter", 1.5);

_Alternatively:_

       var result = db.increment(<global name>, <key>, <increment_value>);
      
Example (increment the value of the "counter" node by 1.5 and return the new value):

       var result = db.increment("Person", "counter", 1.5);


### Lock a global node

_Using a global object:_

       var result = mglobal.lock(<key>, <timeout>);
      
Example (lock global node '1' with a timeout of 30 seconds):

       var result = person.lock(1, 30);

_Alternatively:_

       var result = db.lock(<global name>, <key>, <timeout>);
      
Example (lock global node '1' with a timeout of 30 seconds):

       var result = db.lock("Person", 1, 30);

* Note: Specify the timeout value as '-1' for no timeout (i.e. wait until the global node becomes available to lock).


### Unlock a (previously locked) global node

_Using a global object:_

       var result = mglobal.unlock(<key>);
      
Example (unlock global node '1'):

       var result = person.unlock(1);

_Alternatively:_

       var result = db.unlock(<global name>, <key>);
      
Example (unlock global node '1'):

       var result = db.unlock("Person", 1);


### Merge (or copy) part of one global to another

* Note: In order to use the 'Merge' facility with YottaDB the M support routines should be installed (**%zmgsi** and **%zmgsis**).

Global objects must be used to invoke the Merge command.

Merge from global2 to global1:

       var result = <global name 1>.merge([<key1>,] <global name 2> [, <key2>]);
      
Example 1 (merge ^MyGlobal2 to ^MyGlobal1):

       global1 = new mglobal(db, 'MyGlobal1');
       global2 = new mglobal(db, 'MyGlobal2');
       global1.merge(global2);

Example 2 (merge ^MyGlobal2(0) to ^MyGlobal1(1)):

       global1 = new mglobal(db, 'MyGlobal1', 1);
       global2 = new mglobal(db, 'MyGlobal2', 0);
       global1.merge(global2);

Alternatively:

       global1 = new mglobal(db, 'MyGlobal1');
       global2 = new mglobal(db, 'MyGlobal2');
       global1.merge(1, global2, 0);


## <a name="cursors"></a> Cursor based data retrieval

The **mcursor** class.

This facility provides high-performance techniques for traversing records held in database globals. 

### Specifying the query

The first task is to specify the 'query' for the global traverse.

       query = new mcursor(db, {global: <global_name>, key: [<seed_key>]}[, <options>]);

The 'options' object can contain the following properties:

* **multilevel**: A boolean value (default: **multilevel: false**). Set to 'true' to return all descendant nodes from the specified 'seed_key'.

* **getdata**: A boolean value (default: **getdata: false**). Set to 'true' to return any data values associated with each global node returned.

* **format**: Format for output (default: not specified). If the output consists of multiple data elements, the return value (by default) is a JavaScript object made up of a 'key' array and an associated 'data' value.  Set to "url" to return such data as a single URL escaped string including all key values ('key[1->n]') and any associated 'data' value.

Example (return all keys and names from the 'Person' global):

       query = new mcursor(db, {global: "Person", key: [""]}, {multilevel: false, getdata: true});

### Traversing the dataset

In key order:

       result = query.next();

In reverse key order:

       result = query.previous();

In all cases these methods will return 'null' when the end of the dataset is reached.

Example 1 (return all key values from the 'Person' global - returns a simple variable):

       query = new mcursor(db, {global: "Person", key: [""]});
       while ((result = query.next()) !== null) {
          console.log("result: " + result);
       }

Example 2 (return all key values and names from the 'Person' global - returns an object):

       query = new mcursor(db, {global: "Person", key: [""]}, multilevel: false, getdata: true);
       while ((result = query.next()) !== null) {
          console.log("result: " + JSON.stringify(result, null, '\t'));
       }


Example 3 (return all key values and names from the 'Person' global - returns a string):

       query = new mcursor(db, {global: "Person", key: [""]}, multilevel: false, getdata: true, format: "url"});
       while ((result = query.next()) !== null) {
          console.log("result: " + result);
       }

Example 4 (return all key values and names from the 'Person' global, including any descendant nodes):

       query = new mcursor(db, {global: "Person", key: [""]}, {{multilevel: true, getdata: true});
       while ((result = query.next()) !== null) {
          console.log("result: " + JSON.stringify(result, null, '\t'));
       }

* M programmers will recognise this last example as the M **$Query()** command.
 

### Traversing the global directory (return a list of global names)

       query = new mcursor(db, {global: <seed_global_name>}, {globaldirectory: true});

Example (return all global names held in the current directory)

       query = new mcursor(db, {global: ""}, {globaldirectory: true});
       while ((result = query.next()) !== null) {
          console.log("result: " + result);
       }


## <a name="dbfunctions">Invocation of database functions</a>

       result = db.function(<function>, <parameters>);
      
Example:

M routine called 'math':

       add(a, b) ; Add two numbers together
                 quit (a+b)

JavaScript invocation:

      result = db.function("add^math", 2, 3);


## <a name="tprocessing">Transaction Processing</a>

M DB Servers implement Transaction Processing by means of the methods described in this section.  When implementing transactions, care should be taken with JavaScript operations that are invoked asynchronously.  All the Transaction Processing methods describe here can only be invoked synchronously.  


### Start a Transaction

       result = db.tstart(<parameters>);

* At this time, this method does not take any arguments.
* On successful completion this method will return zero, or an error code on failure.

Example:

       result = db.tstart();


### Determine the Transaction Level

       result = db.tlevel(<parameters>);

* At this time, this method does not take any arguments.
* Transactions can be nested and this method will return the level of nesting.  If no Transaction is active this method will return zero.  Otherwise a positive integer will be returned to represent the current depth of Transaction nesting.

Example:

       tlevel = db.tlevel();


### Commit a Transaction

       result = db.tcommit(<parameters>);

* At this time, this method does not take any arguments.
* On successful completion this method will return zero, or an error code on failure.

Example:

       result = db.tcommit();


### Rollback a Transaction

       result = db.trollback(<parameters>);

* At this time, this method does not take any arguments.
* On successful completion this method will return zero, or an error code on failure.

Example:

       result = db.trollback();


## <a name="dbclasses">Direct access to InterSystems classes (IRIS and Cache)</a>

### Invocation of a ClassMethod

       result = db.classmethod(<class_name>, <classmethod_name>, <parameters>);
      
Example (Encode a date to internal storage format):

       result = db.classmethod("%Library.Date", "DisplayToLogical", "10/10/2019");


### Creating and manipulating instances of objects

The following simple class will be used to illustrate this facility.

       Class User.Person Extends %Persistent
       {
          Property Number As %Integer;
          Property Name As %String;
          Property DateOfBirth As %Date;
          Method Age(AtDate As %Integer) As %Integer
          {
             Quit (AtDate - ..DateOfBirth) \ 365.25
          }
       }

### Create an entry for a new Person

       person = db.classmethod("User.Person", "%New");

Add Data:

       result = person.setproperty("Number", 1);
       result = person.setproperty("Name", "John Smith");
       result = person.setproperty("DateOfBirth", "12/8/1995");

Save the object record:

       result = person.method("%Save");

### Retrieve an entry for an existing Person

Retrieve data for object %Id of 1.
 
       person = db.classmethod("User.Person", "%OpenId", 1);

Return properties:

       let number = person.getproperty("Number");
       let name = person.getproperty("Name");
       let dob = person.getproperty("DateOfBirth");

Calculate person's age at a particular date:

       let today = db.classmethod("%Library.Date", "DisplayToLogical", "10/10/2019");
       let age = person.method("Age", today);


### Reusing an object container

Once created, it is possible to reuse containers holding previously instantiated objects using the **reset()** method.  Using this technique helps to reduce memory usage in the Bun environment.

Example 1 Reset a container to hold a new instance:

       person.reset("User.Person", "%New");

Example 2 Reset a container to hold an existing instance (object %Id of 2):

       person.reset("User.Person", "%OpenId", 2);


## <a name="license">License</a>

Copyright (c) 2021-2023 MGateway Ltd,
Surrey UK.                                                      
All rights reserved.
 
http://www.mgateway.com                                                  
Email: cmunt@mgateway.com
 
 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.      

## <a name="relnotes">Release Notes</a>

### v1.0.1 (11 January 2023)

* Initial Release

### v1.0.2 (12 January 2023)

* Remove the need to prefix global names with the '^' character for API-based connections to YottaDB.
* Allow the environment variables required for binding to the YottaDB API to be specified as name/value pairs in a separate JSON object.

### v1.0.2b (22 June 2023)

* Documentation update.

### v1.1.3 (25 August 2023)

* Introduce support for invoking all database commands asynchronously.

### v1.2.4 (10 November 2023)

* Introduce support for the mcursor class

