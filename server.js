/* ************************************************************ SETUP ******************************************************* */
const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const app = express();
const fs = require('fs');
const socketio = require('socket.io');

// utils
const {
  insertMessage,
  getMessage,
  formatMessage,
  getMessages
} = require('./utils/messages');
const {
  registerUser,
  getUser,
  joinUsersRoom,
  leaveUsersRoom,
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
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
});var sharedsession = require("express-socket.io-session");
app.use(session);
io.use(sharedsession(session, {
  autoSave:true
}));

// set static folder
app.use(express.static(path.join(__dirname, 'public')));
// set body-parser
app.use(express.urlencoded({extended: false}));
// parses incoming requests with json payloads to an object
app.use(express.json());

// set view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// globals
const botName = 'ChatApp Bot';

/* ************************************************************ ROUTES ******************************************************* */

// run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    // create user object
    const user = userJoin(socket.id, username, room);
    // subscribe to a given channel
    socket.join(user.room);

    // welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatApp!'));

    // broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    // get user-id from session
    const userID = socket.handshake.session.userID;

    const room = socket.handshake.session.room;
    // select room of user
    getRoom(room).then(element => {
      // get room-id
      const roomID = element[0].ID;
      // saves message into database
      insertMessage(msg, userID, roomID).then(data => {
        msg = data
        console.log(msg);
      }).catch(err => {
        console.log(err.message);
      });
    }).catch(err => {
      console.log(err.message);
    });
    io.to(user.room).emit('message', formatMessage(user.username, msg));
    console.log('send1');
  });
  // listen to image
  socket.on('image', async ({base64, filename}) => {
    // 
    const filepath = './public/upload/' + filename;
    //
    const buffer = Buffer.from(base64, 'base64');
    // validate size
    let len = Buffer.byteLength(buffer) / (1024 * 1024); // MB
    if (len < 6) {
      //
      await fs.writeFile(filepath, buffer, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('image saved');
        };
  
      });
      //
      const imgUrl = '/upload/' + filename;
      //
      const user = getCurrentUser(socket.id);
      // get user-id from session
      const userID = socket.handshake.session.userID;
  
      const room = socket.handshake.session.room;
      // select room of user
      getRoom(room).then(element => {
        // get room-id
        const roomID = element[0].ID;
        // saves message into database
        insertMessage(imgUrl, userID, roomID).then(msg => {
          io.to(user.room).emit('message', formatMessage(user.username, msg));
          console.log('send2')
        });
      }).catch(err => {
        console.log(err.message);
      });
    }
  })

  // runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    const userID = socket.handshake.session.userID;
    // deletes user & room correlation from database when user lefts the room
    getRoom(user.room).then(roomElement => {
      const roomID = roomElement[0].ID;
      leaveUsersRoom(userID, roomID).then(() => {
        // ???
      }).catch(err => {
        console.log(err.message);
      });
    }).catch(err => {
      console.log(err.message);
    });

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    };

  });

});

// route to main
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/room');
  } else {
    res.render('main');
  }
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
        // console.log(req.session);
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

// route to chat
app.get('/chat/:room/:id', (req, res) => {
  if (req.session.user) {
    const chatRoom = req.params.room;
    const roomId = req.params.id;
    if (chatRoom) {
      req.session.room = chatRoom
      // combine userID and roomID
      // render page chat
      joinUsersRoom(req.session.userID, roomId).then(() => {
        getMessages(chatRoom).then(messages => {
          const msgs = []
          messages.forEach(msg => {
            msgs.push({
              username: msg.username,
              text: msg.message,
              time: moment(msg.message_time).format('H:mm')
            })
          })
          res.render('chat', {username: req.session.user, chatRoom, oldMessages: JSON.stringify(msgs)});
        }).catch(error => {
          res.render('chat', {username: req.session.user, chatRoom, oldMessages: JSON.stringify([])});
        })
      }).catch(err => {
        console.log(err);
      });
    } else {
      res.redirect('/room');
    };
  } else {
    res.redirect('/');
  };
});

// route to logout
app.get('/logout', (req, res) => {
  // destroys the session from user & logs him out
  req.session.destroy();
  res.redirect('/');
});

/* ************************************************************ PORT ******************************************************* */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
