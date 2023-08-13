import 'phaser'
import MainScene from './scenes/mainScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  dom: {
    createContainer: true
},
  scene: [MainScene]
}

window.addEventListener('load', () => {
  let game = new Phaser.Game(config)
})
