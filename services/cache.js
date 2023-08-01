const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = function (options = {}) {
  this._useCache = true;
  this._hashKey = JSON.stringify(options.key || "");
  return this;
};

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  if (!this._useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  const cachedValue = await client.hget(this._hashKey, key);
  if (cachedValue) {
    console.info(
      `USING REDIS CACHE ON '${this.mongooseCollection.name}' COLLECTION`
    );
    const doc = JSON.parse(cachedValue);
    return Array.isArray(doc) ? doc.map((d) => this.model(d)) : this.model(doc);
  }

  const result = await exec.apply(this, arguments);

  client.hset(this._hashKey, key, JSON.stringify(result), "EX", 10);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    hashKey = JSON.stringify(hashKey);
    console.info(`CLEANING CACHE FOR ${hashKey}`);
    client.del(hashKey);
  },
};
