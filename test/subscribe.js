"use strict";

var describe = require("mocha").describe;
var step = require("mocha-steps").step;
var RedisSubMux = require("../lib");
var redisJs = require("redis-js");

var redisSubMux = RedisSubMux({
  redisClient: redisJs
});

var redisSubscriptions = [];

redisJs.on("subscribe", function(redisChannel, count) {
  if (count === undefined) return;
  redisSubscriptions.push(redisChannel);
});

redisJs.on("unsubscribe", function(redisChannel, count) {
  if (count === undefined) return;
  while (redisSubscriptions.includes(redisChannel)) {
    redisSubscriptions.splice(redisSubscriptions.indexOf(redisChannel), 1);
  }
});

var callback1 = function() {};
var callback2 = function() {};

describe("#subscribe", function() {
  step("should subscribe in redis at first call", function(done) {
    const channel = "P123";
    redisSubMux.subscribe(channel, callback1, function() {
      if (redisSubscriptions.length === 0) {
        done("redisClient.subscribe was not called");
      } else if (redisSubscriptions[0] !== channel) {
        done("Subscribed to the wrong channel");
      } else {
        done();
      }
    });
  });
  step("should not subscribe in redis at second call", function(done) {
    const channel = "P123";
    redisSubMux.subscribe(channel, callback2, function() {
      if (redisSubscriptions.length !== 1) {
        done("Subscribed the second time.");
      } else {
        done();
      }
    });
  });
  step("should not unsubscribe in redis at first call", function(done) {
    const channel = "P123";
    redisSubMux.unsubscribe(channel, callback1, function() {
      if (redisSubscriptions.length !== 1) {
        done("Unsubscribed the first time.");
      } else {
        done();
      }
    });
  });
  step(
    "should unsubscribe in redis at second call, using unsubscribeAll",
    function(done) {
      redisSubMux.unsubscribeAll(callback2, function() {
        if (redisSubscriptions.length !== 0) {
          done("Not unsubscribed the second time.");
        } else {
          done();
        }
      });
    }
  );
});
