var path = require("path"),
    fs = require("fs"),
    strata = require("strata"),
    redirect = strata.redirect,
    mustache = require("mustache");

strata.use(strata.commonLogger);
strata.use(strata.contentType, "text/html");
strata.use(strata.contentLength);
strata.use(strata.file, path.join(__dirname, "public"));
strata.use(strata.sessionCookie);

// A map of usernames to the last time we heard anything from that user. Old
// usernames are automatically purged.
var users = [];

// The number of milliseconds to wait before automatically logging a user out
// of the chat.
var INACTIVE_USER_EXPIRY = 60 * 1000;

// This array stores "events" that happen in this chat. It is used to populate
// new clients with recent history, as well as provide currently polling clients
// with missing pieces of the chat history. Most recent events are at the end.
var history = [];

// The number of events to keep around in the chat history.
var MAX_HISTORY_LENGTH = 10000;

function isPresent(user) {
  return user in users;
}

function login(env, user) {
  addHistory({
    type: "user-joined",
    user: user
  });

  users[user] = (new Date).getTime(); // Add to the `users` store.
  env.session.user = user; // Add to the session.
}

function logout(env) {
  if (isLoggedIn(env)) {
    var user = currentUser(env);

    addHistory({
      type: "user-left",
      user: user
    });

    delete users[user]; // Remove from the `users` store.
  }

  delete env.session.user; // Remove from the session.
}

// Returns the username of the current user.
function currentUser(env) {
  return env.session.user;
}

// Returns `true` if a user is logged in.
function isLoggedIn(env) {
  return !!currentUser(env);
}

// Adds the given `event` object to the chat history.
function addHistory(event) {
  event.time = (new Date).getTime();

  history.push(event);

  while (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }
}

function getTemplate(filename) {
  var file = path.resolve(__dirname, "templates", filename + ".mustache");
  return fs.readFileSync(file, "utf8");
}

function render(template, view) {
  return mustache.to_html(template, view || {});
}

// Purges the `users` object of usernames that we haven't seen in a while.
function purgeInactiveUsers() {
  var now = (new Date).getTime(),
      expiry = now - INACTIVE_USER_EXPIRY,
      lastSeen;

  for (var user in users) {
    lastSeen = users[user];

    if (lastSeen < expiry) {
      addHistory({
        type: "user-left",
        user: user
      });

      delete users[user];
    }
  }
}

// TODO: Update "last seen" whenever we see a user. Also, figure out a way
// to prevent old cookies from hijacking current sessions. Then turn this on.
// setInterval(purgeInactiveUsers, 10000);

// GET /
strata.get("/", function (env, callback) {
  if (isLoggedIn(env)) {
    // Give new clients the last 100 events in the history to give them a
    // good idea of the current topic of discussion in the chat.
    var content = render(getTemplate("chat"));

    callback(200, {}, content);
  } else {
    redirect(env, callback, "/login");
  }
});

// GET /login
strata.get("/login", function (env, callback) {
  callback(200, {}, render(getTemplate("login")));
});

// POST /login
strata.post("/login", function (env, callback) {
  var req = strata.Request(env);

  req.params(function (err, params) {
    var user = params.user;

    if (user) {
      if (isPresent(user)) {
        // Username already taken, 409 and try again.
        var content = render(getTemplate("login"), {
          error: "That username is already being used!"
        });

        callback(409, {}, content);
      } else {
        login(env, user);
        redirect(env, callback, "/");
      }
    } else {
      // No user parameter given, 400 error.
      var content = render(getTemplate("login"), {
        error: "Please provide a username!"
      });

      callback(400, {}, content);
    }
  });
});

// POST /messages
strata.post("/messages", function (env, callback) {
  if (!isLoggedIn(env)) {
    callback(403, {}, "You must login to post a message to the chat.");
    return;
  }

  var user = currentUser(env);
  var req = strata.Request(env);

  req.params(function (err, params) {
    var messageText = params.message;

    if (messageText) {
      addHistory({
        type: "new-message",
        user: user,
        text: messageText
      });

      callback(201, {}, "You have successfully added a new message to the chat.");
    } else {
      callback(400, {}, "You must provide a message.");
    }
  });
});

// GET /users
strata.get("/users", function (env, callback) {
  if (!isLoggedIn(env)) {
    callback(403, {}, "You must login to view this chat's users.");
    return;
  }

  var content = JSON.stringify({ users: Object.keys(users) });

  callback(200, {"Content-Type": "application/json"}, content);
});

// GET /events?since=:milliseconds
strata.get("/events", function (env, callback) {
  if (!isLoggedIn(env)) {
    callback(403, {}, "You must login to view this chat's events.");
    return;
  }

  var req = strata.Request(env);

  req.params(function (err, params) {
    var since = parseInt(params.since),
        events;

    if (isNaN(since)) {
      // If no "since" was given, just return the last 100 events.
      events = history.slice(-100);
    } else {
      events = history.filter(function (event) {
        return event.time > since;
      });
    }

    var content = JSON.stringify({ events: events });

    callback(200, {"Content-Type": "application/json"}, content);
  });
});

strata.run();
