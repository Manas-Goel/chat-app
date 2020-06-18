const { addRoom, getRoom, addUserInRoom, removeUserInRoom } = require('./rooms');
const users = [];

const addUser = ({ id, username, roomName, publicKey }) => {

    username = username.trim().toLowerCase();
    roomName = roomName.trim().toLowerCase();

    if (!username && !roomName) {
        return {
            error: 'Username and room are required!'
        };
    }

    let { room, error } = getRoom(roomName);

    if (error) {
        room = addRoom(roomName);
    } else {
        addUserInRoom(roomName);
    }

    const existingUser = users.find((user) => {
        return user.room.roomName === roomName && user.username === username;
    });

    if (existingUser) {
        return {
            error: 'Username is in use!'
        };
    }


    const user = { id, username, room, publicKey };
    users.push(user);

    return { user };
};

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if (index !== -1) {
        removeUserInRoom(users[index].room.roomName);
        return users.splice(index, 1)[0];
    }
};

const getUser = (id) => {
    const user = users.find((user) => {
        return user.id === id;
    });

    return user;
};

const usersInRoom = (roomName) => {
    roomName = roomName.trim().toLowerCase();

    const userArray = users.filter((user) => {
        return user.room.roomName === roomName;
    });

    return userArray;
};

module.exports = {
    addUser,
    removeUser,
    getUser,
    usersInRoom
};