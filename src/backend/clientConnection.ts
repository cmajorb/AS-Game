import { Game } from 'phaser';
import { PlayerType, Item, GameState, GameStates } from '../types'

export function clientConnection(io: any) {
  let worlds = ["mainWorld", "testWorld"];
  const allGameStates: GameStates = {allGameStates: {}};
  for (let world of worlds) {
    let newWorld = { playerList: {}, items: {}, creatures: {}, world : world} as GameState ;
    allGameStates.allGameStates[world] = newWorld;
  }
  console.log(allGameStates);
  // const gameState = { playerList: {}, items: {}, creatures: {}, world : "mainWorld" } as GameState ;

  io.on('connection', function (socket) {
    let startWorld = worlds[0];
    console.log('a user connected');
    socket.join(startWorld);
    let newPlayer = {
      playerId: socket.id,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      type: (Math.floor(Math.random() * 2) == 0) ? 'alien1' : 'alien2',
      health: 3,
      money: 0,
      name: "bob",
      inventory: []
    } as PlayerType;
    allGameStates.allGameStates[startWorld].playerList[socket.id] = newPlayer;

    let coin = {
      id: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      type: "coin",
      quantity: 1
    } as Item
    allGameStates.allGameStates[startWorld].items[coin.id] = coin;
    // send the players object to the new player
    // socket.emit('currentPlayers', gameState.playerList);

    // update all other players of the new player
    socket.to(startWorld).emit('newPlayer', allGameStates.allGameStates[startWorld].playerList[socket.id]);
    // GameCommunication(io, socket, currentUsers)  

    //remove the users data when they disconnect.
    socket.on('disconnect', function () {
      console.log('user disconnected');

      // remove this player from our players object
      delete allGameStates.allGameStates[startWorld].playerList[socket.id];
      // emit a message to all players to remove this player
      io.emit('player_disconnect', socket.id);
    });

    socket.on('startWorld', function (data) {
      console.log("SENDING STATE");
      socket.emit('setState', allGameStates.allGameStates[data.world]);
    });

    socket.on('sendMessage', function (data) {
      let world = data.world;
      let player = allGameStates.allGameStates[world].playerList[socket.id];
      socket.to(world).emit('publishMessage', {"message" : data.message, "sender" : player.name});
      socket.emit('publishMessage', {"message" : data.message, "sender" : player.name});
    });
    
    socket.on('playerMovement', function (movementData) {
      let world = movementData.world
   
      allGameStates.allGameStates[world].playerList[socket.id].x = movementData.x;
      allGameStates.allGameStates[world].playerList[socket.id].y = movementData.y;
      // emit a message to all players about the player that moved
      socket.to(world).emit('playerMoved', allGameStates.allGameStates[world].playerList[socket.id]);
    });

    socket.on('newScene', function (travelInfo) {
      //change rooms
      let currentworld = travelInfo.currentWorld;
      let newWorld = travelInfo.destinationWorld;
      socket.leave(currentworld);
      socket.join(newWorld);
      socket.emit('changeScene', {world: newWorld});
      socket.to(currentworld).emit('player_disconnect', socket.id);
      let player = allGameStates.allGameStates[currentworld].playerList[socket.id];
      allGameStates.allGameStates[newWorld].playerList[socket.id] = player;
      delete allGameStates.allGameStates[currentworld].playerList[socket.id];
      console.log(socket.rooms);
      
      socket.to(newWorld).emit('newPlayer', allGameStates.allGameStates[newWorld].playerList[socket.id]);
    });

  })
}


