
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
- [ ] People joining see past 10 messages (chat history)
- [x] Chat bot
- [ ] Encryption
- [ ] Map


## How to use REDIS:
Documentation: https://www.npmjs.com/package/redis

$ npm install redis

required code: 
var redis = require("redis"),
    redisClient = redis.createClient();

client.set("string key", "sting val", redis.print);

client.get("foo_rand", function (err, reply) {
    console.log(reply.toString()); 
});
