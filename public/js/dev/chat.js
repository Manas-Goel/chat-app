const crypto = require('crypto-js');
const node_rsa = require('node-rsa');
const key = new node_rsa({ b: 1024 });
const privateKey = key.exportKey('private');
const publicKey = key.exportKey('public');

// Alphabets used to generate Symmetric Key
const alphabet = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890/*-+[]\;,./{}|:"<>?!@#$%^&*()_=';

let serverPublicKey;

const socket = io();

const form = document.querySelector('form');
const inputText = document.getElementById('chatMessage');
const sendLocation = document.getElementById('send-location');
const sendMessage = document.getElementById('send-message');
const renderMessages = document.getElementById('messages');
const roomData = document.getElementById('room-data');

const generatekey = (length) => {
    let key = '';
    for (let i = 0; i < length; i++) {
        let random = Math.floor(Math.random() * alphabet.length);
        key = key + alphabet[random];
    }
    return key;
}


const encryptMessage = (message) => {
    const symmetricKey = generatekey(50);
    encryptedMessage = crypto.AES.encrypt(message, symmetricKey).toString();
    const key = new node_rsa(serverPublicKey);
    encryptedKey = key.encrypt(symmetricKey, 'base64');
    return {
        encryptedMessage,
        encryptedKey
    };
};

const decryptMessage = (encryptedMessage, encryptedKey) => {
    const key = new node_rsa(privateKey);
    const symmetricKey = key.decrypt(encryptedKey, 'utf8');
    const message = crypto.AES.decrypt(encryptedMessage, symmetricKey).toString(crypto.enc.Utf8);
    return message;
};

const parseSearchQuery = () => {
    const search = location.search.split("&");
    const username = getQueryValue(search[0]);
    const room = getQueryValue(search[1]);
    return {
        username,
        roomName: room
    };
};

const getQueryValue = (query) => {
    const index = query.indexOf('=');
    return query.substring(index + 1).replace(/[+]/g, ' ');
};

const { username, roomName } = parseSearchQuery();

socket.emit('join', { username, roomName, publicKey }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});


// const autoscroll = () => {
//     const newMessage = renderMessages.lastElementChild;

//     const newMessageStyles = getComputedStyle(newMessage);
//     const newMessageMargin = parseInt(newMessageStyles.marginBottom);
//     const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

//     const visibleHeight = document.querySelector('.chat__messages').offsetHeight;

//     const containerHeight = renderMessages.scrollHeight;

//     const scrollOffset = renderMessages.scrollTop + visibleHeight;

//     if ((containerHeight - newMessageHeight) <= scrollOffset) {
//         renderMessages.scrollTop = renderMessages.scrollHeight;
//     }
//     console.log(renderMessages.scrollTop);
// }

socket.on('message', (message) => {
    let finalMessage;
    if (message.username === 'ADMIN') {
        finalMessage = message.text;
    } else {
        finalMessage = decryptMessage(message.text, message.key);
    }
    const time = moment(message.createdAt).format('h:mm a');
    const html = `<div>
                    <p>
                        <span class="message__name">${message.username}</span>
                        <span class="message__meta">${time}</span>
                    </p>
                     <p>${finalMessage}</p>
                  </div>`;
    renderMessages.insertAdjacentHTML('beforeend', html);
    // autoscroll();
});

socket.on('locationMessage', (message) => {
    const finalUrl = decryptMessage(message.text, message.key);
    const time = moment(message.createdAt).format('h:mm a');
    const html = `<div>
                      <p>
                        <span class="message__name">${message.username}</span>
                        <span class="message__meta">${time}</span>
                      </p>
                      <p><a href="${finalUrl}" target="_blank">My current Location</a></p>
                  </div>`;
    renderMessages.insertAdjacentHTML('beforeend', html);
    // autoscroll();
});

socket.on('roomData', ({ roomName, users }) => {
    let html = `<h1 class="room-title">${roomName}</h1>
                <h3 class="list-title">Users</h3>`;
    for (let i = 0; i < users.length; i++) {
        html += `<li class="users">${users[i].username}</li>`
    }
    roomData.innerHTML = html;
});

socket.on('serverPublicKey', (key) => {
    serverPublicKey = key;
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage.setAttribute('disabled', 'disabled');
    const message = inputText.value;
    if (message === '')
        return sendMessage.removeAttribute('disabled');
    const { encryptedMessage, encryptedKey } = encryptMessage(message);
    socket.emit('sendMessage', { encryptedMessage, encryptedKey }, () => {
        sendMessage.removeAttribute('disabled');
        inputText.value = "";
        inputText.focus();
    });
})

sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Your browser does not support sending locations');
    }
    sendLocation.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        };
        const { encryptedMessage, encryptedKey } = encryptMessage(JSON.stringify(coords));
        socket.emit('sendLocation', { encryptedMessage, encryptedKey }, () => {
            sendLocation.removeAttribute('disabled');
        });
    });
});