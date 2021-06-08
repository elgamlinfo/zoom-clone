const sendMess = document.querySelector('.send_mess');
const messInput = document.querySelector('.mess_input');
const messContainer = document.querySelector('#mess_cont');


sendMess.addEventListener('click', e => {
    if(messInput.value.length !== 0) {
        const userData = {
            mess: messInput.value,
            name: userName
        }
        socket.emit('message', userData);
        messInput.value = "";

    }
})

document.querySelector('html').addEventListener('keydown',  (e) => {
    if (e.which == 13 &&  messInput.value.length !== 0) {
        const userData = {
            mess: messInput.value,
            name: userName
        }
        socket.emit('message', userData);
        messInput.value = "";
    }
});

socket.on('sendMess', (userData) => {
    let html = ` <div class="message_item">
                    <p class="user_name">${userData.name}</p>
                    <p class="message_content">${userData.mess}</p>
                </div>
                `;
    messContainer.insertAdjacentHTML('afterbegin', html)
  
})  



  
  