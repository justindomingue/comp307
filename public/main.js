$(function () {

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $title = $('title');
  var defaultTitle = "Aristochat";
  var $usernameInput = $('.usernameInput'); // Input for username
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $loginMsg = $('.login-msg');
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var usersRooms = ['#public'];
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var unreadMessages = {'#public': 0};

  var socket = io();

  // Returns the ID of the active room
  function activeID() {
    return $('.tabs li.active a').attr('href');
  }

  // Returns the active tab
  function active() {
    return $(activeID());
  }

  // Returns a jQuery selector for the portion of the document containing messages
  // for the given roomID
  function getMessages(roomID) {
    return $(roomID).find('.messages');
  }

  // TABS

  function addTab(name) {
    // 1. Add to tab list
    var $li = $('<li><a href="#' + name + '">' + name + '</a></li>');
    $('.tabs ul.horizontal').append($li);

    // 2. Add page
    var $div = $('<div class="tab" id="' + name + '"><div class="chatArea"><ul class="messages"></ul></div></div>');
    $('.tabs').append($div);

    $('.tabs').trigger('destroy');
    $('.tabs').tabslet();
    $('.tabs').trigger('show', '#'+name);
  }

  function removeTab(name) {
    // Delete tab content
    $(name).remove();
    $('.tabs ul.horizontal li a[href='+name+']')[0].remove();
  }
  
  function switchTabToNearestNeighbor(roomIndex) {
    var roomID;
    if (usersRooms.length > roomIndex + 1) {
  	  // Switch the user to the tab to the right
  	  roomID = usersRooms[roomIndex + 1];
  	  $('.tabs').trigger('show', roomID);
  	} else {
  	  // Switch the user to the tab to the left
  	  roomID = usersRooms[roomIndex - 1];
  	  $('.tabs').trigger('show', roomID);
  	}
  }
  
  $('.after_event').tabslet();
  $('.after_event').on("_after", function() {
    // Remove notifications for the tab
    var data = {
      room: activeID(),
      count: 0
    }
    updateNotification(data);
  });

  $('.tabs').tabslet();
  active().show();

  // Notifications
  // data.group is the tab name
  // if data.count is 0, deletes the notification
  // else, set the text to data.count
  function updateNotification(data) {
    group = data.room;
    $tab = $('.tabs li a[href='+group+'] span');
    if (data.count === 0) {
      $tab.remove();
      $title.html(defaultTitle);  // Reset the webpage's title to the default
    } else {
      if ($tab[0] === undefined) {
        $('.tabs li a[href='+group+']').append('<span class="badge"></span>');
        $tab = $('.tabs li a[href='+group+'] span');
      }
      $tab.text(data.count);
      $title.html("Message in " + group.substr(1) + " (" + data.count +")");
    }
  }

  function validateTabName(name) {
    name = '#'+name;
    socket.emit('validate room name', name);
  }

  // Emits a room join request to the server
  function sendJoinRequest(name) {
    var data = {
      room: name,
      username: username
    }

    socket.emit('user joined', data);
  }
  
  // Emits a leave room request to the server
  function sendLeaveRequest(name) {
    var data = {
      room: name
    }
    
    socket.emit('user left', data);
  }

  // Socket

  //  Sets a message to display upon adding a participant to a chat
  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "this room has 1 participant";
    } else {
      message += "this room has " + data.numUsers + " participants";
    }
    log(message, data.room);
  }

  // Sets a message to display upon logging in a new user
  function newUserMessage (data) {
    var message = '';
    if (data.usersOnline === 1) {
      message += "there is 1 user currently online";
    } else {
      message += "there are " + data.usersOnline + " users currently online";
    }
    log(message, activeID());
  }

  // Sets the client's username
  function setUsername() {
    var requestedUsername = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (requestedUsername) {
      // Tell the server your username
      socket.emit('validate username', requestedUsername);
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message) {
      $inputMessage.val('');

      joinRegex = /^\/join ([\w|\s]*)/.exec(message)
      leaveRegex = /^\/leave ([\w|\s]*)/.exec(message)
      if (joinRegex) {
        // Check if the user is already a member of the room
        var roomIndex = usersRooms.indexOf('#'+joinRegex[1]);
        if (roomIndex >= 0) {
          // Switch to tab of room they entered
          $('.tabs').trigger('show', '#'+joinRegex[1]);
        } else {
          $('#no-chats').empty();  // Ensure that $('#no-chats') is empty
          addTab(joinRegex[1]);
          usersRooms.push('#'+joinRegex[1]);
          unreadMessages['#'+joinRegex[1]] = 0;
          // Make a request to join the room
    	  sendJoinRequest('#'+joinRegex[1]);
    	  //$('.tabs').trigger('next');
        }
      } else if (leaveRegex) {
        // Check if the user is requesting to leave a room they are a member of
        var roomIndex = usersRooms.indexOf('#'+leaveRegex[1]);
        if (roomIndex >= 0) {
          // If the user left the currently active room, and it wasn't the last room they were in,
          // switch them to a neighboring room
          if ('#'+leaveRegex[1] === activeID() && usersRooms.length > 1) {
            switchTabToNearestNeighbor(roomIndex);
          }
          removeTab('#'+leaveRegex[1]);
          usersRooms.splice(roomIndex, 1);
          delete unreadMessages['#'+leaveRegex[1]];
          // If the user is no longer in any rooms, tell them
          if (usersRooms.length === 0) {
            $('#no-chats').append('<h2>You have left all rooms :(</h2>');
            $('#no-chats').append("<h2>Use '/join' to join or create a room!</h2>");
          }
          // Notify the server that the user has left
          sendLeaveRequest('#'+leaveRegex[1]);
        }
      } else if (connected) {
        addChatMessage({
          username: username,
          room: activeID(),
          message: message
        });
        // tell server to execute 'new message' and send along the message and the room
        socket.emit('new message', {message: message, room: activeID()});
      }
    }
  }

  // Log a message
  function log (message, room, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, room, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var body = data.message;
    if (options.type === 'img') {
      body = '<img class="chatbot-img" src="' + data.message + '">';
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .html(body);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, data.room, options);
  }

  // Adds the visual chat typing message
  function addChatTyping(data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping(data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // room - The chat room to add it to
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, roomID, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      getMessages(roomID).prepend($el);
    } else {
      getMessages(roomID).append($el);
    }
    // Scroll to the bottom of the messages
    getMessages(roomID)[0].scrollTop = getMessages(roomID)[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing', {room: activeID()});
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing', {room: activeID()});
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

   function addHistory (history, room) {
      for (i = 0; i < history.length; i++) {
        var combined = history[i].split(":", 2);
        console.log(combined[0] + "    " + combined[1]);
        var data = {username: combined[0] , message: combined[1], room: room};
        addChatMessage(data);
      }
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        socket.emit('stop typing', {room: activeID()});
        sendMessage();
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function () {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // This runs after socket validates the user's username
  socket.on('valid username', function (data) {
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();

    username = data.username;
    connected = true;
    // Display the welcome message
    var message = "Welcome to the chat. ";
    log(message, activeID(), {
      prepend: true
    });

    newUserMessage(data);
    socket.emit('user joined', {username: username, room: activeID()});
    socket.emit('get history', {room: activeID()});
  });

  // This runs if the requested username already exists
  socket.on('invalid username', function (data) {
    $loginMsg.text("The username '" + data + "' is already taken. Please try another!");
    $currentInput.val('');
    $currentInput.focus();
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
    if (data.room != activeID()) {
      data.count = ++unreadMessages[data.room];
      updateNotification(data);
      ohSnap('('+data.room+') '+data.username+': ' + data.message, 'blue');
    }
  });

  // Whenever the server emits 'chatbot message', update the chat body
  socket.on('chatbot message', function (data) {
    addChatMessage(data, data.options);
  });

  // Whenever the server emits 'user joined', log it in the chat body of the appropriate room,
  // and add it to the list of rooms the user is a part of
  socket.on('user joined', function (data) {
    log(data.username + ' joined', data.room);
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left', data.room);
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('receive history', function(data) {
    console.log("Client Received History : " + data.history);
    addHistory(data.history, data.room);
  });

});
