import Phaser from 'phaser'
import _ from 'lodash';
import io from 'socket.io-client'

const socket = io()

const sendButton = document.getElementById('messageBtn')
const messageText = <HTMLTextAreaElement>document.getElementById('message')!

const messageList = document.getElementById('message-list')
socket.on('chat message', (msg) => {
    const li = document.createElement('li')
    li.textContent = msg
    li.classList.add('list-group-item')
    messageList?.appendChild(li)
})

const gameDiv = document.getElementById('game')

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    pixelArt: true,
    parent: gameDiv,
    dom: {
        createContainer: true
    }
};

var game = new Phaser.Game(config);
var cursors: any
var player: any
var speech: any
var messageForm: any

function preload() {
    this.load.spritesheet('link', 'assets/link.png', {
        frameWidth: 32,
        frameHeight: 32
    })
    this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-classic.png', 'assets/fonts/bitmap/atari-classic.xml');
    this.load.html('message-form', 'assets/html/message_form.html')
}

function create() {
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(10, 20) }),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(10) }),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('link', { frames: [0] }),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(20, 30) }),
        frameRate: 13,
        repeat: -1
    })

    player = this.physics.add.sprite(400, 300, 'link');
    player.body.allowGravity = false
    player.setScale(2)
    player.setDepth(1)
    player.anims.play('down', true)
    player.setCollideWorldBounds(true)

    let animIndex = 0;
    const anims = ['up', 'down', 'left']
    this.input.on('pointerdown', () => {
        animIndex++
        animIndex = animIndex % anims.length
        player.play(anims[animIndex])
    })

    cursors = this.input.keyboard.createCursorKeys()
    this.input.keyboard.disableGlobalCapture()

    speech = this.add.bitmapText(0, 0, 'atari', '')
        .setFontSize(16)
        .setMaxWidth(300)
        .setDepth(0)
        .setVisible(false)

    messageForm = this.add.dom(100, 100)
        .createFromCache('message-form')
        .setDepth(2)
        .setVisible(false)

    const messageInput: HTMLInputElement = messageForm.node.children[0]

    this.input.keyboard.on('keydown-ENTER', () => {
        if (messageForm.visible) {
            displaySpeech(messageInput.value)
            messageInput.value = ''
            messageForm.setVisible(false)
        } else {
            messageForm.setVisible(true)
            // this doesn't seem to work but not sure why
            messageInput.focus()
        }
    })
}

function update() {
    let xVel = 0
    let yVel = 0
    if (cursors.left.isDown) {
        xVel -= 160
    }
    if (cursors.right.isDown) {
        xVel += 160
    }
    if (cursors.up.isDown) {
        yVel -= 160
    }
    if (cursors.down.isDown) {
        yVel += 160
    }
    player.setVelocityX(xVel)
    player.setVelocityY(yVel)
    if (yVel > 0) {
        player.anims.play('down', true)
        player.flipX = false
    } else if (yVel < 0) {
        player.anims.play('up', true)
        player.flipX = false
    } else if (xVel > 0) {
        player.anims.play('left', true)
        player.flipX = true
    } else if (xVel < 0) {
        player.anims.play('left', true)
        player.flipX = false
    } else {
        player.anims.play('idle', true)
        player.flipX = false
    }

}

function displaySpeech(s: string) {
    if (s.length > 100) {
        s = s.substring(0, 96) + " ..."
    }
    speech
        .setText(s)
        .setMaxWidth(300)
        .setPosition(player.x - 70, player.y + player.displayHeight / 2, 0)
        .setVisible(true)
    socket.emit('chat message', s)
}

sendButton?.addEventListener('click', (ev) => {
    displaySpeech(messageText.value)
    messageText.value = ''
})