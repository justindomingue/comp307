var client = require('node-bing-api')({accKey: 'wsl7vVXADKxJj5qdnLizMzR7Ck5VlLVkKhMjL4APQeA='});

//patterns
var patterns = [
  /^:picture (.*)$/,
  /^:online/,
  ];

function Bot() {
  this.handle_request = function(type, data, extras, callback) {
    switch (type) {
      case 0:
        client.images(data,  {top: 1, imageFilters: { size: 'medium' }}, function(err, res, body) {
          console.log(body);
          image = body['d']['results'][0]
            console.log(image);
          callback({message: image.MediaUrl, type: 'img'});
        });
        break;
      case 1:
        callback({message: extras.users.toString(), type: 'text'});
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
