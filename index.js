require('dotenv').config();
const express = require('express')
const app = express()
const path = require('path');
const fs = require('fs')
const axios = require('axios');
//const server = require('http').Server(app)
const server = require('https').createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem')),
  },
  app
)
const io = require('socket.io')(server);
var cors = require('cors')
const { v4: uuidV4 } = require('uuid')
const {ExpressPeerServer} = require('peer');

const port = process.env.PORT || 9000;

//const expressServer = app.listen(9000);
const peerServer = ExpressPeerServer(server,{
  path: "/myapp",
   
});



//set path
const viewPath = path.join(__dirname, "./views");
const publicPath = path.join(__dirname, "./public");

app.use(cors())
app.use(peerServer);

//set template engine
app.use(express.static(viewPath));
app.use(express.static(publicPath));

app.set("views", viewPath);
app.set("view engine", "ejs");

// app.get('/', (req, res) => {
//   res.redirect(`/${Date.now() + ( (Math.random()*100000).toFixed())}/8368368`)
// })

let userID;

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

peerServer.on('connection', (client) => { 
  console.log(client.id);
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)

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
      console.log(`USER ${userId} Disconnected`);
      axios.get(`http://localhost:8000/close/${userID}`);
    })
  })
})

server.listen(port, () => {
   console.log(`app listen at port https://localhost:${port}`);
})
