function Client(eventHandler) {
  if (typeof eventHandler !== "function") {
    throw new Error("You must provide an event handler to Client");
  }

  this.eventHandler = eventHandler;
  this.since = 0;
}

Client.prototype.init = function (callback) {
  this.getUsers(callback);
  this.getEvents();

  // Start polling for new events!
  this.startPolling();
};

Client.prototype.startPolling = function () {
  var self = this;

  this.timer = setInterval(function () {
    self.getEvents();
  }, 1000);
};

Client.prototype.stopPolling = function () {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
};

Client.prototype.getUsers = function (callback) {
  if (typeof callback !== "function") {
    throw new Error("You must provide a callback to Client#getUsers.");
  }

  $.ajax({
    type: "get",
    url: "/users",
    context: this,
    success: function (data, textStatus, xhr) {
      callback(data.users);
    }
  });
};

Client.prototype.getEvents = function () {
  if (this.activeRequest) {
    // There is an active request already, so cancel this call.
    return;
  }

  var data;

  if (this.since) {
    data = { since: this.since };
  } else {
    data = {};
  }

  this.activeRequest = $.ajax({
    type: "get",
    url: "/events",
    data: data,
    context: this,
    success: function (data, textStatus, xhr) {
      var events = data.events,
          self = this;

      $.each(data.events, function (i, event) {
        console.log(event)
        self.eventHandler(event);
      });

      // Record the timestamp of the most recent event so we don't
      // get the same events back on the next request.
      if (events.length > 0) {
        this.since = events[events.length - 1].time;
      }
    },
    complete: function () {
      delete this.activeRequest;
    }
  });
};

Client.prototype.sendMessage = function (message) {
  $.ajax({
    type: "post",
    url: "/messages",
    context: this,
    data: {
      message: message
    }
  });
};
