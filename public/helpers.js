// The handle of the chat user.
var user = window.prompt("What username would you like to use?");

// The address of the chat server.
var host = "codeclass.herokuapp.com";
// host = "localhost:5000"; // dev

// The time (in milliseconds) of the last message we received.
var since = 0;

// Sends the given `message` (a string) to everyone in the chat.
function sendMessage(message) {
  $.ajax("http://" + host + "/messages-create", {
    dataType: "jsonp",
    data: {
      user: user,
      message: message
    }
  });
}

// Fetches all new messages from the server and call the callback with
// an array of all new messages.
function getMessages(callback) {
  $.ajax("http://" + host + "/messages", {
    dataType: "jsonp",
    data: {
      since: since
    },
    success: function (data, textStatus, xhr) {
      var messages = data.messages;

      callback(messages);

      if (messages.length > 0) {
        // Update the value of the `since` variable so we don't get
        // the same messages back again in the future.
        since = messages[messages.length - 1].time;
      }
    }
  });
}

// Shows the given `message` on the page.
function renderMessage(message) {
  var user = message.user;
  var text = message.text;
  var html = '<li class="message"><span class="user">' + user + ':</span><span class="text">' + text + '</span></li>';
  $("#messages").append(html);
}
