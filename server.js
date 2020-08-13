/* ************************************************************ SETUP ******************************************************* */
const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

// session
const session = require('express-session');
const users = require('./utils/users');
app.use(session({
  secret: 'chat',
  cookie: {}
}));

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

// route to main
app.get('/', (req, res) => {
  res.render('main');
});

// handle with register data
app.post('/', (req, res) => {
  console.log(req.body);
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const repassword = req.body.repassword;
  if (firstname && lastname && username && email && password && password === repassword) {
    users.registerUser(firstname, lastname, username, email, password).then(() => {
      req.session.user = username;
      res.json(1);
    }).catch(err => {
      res.json(2);
    });
  } else if (username && password) {
    // users.getUser
  } else {
    res.json(3);
  };
});

// route to room
app.get('/room', (req, res) => {
  if (req.session.user) {
    res.render('room');
  } else {
    res.redirect('/');
  }
});

// route to chat with query
app.get('/chat', (req, res) => {
  // console.log(req.params);
  // console.log(req.query.room)
  if (req.session.user) {
    const chatRoom  = req.query.room 
    if (chatRoom ) {
      res.render('chat', {username: req.session.user, chatRoom });
    } else {
      res.redirect('/room')
    }
  } else {
    res.redirect('/');
  }
});
// route to chat with params
app.get('/chat/:room', (req, res) => {
  if (req.session.user) {
    const chatRoom = req.params.room 
    if (chatRoom ) {
      res.render('chat', {username: req.session.user, chatRoom});
    } else {
      res.redirect('/room')
    }
  } else {
    res.redirect('/');
  }
})

/* ************************************************************ PORT ******************************************************* */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
