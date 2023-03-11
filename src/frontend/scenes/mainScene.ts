import io from 'socket.io-client'
import { Player } from '../objects/player'

function addPlayer(self, playerInfo, camera) {
  self.currentPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, playerInfo.type).setOrigin(0.5, 0.5).setDisplaySize(MainScene.PLAYER_SIZE, MainScene.PLAYER_SIZE);
  const player = new Player(self.currentPlayer, new Phaser.Math.Vector2(6, 6));
  camera.startFollow(self.currentPlayer);

  self.currentPlayer.setMaxVelocity(300);
}
function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, playerInfo.type).setOrigin(0.5, 0.5).setDisplaySize(MainScene.PLAYER_SIZE, MainScene.PLAYER_SIZE);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

export default class MainScene extends Phaser.Scene {
 
  static readonly TILE_SIZE = 33;
  static readonly PLAYER_SIZE = 50;
  otherPlayers: any
  socket: SocketIOClient.Socket
  target: Phaser.Math.Vector2
  currentPlayer: any

    constructor() {
    super('MainScene')
  }

  init(data: any) { }
  preload() {
    this.load.image('alien1', 'assets/culug.png');
    this.load.image('alien2', 'assets/pufcat.png');
    this.load.image("tiles", "assets/tilesets/example_tileset.png");
    this.load.tilemapCSV("map", "assets/mainmap.csv");
  }

  create() {

    const map = this.make.tilemap({ key: "map", tileWidth: MainScene.TILE_SIZE, tileHeight: MainScene.TILE_SIZE });
    const tileset = map.addTilesetImage("tiles");
    const groundLayer = map.createLayer(0, tileset, 0, 0);


    const camera = this.cameras.main;
    camera.setBounds(0,0, map.widthInPixels, map.heightInPixels);

    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        console.log(id);
        console.log(players[id]);
        if (players[id].playerId === self.socket.id) {
          addPlayer(self, players[id], camera);
        } else {
          addOtherPlayers(self, players[id]);
        }
      });
    });
    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    });
    this.socket.on('player_disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });


    this.target = new Phaser.Math.Vector2();

    this.input.on('pointerup', (pointer) => {
      console.log("click");

      this.target.x = pointer.x + camera.worldView.x;
      this.target.y = pointer.y + camera.worldView.y + MainScene.PLAYER_SIZE/2;
      
      // Start moving our cat towards the target
      this.physics.moveToObject(this.currentPlayer, this.target, 300);
    });

    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setRotation(playerInfo.rotation);
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });   
  }

  update(){
    if (this.currentPlayer) {
      if (this.currentPlayer.body.speed > 0) {
        // Calculate it's distance to the target
        const d = Phaser.Math.Distance.Between(this.currentPlayer.x, this.currentPlayer.y, this.target.x, this.target.y);

        // If it's close enough,
        if (d < 10) {
          // Reset it's body so it stops, hide our arrow
          this.currentPlayer.body.reset(this.target.x, this.target.y);
        }
      }
      // this.physics.world.wrap(this.ship, 5);

      var x = this.currentPlayer.x;
      var y = this.currentPlayer.y;
      var r = this.currentPlayer.rotation;
      if (this.currentPlayer.oldPosition && (x !== this.currentPlayer.oldPosition.x || y !== this.currentPlayer.oldPosition.y || r !== this.currentPlayer.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.currentPlayer.x, y: this.currentPlayer.y, rotation: this.currentPlayer.rotation });
      }
      // save old position data
      this.currentPlayer.oldPosition = {
        x: this.currentPlayer.x,
        y: this.currentPlayer.y,
        rotation: this.currentPlayer.rotation
      };
    }
    
  }

}
