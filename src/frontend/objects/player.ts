import MainScene from "../scenes/mainScene";
import { PlayerType } from '../../types'

export class Player extends Phaser.Physics.Arcade.Sprite {
  oldPosition: Phaser.Math.Vector2
  playerInfo: PlayerType
  constructor(scene, playerInfo) {
    super(scene, playerInfo.x, playerInfo.y, playerInfo.type); // The frame is optional 
    this.setDisplaySize(MainScene.PLAYER_SIZE, MainScene.PLAYER_SIZE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setMaxVelocity(300);
    this.oldPosition = new Phaser.Math.Vector2();
    this.playerInfo = playerInfo;
  }
  hasMoved() {
    var x = this.x;
    var y = this.y;
    return this.oldPosition && (x !== this.oldPosition.x || y !== this.oldPosition.y)
  }
}