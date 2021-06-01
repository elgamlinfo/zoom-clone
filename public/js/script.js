const videoGrid = document.querySelector(".contact_video_grid");
const audioMuteBtn = document.querySelector(".audio_mute_btn");
const videoMuteBtn = document.querySelector(".video_mute_btn");
const shareBtn = document.querySelector("#start_share_screen");
const shareVideo = document.querySelector("#share_video");
const shareScreenRev = document.querySelector("#share_screen_prev");
const contactVideoGrid = document.querySelector("#contact_video_grid");
const fullSreenBtn = document.getElementById("full_screen");
const openPintBtn = document.getElementById("open_pint");
const usersContainer = document.querySelector(".users_container");
const peers = {};
const myVideo = document.createElement("video");
myVideo.muted = true;
const videoText = document.createElement("div");
const videoItem = document.createElement("div");
videoItem.classList.add("video__item");
videoText.classList.add("video__name");
videoItem.append(videoText);
let myVideoStream;
var userName;
let usersData;
let userID;
let dbuserID;
let share = false;
let current;
const socket = io("/");
const myPeer = new Peer(undefined, {
  host: "/",
  port: 9000,
  path: "/myapp",
});

myPeer.on("open", (id) => {
  userID = id;
  axios.get(`http://127.0.0.1:8000/user/${USER_ID}`)
  .then(res => {
    if(ROOM_ID == USER_ID){
      socket.emit("join-room", ROOM_ID, id, {...res.data,peerId: id,video: true, audio: true},{...res.data, roomURL:`http://127.0.0.1:8000/meeting/${res.data.id}`});
    }else{
      socket.emit("join-room", ROOM_ID, id, {...res.data,peerId: id,video: true, audio: true});
    }
    userName = `${res.data.first_name} ${res.data.last_name}`;
    dbuserID = res.data.id;
    //addVideoStream(myVideo, myVideoStream, id, userName);
  })
  .catch(error => {
    console.error(error);
  })
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
    if(shareBtn){
      shareBtn.addEventListener("click", () => {
         screenSharing();
      });
    }
    myVideoStream = stream;
    setTimeout(() => {
      addVideoStream(myVideo, stream, userID, userName);
    }, 100)
    myPeer.on("call", (call) => {
      peers[call.peer] = call;
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        usersData.forEach(user => {
          if(user.peerId == call.peer)
          setTimeout(() => {
            addVideoStream(video, userVideoStream, call.peer, `${user.first_name} ${user.last_name}`);
          },100)
        })
      });
    });
    socket.on("user-connected", (userId, userData) => {
      connectToNewUser(userId,userData,stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  const video = document.getElementById(userId);
  if (video) {
    video.parentElement.remove();
  }
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
});

function connectToNewUser(userId, userData,stream) {
  const call = myPeer.call(userId,stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userId, `${userData.first_name} ${userData.last_name}`);
    if (share) {
      if (Object.keys(peers).length !== 0) {
        for (let [key, value] of myPeer._connections.entries()) {
          if (myPeer._connections.get(key)[0].peerConnection !== null) {
            myPeer._connections
              .get(key)[0]
              .peerConnection.getSenders()[1]
              .replaceTrack(shareStream.getTracks()[0]);
            console.log(myPeer);
          }
        }
      }
      socket.emit("sharescreen", userID);
    }
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

let muteUsersVideo;
let muteUsersAudio
let kickUsers
socket.on("participants", (userData) => {
  usersData = userData
  usersContainer.innerHTML = "";
  userData.forEach((user) => {
    usersContainer.insertAdjacentHTML(
      "beforeend",
      `<div class="user_item">
      <img src="http://127.0.0.1:8000/storage/${user.image}" alt="">
      <p class="user_name">${user.first_name} ${user.last_name}</p>
      <div class="options">
      <span class="${user.audio?"":"active"} " id="${user.id}"><i class="mute_users_audio fad fa-microphone${user.audio?"":"-slash"}"></i></span>
      <span class="${user.video?"":"active"} " id="${user.id}"><i class="mute_users_video fad fa-video${user.video?"":"-slash"}"></i></span>
      ${ROOM_ID==USER_ID&&USER_ID!=user.id?`<span><i class="kick_user fad fa-sign-out-alt" id="${user.id}"></i></span>`:''}
      </div>
      </div>`
      );
    });
    muteUsersVideo = document.querySelectorAll(".mute_users_video");
    muteUsersAudio = document.querySelectorAll(".mute_users_audio");  
    kickUsers = document.querySelectorAll(".kick_user");
    muteUsersAudio.forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.parentNode.id;
        if(ROOM_ID == USER_ID){
          if(id != USER_ID) {
            socket.emit("user_mute_audio", id)
          }
        } 
      })
    })   
    muteUsersVideo.forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.parentNode.id;
        if(ROOM_ID == USER_ID){
          if(id != USER_ID) {
            socket.emit("user_mute_video", id)
          }
        } 
      })
    })   

  if (ROOM_ID == USER_ID) {
    kickUsers.forEach(kick => {
      kick.addEventListener('click', e => {
        socket.emit("user-kick", e.target.id)
    })
  })}
});

socket.on("user_mute_audio", (uId) => {
  if (uId == USER_ID) {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      audioMuteBtn.classList.toggle("active");
      audioMuteBtn.firstChild.classList.toggle("fa-microphone");
      audioMuteBtn.firstChild.classList.toggle("fa-microphone-slash");
    } else {
      audioMuteBtn.classList.toggle("active");
      audioMuteBtn.firstChild.classList.toggle("fa-microphone");
      audioMuteBtn.firstChild.classList.toggle("fa-microphone-slash");
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
    socket.emit("unmute-unmute-mic", uId);
  } 
})
socket.on("user_mute_video", (uId) => {
  if (uId == USER_ID) {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      videoMuteBtn.classList.toggle("active");
      videoMuteBtn.firstChild.classList.toggle("fa-video");
      videoMuteBtn.firstChild.classList.toggle("fa-video-slash");
    } else {
      videoMuteBtn.classList.toggle("active");
      videoMuteBtn.firstChild.classList.toggle("fa-video");
      videoMuteBtn.firstChild.classList.toggle("fa-video-slash");
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
    socket.emit("stop-play-video", uId);
  } 
})


socket.on('user-kick', id => {
  if(USER_ID == id){
    window.location = `http://localhost:8000/leave/${id}`
  }
})

//host information handler
socket.on("host-data", HostData => {
  let html = ` 
                    <div class="row meeting_host">
                        <h3 class="col-12 m-0 p-0 pb-3  text-uppercase fw-bold">${HostData.first_name} ${HostData.last_name}'s room</h3>
                    </div>
                    <div class="item row pt-2 justify-content-between">
                        <p class="col-3 p-0 fs-md-5  text-capitalize room_id_title">id :</p>
                        <p class="col-9 p-0 fs-md-5 m-0 room_id">${HostData.id}</p>
                    </div>
                    <div class="item row pt-2 justify-content-between">
                        <p class="col-3 p-0 fs-md-5  text-capitalize room_host_title">host :</p>
                        <p class="col-9 p-0 fs-md-5  m-0 room_host text-uppercase">${HostData.first_name} ${HostData.last_name}</p>
                    </div>
                    <div class="item row pt-2 justify-content-between">
                        <p class="col-4 p-0  fs-md-5   text-capitalize room_passcode_title">passCode :</p>
                        <p class="col-8 p-0 fs-md-5  m-0 room_passcode">${HostData.meeting_password}</p>
                    </div>
                    <div class="item row pt-2 justify-content-between">
                        <p class="col-3 p-0 fs-md-5 text-capitalize room_invite_title">invite :</p>
                        <p class="col-9 p-0 fs-md-5 m-0 room_invite">${HostData.roomURL}</p>
                    </div>
                  `;
                  document.querySelector(".metting_info").innerHTML = html;
})

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
  socket.emit("unmute-unmute-mic", dbuserID);
});

videoMuteBtn.addEventListener("click", (e) => {
  muteUnmuteVideo(e);
  socket.emit("stop-play-video", dbuserID);
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
    fullSreenBtn.addEventListener("click", (e) => {
      if (myVid.requestFullscreen) {
        myVid.requestFullscreen();
      } else if (myVid.webkitRequestFullscreen) {
        /* Safari */
        myVid.webkitRequestFullscreen();
      } else if (myVid.msRequestFullscreen) {
        /* IE11 */
        myVid.msRequestFullscreen();
      }
    });

    if (Object.keys(peers).length !== 0) {
      for (let [key, value] of myPeer._connections.entries()) {
        myPeer._connections
          .get(key)[0]
          .peerConnection.getSenders()[1]
          .replaceTrack(shareStream.getTracks()[0]);
        console.log(myPeer);
      }
    }

    shareStream.getTracks()[0].onended = () => {
      if (Object.keys(peers).length !== 0) {
        for (let key of myPeer._connections.keys()) {
          myPeer._connections
            .get(key)[0]
            .peerConnection.getSenders()[1]
            .replaceTrack(myVideoStream.getVideoTracks()[0]);
        }
      }
      share = false;
      socket.emit("closeShare", userID);
      myVid.srcObject = myVideoStream;
      fullSreenBtn.style.display = "none";
      openPintBtn.style.display = "none";
      myVid.style.objectFit = "cover";
    };
  });

  socket.emit("sharescreen", userID);
  socket.on("user-connected", (userId) => {
    console.log(userId);
  });
}

socket.on("share", (userId) => {
  const vid = document.getElementById(userId);
  fullSreenBtn.style.display = "block";
  vid.style.objectFit = "contain";
  fullSreenBtn.addEventListener("click", (e) => {
    if (vid.requestFullscreen) {
      vid.requestFullscreen();
    } else if (vid.webkitRequestFullscreen) {
      /* Safari */
      vid.webkitRequestFullscreen();
    } else if (vid.msRequestFullscreen) {
      /* IE11 */
      vid.msRequestFullscreen();
    }
  });
});

socket.on("shareClose", (userId) => {
  const vid = document.getElementById(userId);
  vid.style.objectFit = "cover";
  fullSreenBtn.style.display = "none";
});



