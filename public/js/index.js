(function connect() {
    const socket = io()

    const sendButton = document.getElementById('messageBtn')
    const messageText = document.getElementById('message')
    sendButton.addEventListener('click', (ev) => {
        socket.emit('chat message', messageText.value)
        messageText.value = ''
    })

    const messageList = document.getElementById('message-list')
    socket.on('chat message', (msg) => {
        const li = document.createElement('li')
        li.textContent = msg
        li.classList.add('list-group-item')
        messageList.appendChild(li)
    })
})()