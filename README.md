# MEMCACHED
This is my own version of memcached server side, Memcached is an Free & open source, high-performance, distributed memory object caching system, generic in nature, but intended for use in speeding up dynamic web applications by alleviating database load.
memcached server written in node.js.

The server is useful if you want a simple memcached server that integrates with your existing node.js infrastructure;

## Installation
Installing the package is very simple. Just download the repository once is located in your environment install using npm:

    # npm install
    # npm link


On Ubuntu or Mac OS X systems, use `sudo`:

    $ sudo npm install
    $ sudo npm link

### Compatibility
Versions 1 and later should be used at least with Node.js v8 or later:

* Node.js v8 or later: ^1.0.0
* Node.js v6 or earlier: ^0.2.0.

## memcached Server
this is server compatible with memcached.

### Usage
Start from the command line:

    $ memcached
    $ memcached --port=[YOUR PORT ASSIGNED]

After it, you are going to be able to use your client.

### Options
Options are designed to be compatible with the original memcached, whenever possible.

* `--port port`: Start server on the given port.

### Server Commands
memcached accepts the following commands, based on [the original commands](https://github.com/memcached/memcached/blob/master/doc/protocol.txt):

#### Storage

There are a few storage commands that start with a header like this:

`<command> <key> <flags> <exptime> <bytes>\r\n`

* `<command>` is `set`, `add`, `replace`, `append` or `prepend`, `cas`.

* `<key>` is a string that will identify the element.

* `<flags>` is a 32-bit integer to store with the value.

* `<exptime>` is expiration time in seconds.

* `<bytes>` is the length of the data in bytes.

Afterwards the server will expect the data block:

`<data>\r\n`

with a length of `<bytes>`.

The server will respond with:

* `STORED\r\n` to indicate success.

* `NOT_STORED\r\n` to indicate failure.

#### Retrieval

The command `get` has the following syntax:

`get <key>\r\n`

where `<key>` is a string that identifies an element.

`gets <key>\r\n`

where `<key>` is a string that identifies an element.

#### Deletion

The command to delete a record is:

`delete <key>\r\n`

where the `<key>` identifies the record.
The server will respond with:

* `DELETED` to indicate that the record has been deleted.

## API

The API has the following functions.

### set( key, value[, time, flag] )
Stores a value to the cache.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### add( key, value[, time, flag] )
Stores a value to the cache if the key does not exist.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### replace( key, value[, time, flag] )
Replaces a value to the cache if the key does exist.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### append( key, value[, time, flag] )
Appends a value to the cache if the key does exist.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### prepend( key, value[, time, flag] )
Concats a value at the begining to the cache if the key does exist.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### prepend( key, value[, time, flag] )
Concats a value at the begining to the cache if the key does exist.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### cas( key, value[, time, flag] )
stands for Check-And-Set or Compare-And-Swap. memcached CAS command is used to set the data if it is not updated since last fetch.
If time (in ms) is specified, the value will be automatically removed (via setTimeout)

### get( [key] )
Retreives a value for a given key, or if no key is passed, will return the internal cache object.

### gets( [key] )
Retreives a value and CAS Value for a given key, or if no key is passed, will return the internal cache object.

### del( key )
Deletes a key, returns a boolean indicating if the key existed and was deleted

### clear()
Deletes all keys

### size
The current number of entries in the cache

### memsize
The approximate size in bytes of the cache (including all objects stored and cache overhead)
This is a rough estimate, using the js-sizeof library.

### hits
The number of cache hits

### misses
The number of cache misses.


## References
* [protocol.txt](https://github.com/memcached/memcached/blob/master/doc/protocol.txt)

## License
Distributed under the ISC license.

