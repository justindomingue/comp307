var client = require('google-images');

//patterns
var patterns = [
  /find (?:\w+ ?)*(?:picture|image) (?:of)? ((?:\w+ ?)+)/i,
  /who('s| is) online/i
  ];

function Bot() {
  this.handle_request = function(type, data, extras, callback) {
    switch (type) {
      case 0:
        client.search(data, function(err, images) {
          image = images[0];
          callback({message: image.url, type: 'img'});
        });
        break;
      case 1:
        callback({message: 'Online: ' + extras.users.toString(), type: 'text'});
      default:
        break;
    }
  }
}

Bot.prototype.answer = function(request, extras, callback){
  //go over the patterns and try to find a match
  for (i=0; i<patterns.length; i++) {
    if (g = request.match(patterns[i])) {
      this.handle_request(i, g[1], extras, function(result) {
        callback(result);
      });
    }
  }
}

module.exports = new Bot();
