require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
var cors = require('cors');
const {ExpressPeerServer} = require('peer');
const { v4: uuidV4 } = require('uuid');
const port = process.env.PORT || 9000;
let userID;
let users = {};
let HostData;
const server = require('https').createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
  },
  app
);
const io = require('socket.io')(server);
const peerServer = ExpressPeerServer(server,{
  path: "/myapp",
});


//set path
const viewPath = path.join(__dirname, "./views");
const publicPath = path.join(__dirname, "./public");


//app use
app.use(express.static(viewPath));
app.use(express.static(publicPath));
app.use(cors({origin: "*"}));
app.use(peerServer);


//set template engine
app.set("views", viewPath);
app.set("view engine", "ejs");


//generate room && user id 
app.get('/gen', (req, res) => {
  res.redirect(`/?roomid=${Date.now() + ( (Math.random()*100000).toFixed())}&userid=${Date.now() + ( (Math.random()*100000).toFixed())}`)
})

//main router for meeting page
app.get('/', (req, res) => {
  userID = req.query.userid;
  res.render('meeting', { 
    roomId: req.query.roomid,
    userId: req.query.userid,
   })

})

//404 page handler
app.use((req, res, next) => {
    res.render('404');
});


//peer on connection handelr
peerServer.on('connection', (client) => { 
  console.log(client.id);
});


io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, userData, hostData) => {
    if (users[roomId]) users[roomId].push(userData);
    else users[roomId] = [userData];
    if(hostData != null){
      HostData = hostData;
    }

    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId, userData)
    io.in(roomId).emit("host-data", HostData);
    io.in(roomId).emit("participants", users[roomId]);

    socket.on("unmute-unmute-mic", (userid) => {
      users[roomId].forEach((user) => {
          if (user.id == userid) return (user.audio = !user.audio);
      });
      io.in(roomId).emit("participants", users[roomId]);
    });
  

    socket.on("stop-play-video", userid => {
        users[roomId].forEach((user) => {
            if (user.id == userid) return (user.video = !user.video);
        });
        io.in(roomId).emit("participants", users[roomId]);
    })

    socket.on("user_mute_audio", (uId) => {
     socket.to(roomId).emit("user_mute_audio", uId)
    })

    socket.on("user_mute_video", (uId) => {
     socket.to(roomId).emit("user_mute_video", uId)
    })

    socket.on('user-kick', id => {
      socket.to(roomId).emit('user-kick', id);
    })

    socket.on('sharescreen', (userID) => {
      socket.to(roomId).emit('share', userID);
    })

    socket.on("closeShare", userID => {
      socket.to(roomId).emit('shareClose', userID);
    })

    socket.on('message', (userData) => {
      io.to(roomId).emit('sendMess', userData)
    })

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
      users[roomId] = users[roomId].filter((user) => user.id !== userData.id);
      if (users[roomId].length === 0) delete users[roomId];
      else io.in(roomId).emit("participants", users[roomId]);
      axios.get(`http://localhost:8000/close/${userID}`);
      console.log(`USER ${userId} Disconnected`);
    })
  })
})

server.listen(port, () => {
   console.log(`app listen at port https://localhost:${port}/gen`);
})