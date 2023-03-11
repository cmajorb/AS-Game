import 'phaser'
import MainScene from './scenes/mainScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [MainScene]
}

window.addEventListener('load', () => {
  let game = new Phaser.Game(config)
})
