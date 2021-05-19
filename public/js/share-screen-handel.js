/*********************************start screen capture************************************/
//variables
var shareVideo = document.getElementById('share_video');
var startBtn = document.getElementById('start_share_screen');
var shareScreenRev = document.getElementById('share_screen_prev');
var contactVideoGrid = document.getElementById('contact_video_grid');


/////Options for getDisplayMedia()/////
var displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: false
};

/////stat capure button/////
startBtn.addEventListener('click', (e) => {
    startCapture();
    contactVideoGrid.style.display = 'none';
    shareScreenRev.style.display = 'block';
   
})

/////start screen capture function/////
async function startCapture() {
    navigator.mediaDevices.getDisplayMedia({video:{cursor:"always"}, audio: true})
    .then(stream => {
      myVideoStream = stream;
      shareVideo.srcObject = stream;
      myPeer.on('call', call => {
        call.answer(stream)
        call.on('stream', userVideoStream => {
          shareVideo.srcObject = userVideoStream;
        })
      })
      socket.emit('sharescreen', stream);
      socket.on('user-connected', userId => {
        const call = myPeer.call(userId, stream)
        // call.on('stream', userVideoStream => {
        //   shareVideo.srcObject = userVideoStream;
        // })
        // call.on('close', () => {
        //   video.remove()
        // })

        peers[userId] = call
      })
    })
    .catch(error => {
      console.log({error});
    })
}
/*********************************end  screen capture************************************/
socket.on('share', stream => {
  contactVideoGrid.style.display = 'none';
  shareScreenRev.style.display = 'block';
})
/********************************* start full screen video btn************************************/
var fullSreenBtn =  document.getElementById('full_screen');

fullSreenBtn.addEventListener('click', (e) => {
  if (shareVideo.requestFullscreen) {
    shareVideo.requestFullscreen();
  } else if (shareVideo.webkitRequestFullscreen) { /* Safari */
    shareVideo.webkitRequestFullscreen();
  } else if (shareVideo.msRequestFullscreen) { /* IE11 */
    shareVideo.msRequestFullscreen();
  }
})
/*********************************end full screen video btn************************************/
