//node modules
const path = require('path');
const http = require('http');
// npm modules
const express = require('express');
const socketio = require('socket.io');
// my node files
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUser, usersInRoom } = require('./utils/users');

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

// socket events
io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('ADMIN', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: usersInRoom(user.room)
        });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, message));
            callback();
        }
    });

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        if (user) {
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, location));
            callback();
        }
    });

    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');

        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: usersInRoom(user.room)
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});