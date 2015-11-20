// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// Initialize our dictionary of rooms with the global room "Free-for-all"
// Key = name of room
// Value = object containing usernames and number of participants
var rooms = {}
rooms["Free-for-all"] = {
	numUsers: 0,
	usernames: {}
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
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  // Field to indicate whether a user corresponding to the given socket has been added
  // This field will be set to true if the user logs in
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.to(data.room).emit('new message', {
      username: socket.username,
      room: data.room,
      message: data.message
    });
  });
	
  // when the client emits 'add user', this listens and executes
  // handles new users added to the system by storing their username in the socket session,
  // and emitting a welcome message to them
  socket.on('add user', function (data) {
    // we store the username in the socket session for this client
    socket.username = data.username;
    // add the client's username to the list of all active users
    usernames[data.username] = {};
    // increment the number of users in the room by one
    numUsers++;
    addedUser = true;
    // Emit a message back to the user to indicate that they are logged into the chat
    // and to welcome them to the chat
    socket.emit('login', {
      numUsers: numUsers
    });
  });
  
  socket.on('add room', function (data) {
    // TODO: implement
  });
  
  socket.on('user joined', function (data) {
    // subscribe the socket to the room
    socket.join(data.room);
    // Add the room to the list of rooms the user is a part of
    usernames[data.username][data.room] = data.room;
    // add the client's username to the list of usernames for the current chat
    rooms[data.room].usernames[data.username] = data.username;
    // increment the number of users in the room by one
    rooms[data.room].numUsers++;
    // echo to all members of the chat that a person has connected
    socket.to(data.room).emit('user joined', {
      room: data.room,
      username: socket.username,
      numUsers: rooms[data.room].numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (data) {
    socket.to(data.room).emit('typing', {
      username: socket.username,
      room: data.room
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (data) {
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
      }
      // Remove the user from the global list of usernames
      delete usernames[socket.username];
      numUsers--;
    }
  });
  
  // when the user closes an individual tab, disconnect them from that group
  socket.on('disconnect from group', function(data) {
    if (addedUser) {
      removeUserFromRoom(data.room);
      delete usernames[socket.username][data.room];
    }
  });
  
  // Helper function which removes the user from the given room and notifies other participants
  // of the room
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
});
