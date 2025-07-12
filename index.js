//TODO IMPLEMENT CROUCHING CORRECTLY THEN YOU CAN IMPLEMENT SLIDING AND HIGH JUMP, AFTER THOSE ARE DONE, THEN IMPLEMENT WALK STICK
//TODo Bug, while jumping, crouch speed reduction should not apply

import {Slime} from './slime.js'
import map1 from './map1.js';
import { collisionTile } from './collisionTile.js';

//*DATA
const canvas = document.getElementById('slimerun-game')
const context = canvas.getContext('2d')

let playerLength = 64
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
    framesTotal: 12,
    framecount: 0
  },
  {
    type: 'falling',
    framesTotal: 4,
    framecount: 0
  },
  {
    type: 'walking',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'running',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'crouching',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'landing',
    framesTotal: 2,
    framecount: 0
  },
  {
    type: 'bonk',
    framesTotal: 2,
    framecount: 0
  },
  {
    type: 'crouchwalk',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'sliding',
    framesTotal: 8,
    framecount: 0
  },
]

console.log(canvas.height);
let player = new Slime(playerLength, playerLength, 0, canvas.height - playerLength*8, statesArray[0], null)
let playerSpeedX = 8
let cameraFallingSpeed = 28
let cameraJumpingSpeed = 16

let tileSize = 64

let risingSpeed = 48
let fallingSpeed = 0

let isGameOn = false

let enemyCollision = true

let playerMovement = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  run: false
}
let opositesHorizontal = false

const camera = {
  get posX () {
    return -(canvas.width / 4 - player.posX)
  },
  get posY () {
    return -(canvas.height / 4 - player.posY)
  },
}

let movingTo = {
  up: false,
  down: false,
  left: false,
  right: false
}



//*Methods

function gameLoop(){
  if(!isGameOn) return
  clearCanvas()
  updatePlayer()
  drawCanvas()
  drawMap()
  drawCamera()
  drawPlayer()

  if(!enemyCollision) window.requestAnimationFrame(gameLoop)
}

function clearCanvas(){
  context.clearRect(0,0,player.width,player.height);
}

function drawPlayer(){
  /* context.fillStyle = 'white';
  context.fillRect(player.posX - 32,player.posY,player.width,player.height);
  context.fillRect(player.posX,player.posY,player.width + 32,player.height);
  context.fillRect(player.posX,player.posY,player.width,player.height + 32);
  context.fillRect(player.posX,player.posY - 32,player.width,player.height); */

  /* if(player.state.type == 'crouching'){
    context.fillStyle = 'white';
    context.fillRect(player.posX,player.posY + player.height/2,player.width,player.height/2);
  }else */{
    context.fillStyle = 'black';
    context.fillRect(player.posX,player.posY,player.width,player.height);
  }
  

}

function resizeCanvas(){
  let width = Math.ceil(window.innerWidth/64)*64 
  let height = Math.ceil(window.innerHeight/64)*64
  canvas.width = width 
  canvas.height =  height - playerLength*3
}

function drawCamera(){
  context.strokeStyle='red';
  context.strokeRect(camera.posX + player.width/2, camera.posY, canvas.width/2, canvas.height/1.5);
  context.fillRect(camera.posX, camera.posY, 64, 64)
}

function drawCanvas(){
  context.beginPath();
  context.fillStyle='rgb(142, 239, 173)';
  context.fillRect(0,0,canvas.width, canvas.height);
}

function drawMap(){
  /*
  ^ first make the canvas smaller to test drawing outside - done
  ^ then make each collision tile, an object from a class, which means create the tile array separate from the drawing process, probably just once even - done
  ^ then make the collision detection for them - done
  TODO then implement the buffer approach so that I potentially dont have to redraw everything on every frame - for later
  ^ make moving viewport with character across the map - done
  */  


  movingTo = {
    up: false,
    down: false,
    left: false,
    right: false
  }

  //* if viewport is past right canvas border
  if(camera.posX + (canvas.width/2) + (player.width/2) > canvas.width){
    movingTo.right = true
  }

  //* if viewport is past top canvas border
  if(camera.posY < 0){
    movingTo.up = true
  }

  if(camera.posX + player.width/2 < 0){
    //movingTo.left = true
  }

  //* if viewport is past bottom canvas border
  let isTilesBelow = false
  if(camera.posY + (canvas.height/1.5) > canvas.height){
    movingTo.down = true

    for (let i = 0; i < tilesArray.length; i++) {
      if(tilesArray[i].posY + tilesArray[i].height > camera.posY + canvas.height/1.5){
        isTilesBelow = true
        //console.log("there's a tile below");
        break
      }
      
    }

  }

  
  for (let i = 0; i < tilesArray.length; i++) {
    

    /* if(movingTo.right && playerMovement.right){
      tilesArray[i].posX -= playerSpeedX
    }
    if(movingTo.left && playerMovement.left){
      tilesArray[i].posX += playerSpeedX
    }

    if(movingTo.up && player.state.type == 'jumping'){
      tilesArray[i].posY += cameraJumpingSpeed/1.5
    }

    if(movingTo.down && player.state.type == 'falling' && isTilesBelow){
      tilesArray[i].posY -= cameraFallingSpeed*1.25
    } */


    context.fillStyle='teal';
    if(tilesArray[i].height < playerLength) context.fillStyle='white';
    if(tilesArray[i].height > playerLength) context.fillStyle='red';

    context.fillRect(tilesArray[i].posX, tilesArray[i].posY, tilesArray[i].width, tilesArray[i].height);
  }
}

function updatePlayer(){
  opositesHorizontal = false

  //* increase/decrease vertical movement speeds if needed
  if(player.state.type == 'jumping') risingSpeed -= 4
  if(player.state.type == 'falling' && fallingSpeed < 32) {
    fallingSpeed += 4
  }
  
   /* {
    if (fallingSpeed < 40) {
      cameraFallingSpeed += 4
      
    }
  } */

  if(!playerMovement.left && !playerMovement.right && !playerMovement.jump && !playerMovement.crouch && !playerMovement.run){
    if(
      player.state.type != 'falling' && player.state.type != 'jumping' && player.state.type != 'landing' && player.state.type != 'bonk'
    ){
      player.state = statesArray[0]
      player.state.framecount = 0
    }
  }

  //* if crouch is pressed, decrease the horizontal speed
  if(playerMovement.crouch && !playerMovement.run){
    if(!player.state.type != 'jumping') playerSpeedX = 3
    else playerSpeedX = 6
  }

  //* if run is pressed, increase the horizontal speed
  if(playerMovement.run && !playerMovement.crouch) playerSpeedX = 12
  
  //* if crouch or run are not pressed, horizontal speed is normal
  if(!playerMovement.crouch && !playerMovement.run) playerSpeedX = 6
  
  //* if opposite directions are held, do not try to move
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true


  //* horizontal movement
  if(!opositesHorizontal){

    if (player.state.type == 'idle' && !playerMovement.run && !playerMovement.crouch && (playerMovement.left || playerMovement.right)) {
      player.state = statesArray[3]
      player.state.framecount = 0
    }
    if (player.state.type == 'idle' && playerMovement.run && !playerMovement.crouch){
      player.state = statesArray[4]
      player.state.framecount = 0
    }

    if ((player.state.type == 'idle' || player.state.type == 'crouchwalk') && !playerMovement.run && playerMovement.crouch){
      player.state = statesArray[5]
      player.state.framecount = 0
    }

    if (playerMovement.run && playerMovement.crouch){
      playerMovement.run = false
      playerMovement.crouch = false
      player.state = statesArray[0]
      player.state.framecount = 0
    }

    //* Move Right
    if(playerMovement.right && player.state.type != 'landing' && player.state.type != 'bonk'){
      if(!isPlayerNotInBounds('right')){

        player.posX += playerSpeedX

        if(player.state.type == 'crouching'){
          player.state = statesArray[8]
          player.state.framecount = 0
        }
        
        //*If there is a collision tile to the right, correct player position
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(player, tilesArray[i])) {
            player.posX = tilesArray[i].posX - tilesArray[i].width  
          }
        }

        /* //* if viewport goes to the right, change the player position relative to the map movement
        if(movingTo.right){
          player.posX -= playerSpeedX
        } */

      }else player.posX = canvas.width - player.width
    }

    //* Move Left
    if(playerMovement.left  && player.state.type != 'landing' && player.state.type != 'bonk'){

      if(!isPlayerNotInBounds('left')){
        
        player.posX -= playerSpeedX

        if(player.state.type == 'crouching'){
          player.state = statesArray[8]
          player.state.framecount = 0
        }
  
        //*If there is a collision tile to the left, correct player position
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(player, tilesArray[i])) {
            player.posX = tilesArray[i].posX + tilesArray[i].width  
          }
        }
  
        //* if viewport goes to the left, change the player position relative to the map movement
        if(movingTo.left){
          player.posX += playerSpeedX
        }

      }else player.posX = 0
      
    }
    
  }
  //console.log('what the dog doin? >>: ', player.state.type);
  //* if jump pressed, and not already jumping or falling, jump
  if(playerMovement.jump && player.state.type != 'jumping' && player.state.type != 'falling' && player.state.type != 'landing' && player.state.type != 'bonk'){
    player.state = statesArray[1]
    player.state.framecount = 0
  }

  //* if player is not touching a tile, and inside the canvas, fall by gravity
  fallIfAirBorne()

  //* if in jumping state - if rising time has not ended, keep rising
  if(player.state.type == 'jumping' && player.state.framecount < player.state.framesTotal){

    player.posY -= risingSpeed

    //* check for collision while rising, if collided, go into bonk(head collision) state
    for (let i = 0; i < tilesArray.length; i++) {
      if (newCollisionCheck(player, tilesArray[i])) {
        player.posY = tilesArray[i].posY + tilesArray[i].height
        player.state = statesArray[7]
        player.state.framecount = 0
        risingSpeed = 48
        break
      }
    }
  }

  //* if in jumping state - if rising time has ended, start falling
  if(player.state.type == 'jumping' && player.state.framecount >= player.state.framesTotal){
    player.state = statesArray[2]
    player.state.framecount = 0
    risingSpeed = 48
  }

  //* if in bonk state (head collision), after x frames, start falling
  if(player.state.type == 'bonk'){
    if(player.state.framecount < player.state.framesTotal) console.log('bonking');
    if(player.state.framecount >= player.state.framesTotal){
      player.state = statesArray[2]
      player.state.framecount = 0
    }
  }

  //* if on falling state, move down
  if(player.state.type == 'falling'){

    let landed = false

    player.posY += fallingSpeed

    if(isPlayerNotInBounds('down')){
      player.posY = canvas.height - player.height
      player.state = statesArray[6]
      player.state.framecount = 0
      risingSpeed = 48
      fallingSpeed = 0
    }

    for (let i = 0; i < tilesArray.length; i++) {
      if (newCollisionCheck(player, tilesArray[i])) {
        player.posY = tilesArray[i].posY - player.height
        landed = true
      }
    }
    
    if(landed){
      player.state = statesArray[6]
      player.state.framecount = 0
      risingSpeed = 48
      fallingSpeed = 0
    }

  }

  //* if in landing state, count landing frames and change state if needed
  if(player.state.type == 'landing'){
    if(player.state.framecount < player.state.framesTotal){
      console.log('landing lag');
      //* check frame and do animation, not needed for functionality right now
    }
    if(player.state.framecount >= player.state.framesTotal){
      console.log('landed');
      player.state = statesArray[0]
      player.state.framecount = 0
    }

  }

  //* if crouching, reduce size to half  
  if((player.state.type == 'crouching' || player.state.type == 'crouchwalk') && playerMovement.crouch && player.height > playerLength/2){
    if(playerMovement.crouch){
      player.posY += player.height/2
      player.height = player.height / 2
    }
  }

  //* if size reduced and not crouching, set size to normal
  if(!playerMovement.crouch && player.height < playerLength){

      let isUnderTile = false

      player.height = playerLength
      player.posY -= playerLength/2

      for (let i = 0; i < tilesArray.length; i++){
        if(newCollisionCheck(player, tilesArray[i])){
          isUnderTile = true
        }
      }

      if(isUnderTile){
        player.height = playerLength/2
        player.posY += playerLength/2
      }
  }

  //*
  if(player.state.type == 'walking' && playerMovement.crouch){
    player.state = statesArray[8]
    player.state.framecount = 0
  }


  //* if crouching, not moving, and pressed jump after x frames, do a higher jump
  if(player.state.type == 'crouching' && player.state.framecount > player.state.framesTotal/2){

    risingSpeed = 64

    if(playerMovement.jump){
      risingSpeed = 64
      player.state = statesArray[1]
      player.state.framecount = 0
    }
  }


  //* if running, then pressed crouch, change into a slide, which boost speed and reduces height

  //console.log(player.state.type, ': ',player.state.framecount);
  console.log(player.state.type)
  player.state.framecount++
}

function fallIfAirBorne(){
  if((player.state.type == 'idle' || player.state.type == 'walking' || player.state.type == 'crouching' || player.state.type == 'crouchwalk'  || player.state.type == 'running') && player.state.type != 'bonk'){

    let isAirBorne = true
    //let noCollisionCount = 0

    player.posY += player.height/2
    for (let i = 0; i < tilesArray.length; i++){
      if(newCollisionCheck(player, tilesArray[i])){
        isAirBorne = false
      }//else noCollisionCount++
    }
    if(isPlayerNotInBounds('down')) isAirBorne = false

    player.posY -= player.height/2

    /* if (noCollisionCount < tilesArray.length) {
      console.log(noCollisionCount, tilesArray.length);
      if(playerMovement.left || playerMovement.right) player.state = statesArray[3]
      else player.state = statesArray[0]
      console.log(player.state.type, 'aksjdf');
    } */
    
    if(isAirBorne){
      player.state = statesArray[2]
      player.state.framecount = 0
    }

    //! FUNCTIONAL BUG, DOESN'T BREAK ANYTHING YET; BUT IT IS HERE
    //^ it does detect going from walking on a collision to being airborne and changing to falling, but doesn't change back to walking when moved back on top of a tile - this bug  should not necessary to fix as you should fall and go through landing to walk again, not walk directly from falling

  }
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

function isPlayerNotInBounds(bound){
  if(bound == 'left'){
    if(player.posX <= 0) return true
  }
  if(bound == 'right'){
    if(player.posX >= canvas.width - player.width) return true
  }
  if(bound == 'up'){
    if(player.posY <= 0) return true
  }
  if(bound == 'down'){
    if(player.posY >= canvas.height - player.height) return true
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

      if(map.mapInfo.tiles[arrayIndex] == 2){
        let tile = new collisionTile(tileSize, tileSize/2, tileSize*j, tileSize*i)
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
  
  if(key.code == "ControlLeft"){
    key.preventDefault()
    playerMovement.crouch = true
  }

  if(key.code == "ShiftLeft"){
    key.preventDefault()
    playerMovement.run = true
  }

  if(key.code == "ArrowRight") playerMovement.right = true

  if(key.code == "ArrowLeft") playerMovement.left = true

  if(key.code == 'Space') playerMovement.jump = true;

})

document.addEventListener('keyup', (key) => {

  if(key.code == "ControlLeft"){
    key.preventDefault()
    playerMovement.crouch = false
  }

  if(key.code == "ShiftLeft"){
    key.preventDefault()
    playerMovement.run = false
  }

  if(key.code == "ArrowRight") playerMovement.right = false

  if(key.code == "ArrowLeft") playerMovement.left = false

  if(key.code == 'Space') playerMovement.jump = false;

})

window.addEventListener('resize', () => {
  resizeCanvas()
})

//*Run
getCollisionTilesArray()
//resizeCanvas()
clearCanvas()
drawPlayer()

