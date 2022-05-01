import Phaser from 'phaser'
import { Socket } from 'socket.io-client'
import _ from 'lodash'

var messageForm: any

export default class MainScene extends Phaser.Scene {
    constructor(socket: Socket) {
        super('MainScene')
        this.socket = socket
    }

    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    speech: Phaser.GameObjects.BitmapText
    socket: Socket

    displaySpeech(s: string) {
        if (s.length > 100) {
            s = s.substring(0, 96) + " ..."
        }
        this.speech
            .setText(s)
            .setMaxWidth(300)
            .setPosition(this.player.x - 70, this.player.y + this.player.displayHeight / 2, 0)
            .setVisible(true)
        this.socket.emit('chat message', s)
    }

    preload() {
        this.load.spritesheet('link', 'assets/link.png', {
            frameWidth: 32,
            frameHeight: 32
        })
        this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-classic.png', 'assets/fonts/bitmap/atari-classic.xml');
        this.load.html('message-form', 'assets/html/message_form.html')
        this.load.audio('woods-loop', 'assets/audio/woods_loop.ogg')
    }

    create() {
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

        this.player = this.physics.add.sprite(400, 300, 'link');
        this.player.body.allowGravity = false
        this.player.setScale(2)
        this.player.setDepth(1)
        this.player.anims.play('down', true)
        this.player.setCollideWorldBounds(true)

        let animIndex = 0;
        const anims = ['up', 'down', 'left']
        this.input.on('pointerdown', () => {
            animIndex++
            animIndex = animIndex % anims.length
            this.player.play(anims[animIndex])
        })

        this.cursors = this.input.keyboard.createCursorKeys()
        this.input.keyboard.disableGlobalCapture()

        this.speech = this.add.bitmapText(0, 0, 'atari', '')
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
                this.displaySpeech(messageInput.value)
                messageInput.value = ''
                messageForm.setVisible(false)
            } else {
                messageForm.setVisible(true)
                // this doesn't seem to work but not sure why
                messageInput.focus()
            }
        })

        this.sound.pauseOnBlur = false
        const bgMusic = this.sound.add('woods-loop')
        bgMusic.play({
            loop: true
        })
    }

    update() {
        let xVel = 0
        let yVel = 0
        if (this.cursors.left.isDown) {
            xVel -= 160
        }
        if (this.cursors.right.isDown) {
            xVel += 160
        }
        if (this.cursors.up.isDown) {
            yVel -= 160
        }
        if (this.cursors.down.isDown) {
            yVel += 160
        }
        this.player.setVelocityX(xVel)
        this.player.setVelocityY(yVel)
        if (yVel > 0) {
            this.player.anims.play('down', true)
            this.player.flipX = false
        } else if (yVel < 0) {
            this.player.anims.play('up', true)
            this.player.flipX = false
        } else if (xVel > 0) {
            this.player.anims.play('left', true)
            this.player.flipX = true
        } else if (xVel < 0) {
            this.player.anims.play('left', true)
            this.player.flipX = false
        } else {
            this.player.anims.play('idle', true)
            this.player.flipX = false
        }

    }

}