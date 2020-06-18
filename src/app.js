//node modules
const path = require('path');
const http = require('http');
// npm modules
const express = require('express');
const socketio = require('socket.io');
const crypto = require('crypto-js');
const node_rsa = require('node-rsa');
// my node files
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUser, usersInRoom } = require('./utils/users');

const alphabet = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890/*-+[]\;,./{}|:"<>?!@#$%^&*()_=';

// server setup
const app = express();
const server = http.createServer(app);

// socket.io setup
const io = socketio(server);

// Environment variables
const PORT = process.env.PORT || 3000;

// path variables
const publicDirectoryPath = path.join(__dirname, '../public');

// Setting up express middleware
app.use(express.static(publicDirectoryPath));

const generatekey = (length) => {
    let key = '';
    for (let i = 0; i < length; i++) {
        let random = Math.floor(Math.random() * alphabet.length);
        key = key + alphabet[random];
    }
    return key;
}

const decryptMessage = (encryptedMessage, encryptedKey, privateKey) => {
    const key = new node_rsa(privateKey);
    const symmetricKey = key.decrypt(encryptedKey, 'utf8');
    const message = crypto.AES.decrypt(encryptedMessage, symmetricKey).toString(crypto.enc.Utf8);
    return message;
};

const encryptMessage = (message, publicKey) => {
    const key = new node_rsa(publicKey);
    const symmetricKey = generatekey(50);
    const encryptedMessage = crypto.AES.encrypt(message, symmetricKey).toString();
    const encryptedSymmetricKey = key.encrypt(symmetricKey, 'base64');
    return {
        serverEncryptMessage: encryptedMessage,
        serverSymmetricKey: encryptedSymmetricKey
    };
};

// socket events
io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('join', ({ username, roomName, publicKey }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, roomName, publicKey });
        if (error) {
            return callback(error);
        }
        socket.join(user.room.roomName);
        socket.emit('serverPublicKey', user.room.publicKey);
        socket.emit('message', generateMessage('ADMIN', 'Welcome!'));
        socket.broadcast.to(user.room.roomName).emit('message', generateMessage('ADMIN', `${user.username} has joined`));
        io.to(user.room.roomName).emit('roomData', {
            roomName: user.room.roomName,
            users: usersInRoom(user.room.roomName)
        });
        callback();
    });

    socket.on('sendMessage', ({ encryptedMessage, encryptedKey }, callback) => {
        const user = getUser(socket.id);
        if (user) {
            const message = decryptMessage(encryptedMessage, encryptedKey, user.room.privateKey);
            const users = usersInRoom(user.room.roomName);
            for (let i = 0; i < users.length; i++) {
                const newUser = users[i];
                const { serverEncryptMessage, serverSymmetricKey } = encryptMessage(message, newUser.publicKey);
                io.to(newUser.id).emit('message', generateMessage(user.username, serverEncryptMessage, serverSymmetricKey));
            }
            callback();
        }
    });

    socket.on('sendLocation', ({ encryptedMessage, encryptedKey }, callback) => {
        const user = getUser(socket.id);
        if (user) {
            const location = JSON.parse(decryptMessage(encryptedMessage, encryptedKey, user.room.privateKey));
            const url = `https://google.com/maps?q=${location.lat},${location.long}`;
            const users = usersInRoom(user.room.roomName);
            for (let i = 0; i < users.length; i++) {
                const newUser = users[i];
                const { serverEncryptMessage, serverSymmetricKey } = encryptMessage(url, newUser.publicKey);
                io.to(newUser.id).emit('locationMessage', generateMessage(user.username, serverEncryptMessage, serverSymmetricKey));
            }
            callback();
        }
    });

    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');

        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room.roomName).emit('message', generateMessage('ADMIN', `${user.username} has left`));
            io.to(user.room.roomName).emit('roomData', {
                roomName: user.room.roomName,
                users: usersInRoom(user.room.roomName)
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});