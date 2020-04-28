const users = [];

const addUser = ({ id, username, room }) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();
  //Checking if username and room is provided
  if (!username || !room) return { error: "Username and room required!" };
  //Checking if username is unique in that room
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });
  if (existingUser) return { error: "Username already taken!" };
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
};
