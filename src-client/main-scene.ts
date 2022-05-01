import Phaser from 'phaser'
import { Socket } from 'socket.io-client'
import _ from 'lodash'

export default class MainScene extends Phaser.Scene {

    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    speech: Phaser.GameObjects.BitmapText
    messageForm: Phaser.GameObjects.DOMElement
    socket: Socket
    playerKey: string
    addToMessageHistory: Function
    otherPlayers: Map<string, Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> = new Map()

    constructor(socket: Socket, addToMessageHistory: Function) {
        super('MainScene')
        this.socket = socket
        this.addToMessageHistory = addToMessageHistory

    }

    setPlayerPosition(playerKey: string, x: number, y: number) {
        if (this.otherPlayers.has(playerKey)) {
            this.otherPlayers.get(playerKey).setPosition(x, y)
        } else {
            console.log('adding new player')
            const newPlayer = this.physics.add.sprite(x, y, 'link');
            newPlayer.body.allowGravity = false
            newPlayer.setScale(2)
            newPlayer.setDepth(1)
            this.otherPlayers.set(playerKey, newPlayer)
        }
    }

    displaySpeech(s: string, player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        if (s.length > 100) {
            s = s.substring(0, 96) + " ..."
        }
        this.speech
            .setText(s)
            .setMaxWidth(300)
            .setPosition(player.x - 70, player.y + player.displayHeight / 2, 0)
            .setVisible(true)
    }

    sendMessage(s: string) {
        this.displaySpeech(s, this.player)
        this.socket.emit('chat message', s)
        this.addToMessageHistory('me', s)
    }

    setName(s: string) {
        this.socket.emit('set name', s)
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

        this.messageForm = this.add.dom(100, 100)
            .createFromCache('message-form')
            .setDepth(2)
            .setVisible(false)

        const messageInput: HTMLInputElement = <HTMLInputElement>this.messageForm.node.children[0]

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.messageForm.visible) {
                this.setName(messageInput.value)
                messageInput.value = ''
                this.messageForm.setVisible(false)
            } else {
                this.messageForm.setVisible(true)
                // this doesn't seem to work but not sure why
                messageInput.focus()
            }
        })

        this.sound.pauseOnBlur = false
        // const bgMusic = this.sound.add('woods-loop')
        // bgMusic.play({
        //     loop: true
        // })

        this.socket.on('player message', ({ message, key, name }) => {
            if (this.otherPlayers.has(key)) {
                this.displaySpeech(name + ': ' + message, this.otherPlayers.get(key)
            }
            this.addToMessageHistory(name, message)
        })

        this.socket.on('player position', ({ x, y, key, name }: { x: number, y: number, key: string, name: string }) => {
            this.setPlayerPosition(key, x, y)
        })

        this.socket.on('remove player', (key) => {
            if (this.otherPlayers.has(key)) {
                console.log('Deleted player')
                this.otherPlayers.get(key).destroy()
                this.otherPlayers.delete(key)
            } else {
                console.log("Can't delete player I don't know about")
            }
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
        this.socket.emit('player position', {
            x: this.player.x,
            y: this.player.y
        })
    }

}