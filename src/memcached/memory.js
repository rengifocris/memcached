const sizeof = require("js-sizeof");

const MemoryCached = function () {
  this._cache = {};
  this._timeouts = {};
  this._ids = {};
  this._clientIds = {};
  this._flags = {};

  this._hits = 0;
  this._misses = 0;
  this._size = 0;

  return this;
};

MemoryCached.prototype = {
  get size() {
    return this._size;
  },
  get memsize() {
    return sizeof(
      this._cache
    ); /* Returns the approximate memory usage of all objects stored in the cache and cache overhead */
  },
  get hits() {
    return this._hits;
  },
  get misses() {
    return this._misses;
  },

  set: function (key, value, time, flag, id) {
    if (this._timeouts[key]) {
      clearTimeout(this._timeouts[key]);
      delete this._timeouts[key];
    }

    if (this._ids[key]) {
      delete this._ids[key]
    }

    if (this._clientIds[key]) {
      delete this._clientIds[key];
    }

    if (this._flags[key]) {
      delete this._flags[key];
    }

    this._cache[key] = value;
    this._flags[key] = flag;

    if (!isNaN(time)) {
      this._timeouts[key] = setTimeout(this.del.bind(this, key), time);
    }

    ++this._size;

    if (id) {
      this._ids[key] = id;
    } else {
      this._ids[key] = this._size;
    }
  },

  add: function (key, value, time, flag) {
    if (!this._cache[key]) {
      this.set(key, value, time, flag);
    }
  },

  replace: function (key, value, time, flag) {
    if (this._cache[key]) {
      this.set(key, value, time, flag);
    }
  },

  append: function (key, value, time, flag) {
    if (this._cache[key]) {
      this.set(key, this._cache[key] + value, time, flag);
    }
  },

  prepend: function (key, value, time, flag) {
    if (this._cache[key]) {
      this.set(key, value + this._cache[key], time, flag);
    }
  },

  get: function (key) {
    if (typeof key === "undefined") {
      return this._cache;
    }

    if (!(key in this._cache)) {
      ++this._misses;
      return null;
    }

    let object = {
      flag: this._flags[key],
      data: this._cache[key]
    }
    
    ++this._hits;

    return object;
  },

  cas: function (key, value, time, flag, id, clientId) {
    if (this._cache[key]) {
      if (this._ids[key]) {
        if (this._clientIds[key]) {
          if (clientId !== this._clientIds[key]) {
            return null;
          }
        }
      }

      this.set(key, value, time, flag, id);
      this._clientIds[key] = clientId;
    }
  },

  gets: function (key) {
    if (typeof key === "undefined") {
      return this._ids;
    }

    if (!(key in this._cache)) {
      ++this._misses;
      return null;
    }

    if (!(key in this._ids)) {
      ++this._misses;
      return null;
    }

    ++this._hits;

    let data = {
      data: this._cache[key],
      cas: this._ids[key],
      flag: this._flags[key],
    };

    return data;
  },

  del: function (key) {
    clearTimeout(this._timeouts[key]);
    delete this._timeouts[key];

    if (!(key in this._cache)) {
      return false;
    }

    delete this._cache[key];
    delete this._ids[key];
    delete this._clientIds[key];
    --this._size;

    return true;
  },

  clear: function () {
    for (let key in this._timeouts) {
      clearTimeout(this._timeouts[key]);
    }

    this._cache = {};
    this._ids = {};
    this._timeouts = {};
    this._size = 0;
  },
};

MemoryCached.shared = new MemoryCached();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MemoryCached;
}
