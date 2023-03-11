import MainScene from "../scenes/mainScene";

export class Player {
  constructor(
    private sprite: Phaser.GameObjects.Sprite,
    private tilePos: Phaser.Math.Vector2
  ) {
    const offsetX = MainScene.TILE_SIZE / 2;
    const offsetY = MainScene.TILE_SIZE;

    this.sprite.setOrigin(0.5, 1);
    this.sprite.setPosition(
      tilePos.x * MainScene.TILE_SIZE + offsetX,
      tilePos.y * MainScene.TILE_SIZE + offsetY
    );
    this.sprite.setFrame(55);
  }
}