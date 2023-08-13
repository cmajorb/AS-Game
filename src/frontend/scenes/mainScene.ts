import io from 'socket.io-client'
import { Player } from '../objects/player'
import { GameState } from '../../types'

function createRoomSelect(self) {
  const screenCenterX = self.cameras.main.worldView.x + self.cameras.main.width / 2;
  const screenCenterY = self.cameras.main.worldView.y + self.cameras.main.height / 2;

    const roomSelect = self.add.dom(screenCenterX, screenCenterY).createFromCache('roomselect');
    roomSelect.addListener('click');
    roomSelect.on('click', function (this: any, event)
        {
            if (event.target.name === 'submitButton')
            {
                const selectedRoom = this.getChildByName('roomSelect');
                if (selectedRoom.value !== '')
                {
                    this.removeListener('click');
                    this.destroy();
                    self.transporting = false;
                    console.log(selectedRoom.value);
                    if(selectedRoom.value != self.state.world) {
                      self.socket.emit('newScene', {currentWorld: self.state.world, destinationWorld: selectedRoom.value});
                    }
                }
            } else if(event.target.name === 'cancelButton') {
              self.transporting = false;
              this.destroy();
            }
        });
}
function addPlayer(self, playerInfo) {
  self.player = new Player(self, playerInfo);
  self.cameras.main.startFollow(self.player);
}
function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, playerInfo.type).setOrigin(0.5, 0.5).setDisplaySize(MainScene.PLAYER_SIZE, MainScene.PLAYER_SIZE);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
  // self.physics.add.collider(self.player, otherPlayer);

}
function collisionCallback (obj1, obj2) {
  obj1.setDrag(500);
}

function addItems(self, state) {
  Object.keys(state.items).forEach(function (id) {
    let item = state.items[id];
    self.add.sprite(item.x, item.y, item.type).setDisplaySize(MainScene.PLAYER_SIZE, MainScene.PLAYER_SIZE);
  });
}

export default class MainScene extends Phaser.Scene {

  static readonly TILE_SIZE = 33;
  static readonly PLAYER_SIZE = 50;
  otherPlayers: any
  socket: SocketIOClient.Socket
  target: Phaser.Math.Vector2
  player: Player
  state: GameState
  transporting: boolean
  world: string
  groundLayer: any

  constructor() {
    super('MainScene')
    this.state = {
      playerList: {},
      items: {},
      creatures: {},
      world: ""
    };
    var self = this;
    this.socket = io();
    this.socket.on('setState', function (gameState) {
      self.state = gameState;
      addItems(self, gameState);
      addPlayer(self, gameState.playerList[self.socket.id]);
      self.physics.add.collider(self.player, self.groundLayer, function(obj1, obj2){ collisionCallback(obj1, obj2);
        if(!self.transporting) {
          self.transporting = true;
          createRoomSelect(self);
        }
      });

      Object.keys(gameState.playerList).forEach(function (id) {
        if (gameState.playerList[id].playerId !== self.socket.id) {
          addOtherPlayers(self, gameState.playerList[id]);
        }
      });
    });
    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    });

    this.socket.on('changeScene', function (data) {
      self.scene.restart({world: data.world});
    });

    this.socket.on('player_disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });

    this.socket.on('publishMessage', function (data) {
      const messages = document.getElementById('allmessages');
      messages!.innerHTML =  "<br>" + data.sender + ": " + data.message + messages!.innerHTML;
    });

    const form = document.getElementById('sendmessage');
    form?.addEventListener('submit', function handleClick(e) {
      e.preventDefault();
      const input = document.getElementById('message') as HTMLInputElement | null;
      self.socket.emit('sendMessage', {message: input?.value, world: self.state.world});
      input!.value = "";
    });

  }

  init(data: any) { 
    if(data.world) {
      this.world = data.world
    } else {
      this.world = "mainWorld"
    }
  }
  preload() {
    this.load.image('alien1', 'assets/culug.png');
    this.load.image('alien2', 'assets/pufcat.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image("tiles", "assets/tilesets/example_tileset.png");
    this.load.tilemapTiledJSON(this.world, "assets/tilesets/" + this.world + ".json");
    this.load.html('roomselect', 'assets/text/roomselect.html');
  }

  create() {
    const map = this.make.tilemap({ key: this.world, tileWidth: MainScene.TILE_SIZE, tileHeight: MainScene.TILE_SIZE });
    const tileset = map.addTilesetImage("example_tileset", "tiles");
    this.groundLayer = map.createLayer(0, tileset, 0, 0);

    map.setCollisionByProperty({ collides: true });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    this.socket.emit('startWorld', {world: this.world})
    this.otherPlayers = this.physics.add.group();
    this.transporting = false;

    this.target = new Phaser.Math.Vector2();

    this.input.on('pointerup', (pointer) => {
      if(!this.transporting) {
        this.target.x = pointer.x + this.cameras.main.worldView.x;
        this.target.y = pointer.y + this.cameras.main.worldView.y;
        this.player.setDrag(0);
        this.physics.moveToObject(this.player, this.target, 300);
      }
    });

  }

  update() {
    if (this.player && this.player.body instanceof Phaser.Physics.Arcade.Body && !this.transporting) {
      if (this.player.body.speed > 0) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
        if (d < 10) {
          this.player.body.reset(this.target.x, this.target.y);
        }
      }
      if (this.player.hasMoved()) {
        this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, world: this.state.world });
      }
      this.player.oldPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    }
  }
}
