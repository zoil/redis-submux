# Subscriptions multiplexer for Redis

[![NPM](https://nodei.co/npm/redis-submux.png)](https://npmjs.org/package/redis-submux)

A small library that lets you subscribe your callbacks to Redis channels.

## Installation

`npm install redis-submux`

## Usage

    var RedisSubMux = require('redis-submux');
    var redisSubMux = RedisSubMux({
        host: 'localhost',
        port: 6379'
    });

    var channel = 'test123';
    var callback = function(data) {
        console.log('data',data);
    }
    redisSubMux.subscribe(channel, callback);
    redisSubMux.unsubscribe(channel, callback);

## Test

  `npm test`

