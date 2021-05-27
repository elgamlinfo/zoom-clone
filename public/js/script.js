const videoGrid = document.querySelector(".contact_video_grid");
const audioMuteBtn = document.querySelector(".audio_mute_btn");
const videoMuteBtn = document.querySelector(".video_mute_btn");
const shareVideo = document.querySelector("#share_video");
const  shareScreenRev = document.querySelector('#share_screen_prev');
const contactVideoGrid = document.querySelector('#contact_video_grid');
const peers = {};
const myVideo = document.createElement("video");
myVideo.muted = true;
const videoText = document.createElement("div");
const videoItem = document.createElement("div");
videoItem.classList.add("video__item");
videoText.classList.add("video__name");
videoItem.append(videoText);
let myVideoStream;
let userName = "mostafa elgaml";
let userID = undefined;
let share = false;
let current;
let domain = (new URL(window.location));

const socket = io("/");
const myPeer = new Peer(peer_id, {
  host: 'zoom-clone-nod.herokuapp.com',
  path: '/',
  port: 443,
  secure: true
})
// const myPeer = new Peer(undefined, {
//   host: domain.hostname,
//   port: 3000,
//   path: "/myapp",
// });   

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  userID = id;
});

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    document.querySelector("#start_share_screen").addEventListener('click', () => {
      screenSharing()
    })
    myVideoStream = stream;
    addVideoStream(myVideo, stream, userID, userName);
    myPeer.on("call", (call) => {
      peers[call.peer] = call
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer, userName);
        //console.log(call);
      });
    });
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);   
    });
  });



socket.on("user-disconnected", (userId) => {
  const video = document.getElementById(userId);
  if (video) {
    video.parentElement.remove();
  }
  if (peers[userId]) {
    peers[userId].close();
  }
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId, userName);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
  if(share) {
    for (let [key, value] of myPeer._connections.entries()) {
      myPeer._connections
        .get(key)[0]
        .peerConnection.getSenders()[1]
        .replaceTrack(shareStream.getTracks()[0]);
        console.log(myPeer);
    }
  }   
}

function addVideoStream(video, stream, userId, name = userName) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  video.setAttribute("id", userId);
  video.setAttribute("class", "contact_video");

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

audioMuteBtn.addEventListener("click", (e) => {
  muteUnmuteAudio(e);
});

videoMuteBtn.addEventListener("click", (e) => {
  muteUnmuteVideo(e);
});

const muteUnmuteAudio = (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    e.target.parentNode.classList.toggle("active");
    e.target.classList.toggle("fa-microphone");
    e.target.classList.toggle("fa-microphone-slash");
  } else {
    e.target.parentNode.classList.toggle("active");
    e.target.classList.toggle("fa-microphone");
    e.target.classList.toggle("fa-microphone-slash");
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const muteUnmuteVideo = (e) => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    e.target.parentNode.classList.toggle("active");
    e.target.classList.toggle("fa-video");
    e.target.classList.toggle("fa-video-slash");
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    e.target.parentNode.classList.toggle("active");
    e.target.classList.toggle("fa-video");
    e.target.classList.toggle("fa-video-slash");
  }
};


var shareStream;
async function screenSharing() {
  await navigator.mediaDevices.getDisplayMedia().then((stream) => {
    shareStream = stream;
    share = true;
    for (let [key, value] of myPeer._connections.entries()) {
      myPeer._connections
        .get(key)[0]
        .peerConnection.getSenders()[1]
        .replaceTrack(shareStream.getTracks()[0]);
        console.log(myPeer);
    }

    shareStream.getTracks()[0].onended = () => {
      for (let key of myPeer._connections.keys()) {
          myPeer._connections.get(key)[0].peerConnection.getSenders()[1].replaceTrack(myVideoStream.getVideoTracks()[0])
      }
      share = false;
    }
  });
  //socket.emit('sharescreen');
  socket.on("user-connected", (userId) => {
    console.log(userId);
  });
}
// socket.on('share', stream => {
//   contactVideoGrid.style.display = 'none';
//   shareScreenRev.style.display = 'block';
// })