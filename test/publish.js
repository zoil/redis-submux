"use strict";

var describe = require("mocha").describe;
var step = require("mocha-steps").step;
var expect = require("chai").expect;
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

describe("#publish", function() {
  step("should receive data on publish", function(done) {
    var channel = "P123";
    var sentData = "test";
    var receivedData = false;
    var cb = function(data) {
      receivedData = data;
    };
    redisSubMux.subscribe(channel, cb, function() {
      redisJs.publish([channel], sentData, function() {
        if (receivedData === false) {
          done("The data was not received");
        } else if (receivedData !== sentData) {
          done("Something else was received");
        } else {
          done();
        }
      });
    });
  });
});
