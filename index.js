require('dotenv').config();
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const {ExpressPeerServer} = require('peer');

const port = process.env.PORT || 5000;

//const expressServer = server.listen(9000);
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/" 
});

app.use('/peerjs', peerServer);


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('meeting', { roomId: req.params.room })
})

peerServer.on('connection', (client) => { 
  console.log(client.id);
});
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)
    socket.on('sharescreen', (stream) => {
      console.log('stream');
      socket.to(roomId).emit('share')
    })

    socket.on('message', (userData) => {
      io.to(roomId).emit('sendMess', userData)
    })

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(port)