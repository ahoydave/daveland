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
        create: create
    },
    pixelArt: true
};

var game = new Phaser.Game(config);

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
        key: 'up',
        frames: this.anims.generateFrameNumbers('link', { frames: _.range(20, 30)}),
        frameRate: 13,
        repeat: -1
    })
    const player = this.add.sprite(400, 300, 'link');
    player.setScale(2)
    player.play('up')
    let animIndex = 0;
    const anims = [ 'up', 'down', 'left' ]
    this.input.on('pointerdown', () => {
        animIndex++
        animIndex = animIndex % anims.length
        player.play(anims[animIndex])
    })
}