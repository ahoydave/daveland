import Phaser from 'phaser'
import { Socket } from 'socket.io-client'
import _ from 'lodash'


export default class IntroScene extends Phaser.Scene {

    constructor(public socket: Socket) {
        super('IntroScene')
    }

    preload() {
        this.load.html('enter-name', 'assets/html/enter_name.html')
    }

    create() {
        const nameForm = this.add.dom(this.game.canvas.width/2, this.game.canvas.height/2)
            .createFromCache('enter-name')

        const nameInput: HTMLInputElement = <HTMLInputElement>nameForm.node.children[1]

        this.input.keyboard.on('keydown-ENTER', () => {
            if (nameInput.value !== '') {
                this.socket.emit('set name', nameInput.value)
                this.scene.start('MainScene')
            }
        })
    }
}