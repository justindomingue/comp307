// Setup basic express server
var express = require('express');
var redis = require('redis');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// var redisClient = redis.createClient();
var redisClient = redis.createClient(6379, 'comp307.redis.cache.windows.net', { auth_pass: 'F0v6DGIxpKGaw4tHS/qtId13rT4AU9D0a9YbnErRjf0=' });
var history =  {};

redisClient.on("error", function (err) {
  console.log("Redis Error " + err);
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

var Bot = require('./bot');

// Chatroom

// Initialize our dictionary of rooms with the global room "public"
// Key = name of room
// Value = object containing usernames and number of participants
var rooms = {};
var publicRoom = new Room();
rooms['#public'] = publicRoom;


var usernames = {};
var locations = {};
var numUsers = 0;

function Room() {
  this.numUsers = 0;
  this.usernames = {};
}

// Dictionary of users currently online
// Key: username
// Value: a dictionary of rooms the user is in
// As an example, here is what usernames might look like:
/*
var usernames = {
    keith: {
        room1: "room1",
        room2: "room2",
        room3: "room3"
    },
    jane: {
        room1: "room1"
    }
}
*/

io.on('connection', function (socket) {
  // Field to indicate whether a user corresponding to the given socket has been added
  // This field will be set to true if the user logs in
  var addedUser = false;

  // Send the user every
  for (var key in locations) {
    console.log("Sending location " + locations[key]);
   socket.emit('receive location', { 'username':key, 'lat':locations[key].lat, 'lng':locations[key].lng });
  }

  // Validates the user and logs them in
  socket.on('validate username', function (data) {
    // Check for the existence of the username in the usernames dictionary
    // DEBUG:
    // console.log(usernames);

    console.log("retrieved usernames");
    if (data in usernames) {
      console.log("username " + data + " already taken");
      socket.emit('invalid username', data);
    } else {
      // DEBUG:
      // console.log(usernames[data]);
      console.log(data + " logged in");
      socket.username = data;
      usernames[data] = {};
      numUsers++;
      addedUser = true;
      socket.emit('valid username', {
        username: data,
        usersOnline: numUsers
      });
    }
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    var message = data.message;
    var isChatbot = false;

    // we tell the client to execute 'new message'
    console.log(socket.username + " sent a message to " + data.room);
    socket.to(data.room).emit('new message', {
      username: socket.username,
      room: data.room,
      message: message
    });


    // check message was for bot
    if (message.match(/^:/)) {
      isChatbot = true;
      Bot.answer(message, { users: Object.keys(usernames), numUsers: numUsers }, function (answer) {
        console.log("Chatbot replying.");
        socket.to(data.room).emit('chatbot message', {
          username: 'chatbot',
          room: data.room,
          message: answer.message,
          options: { type: answer.type }
        });
        socket.emit('chatbot message', {
          username: 'chatbot',
          room: data.room,
          message: answer.message,
          options: { type: answer.type }
        });
      });
    }
    if (!isChatbot) {
          ///also add to history
          addHistory(data, socket.username);
    }
  });

  socket.on('user joined', function (data) {
    console.log(data.username + " joined " + data.room);

    // Check if the room already exists
    if (!(data.room in rooms)) {
      // Add a new room to the dictionary of rooms

      rooms[data.room] = new Room();
    }

    // Subscribe the socket to the room
    socket.join(data.room);

    // Add the room to the list of rooms the user is a part of
    usernames[data.username][data.room] = data.room;

    // add the client's username to the list of participants in the given room
    rooms[data.room].usernames[data.username] = data.username;
    // increment the number of users in the room by one
    rooms[data.room].numUsers++;

    // DEBUG:
    // console.log(rooms[data.room].numUsers);
    // echo to all members of the chat that a person has connected
    socket.emit('user joined', {
      room: data.room,
      username: socket.username,
      numUsers: rooms[data.room].numUsers
    });
    //get history
    getHistory(data.room, queryHistory);

    socket.to(data.room).emit('user joined', {
      room: data.room,
      username: socket.username,
      numUsers: rooms[data.room].numUsers
    });
  });

  socket.on('my location', function (data) {
    var usr = data.username,
      lat = data.lat,
      lng = data.lng;

    locations[usr] = {'lat':lat, 'lng':lng };

    io.sockets.emit('receive location', { 'username':usr, 'lat':lat, 'lng':lng });
  });

  //gets the chat history
  socket.on('get history', function (data) {
    getHistory(data.room, queryHistory);
    console.log("History for Room : " + data.room + " History: " + history[data.room]);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (data) {
    //console.log(socket.username + " typing to " + data.room);
    socket.to(data.room).emit('typing', {
      username: socket.username,
      room: data.room
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (data) {
    //console.log(socket.username + " stopped typing to " + data.room);
    socket.to(data.room).emit('stop typing', {
      username: socket.username,
      room: data.room
    });
  });

  // when the user closes the webpage, disconnect them from all groups they were in
  socket.on('disconnect', function () {
    // remove the username from all the rooms the user
    // was a part of and from the list of global usernames
    if (addedUser) {
      // Get the dictionary of rooms the user was a part of

      var usersRooms = usernames[socket.username];
      // Iterate through the rooms, removing the user from each one, and echoing to other
      // members of each room that the user has left
      for (var room in usersRooms) {
        removeUserFromRoom(usersRooms[room]);
        console.log(socket.username + " left " + room);
      }
      // Remove the user from the global list of usernames
      delete usernames[socket.username];
      numUsers--;

      // Remove location of user
      delete locations[socket.username];
    }
  });

  // when the user closes an individual tab, disconnect them from that group
  socket.on('user left', function (data) {
    if (addedUser) {

      removeUserFromRoom(data.room);
      console.log(socket.username + " left " + data.room);
      delete usernames[socket.username][data.room];
      // setUsernames(usernames);
    }
  });

  // Helper function which removes the user from the given room and notifies other participants
  // of the room that a user has left
  function removeUserFromRoom(room) {
    delete rooms[room].usernames[socket.username];
    rooms[room].numUsers--;
    if (rooms[room].numUsers === 0) {
      // Remove the room entirely
      delete rooms[room];
    } else {
      // Emit to the remaining users that the user has left
      socket.to(room).emit('user left', {
        username: socket.username,
        room: room,
        numUsers: rooms[room].numUsers
      });
    }
    // Have the socket leave the room
    socket.leave(room);
  }

function getHistory(roomID, callback) {
  console.log("RoomID get history: " + roomID);
  redisClient.lrange(roomID, 0, -1, function (err, reply) {
    callback(err, reply, roomID);
  });
}

function queryHistory(err, reply, roomID) {
  history[roomID] = reply;
    socket.emit('receive history', {
    history: history[roomID], room: roomID
  });
}

function addHistory(data, username) {
  if (data.message == null) return;
  var input = username + ":" + data.message;
  var response = redisClient.rpush(data.room, input, redis.print);
  console.log("RoomID addHistory: " + data.room);
}
});
