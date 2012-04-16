var path = require("path"),
    strata = require("strata"),
    redirect = strata.redirect;

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html");
strata.use(strata.contentLength);
strata.use(strata.file, path.join(__dirname, "public"), "index.html");
strata.use(strata.jsonp);

// An array of messages that have been posted to this chat. Each message is
// stored as an object with three properties: time, user, and text.
var history = [];

// The number of events to keep around in the chat history.
var MAX_HISTORY_LENGTH = 10000;

// GET /messages-create
// Note: This is a JSONP endpoint!
strata.get("/messages-create", function (env, callback) {
  var req = strata.Request(env);

  req.params(function (err, params) {
    var user = params.user;
    var message = params.message;

    if (user && message) {
      // Add the message to the chat history.
      history.push({
        time: (new Date).getTime(),
        user: user,
        text: message
      });

      // Keep the # of items in the history under MAX_HISTORY_LENGTH.
      while (history.length > MAX_HISTORY_LENGTH) {
        history.shift();
      }

      callback(201, {}, "You have successfully added a new message to the chat.");
    } else {
      callback(400, {}, "You must provide both a user and a message.");
    }
  });
});

// GET /messages?since=:milliseconds
strata.get("/messages", function (env, callback) {
  var req = strata.Request(env);

  req.params(function (err, params) {
    var since = parseInt(params.since),
        messages;

    if (isNaN(since)) {
      // If no "since" was given, just return the last 100 messages.
      messages = history.slice(-100);
    } else {
      messages = history.filter(function (message) {
        return message.time > since;
      });
    }

    var content = JSON.stringify({ messages: messages });

    callback(200, {"Content-Type": "application/json"}, content);
  });
});

module.exports = strata.app;
