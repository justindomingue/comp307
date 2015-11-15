// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var  ffmpeg = require('ffmpeg-output');
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  //when client emits 'media message', this listens and executes
  socket.on('media message', function(data) {

      // socket.emit('ffmpeg-output', 0);

      // writeToDisk(data.audio.dataURL, data.audio.name);

      // if (data.video) {
      //         writeToDisk(data.video.dataURL, data.video.name);
      //         merge(socket, fileName);
      // }

      //just audio
      socket.broadcast.emit('media-message', data.audio);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

// function writeToDisk(dataURL, fileName) {
//     var fileExtension = fileName.split('.').pop(),
//         fileRootNameWithBase = './uploads/' + fileName,
//         filePath = fileRootNameWithBase,
//         fileID = 2,
//         fileBuffer;

//     // @todo return the new filename to client
//     while (fs.existsSync(filePath)) {
//         filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
//         fileID += 1;
//     }

//     dataURL = dataURL.split(',').pop();
//     fileBuffer = new Buffer(dataURL, 'base64');
//     fs.writeFileSync(filePath, fileBuffer);

//     console.log('filePath', filePath);
// }

// function merge(socket, fileName) {
//     var FFmpeg = require('fluent-ffmpeg');

//     var audioFile = path.join(__dirname, 'uploads', fileName + '.wav'),
//         videoFile = path.join(__dirname, 'uploads', fileName + '.webm'),
//         mergedFile = path.join(__dirname, 'uploads', fileName + '-merged.webm');

//     new FFmpeg({
//             source: videoFile
//         })
//         .addInput(audioFile)
//         .on('error', function (err) {
//             socket.emit('ffmpeg-error', 'ffmpeg : An error occurred: ' + err.message);
//         })
//         .on('progress', function (progress) {
//             socket.emit('ffmpeg-output', Math.round(progress.percent));
//         })
//         .on('end', function () {
//             socket.emit('merged', fileName + '-merged.webm');
//             console.log('Merging finished !');

//             // removing audio/video files
//             fs.unlink(audioFile);
//             fs.unlink(videoFile);
//         })
//         .saveToFile(mergedFile);
// }
