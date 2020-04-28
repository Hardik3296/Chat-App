const socket = io();

// socket.on("countUpdated", (count) => {
//   console.log("the value of count variable has been updated to " + count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("clicked");
//   socket.emit("increment");
// });

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = document.querySelector("input");
const $messageFormButton = document.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;

  //Calculating height of the last message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // getting height of viewed area
  const visibleHeight = $messages.offsetHeight;

  //Getting height of conatiner scrollable too
  const containerHeight = $messages.scrollHeight;

  //How far I have scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - visibleHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
  console.log(newMessageStyles);
};

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  //e.target represent our from with id(.)elements is the property(.)the name of the element in the form
  socket.emit("sendMessage", e.target.elements.message.value, (message) => {
    console.log("The message was delivered", message);
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Sorry your browser does not support location sharing");
  }
  $sendLocationButton.setAttribute("disabled", "disabled");
  //getCurrentPosition does not support promises that is why we have to use callback
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location was shared");
      }
    );
  });
});

socket.on("message", (message) => {
  console.log(message);
  //The first argument is the template that we have to change
  //The second argument is an object containing values for each refernece in the template as key value pair
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("H:mm"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (location) => {
  //The first argument is the template that we have to change
  //The second argument is an object containing values for each refernece in the template as key value pair
  const html = Mustache.render(locationMessageTemplate, {
    username: location.username,
    href: location.url,
    createdAt: moment(location.createdAt).format("H:mm"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  console.log(room, users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
