
# COMP307

## How to use

```
cd comp307
$ npm install
$ node app.js
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Features

- [x] Multiple users can join a chat room by each entering a unique username
on website load.
- [x] Users can type chat messages to the chat room.
- [x]  A notification is sent to all users when a user joins or leaves
the chatroom.
- [x] 'is typing' message
- [x] Multiple rooms
- [ ] Private messages
- [x] Unique usernames
- [ ] Send audio messages
- [x] People joining see past 10 messages (chat history)
- [x] Chat bot
- [x] Encryption
- [x] Map


**************************** REDIS ************************
## How to use REDIS:
Documentation: https://www.npmjs.com/package/redis

$ npm install redis

We then need to set the file to where the data will be saved

FROM comp307 base directory:

$cd node_modules/redis-stable/src
$./redis-cli                            --will run redis client

Within Redis Client then type:

CONFIG SET dir ../../../
CONFIG SET dbfilename redisDatbase.rdb

---
To start redis server

FROM comp307 base directory:

$cd node_modules/redis-stable/src
$./redis-server

NOTE: this will start on the default port described in redis.conf
To change the conf, go to (from comp307 root)

$vim node_modules/redis-stable/redis.conf

* Then change port too desired port for redis server. Vim command : ?port *



******************************************************************
