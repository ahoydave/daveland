import Phaser from 'phaser'
import { Socket } from 'socket.io-client'
import _ from 'lodash'
import { Vector } from 'matter'

type Doing = 'left' | 'right' | 'up' | 'down' | 'idle'

export default class MainScene extends Phaser.Scene {

    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    speech: Array<[Phaser.GameObjects.BitmapText, number]> = []
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

    animatePlayer(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, doing: Doing) {
        switch (doing) {
            case 'up':
                player.anims.play('up', true)
                player.flipX = false
                break
            case 'down':
                player.anims.play('down', true)
                player.flipX = false
                break
            case 'left':
                player.anims.play('left', true)
                player.flipX = false
                break
            case 'right':
                player.anims.play('left', true)
                player.flipX = true
                break
            case 'idle':
                player.anims.play('idle', true)
                player.flipX = false
        }
    }

    setRemotePlayerPosition(playerKey: string, x: number, y: number) {
        if (this.otherPlayers.has(playerKey)) {
            this.otherPlayers.get(playerKey).setPosition(x, y)
        } else {
            console.log('adding new player')
            const newPlayer = this.physics.add.sprite(x, y, 'link');
            newPlayer.body.allowGravity = false
            newPlayer.setScale(2)
            newPlayer.setDepth(1)
            newPlayer.tint = Math.random() * 0xffffff
            this.otherPlayers.set(playerKey, newPlayer)
        }
    }

    updateRemotePlayer({ x, y, key, doing }: { x: number, y: number, key: string, doing: Doing }) {
        this.setRemotePlayerPosition(key, x, y)
        if (this.otherPlayers.has(key)) {
            this.animatePlayer(this.otherPlayers.get(key), doing)
        }
    }

    displaySpeech(s: string, player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        if (s.length > 100) {
            s = s.substring(0, 96) + " ..."
        }
        let newSpeech = this.add.bitmapText(0, 0, 'atari', s)
            .setFontSize(16)
            .setMaxWidth(300)
            .setDepth(0)
            .setPosition(player.x - 70, player.y + player.displayHeight / 2, 0)
            .setVisible(true)

        let ttl = 5000 + s.length * 100
        this.speech.push([newSpeech, ttl])
        console.log(this.speech.length)
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
                this.displaySpeech(name + ': ' + message, this.otherPlayers.get(key))
            }
            this.addToMessageHistory(name, message)
        })

        this.socket.on('player update', (content) => {
            this.updateRemotePlayer(content)
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

    update(_time: number, delta: number) {
        let xVel = 0
        let yVel = 0
        xVel += this.cursors.left.isDown ? -160 : 0
        xVel += this.cursors.right.isDown ? 160 : 0
        yVel += this.cursors.up.isDown ? -160 : 0
        yVel += this.cursors.down.isDown ? 160 : 0
        this.player.setVelocityX(xVel)
        this.player.setVelocityY(yVel)

        let doing: Doing = 'idle'
        if (yVel > 0) {
            doing = 'down'
        } else if (yVel < 0) {
            doing = 'up'
        } else if (xVel > 0) {
            doing = 'right'
        } else if (xVel < 0) {
            doing = 'left'
        }
        this.animatePlayer(this.player, doing)

        this.socket.emit('player update', {
            x: this.player.x,
            y: this.player.y,
            doing: doing
        })

        for (let i = 0; i < this.speech.length; i++) {
            this.speech[i][1] -= delta
            if (this.speech[i][1] <= 0) {
                this.speech[i][0].destroy();
            } else {
                const newAlpha = Math.min(1000, this.speech[i][1]) / 1000
                this.speech[i][0].alpha = newAlpha
            }
        }
        this.speech = this.speech.filter(([_, ttl]) => ttl > 0)
    }
}