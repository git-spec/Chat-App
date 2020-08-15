/* ************************************************************ SETUP ******************************************************* */
const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const {
  insertMessage,
  getMessage,
  formatMessage
} = require('./utils/messages');
const {
  registerUser,
  getUser,
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  setUsersRoom
} = require('./utils/users');
const {
  getRooms,
  getRoom
} = require('./utils/rooms');

// socketio server
const server = http.createServer(app);
const io = socketio(server);

// session
const session = require('express-session')({
  secret: "chat",
  resave: true,
  saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
app.use(session);
io.use(sharedsession(session, {
  autoSave:true
}));
// set static folder
app.use(express.static(path.join(__dirname, 'public')));
// set body-parser
app.use(express.urlencoded({extended: false}))
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
    // create user object
    const user = userJoin(socket.id, username, room);
    // subscribe to a given channel
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
    console.log(user.room);
    // console.log(socket.handshake.session.room);
    console.log(socket.handshake.session.userID);

    getRoom(user.room).then(element => {
      console.log(element[0].ID);

      insertMessage(msg, socket.handshake.session.userID, element[0].ID)
    }).catch(err => {
      console.log(err.message);
    })
    // insertMessage(msg, this.socket.session.userID, this.socket.session.roomID)
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

// handle with register or login data
app.post('/', (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const repassword = req.body.repassword;
  // 1 registration or login successful
  // 2 user already exists
  // 3 user not found
  // 4 server error
  // 5 missing entries
  if (firstname && lastname && username && email && password && password === repassword) {
    registerUser(firstname, lastname, username, email, password).then(() => {
      getUser(username, password).then(user => {
        req.session.user = user.username;
        req.session.userID = user.ID;
        console.log(req.session);
        // login successful
        res.json(1);
      }).catch(err => {
        if (err === 3) {
          // user not found
          res.json(3);
        } else {
          // server error
          res.json(4);
        };
      });  
    }).catch(err => {
      if (err === "exists") {
        // user already exists
        res.json(2);
      } else {
        // server error
        res.json(4);
      };
    });
  } else if (username && password) {
    getUser(username, password).then(user => {
      req.session.user = user.username;
      req.session.userID = user.ID;
      // login successful
      res.json(1);
    }).catch(err => {
      if (err === 3) {
        // user not found
        res.json(3);
      } else {
        // server error
        res.json(4);
      };
    });
  } else {
    // missing entries
    res.json(5);
  };
});

// route to room
app.get('/room', (req, res) => {
  // check if valid user
  if (req.session.user) {
    // get rooms from db
    getRooms().then(rooms => {
      res.render('room', {rooms});
    }).catch(err => {
      res.redirect('/');
    })
  } else {
    res.redirect('/');
  }
});

// route to chat with params
app.get('/chat/:room&:id', (req, res) => {
  if (req.session.user) {
    const chatRoom = req.params.room;
    if (chatRoom ) {
      // combine userID and roomID
      setUsersRoom(req.session.userID, req.params.id).then(() => {}).catch(err => {});
      // render page chat
      res.render('chat', {username: req.session.user, chatRoom});
    } else {
      res.redirect('/room')
    };
  } else {
    res.redirect('/');
  };
});

/* ************************************************************ PORT ******************************************************* */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
