# mg-dbx-napi

High speed Synchronous and Asynchronous access to InterSystems Cache/IRIS and YottaDB from Node.js or Bun.

Chris Munt <cmunt@mgateway.com>  
20 February 2026, MGateway Ltd [http://www.mgateway.com](http://www.mgateway.com)

* Verified to work with Node.js and the Bun JavaScript engine.
* Two connectivity models to the InterSystems or YottaDB database are provided: High performance via the local database API or network based.
* [Release Notes](#relnotes) can be found at the end of this document.

Contents

* [What Is mg-dbx-napi?](#whatis)
* [Installing mg-dbx-napi](#install)
* [Using mg-dbx-napi](#using)
* [Connecting to the database](#connect)
* [Invocation of database commands](#dbcommands)
* [Invocation of database functions](#dbfunctions)
* [Cursor based data retrieval](#cursors)
* [Transaction Processing](#tprocessing)
* [Direct access to InterSystems classes (IRIS and Cache)](#dbclasses)
* [Direct access to SQL: MGSQL and InterSystems SQL (IRIS and Cache)](#dbsql)
* [JavaScript Superserver](#jssuperserver)
* [Background and History of This Package](#overview)
* [License](#license)

## <a name="whatis">What Is *mg-dbx-napi*?</a>

This package provides **Node.js** and **Bun** applications with extremely high-performance access to InterSystems database products and the YottaDB database.

## <a name="install">Installing mg-dbx-napi</a>

       npm install mg-dbx-napi


## <a name="using">Using mg-dbx-napi</a>

*mg-dbx-napi* is loaded into a Node.js or Bun.js script as follows:

        import {server, mglobal, mclass, mcursor} from 'mg-dbx-napi';

If you don't require all the classes, just import the ones you need, eg:

        import {server, mglobal} from 'mg-dbx-napi';


Notes:

- *mg-dbx-napi* is compatible with both Node.js (version 20 and later) and Bun.js (version 1.0 and later).

- Pre-compiled versions of the *mg-dbx-napi.node* add-on are included within the installed package, for the following platforms:

  - Windows 64-bit
  - Linux x64
  - Linux ARM64

The two Linux versions have been compiled using version 2.31 of the GNU C Library, so they will work with the following Linux distributions and their later versions:

  - Ubuntu 20.04
  - Debian 11 (Bullseye)
  - Suse Linux 15-SP5
  - Redhat 9.2
  - CentOS v9
  - Raspberry Pi OS 2023-05-03/11

  If you are using a different Linux distribution, check its C Library version using:

        ldd --version

- *mg-dbx-napi* will automatically detect your operating system and architecture and load the
appropriate add-on version and intermediate interface shim module.


- If you want to use *mg-dbx-napi* on a platform other than those for which pre-compiled add-on versions are provided, please contact Chris Munt <cmunt@mgateway.com>  


## <a name="databases">Supported Databases</a>

*mg-dbx-napi* is designed for use with the following databases:

- [InterSystems IRIS](https://www.intersystems.com/uk/data-platform/)
- [InterSystems Cache](https://www.intersystems.com/uk/cache/)
- [YottaDB](https://yottadb.com/)

*mg-dbx-napi* can connect in two ways to these databases:

- networked connection, where the Node.js/Bun.js system and database can be on separate servers
- in-process API connection, where the Node.js/Bun.js system and database reside on the same physical server

Networked connections provide the most all-round platform compatibility (eg Node.js running on a Windows system can connect to YottaDB which only runs on Linux), and highest levels of security.  In order to use a networked connection, you need to install our DB Superserver on the database system: see next section below.

The in-process API connection mode provides the very highest levels of performance, reaching near in-memory performance access to the respective database persistent storage.  Note that in this mode, you need to be aware of the platform availability of the database products:

- InterSystems' Cache and IRIS database versions are available for both Windows and Linux (x64 and ARM64)
- YottaDB is only available on Linux (x64 and ARM64)

The in-process API connection does **not** require installation of our DB Superserver on the database system, unless:

- you want to use SQL to access the data held on the database
- you want to use the Merge command with the YottaDB database


### Installing the M support routines (also known as the DB Superserver)

The M support routines are required for:

* Network based access to databases (unless the experimental JavaScript based superserver is used).
* Direct access to SQL (either via the API or via the network).

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

Example:

        import {server, mglobal} from 'mg-dbx-napi';
        let db = new server();
        db.open({
          type: "IRIS",
          path:"/opt/IRIS20181/mgr",
          username: "_SYSTEM",
          password: "SYS",
          namespace: "USER"
        });

        let person = new mglobal(db, "Person");
        let name = person.get(1);

        // ..do more stuff, then finally:

        db.close();


Most **mg-dbx-napi** methods are capable of operating either synchronously or asynchronously. For an operation to complete asynchronously, simply supply a suitable callback as the last argument in the call.

The first step is to include the **mg-dbx-napi** classes in your JavaScript project.  For example:

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

           var open = db.open({
               type: "YottaDB",
               path: "/usr/local/lib/yottadb/r138",
               env_vars: {
                 ydb_gbldir: '/root/.yottadb/r1.38_x86_64/g/yottadb.gld',
                 ydb_routines: '/root/.yottadb/r1.38_x86_64/o*(/root/.yottadb/r1.38_x86_64/r /root/.yottadb/r) /usr/local/lib/yottadb/r138/libyottadbutil.so',
                 ydb_ci: '/usr/local/lib/yottadb/r138/zmgsi.ci'
               }
             });

Note that the actual YottaDB environment variables that you should use will depend on your YottaDB configuration, and, in particular, the Globals and Routines that you may need to access from Node.js or Bun.js.

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


### Returning (and optionally changing) the current character set

UTF-8 is the default character encoding for **mg-dbx-napi**.  The other option is the 8-bit ASCII character set (characters of the range ASCII 0 to ASCII 255).  Native Unicode (as UTF-16) is supported for InterSystems DB Servers. The ASCII character set is a better option when exchanging single-byte binary data with the database.

       current_charset = db.charset([<new_charset>]);

Example 1 (Get the current character set): 

       var charset = db.charset();

Example 2 (Change the current character set): 

       var new_charset = db.charset('ascii');

Example 3 (Native Unicode support for InterSystems DB Servers): 

       var new_charset = db.charset('utf-16');

* If the operation is successful this method will echo back the new character set name.  If not successful, the method will return the name of the current (unchanged) character set.
* Currently supported character sets and encoding schemes: 'ascii', 'binary', 'utf-8' and 'utf-16' for InterSystems DB Servers.


### Setting (or resetting) the timeout for the connection

       new_timeout = db.settimeout(<new_timeout>);

Specify a new timeout value (in seconds) for the connection.  If the operation is successful this method will return the new value for the timeout.

Example (Set the timeout to 30 seconds): 

       var new_timeout = db.settimeout(30);


### Get the error message associated with the previous database operation

       error_message = db.geterrormessage();

This method will return the error message (as a string) associated with the previous database operation.  An empty string will be returned if the previous operation completed successfully.


### Close database connection

       db.close();
 

## <a name="dbcommands">Invocation of database commands</a>

Database commands can either be invoked directly from a database object or via a mglobal container object.  The latter approach does give slightly better performance - particularly in cases where the same global reference is repeatedly used.

mglobal container objects can be created as described in the [Connecting to the database](#Connect) section.

Example (using a global named "Person"):

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


### Create a set of child data nodes in the DB Server

_Status: Beta release._

       var result = mglobal.setchildnodes([<partialkey...>,] <[childnodes]>, <{options}>);

Where:

* **childnodes**: an array of child data nodes.  Each element has the following form:

        {key: <keys value(s)>, data: <data value>}


* **options**: A JSON object in which the following options can be defined:
	* **lock**: if **true**, acquire a lock on the target DB data node before proceeding.
	* **locktimeout**: timeout for the lock operation (in seconds).
	* **numerickeys**: Treat the dataset as a numerically-keyed JavaScript array.


Example 1:

       global = new mglobal(db, 'MyGlobal');
       const nodes = [];
       nodes[0] = {key: 1, data: "record#1"};
       nodes[1] = {key: 2, data: "record#2"};
       nodes[2] = {key: 3, data: "record#3"};
       nodes[3] = {key: "a", data: "record#a"};
       result = global.setchildnodes(nodes, {});

This will create the following data nodes in the DB Server:

       ^MyGlobal(1)="record#1"
       ^MyGlobal(2)="record#2"
       ^MyGlobal(3)="record#3"
       ^MyGlobal("a")="record#a"

Example 2 (using partial keys):

       global = new mglobal(db, 'MyGlobal', "a");
       const nodes = [];
       nodes[0] = {key: 1, data: "record#1"};
       nodes[1] = {key: 2, data: "record#2"};
       nodes[2] = {key: 3, data: "record#3"};
       nodes[2] = {key: "a", data: "record#a"};
       result = global.setchildnodes("b", nodes, {});

This will create the following data nodes in the DB Server:

       ^MyGlobal("a","b",1)="record#1"
       ^MyGlobal("a","b",2)="record#2"
       ^MyGlobal("a","b",3)="record#3"
       ^MyGlobal("a","b","a")="record#a"

Example 3 (specifying multiple key values in an array):

       global = new mglobal(db, 'MyGlobal');
       const nodes = [];
       nodes[0] = {key: 1, data: "record#1"};
       nodes[1] = {key: [1, 2, "c"], data: "three keys"};
       result = global.setchildnodes(nodes, {});

This will create the following data nodes in the DB Server:

       ^MyGlobal(1)="record#1"
       ^MyGlobal(1,2,"c")="three keys"

Example 4 (using numeric keys):

       global = new mglobal(db, 'MyGlobal');
       const nodes = [];
       nodes[0] = "record#1";
       nodes[1] = "record#2";
       nodes[2] = "record#3};
       result = global.setchildnodes(nodes, {numerickeys: true});

This will create the following data nodes in the DB Server:

       ^MyGlobal(0)="record#1"
       ^MyGlobal(1)="record#2"
       ^MyGlobal(2)="record#3"

### Retrieve a set of child data nodes from the DB Server

_Status: Beta release._

       var result = mglobal.getchildnodes([<partialkey...>,], <{options}>);

Where:

* **options**: A JSON object in which the following options can be defined:
	* **getdata**: if **true**, return the child node data in addition to the key values (set to **true** or **false**, default: **false**).
	* **max**: the maximum number of nodes to return. A default maximum of 100 records is automatically applied.
	* **start**: start from this key value.
	* **end**: finish at this key value.
	* **lock**: if **true**, acquire a lock on the target DB data node before proceeding.
	* **locktimeout**: timeout for the lock operation (in seconds).
	* **numerickeys**: Treat the dataset as a numerically-keyed JavaScript array.

Child node data will re returned in an array, each element of which has the following form:

       {key: <key value>, data: <data value>}

If the **getdata** property is not set to **true**, a simple array of key values will be returned.

The following examples are based on the DB Server data set:

       ^MyGlobal("a","b",1)="record#1"
       ^MyGlobal("a","b",2)="record#2"
       ^MyGlobal("a","b",3)="record#3"
       ^MyGlobal("a","b",4,1)="record#4,1"
       ^MyGlobal("a","b","a")="record#a"

Example 1 (return all key values):

       global = new mglobal(db, 'MyGlobal');
       result =  global.getchildnodes("a", "b", {});

The following JavaScript array will be returned:

       result[0] = 1
       result[1] = 2
       result[2] = 3
       result[3] = 4
       result[4] = "a"

Example 2 (return all key values and the associated data):

       global = new mglobal(db, 'MyGlobal');
       result =  global.getchildnodes("a", "b", {getdata: true});

The following JavaScript array will be returned:

       result[0] = {key: 1, data: "record#1}
       result[1] = {key: 2, data: "record#2}
       result[2] = {key: 3, data: "record#3}
       result[3] = {key: 4}
       result[4] = {key: "a", data: "record#a}

Example 3 (specifying start and end key values):

       global = new mglobal(db, 'MyGlobal');
       result =  global.getchildnodes("a", "b", {getdata: true, start: 2, end: 3});

The following JavaScript array will be returned:

       result[1] = {key: 2, data: "record#2}
       result[2] = {key: 3, data: "record#3}

Example 4 (using numeric keys):

For the following dataset contained in the DB Server:

       ^MyGlobal(0)="record#1"
       ^MyGlobal(1)="record#2"
       ^MyGlobal(2)="record#3"
       ^MyGlobal(3,1)="record#3,1"

JavaScript:

       global = new mglobal(db, 'MyGlobal');
       result = global.getchildnodes({numerickeys: true});

This will return the following JavaScript array:

       result[0] = "record#1"
       result[1] = "record#2"
       result[2] = "record#3"
       result[3] = undefined

Note that JavaScript **undefined** is returned for nodes where there's no data defined at the current key-level, but data defined at a lower (i.e. descendant) key-level.

Data nodes are returned up to the point at which the key is undefined, or the value defined in the **end** option is reached (whichever comes first).  

## <a name="cursors"></a> Cursor based data retrieval

The **mcursor** class.

This facility provides high-performance techniques for traversing records held in database globals. 

### Specifying the query

The first task is to specify the 'query' for the global traverse.

       query = new mcursor(db, {global: <global_name>, key: [<seed_key>]}[, {<options>}]);

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

       query = new mcursor(db, {global: "Person", key: [""]}, {multilevel: false, getdata: true});
       while ((result = query.next()) !== null) {
          console.log("result: " + JSON.stringify(result, null, '\t'));
       }


Example 3 (return all key values and names from the 'Person' global - returns a string):

       query = new mcursor(db, {global: "Person", key: [""]}, {multilevel: false, getdata: true, format: "url"});
       while ((result = query.next()) !== null) {
          console.log("result: " + result);
       }

Example 4 (return all key values and names from the 'Person' global, including any descendant nodes):

       query = new mcursor(db, {global: "Person", key: [""]}, {multilevel: true, getdata: true});
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

Once created, it is possible to reuse containers holding previously instantiated objects using the **reset()** method.  Using this technique helps to reduce memory usage in the JavaScript environment.

Example 1 Reset a container to hold a new instance:

       person.reset("User.Person", "%New");

Example 2 Reset a container to hold an existing instance (object %Id of 2):

       person.reset("User.Person", "%OpenId", 2);


## <a name="dbsql">Direct access to SQL: MGSQL and InterSystems SQL (IRIS and Cache)</a>

**mg-dbx-napi** provides direct access to the Open Source MGSQL engine ([https://github.com/chrisemunt/mgsql](https://github.com/chrisemunt/mgsql)) and InterSystems SQL (IRIS and Cache).

* Note: In order to use this facility the M support routines should be installed (**%zmgsi** and **%zmgsis**).

### Specifying the SQL query

The first task is to specify the SQL query.

       query = new mcursor(db, {sql: <sql_statement>[, type: <sql_engine>]});
Or:

       query = db.sql({sql: <sql_statement>[, type: <sql_engine>]});

Example 1 (using MGSQL):

       query = db.sql({sql: "select * from person"});


Example 2 (using InterSystems SQL):

       query = db.sql({sql: "select * from SQLUser.person", type: "Cache"});


### Execute an SQL query

       var result = <query>.execute();

The result of query execution is an object containing the return code and state and any associated error message.  The familiar ODBC return and status codes are used.

Example 1 (successful execution):

       {
           "sqlcode": 0,
           "sqlstate": "00000",
           "columns": [
                         {
                            "name": "Number",
                            "type": "INTEGER"
                         },
                           "name": "Name",
                            "type": "VARCHAR"
                         },
                           "name": "DateOfBirth",
                            "type": "DATE"
                         }
                      ]
       }


Example 2 (unsuccessful execution):

       {
           "sqlcode": -1,
           "sqlstate": "HY000",
           "error": "no such table 'person'"
       }


### Traversing the returned dataset (SQL 'select' queries)

In result-set order:

       result = query.next();

In reverse result-set order:

       result = query.previous();

In all cases these methods will return 'null' when the end of the dataset is reached.

Example:

       while ((row = query.next()) !== null) {
          console.log("row: " + JSON.stringify(result, null, '\t'));
       }

The output for each iteration is a row of the generated SQL result-set.  For example:

       {
           "number": 1,
           "name": "John Smith",
       }

### SQL cleanup

For 'select' queries that generate a result-set it is good practice to invoke the 'cleanup' method at the end to delete the result-set held in the database.

       var result = <query>.cleanup();

### Reset an SQL container with a new SQL Query

       <query>.reset({sql: <sql_statement>[, type: <sql_engine>]);


## <a name="jssuperserver">JavaScript Superserver</a>

* Note: This facility is experimental at this time.  Also, due to missing functionality in the Bun JavaScript engine, the JavaScript Superserver only works under Node.js. 

**mg-dbx-napi** can connect to remote DB Servers over the network.  Usually, this requires the use of a Superserver written in M-code installed within the DB Server.  We now include a Superserver written purely in JavaScript (**mgsi_node.mjs**).  The JavaScript Superserver resides on the same host as the DB Server.

**mg-dbx-napi**, running on the remote client, connects to this Superserver which then connects to the DB Server via its API.  Using this facility removes the need for the M-based Superserver operating within the DB Server environment.

Required components:

* On the client: mg_dbx_napi.mjs|ts and mg-dbx-napi.node
* On the DB Server: mgsi_node.mjs and mg-dbx-napi.node

Starting the JavaScript Superserver:

       node mgsi_node.mjs <tcp_port>

Example (Superserver listening on TCP port 7777):

       node mgsi_node.mjs 7777

By default, the Superserver will only write initial start-up information to the console.  If you wish to see evidence of all requests being processed, start the Superserver in 'verbose' mode:

       node mgsi_node.mjs 7777 verbose

On the client-side, the **mg-dbx-napi** open() method must be supplied with parameters for both API-based and network-based access.  **mg-dbx-napi** will use the network-oriented parameters to first connect to the remote JavaScript Superserver which will then use the forwarded API-oriented parameters to connect to the DB Server.

Ordinarily, when both API-oriented and network-oriented parameters are supplied to the open() method, the API-oriented parameters take precedence.  However, in this case we want the network-oriented parameters to take precedence in the first instance.  To ensure that this happens, set the **use** parameter to **'tcp'**.

Example (IRIS):

          var open = db.open({
               type: "YottaDB",
               use: "tcp",
               path:"/opt/IRIS20181/mgr",
               host: "localhost",
               tcp_port: 7777,
               username: "_SYSTEM",
               password: "SYS",
               namespace: "USER"
             });

Example (YottaDB):

           var open = db.open({
               type: "YottaDB",
               use: "tcp",
               path: "/usr/local/lib/yottadb/r138",
               host: "localhost",
               tcp_port: 7777,
               env_vars: {
                 ydb_gbldir: '/root/.yottadb/r1.38_x86_64/g/yottadb.gld',
                 ydb_routines: '/root/.yottadb/r1.38_x86_64/o*(/root/.yottadb/r1.38_x86_64/r /root/.yottadb/r) /usr/local/lib/yottadb/r138/libyottadbutil.so',
                 ydb_ci: '/usr/local/lib/yottadb/r138/zmgsi.ci'
               }
             });


## <a name="background">Background and History of This Package</a>

**Node.js** was released in 2009 and is based on the Google V8 JavaScript engine.  It has always been possible to extend the functionality of Node.js by creating add-on modules that work directly to the V8 C++ API.  With Node.js version 8, the third iteration of a new C++ API was released - Node-API.  This API is intrinsically part of Node.js and, as such, is independent of the underlying JavaScript implementation.  A key design goal of this new API was that it should be Application Binary Interface (ABI) stable across versions of Node.js.  In other words, it should not be necessary to recompile add-on modules based on Node-API when the underlying Node.js platform is upgraded to a new version.  By contrast, Node.js add-ons based on the native V8 API need to be recompiled every time the underlying Node.js/V8 engine is upgraded.

2022 saw the release of a new server-oriented JavaScript engine in beta form - **Bun**.  Bun is based on Apple's JavaScriptCore engine which is used in the Safari web browser.  Bun promised better performance than Node.js - up to 3x faster has been claimed.  In order to hit the ground running, Bun natively implements hundreds of Node.js APIs, including around 90% of the Node-API functions.  Therefore, in theory, Bun should be able to use add-on modules developed for Node.js provided they are based on Node-API.

**mg-dbx-napi** is based on Node-API and is designed to work with both Node.js and Bun.  It offers applications the same functionality as the earlier [mg-dbx](https://github.com/chrisemunt/mg-dbx) module for Node.js which is based on the native V8 API.

**mg-dbx-napi** provides us with the opportunity to explore a high-performance JavaScript engine (Bun) working with the high-performance databases provided by InterSystems and YottaDB but in a way that is compatible with our current **mg-dbx** add-on solution for Node.js.

Those familiar with **mg-dbx** will know that applications engage directly with the functionality provided by the **mg-dbx.node** add-on.  With **mg-dbx-napi.node**, a JavaScript _shim_ is supplied for both Node.js and Bun to provide a common application interface for the two JavaScript engines.  **mg-dbx-napi.node** is itself an add-on written in C++ and manages the interface to the database and is common to both Node.js and Bun.

The Node.js _shim_ is provided as a JavaScript module:

       MyNodeApplication.js -> mg_dbx_napi.js -> mg-dbx-napi.node

The Bun _shim_ is provided as a TypeScript module:

       MyBunApplication.js -> mg_dbx_napi.ts -> mg-dbx-napi.node

However, the packaging included within this repository means that it will automatically detect and load the correct version of both the shim module and add-on module for your operating system and architecture.

## <a name="license">License</a>

Copyright (c) 2021-2026 MGateway Ltd,
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

### v1.3.5 (18 November 2023)

* Introduce support for direct SQL access.
* Correct a fault in the cursor operation to return a global directory listing from YottaDB.

### v1.4.6 (8 December 2023)

* Introduce native Unicode support for InterSystems DB Servers - as character set/encoding UTF-16.

### v1.4.7 (4 February 2024)

* Correct a regression in the processing of numeric values (regression introduced in v1.4.6).

### v1.4.8 (12 March 2024)

* Introduce a JavaScript based Superserver.  This facility is currently only available for Node.js.

### v1.4.9 (19 March 2024)

* Remove the need for the M support routines (superserver code) to be installed in order to support the **Merge** command under YottaDB.  If API-based connectivity to a local YottaDB database is selected then the **Merge** command will be executed via a series of YottaDB API calls.
* Add a 'verbose' option to the JavaScript based Superserver.

### v1.4.10 (17 May 2024)

* Correct a fault in the InterSystems get and change namespace operations (db.namespace()).

### v1.5.11 (7 October 2024)

* Introduce support for the **setchildnodes()** and **getchildnodes()** methods.

### v1.5.12 (9 October 2024)

* Include an option to lock the target global for the **setchildnodes()** and **getchildnodes()** methods.
* For cases where data doesn't exist for a DB node, the **getchildnodes()** method will not create a 'data' property.

### v1.5.13 (16 October 2024)

* Introduce the concept of **numerickeys** for the **setchildnodes()** and **getchildnodes()** methods.
	* This is a facility for storing and retrieving (in or from the DB Server) data held in numerically-keyed JavaScript arrays.
* Allow multiple key values to be specified (as a JavaScript array) in the **setchildnodes()** method.
* Include a minor optimisation for the YottaDB implementation of the **getchildnodes()** method.

### v1.6.14 (21 November 2024)

* Introduce support for binary data: db.charset('binary').
	* Additionally, the 'ascii' character set will now work as expected: db.charset('ascii')

### v1.6.15 (9 December 2025)

* Correct a potential memory access violation in the **dbx.setloglevel()** and **dbx.logmessage()** methods.

### v1.6.16 (11 February 2026)

* Introduce support for macOS.

### v1.6.17 (20 February 2026)

* Minor changes to the packaging required to seamlessly support QEWD: https://www.npmjs.com/package/qewd


