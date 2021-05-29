const videoGrid = document.querySelector(".contact_video_grid");
const audioMuteBtn = document.querySelector(".audio_mute_btn");
const videoMuteBtn = document.querySelector(".video_mute_btn");
const shareVideo = document.querySelector("#share_video");
const shareScreenRev = document.querySelector("#share_screen_prev");
const contactVideoGrid = document.querySelector("#contact_video_grid");
const  fullSreenBtn =  document.getElementById('full_screen');
const  openPintBtn =  document.getElementById('open_pint');
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
let userID;
let share = false;
let current;
let domain = new URL(window.location);

const socket = io("/");
const myPeer = new Peer(undefined, {
  host: domain.hostname,
  port: 3001,
  path: "/myapp",
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  userID = id;
});

navigator.mediaDevices
  .getUserMedia({
    video: true,
    echoCancellation: true,
    noiseSuppression: true,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  })
  .then((stream) => {
    document
      .querySelector("#start_share_screen")
      .addEventListener("click", () => {
        screenSharing();
      });
    myVideoStream = stream;
    addVideoStream(myVideo, stream, userID, userName);
    myPeer.on("call", (call) => {
      peers[call.peer] = call;
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer, userName);
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
    delete peers[userId]
  }
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId, userName);
    if (share) {
      for (let [key, value] of myPeer._connections.entries()) {
        if(myPeer._connections.get(key)[0].peerConnection !== null){
          myPeer._connections
          .get(key)[0]
          .peerConnection.getSenders()[1]
          .replaceTrack(shareStream.getTracks()[0]);
          console.log(myPeer);
        }
      }
      socket.emit('sharescreen', userID);
    }
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
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
    const myVid = document.getElementById(userID);
    myVid.srcObject = stream;
    fullSreenBtn.style.display = "block";
    openPintBtn.style.display = "block";
    myVid.style.objectFit = "contain";
    fullSreenBtn.addEventListener('click', (e) => {
      if (myVid.requestFullscreen) {
        myVid.requestFullscreen();
      } else if (myVid.webkitRequestFullscreen) { /* Safari */
        myVid.webkitRequestFullscreen();
      } else if (myVid.msRequestFullscreen) { /* IE11 */
        myVid.msRequestFullscreen();
      }
    })

    for (let [key, value] of myPeer._connections.entries()) {
        myPeer._connections
        .get(key)[0]
        .peerConnection.getSenders()[1]
        .replaceTrack(shareStream.getTracks()[0]);
        console.log(myPeer);
    }

    shareStream.getTracks()[0].onended = () => {
      for (let key of myPeer._connections.keys()) {
        myPeer._connections
          .get(key)[0]
          .peerConnection.getSenders()[1]
          .replaceTrack(myVideoStream.getVideoTracks()[0]);
      }
      share = false;
      socket.emit("closeShare", userID);
      myVid.srcObject = myVideoStream;
      fullSreenBtn.style.display = "none";
      openPintBtn.style.display = "none";
      myVid.style.objectFit = "cover";
    };
  });
  
  socket.emit('sharescreen', userID);
  socket.on("user-connected", (userId) => {
    console.log(userId);
  });
}


 socket.on('share', userId => {
  const vid = document.getElementById(userId);
  fullSreenBtn.style.display = "block";
  vid.style.objectFit = "contain";
  fullSreenBtn.addEventListener('click', (e) => {
    if (vid.requestFullscreen) {
      vid.requestFullscreen();
    } else if (vid.webkitRequestFullscreen) { /* Safari */
      vid.webkitRequestFullscreen();
    } else if (vid.msRequestFullscreen) { /* IE11 */
      vid.msRequestFullscreen();
    }
  })
})  


socket.on("shareClose", userId => {
  const vid = document.getElementById(userId);
  vid.style.objectFit = "cover";
  fullSreenBtn.style.display = "none";
})