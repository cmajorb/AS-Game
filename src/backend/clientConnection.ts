// import {GameCommunication} from './gameComm'
import Phaser from 'phaser'

interface UserData {
  playerId: string,
  x: number,
  y:number,
  type: string,
  health: number
}

export function clientConnection(io: any) {

  let currentUsers: { [key: string]: UserData } = {};
  
  io.on('connection', function (socket) {
    console.log('a user connected');
    currentUsers[socket.id] = {
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      type: (Math.floor(Math.random() * 2) == 0) ? 'alien1' : 'alien2',
      health: 3
    };
    // send the players object to the new player
  socket.emit('currentPlayers', currentUsers);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', currentUsers[socket.id]);
    // GameCommunication(io, socket, currentUsers)  
    
    //remove the users data when they disconnect.
    socket.on('disconnect', function () {
      console.log('user disconnected');

    // remove this player from our players object
    delete currentUsers[socket.id];
    // emit a message to all players to remove this player
    io.emit('player_disconnect', socket.id);
    });

    socket.on('playerMovement', function (movementData) {
      currentUsers[socket.id].x = movementData.x;
      currentUsers[socket.id].y = movementData.y;
      // emit a message to all players about the player that moved
      socket.broadcast.emit('playerMoved', currentUsers[socket.id]);
    });

  })
  }


 