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
    navigator.mediaDevices.getDisplayMedia({cursor:"always"})
    .then(stream => {
      shareVideo.srcObject = stream;
      myVideoStream.getVideoTracks()[0] = stream.getVideoTracks()[0];
      //socket.emit('sharescreen', stream);
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
