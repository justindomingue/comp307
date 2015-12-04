
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
- [x] Private messages
- [x] Unique usernames
- [x] People joining see past messages (chat history)
- [x] Chat bot
- [x] Encryption
- [x] Map

## Using the app

- Start a private message by clicking on the username of a user you would like to chat with
- Join/create a room by typing ":join roomName" into the text box
- Leave a room you've created by typeing :leave roomName" into the text box
- Ask the chatbot for pictures by typing ":picture" followed by what you would like a picture of
- Ask the chatbot who's online by typing ":online"

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

* Then change port to desired port for redis server. Vim command : ?port *



******************************************************************
