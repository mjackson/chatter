// The handle of the chat user.
var user = window.prompt("What username would you like to use?");

// The address of the chat server.
var host = "codeclass.herokuapp.com";

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
// each new message.
function getMessages(callback) {
  $.ajax("http://" + host + "/messages", {
    dataType: "jsonp",
    data: {
      since: since
    },
    success: function (data, textStatus, xhr) {
      callback(data.messages);
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
