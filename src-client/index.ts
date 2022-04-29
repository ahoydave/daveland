import Phaser from 'phaser'
import _ from 'lodash';

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
    pixelArt: true
};

var game = new Phaser.Game(config);
var cursors: any
var player: any

function preload ()
{
    this.load.spritesheet('link', 'assets/link.png', {
        frameWidth: 32,
        frameHeight: 32
    })
}

function create ()
{
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(10, 20)}),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(10)}),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('link', { frames: [ 0 ]}),
        frameRate: 13,
        repeat: -1
    })
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(20, 30)}),
        frameRate: 13,
        repeat: -1
    })
    player = this.physics.add.sprite(400, 300, 'link');
    player.body.allowGravity = false
    player.setScale(2)
    player.anims.play('down', true)
    player.setCollideWorldBounds(true)

    let animIndex = 0;
    const anims = [ 'up', 'down', 'left' ]
    this.input.on('pointerdown', () => {
        animIndex++
        animIndex = animIndex % anims.length
        player.play(anims[animIndex])
    })

    cursors = this.input.keyboard.createCursorKeys()
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