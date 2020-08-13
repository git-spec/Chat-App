/* ************************************************************ SETUP ******************************************************* */
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
// parses incoming requests with json payloads to an object
app.use(express.json());

// set view engine
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

const botName = 'ChatApp Bot';

/* ************************************************************ ROUTES ******************************************************* */

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatApp!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }

  });

});

let username = '';
// route to main
app.get('/', (req, res) => {
  res.render('main');
});

// handle with register data
app.post('/', (req, res) => {
  console.log(req.body);
  username = req.body.username;
  res.json(1);
});

// route to main
app.get('/register', (req, res) => {
  res.render('main');
});

// route to room
app.get('/room', (req, res) => {
  res.render('room', {username});
});

// route to chat
app.get('/chat', (req, res) => {
  res.render('chat', {username});
});

/* ************************************************************ PORT ******************************************************* */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
