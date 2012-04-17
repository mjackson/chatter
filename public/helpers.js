// The address of the chat server.
var host = "codeclass.herokuapp.com";
// host = "localhost:1982"; // dev

// The time (in milliseconds) of the last message we received.
var since = 0;

// Sends the given `message` to everyone in the chat.
function sendMessage(message) {
  $.ajax("http://" + host + "/messages-create", {
    dataType: "jsonp",
    data: {
      user: message.user,
      text: message.text
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

  var html = '<li class="message">';
  html += '<span class="user">' + escapeHTML(user) + ':</span>';
  html += '<span class="text">' + processText(text) + '</span>';
  html += '</li>';

  $("#messages").prepend(html);
}

var escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHTML(string) {
  return String(string).replace(/[&<>"']/g, function (s) {
    return escapeMap[s] || s;
  });
}

var imageRe = /^http.+?\.(jpe?g|png|gif)$/g;

function processText(text) {
  if (imageRe.test(text)) {
    return '<img src="' + escapeHTML(text) + '">';
  }

  return escapeHTML(text);
}
