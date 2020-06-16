const socket = io();

const form = document.querySelector('form');
const inputText = document.getElementById('chatMessage');
const sendLocation = document.getElementById('send-location');
const sendMessage = document.getElementById('send-message');
const renderMessages = document.getElementById('messages');
const roomData = document.getElementById('room-data');

const parseSearchQuery = () => {
    const search = location.search.split("&");
    const username = getQueryValue(search[0]);
    const room = getQueryValue(search[1]);
    return {
        username,
        room
    };
};

const getQueryValue = (query) => {
    const index = query.indexOf('=');
    return query.substring(index + 1).replace(/[+]/g, ' ');
};

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
    const time = moment(message.createdAt).format('h:mm a');
    const html = `<div>
                    <p>
                        <span class="message__name">${message.username}</span>
                        <span class="message__meta">${time}</span>
                    </p>
                     <p>${message.text}</p>
                  </div>`;
    renderMessages.insertAdjacentHTML('beforeend', html);
    // autoscroll();
});

socket.on('locationMessage', (message) => {
    const time = moment(message.createdAt).format('h:mm a');
    const html = `<div>
                      <p>
                        <span class="message__name">${message.username}</span>
                        <span class="message__meta">${time}</span>
                      </p>
                      <p><a href="${message.url}" target="_blank">My current Location</a></p>
                  </div>`;
    renderMessages.insertAdjacentHTML('beforeend', html);
    // autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    let html = `<h1 class="room-title">${room}</h1>
                <h3 class="list-title">Users</h3>`;
    for (let i = 0; i < users.length; i++) {
        html += `<li class="users">${users[i].username}</li>`
    }
    roomData.innerHTML = html;
})

form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage.setAttribute('disabled', 'disabled');
    const message = inputText.value;
    if (message === '')
        return sendMessage.removeAttribute('disabled');
    socket.emit('sendMessage', message, () => {
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
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            sendLocation.removeAttribute('disabled');
            console.log('Location shared!');
        });
    });
});

const { username, room } = parseSearchQuery();
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});