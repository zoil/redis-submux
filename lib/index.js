"use strict";

var redis = require("redis");

/**
 * @param {{*}} options 
 */
function redisSubMux(options) {
  var redisClient = options.redisClient || redis.createClient(options);
  var channels = {};

  /**
   * @param {string} channel
   * @param {*} message
   */
  function onMessage(channel, message) {
    if (channels[channel] === undefined) {
      redisClient.unsubscribe(channel);
      return;
    }

    var i,
      callbacks = channels[channel].slice(),
      c = callbacks.length;

    for (i = 0; i < c; i++) {
      try {
        callbacks[i](message);
      } catch (err) {
        // just catching any errors
      }
    }
  }

  /**
   * @param {string} channel
   * @param {function} subscriptionCallback
   * @param {function} callback
   */
  function subscribe(channel, subscriptionCallback, callback = function() {}) {
    var wasNotExisting = channels[channel] === undefined;
    if (wasNotExisting) {
      channels[channel] = [];
    }
    if (!channels[channel].includes(subscriptionCallback)) {
      channels[channel].push(subscriptionCallback);
    }
    if (wasNotExisting) {
      redisClient.subscribe(channel, callback);
    } else {
      callback();
    }
  }

  /**
   * @param {string} channel
   * @param {function} subscriptionCallback
   * @param {function} callback
   */
  function unsubscribe(
    channel,
    subscriptionCallback,
    callback = function() {}
  ) {
    var callbacks = channels[channel] || [];

    while (callbacks.includes(subscriptionCallback)) {
      callbacks.splice(callbacks.indexOf(subscriptionCallback), 1);
    }

    if (callbacks.length < 1) {
      if (channels[channel] !== undefined) {
        delete channels[channel];
      }
      redisClient.unsubscribe(channel, callback);
    } else {
      callback();
    }
  }

  /**
   * @param {function} subscriptionCallback
   * @param {function} callback
   */
  function unsubscribeAll(subscriptionCallback, callback = function() {}) {
    var channelsKeys = Object.keys(channels),
      channelsCount = channelsKeys.length;

    if (channelsCount === 0) {
      return callback();
    }

    function unsubIterator(i) {
      if (i === channelsCount) {
        // we're done
        callback();
      } else {
        // process the next channel
        unsubscribe(channelsKeys[i], subscriptionCallback, function() {
          unsubIterator(i + 1);
        });
      }
    }
    unsubIterator(0);
  }

  redisClient.on("message", function(channel, data) {
    onMessage(channel, data);
  });

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    unsubscribeAll: unsubscribeAll
  };
}

module.exports = redisSubMux;
