const node_rsa = require('node-rsa');
const rooms = [];

const addRoom = (roomName) => {
    const room = rooms.find((room) => {
        return room.roomName === roomName;
    });

    if (!room) {
        const key = new node_rsa({ b: 1024 });
        const room = {
            numberOfUsers: 1,
            roomName,
            publicKey: key.exportKey('public'),
            privateKey: key.exportKey('private')
        }
        rooms.push(room);

        return room;
    } else {
        return {
            error: 'room already exists'
        }
    }
}

const getRoom = (roomName) => {
    const room = rooms.find((room) => {
        return room.roomName === roomName;
    });
    if (room) {
        return { room };
    } else {
        return {
            error: 'Room does not exist'
        }
    }
};

const removeRoom = (roomName) => {
    const index = rooms.findIndex((room) => {
        return room.roomName === roomName;
    });

    if (index !== -1) {
        return rooms.splice(index, 1);
    } else {
        return {
            error: 'Room does not exist'
        }
    }
}

const addUserInRoom = (roomName) => {
    const index = rooms.findIndex((room) => {
        return room.roomName === roomName;
    });

    if (index !== -1) {
        rooms[index].numberOfUsers++;
    } else {
        return {
            error: 'Room does not exist'
        }
    }
}

const removeUserInRoom = (roomName) => {
    const index = rooms.findIndex((room) => {
        return room.roomName === roomName;
    });

    if (index !== -1) {
        rooms[index].numberOfUsers--;
        if (rooms[index].numberOfUsers === 0)
            removeRoom(roomName);
    } else {
        return {
            error: 'Room does not exist'
        }
    }
}

module.exports = {
    addRoom,
    getRoom,
    addUserInRoom,
    removeUserInRoom
};