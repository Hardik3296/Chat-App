const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { generateMessage, generateLocationMessage } = require("./utils/message");
const {
  removeUser,
  addUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const port = process.env.PORT || 3000;
const publicRoute = path.join(__dirname, "../public");

//Creating a server. Express does this automatically
const server = http.createServer(app);

//Creating a socket and registering it to work with the given server
//Socket.io expects server as the argument, but if express creates server
//automatically we do not have access to this server, therefore we create the server explicitly
const io = socketio(server);

//Listening for connection event to the server
//Socket object in callback fn contains method that can be used
//To send and receive data from the client
//This callback runs once for every client that is connected to the server
io.on("connection", (socket) => {
  console.log("New websocket connection");
  //Method that send data to the client
  //The first argument to emit() is an event custom or predefined
  //That the server listens for
  //All the values after the first argument
  //to emit are available as values to the callback function in the client script
  //The last value to emit is actually a callback function that runs when the acknowledgement
  //for the message sent is received by the client
  // socket.emit("countUpdated", count);
  //One of the arguments to callback function is itself a callback function
  //that is run in order to send acknowledgement to the sender. It can also send data as it argument
  // socket.on("increment", () => {
  //   count++;
  //   //emit() sends information to only a particular connection and not to all
  //   //socket.emit("countUpdated", count);

  //   //to send information to every connection
  //   io.emit("countUpdated", count);
  // });

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) return callback(error);
    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback("delivered");
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${location.latitude},${location.longitude}`
        )
      );
      callback();
    }
  });
});

app.use(express.static(publicRoute));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
