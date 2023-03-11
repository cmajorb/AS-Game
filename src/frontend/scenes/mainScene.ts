import io from 'socket.io-client'
import { Player } from '../objects/player'

function addPlayer(self, playerInfo, camera) {
  self.player = new Player(self, playerInfo);
  camera.startFollow(self.player);
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
  player: Player

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
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
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
      this.target.x = pointer.x + camera.worldView.x;
      this.target.y = pointer.y + camera.worldView.y;
      this.physics.moveToObject(this.player, this.target, 300);
    });

    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
  }

  update() {
    if (this.player && this.player.body instanceof Phaser.Physics.Arcade.Body) {
      if (this.player.body.speed > 0) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
        if (d < 10) {
          this.player.body.reset(this.target.x, this.target.y);
        }
      }
      if (this.player.hasMoved()) {
        this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y });
      }
      this.player.oldPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    }
  }
}
