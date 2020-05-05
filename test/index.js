/* global describe, it */
'use strict';

const assert = require( 'chai' ).assert;
const Memcached = require( '../src/memcached/memory' );

let i = 0;

function new_key() {
    return 'key_' + ( ++i );
}

const suite = function( cache ) {
    describe( 'size', function() {
        it( 'should be 0 when empty', function() {
            cache.clear();
            assert.equal( cache.size, 0 );
        } );
        it( 'should be accurate', function() {
            cache.clear();
            cache.set( new_key(), 1 );
            assert.equal( cache.size, 1 );
        } );
        it( 'should be accurate after object falls out of cache', function( done ) {
            this.slow( 200 ); // not slow at 50ms
            const start = cache.size;
            cache.set( new_key(), 1, 5 );
            assert.equal( cache.size, start + 1 );
            setTimeout( function() {
                assert.equal( cache.size, start );
                done();
            }, 50 );
        } );
    } );

    describe( 'memsize', function() {

        it( 'should be 0 when empty', function() {
            cache.clear();
            assert.equal( cache.memsize, 0 );
        } );

        it( 'should be accurate', function() {
            cache.clear();

            const firstKey = new_key();
            cache.set( firstKey, 1 );
            const firstSize = cache.memsize;
            assert.isAbove( firstSize, 0 );

            const secondKey = new_key();
            cache.set( secondKey, 10 );
            const secondSize = cache.memsize;
            assert.isAbove( secondSize, firstSize );

            cache.del( secondKey );
            assert.equal( cache.memsize, firstSize );

            cache.del( firstKey );
            assert.equal( cache.memsize, 0 );
        } );

        it( 'should be accurate after object falls out of cache', function( done ) {
            this.slow( 200 ); // not slow at 50ms
            const start = cache.memsize;
            cache.set( new_key(), 1, 5 );
            assert.isAbove( cache.memsize, start );
            setTimeout( function() {
                assert.equal( cache.memsize, start );
                done();
            }, 50 );
        } );
    } );

    describe( 'clear()', function() {
        it( 'should clear all objects', function() {
            const size_start = cache.size;
            const keys = [ new_key(), new_key(), new_key() ];
            cache.set( keys[ 0 ], 1, 10 );
            cache.set( keys[ 1 ], 2, 10 );
            cache.set( keys[ 2 ], 3, 10 );
            assert.equal( cache.size, size_start + 3 );

            cache.clear();
            assert.equal( cache.size, 0 );
            assert.isNull( cache.get( keys[ 0 ] ) );
            assert.isNull( cache.get( keys[ 1 ] ) );
            assert.isNull( cache.get( keys[ 2 ] ) );
        } );
    } );

    describe( 'get()', function() {
        it( 'should return the internal cache object when called with no key', function() {
            assert.equal( cache._cache, cache.get() );
        } );

        it( 'should return null if key doesn\'t exist', function() {
            assert.isNull( cache.get( 'awf1n1a' ) );
            assert.isNull( cache.get( null ) );
            assert.isNull( cache.get( 1 ) );
            assert.isNull( cache.get( true ) );
            assert.isNull( cache.get( false ) );
        } );

        it( 'should return value', function() {
            const complicated = [ 'a', {
                'b': 'c',
                'd': [ 'e', 3 ]
            }, '@' ];
            const key = new_key();
            cache.set( key, complicated, 100 );
            assert.deepEqual( cache.get( key ).data, complicated );
        } );
    } );

    describe( 'set()', function() {
        it( 'should overwrite existing object if exists', function( done ) {
            const ttl1 = 20;
            const ttl2 = 20;
            const value1 = {
                a: 1
            };
            const value2 = {
                a: 2
            };
            const key = new_key();

            cache.set( key, value1, ttl1 );
            assert.deepEqual( cache.get( key ).data, value1 );
            setTimeout( function() {
                cache.set( key, value2, ttl2 );
                assert.deepEqual( cache.get( key ).data, value2 );
            }, 10 );

            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.deepEqual( cache.get( key ).data, value2 );
                done();
            }, 25 );
        } );
        describe( 'stored object', function() {
            it( 'should exist during ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const key = new_key();
                cache.set( key, value, ttl );
                setTimeout( function() {
                    assert.deepEqual( cache.get( key ).data, value );
                    done();
                }, 10 );
            } );
            it( 'should expire after ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const key = new_key();
                cache.set( key, value, ttl );
                setTimeout( function() {
                    assert.isNull( cache.get( key ) );
                    done();
                }, 30 );
            } );
        } );
    } );

    describe( 'add()', function() {
        it( 'should not overwrite existing object if exists', function( done ) {
            const ttl1 = 30;
            const ttl2 = 30;
            const value1 = {
                a: 1
            };
            const value2 = {
                a: 2
            };
            const key = new_key();

            cache.add( key, value1, ttl1 );
            assert.deepEqual( cache.get( key ).data, value1 );

            setTimeout( function() {
                cache.add( key, value2, ttl2 );
                assert.notEqual( cache.get( key ).data, value2 );
            }, 10 );

            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.deepEqual( cache.get( key ).data, value1 );
                done();
            }, 25 );
        } );
        describe( 'stored object', function() {
            it( 'should exist during ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const key = new_key();
                cache.add( key, value, ttl );
                setTimeout( function() {
                    assert.deepEqual( cache.get( key ).data, value );
                    done();
                }, 10 );
            } );
            it( 'should expire after ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const key = new_key();
                cache.add( key, value, ttl );
                setTimeout( function() {
                    assert.isNull( cache.get( key ) );
                    done();
                }, 30 );
            } );
        } );
    } );

    describe( 'replace()', function() {
        it( 'should replace existing object if exists', function( done ) {
            const ttl1 = 20;
            const ttl2 = 20;
            const value1 = {
                a: 1
            };
            const value2 = {
                a: 2
            };
            const key = new_key();

            cache.set( key, value1, ttl1 );
            assert.deepEqual( cache.get( key ).data, value1 );

            setTimeout( function() {
                cache.replace( key, value2, ttl1 );
            },5);


            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.isNotNull( cache.get( key ) );         
                done();
            }, 25 );
        } );
    } );

    describe( 'append()', function() {
        it( 'should append to and existing object if exists', function( done ) {
            const ttl1 = 20;
            const value1 =  "text";
            
            const value2 = " append";
            const key = new_key();

            cache.set( key, value1, ttl1 );
            assert.deepEqual( cache.get( key ).data, value1 );
            setTimeout( function() {
                cache.append( key, value2);
                assert.deepEqual( cache.get( key ).data, value1 + value2 );
            }, 10 );

            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.deepEqual( cache.get( key ).data, value1 + value2);
                done();
            }, 25 );
        } );
        describe( 'stored object', function() {
            it( 'should exist during ttl (ms)', function( done ) {

                const ttl = 20;
                const value = "Timeout";
                const value2 = " append";
                const key = new_key();
                cache.set( key, value, ttl );
                cache.append( key, value2);
                setTimeout( function() {
                    assert.deepEqual( cache.get( key ).data, value + value2);
                    done();
                }, 10 );
            } );

            it( 'should expire after ttl (ms)', function( done ) {

                const ttl = 20;
                const value = "Timeout";
                const value2 = " append";
                const key = new_key();
                cache.set( key, value, ttl );
                cache.append( key, value2, ttl);

                setTimeout( function() {
                    assert.isNull( cache.get( key ));
                    done();
                }, 30 );
            } );
        } );
    } );

    describe( 'prepend()', function() {
        it( 'should prepend to and existing object if exists', function( done ) {
            const ttl1 = 20;
            const value1 =  "text";
            
            const value2 = " prepend";
            const key = new_key();

            cache.set( key, value1, ttl1 );
           // assert.deepEqual( cache.get( key ).data, value1 );

            setTimeout( function() {
                cache.prepend( key, value2, ttl1);

                assert.deepEqual( cache.get( key ).data, value2 + value1);
            }, 10 );

            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.deepEqual( cache.get( key ).data, value2 + value1);
                done();
            }, 25 );
        } );
        describe( 'stored object', function() {
            it( 'should exist during ttl (ms)', function( done ) {

                const ttl = 20;
                const value = "Timeout";
                const value2 = "prepend ";
                const key = new_key();
                cache.set( key, value, ttl );
                cache.prepend( key, value2 );
                setTimeout( function() {
                    assert.deepEqual( cache.get( key ).data, value2 + value );
                    done();
                }, 10 );
            } );
            
            it( 'should expire after ttl (ms)', function( done ) {

                const ttl = 20;
                const value = "Timeout";
                const value2 = "prepend ";
                const key = new_key();
                cache.set( key, value, ttl );
                cache.prepend( key, value2 , ttl);

                setTimeout( function() {
                    assert.isNull( cache.get( key ) );
                    done();
                }, 30 );
            } );
        } );
    } );

    describe( 'gets()', function() {
        it( 'should return the internal cache object when called with no key', function() {
            assert.equal( cache._ids, cache.gets() );
        } );

        it( 'should return null if key doesn\'t exist', function() {
            assert.isNull( cache.gets( 'awf1n1a' ) );
            assert.isNull( cache.gets( null ) );
            assert.isNull( cache.gets( 1 ) );
            assert.isNull( cache.gets( true ) );
            assert.isNull( cache.gets( false ) );
        } );

        it( 'should return value', function() {
            const complicated = [ 'a', {
                'b': 'c',
                'd': [ 'e', 3 ]
            }, '@' ];
            const key = new_key();
            
            cache.set( key, complicated, 100 );

            assert.deepEqual( cache.get( key ).data, complicated );
            assert.isNotNull( cache.get( key ).cas );
        } );
    } );

    describe( 'cas()', function() {
        it( 'should not overwrite existing object if exists and is already modified by another user', function( done ) {
            const ttl1 = 30;
            const ttl2 = 20;
            const idUser = 1;
            const idUser2 = 2;
            const flag = 5;
            const value1 = {
                a: 1
            };
            const value2 = {
                a: 2
            };
            const key = new_key();

            cache.set( key, value1, ttl1 );
            let casToken = cache.gets(key).cas;

            cache.cas(key, value1, ttl1, flag, casToken, idUser);
            assert.deepEqual( cache.get( key ).data, value1 );

            setTimeout( function() {
                cache.cas(key, value2, ttl2, flag, casToken, idUser2);
                assert.notEqual( cache.get( key ).data, value2 );
            }, 10 );

            // test that the value isn't wiped out by the first
            // set()'s timeout
            setTimeout( function() {
                assert.deepEqual( cache.get( key ).data, value1);
                done();
            }, 25 );
        } );

        describe( 'stored object', function() {
            it( 'should exist during ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const value2 = {
                    a: 5
                };

                const idUser = 1;
                const key = new_key();

                cache.set( key, value, ttl );

                let casToken = cache.gets(key).cas;

                cache.cas(key, value2, ttl, casToken, idUser);

                setTimeout( function() {                    
                    assert.deepEqual( cache.get( key ).data, value2 );
                    done();
                }, 10 );
            } );
            it( 'should expire after ttl (ms)', function( done ) {
                const ttl = 20;
                const value = {
                    a: 1
                };
                const value2 = {
                    a: 5
                };

                const idUser = 1;
                const key = new_key();

                cache.set( key, value, ttl );

                let casToken = cache.gets(key).cas;

                cache.cas(key, value2, ttl, casToken, idUser);

                setTimeout( function() {
                    assert.isNull( cache.get( key ));
                    done();
                }, 30 );
            } );
        } );
    } );

    describe( 'del()', function() {
        it( 'should remove object', function() {
            const key = new_key();
            const val = 1;
            const size = cache.size;
            cache.set( key, val, 100 );
            assert.isNotNull( cache.get( key ));
            assert.equal( cache.get( key ).data, val );
            cache.del( key );
            assert.isNull( cache.get( key ) );
            assert.equal( cache.size, size );
        } );
        it( 'should return false when trying to remove a nonexistent object', function() {
            assert.notOk( cache.del( 'nonexistent' ) );
        } );
    } );

    describe( 'hits', function() {
        it( 'should be number of cache hits', function() {
            const key = new_key();
            cache.set( key, 1, 1 );
            const start = cache.hits;
            cache.get( 'missing' );
            cache.get( key );
            cache.get( key );
            cache.get( key );
            assert.equal( cache.hits, start + 3 );
        } );
    } );

    describe( 'misses', function() {
        it( 'should be number of cache misses', function() {
            const key = new_key();
            cache.set( key, 1, 1 );
            const start = cache.misses;
            cache.get( 'missing' );
            cache.get( 'missing' );
            cache.get( key );
            assert.equal( cache.misses, start + 2 );
        } );
    } );
};

describe( 'memcached (instance)', function() {
    suite( new Memcached() );
} );