import {Slime} from './slime.js'
import map1 from './map1.js';
import { collisionTile } from './collisionTile.js';

//*DATA
const canvas = document.getElementById('slimerun-game')
const context = canvas.getContext('2d')
resizeCanvas()


let tilesArray = []
let statesArray = [
  {
    type: 'idle',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'jumping',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'falling',
    framesTotal: 4,
    framecount: 0
  },
  {
    type: 'sliding',
    framesTotal: 4,
    framecount: 0
  },
  {
    type: 'moving',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'running',
    framesTotal: 24,
    framecount: 0
  },
]
let playerSquare = 64
let player = new Slime(playerSquare, playerSquare, 0, canvas.height - playerSquare*3, statesArray[2], null)
let playerSpeedX = 12
let playerSpeedY = 6

let tileSize = 64

let gravity = 48
let antigravity = 0

let isGameOn = false

let enemyCollision = true

let playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false,
  crouch: false
}
let opositesVertical = false
let opositesHorizontal = false

//*Methods
function clearCanvas(){
  context.clearRect(0,0,player.width,player.height);
}

function drawPlayer(){
  context.fillStyle = 'black';
  context.fillRect(player.posX,player.posY,player.width,player.height);
}

function resizeCanvas(){
  canvas.width = 768 //window.innerWidth
  canvas.height = 894 //window.innerHeight - 3.0001
}

function drawCanvas(){
  context.beginPath();
  context.fillStyle='rgb(142, 239, 173)';
  context.fillRect(0,0,canvas.width, canvas.height);
}

function drawMap(map){
  /* 
  //*first make the canvas smaller to test drawing outside - done
  //*then make each collision tile, an object from a class, which means create the tile array separate from the drawing process, probably just once even - done
  //*then make the collision detection for them
  //*then implement the buffer approach so that I potentially dont have to redraw everything on every frame
  //*make moving viewport with character across the map
  */
  for (let i = 0; i < tilesArray.length; i++) {
    context.fillStyle='cyan';
    context.fillRect(tilesArray[i].posX, tilesArray[i].posY, tilesArray[i].width, tilesArray[i].height);
  }
}

function gameLoop(){
  if(!isGameOn) return
  clearCanvas()
  updatePlayer()
  drawCanvas()
  drawMap(map1)
  drawPlayer()

  if(!enemyCollision) window.requestAnimationFrame(gameLoop)
}

function updatePlayer(){
  //* set movement variables
  
  opositesVertical = false
  opositesHorizontal = false

  //* increase/decrease vertical movement speeds
  if(player.state.type == 'jumping') gravity -= 4
  if(player.state.type == 'falling') antigravity += 4

  //* if crouch is pressed, halve the horizontal speed
  if(playerMovement.crouch == true) playerSpeedX = 6
  //* if crouch is not pressed, horizontal speed is normal
  if(playerMovement.crouch == false) playerSpeedX = 12

  //* if opposite directions are held, do not try to move
  if(playerMovement.up && playerMovement.down) opositesVertical = true
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true  

  //* make the normal state is falling but not the same falling as from going down on a jump?



  //* horizontal movement
  if(!opositesHorizontal){

    //* Move Right
    if(playerMovement.right){
      if(isPlayerNotInBounds('right')){
        player.posX = canvas.width - player.width
      }else{
        player.posX += playerSpeedX
  
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(player, tilesArray[i])) {
            player.posX = tilesArray[i].posX - tilesArray[i].width  
          }
        }
      }
    }

    //* Move Left
    if(playerMovement.left){
      
      if(isPlayerNotInBounds('left')){
        player.posX = 0
      }else{
        player.posX -= playerSpeedX
  
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(player, tilesArray[i])) {
            player.posX = tilesArray[i].posX + tilesArray[i].width  
          }
        }
      }
      
    }
    
  }

  //* if jump pressed, and not already jumping or falling, jump
  if(playerMovement.jump && player.state.type != 'jumping' && player.state.type != 'falling'){
    player.state = statesArray[1]
    player.state.framecount = 0
  }

  
  if(player.state.type == 'idle'){

    let shoudlBeFalling = false

    player.posY = player.getBorders().down + 32

    for (let i = 0; i < tilesArray.length; i++) {
      if(!newCollisionCheck(player, tilesArray[i]) && player.posY < canvas.height){
        shoudlBeFalling = true
      } else shoudlBeFalling = false
    }
    player.posY -= (player.height + 32)
    if(shoudlBeFalling){
      player.state = statesArray[2]
    }
  }

  //* if in jumping state, but jumping time not passed, keep going up
  if(player.state.type == 'jumping' && player.state.framecount < 12){
    player.posY -= gravity

    for (let i = 0; i < tilesArray.length; i++) {
      if (newCollisionCheck(player, tilesArray[i])) {
        player.posY = tilesArray[i].posY + tilesArray[i].height
        player.state = statesArray[2]
        player.state.framecount = 0
        gravity = 48
      }
    }
    
  }

  //* if in jumping state, and jumping time has passed, stop going up, change state to falling, reset framecount and gravity
  if(player.state.type == 'jumping' && player.state.framecount >= 12){
    player.state = statesArray[2]
    player.state.framecount = 0
    gravity = 48
  }


  //* if on falling state
  if(player.state.type == 'falling'){
    if(isPlayerNotInBounds('down')){
      player.posY = canvas.height - player.height
      player.state = statesArray[0]
      antigravity = 0
      return
    }

    player.posY += antigravity

    for (let i = 0; i < tilesArray.length; i++) {
      if (newCollisionCheck(player, tilesArray[i])) {
        player.posY = tilesArray[i].posY - player.height
        player.state = statesArray[0]
        antigravity = 0
      }
    }
  }

  player.state.framecount++
  
}

function newCollisionCheck(player, tile){
  if(
    player.posX < tile.posX + tile.width &&
    player.posX + player.width > tile.posX &&
    player.posY < tile.posY + tile.height &&
    player.posY + player.height > tile.posY
  )return true
  return false
}

function checkIfShouldBeFalling(){

  let testPlayer = new Slime(player.width,player.height,player.posX,player.posY,'idle',null)

  testPlayer.posY = testPlayer.posY + testPlayer.height+32
  //console.log(testPlayer.posY, testPlayer.getBorders().down);

  for (let i = 0; i < tilesArray.length; i++) {
    if(!newCollisionCheck(testPlayer, tilesArray[i]) && testPlayer.posY < canvas.height){
      return true
    }
  }
}

function isPlayerColliding(){
  let collisions = {
    up: false,
    left: false,
    right: false,
    down: false,
    tiles: []
  }

  for (let i = 0; i < tilesArray.length; i++) {
    //*top border detection
    if(
      player.getBorders().up <= tilesArray[i].getBorders().down &&
      player.getBorders().down >= tilesArray[i].getBorders().down &&
      player.getBorders().left == tilesArray[i].getBorders().left &&
      player.getBorders().right == tilesArray[i].getBorders().right
    ){
      console.log('detection top border');
      collisions.up = true
      collisions.tiles.push(tilesArray[i])
    }

    //*bottom border detection
    if(
      player.getBorders().down <= tilesArray[i].getBorders().down &&
      player.getBorders().down >= tilesArray[i].getBorders().up &&
      player.getBorders().left == tilesArray[i].getBorders().left &&
      player.getBorders().right == tilesArray[i].getBorders().right
    ){
      console.log('detection bottom border');
      collisions.down = true
      collisions.tiles.push(tilesArray[i])
    }
    //*left border detection 
    if (
      player.getBorders().left > tilesArray[i].getBorders().left &&
      player.getBorders().left < tilesArray[i].getBorders().right && 
      player.getBorders().down == tilesArray[i].getBorders().down &&
      player.getBorders().up == tilesArray[i].getBorders().up 
    ) {
      console.log('detection left border');
      collisions.left = true
      collisions.tiles.push(tilesArray[i])
    }
    //*right border detection
    if (
      player.getBorders().down == tilesArray[i].getBorders().down &&
      player.getBorders().up == tilesArray[i].getBorders().up &&
      player.getBorders().right > tilesArray[i].getBorders().left &&
      player.getBorders().right < tilesArray[i].getBorders().right
    ) {
      console.log('detection right border');
      collisions.right = true
      collisions.tiles.push(tilesArray[i])
    }

    //* top right border detection
    if (
      player.getBorders().up <= tilesArray[i].getBorders().down &&
      player.getBorders().down >= tilesArray[i].getBorders().down &&
      player.getBorders().right > tilesArray[i].getBorders().left &&
      player.getBorders().right < tilesArray[i].getBorders().right
    ) {
      console.log('detection top right border');
      collisions.up = true
      collisions.right = true
      collisions.tiles.push(tilesArray[i])
    }

    //* top left border detection
    if (
      player.getBorders().left > tilesArray[i].getBorders().left &&
      player.getBorders().left < tilesArray[i].getBorders().right && 
      player.getBorders().up <= tilesArray[i].getBorders().down &&
      player.getBorders().down >= tilesArray[i].getBorders().down
    ) {
      console.log('detection top left border');
      collisions.up = true
      collisions.left = true
      collisions.tiles.push(tilesArray[i])
    }



    /* 
    &&
      (
        (
          player.getBorders().down == tilesArray[i].getBorders().down &&
          player.getBorders().up == tilesArray[i].getBorders().up
        )
        ||
        (
          player.getBorders().up <= tilesArray[i].getBorders().down &&
          player.getBorders().down >= tilesArray[i].getBorders().down
        )
        ||
        (
          player.getBorders().down >= tilesArray[i].getBorders().up &&
          player.getBorders().up <= tilesArray[i].getBorders().up
        )
      )
    
    */
    
  }  
  return collisions
}

function isPlayerNotInBounds(bound){
  if(bound == 'left'){
    if(player.posX - playerSpeedX <= 0) return true
  }
  if(bound == 'right'){
    if(player.posX + playerSpeedX >= canvas.width - player.width) return true
  }
  if(bound == 'up'){
    if(player.posY - gravity <= 0) return true
  }
  if(bound == 'down'){
    if(player.posY + gravity >= canvas.height - player.height) return true
  }
}

function getCollisionTilesArray(){

  let map = map1

  let arrayIndex = 0
  for (let i = 0; i < map.mapInfo.rows; i++) {
    for (let j = 0; j < map.mapInfo.columns; j++) {
      if(map.mapInfo.tiles[arrayIndex] == 1){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i)
        tilesArray.push(tile)
      }    
      arrayIndex++      
    }
  }
}

//*Watch
menu_button_start.addEventListener('click', () => {
  main_menu.classList.add('closed')
  isGameOn = !isGameOn
  enemyCollision = !enemyCollision
  window.requestAnimationFrame(gameLoop)
})

/* game_state.addEventListener('click', () => {
  isGameOn = !isGameOn
  enemyCollision = !enemyCollision
  window.requestAnimationFrame(gameLoop)
}) */

document.addEventListener('keydown', (key) => {
  if(key.code == "Escape"){
    if(pause_menu.classList.contains('closed')){
      pause_menu.classList.remove('closed')
      isGameOn = false
    }else{
      pause_menu.classList.add('closed')
      isGameOn = true
      window.requestAnimationFrame(gameLoop)
    }
  }
  
  if(key.code == "ShiftLeft"){
    key.preventDefault()
    playerMovement.crouch = true
  }
  
  if(key.code == "KeyS") playerMovement.down = true

  if(key.code == "KeyW") playerMovement.up = false

  if(key.code == "KeyD") playerMovement.right = true

  if(key.code == "KeyA") playerMovement.left = true

  if(key.code == 'Space') playerMovement.jump = true;
})

document.addEventListener('keyup', (key) => {

  if(key.code == "ShiftLeft"){
    key.preventDefault()
    playerMovement.crouch = false
  }

  if(key.code == "KeyS") playerMovement.down = false

  if(key.code == "KeyW") playerMovement.up = false

  if(key.code == "KeyD") playerMovement.right = false

  if(key.code == "KeyA") playerMovement.left = false

  if(key.code == 'Space') playerMovement.jump = false;
})

window.addEventListener('resize', () => {
  //resizeCanvas()
})

//*Run
getCollisionTilesArray()
//resizeCanvas()
clearCanvas()
drawPlayer()

