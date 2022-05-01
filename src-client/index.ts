import Phaser from 'phaser'
import _ from 'lodash';
import io from 'socket.io-client'
import MainScene from './main-scene';

const socket = io()

const gameDiv = document.getElementById('game')

function addToMsgHistory(playerName: string, message: string) {
    const li = document.createElement('li')
    li.textContent = playerName + ': ' + message
    li.classList.add('list-group-item')
    messageList?.appendChild(li)
}

let mainScene = new MainScene(socket, addToMsgHistory)

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
    scene: mainScene,
    pixelArt: true,
    parent: gameDiv,
    dom: {
        createContainer: true
    }
};

var game = new Phaser.Game(config);

const sendButton = document.getElementById('messageBtn')
const messageText = <HTMLTextAreaElement>document.getElementById('message')!

const messageList = document.getElementById('message-list')

sendButton?.addEventListener('click', (ev) => {
    mainScene.sendMessage(messageText.value)
    messageText.value = ''
})