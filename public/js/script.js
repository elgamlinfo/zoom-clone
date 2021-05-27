const videoGrid = document.querySelector('.contact_video_grid');
const audioMuteBtn = document.querySelector('.audio_mute_btn');
const videoMuteBtn = document.querySelector('.video_mute_btn');
const peers = {};
const myVideo = document.createElement('video');
myVideo.muted = true;
const videoText = document.createElement("div");
const videoItem = document.createElement("div");
videoItem.classList.add("video__item");
videoText.classList.add("video__name");
videoItem.append(videoText);
let myVideoStream;
let userName = "mostafa elgaml";
let userID=undefined;



const socket = io('/');
const myPeer = new Peer(undefined, {
    host: "/",
    port: 3030,
    path: "/myapp",
});



navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream, userID, userName);
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, call.peer, userName)
      console.log(call);
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
 
})


myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
  userID = id;
})


socket.on('user-disconnected', userId => {
  const video = document.getElementById(userId);
  if (video) {
    video.parentElement.remove();
  }
  if (peers[userId]){
    peers[userId].close()
  }
})



function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, userId, userName)
  })
  call.on('close', () => {
    video.remove()
  })
  peers[userId] = call
}


function addVideoStream(video, stream, userId, name=userName) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  video.setAttribute("id", userId);
  video.setAttribute('class', 'contact_video');

  const clonedItem = videoItem.cloneNode(true);
  clonedItem.children[0].innerHTML = name;
  clonedItem.append(video);

  videoGrid.append(clonedItem);
  console.log(name);
  // weird error cleanup
  const nodes = document.querySelectorAll(".video__item") || [];
  nodes.forEach((node) => {
    if (node.children && node.children.length < 2) {
      node.remove();
    }
  });
}   




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
   