const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const {ExpressPeerServer} = require('peer');


const expressServer = app.listen(9000);
const peerServer = ExpressPeerServer(expressServer,{
   path:'/myapp'
});

app.use(peerServer);


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('meeting', { roomId: req.params.room })
})

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

server.listen(3000, () => {
  console.log('http://localhost:3000');
})