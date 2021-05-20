const socket = io('/');

//const socket = io("wss://zoom-clone-nod.herokuapp.com/", { transports: ["websocket"] });
const videoGrid = document.querySelector('.contact_video_grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: 443,
    path: "/myapp",
});

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
let myVideoStream;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})




socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})


myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}



function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  video.setAttribute('class', 'contact_video');

  videoGrid.append(video)
}   



const audioMuteBtn = document.querySelector('.audio_mute_btn');
const videoMuteBtn = document.querySelector('.video_mute_btn');



audioMuteBtn.addEventListener('click', e => {
  muteUnmuteAudio(e);
})


videoMuteBtn.addEventListener('click', e => {
  muteUnmuteVideo(e);
})


const muteUnmuteAudio = (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    e.target.parentNode.classList.toggle('active');
    e.target.classList.toggle('fa-microphone');
    e.target.classList.toggle('fa-microphone-slash');
  } else {
    e.target.parentNode.classList.toggle('active');
    e.target.classList.toggle('fa-microphone');
    e.target.classList.toggle('fa-microphone-slash');
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const muteUnmuteVideo = (e) => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    e.target.parentNode.classList.toggle('active');
    e.target.classList.toggle('fa-video');
    e.target.classList.toggle('fa-video-slash');
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    e.target.parentNode.classList.toggle('active');
    e.target.classList.toggle('fa-video');
    e.target.classList.toggle('fa-video-slash');
  }
}


