//TODO IMPLEMENT IMPLEMENT SLIDING, AFTER THOSE ARE DONE, THEN IMPLEMENT WALK STICK
//TODo Bug, while jumping, crouch speed reduction should not apply
//TODO Bug, while crouching and under a half tile, jump should not be processed,
//TODO bug, while crouching under a half tile, crouchinh should be the state even if crouch is not pressed
//TODO bug, if under a any size tile, jumping should not cause falling, bonk, or landing states, but instead keep it as idle or any moving state after the jump
//TODO Refactor, change most conditionals in updatePlayer to be their own function to better control the amount of calculations done

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
    name: 'idle',
    framesTotal: 24,
    framecount: 0
  },
  {
    name: 'jumping',
    framesTotal: 12,
    framecount: 0
  },
  {
    name: 'falling',
    framesTotal: 4,
    framecount: 0
  },
  {
    name: 'walking',
    framesTotal: 24,
    framecount: 0
  },
  {
    name: 'running',
    framesTotal: 24,
    framecount: 0
  },
  {
    name: 'crouching',
    framesTotal: 24,
    framecount: 0,
    isCrouching: true
  },
  {
    name: 'landing',
    framesTotal: 2,
    framecount: 0
  },
  {
    name: 'bonk',
    framesTotal: 2,
    framecount: 0
  },
  {
    name: 'crouchwalk',
    framesTotal: 24,
    framecount: 0,
    isCrouching: true
  },
  {
    name: 'sliding',
    framesTotal: 8,
    framecount: 0
  },
]
let player = new Slime(playerLength, playerLength, 0, canvas.height - playerLength*8, statesArray[0], null)
let playerSpeedX = 6
let playerCrouchSpeed = 3
let playerWalkSpeed = 6
let playerRunSpeed = 12
let cameraFallingSpeed = 28
let cameraJumpingSpeed = 16

let globalFrameCounter = 0
let stateFrameCount = 0

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
let isUnderTile = false

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

let collisionTester = null

let canMoveHorizontal = true

let fps = 60
let fpsInterval
let startTime
let now
let then
let elapsed

//*Methods

function startAnimating(){
  fpsInterval = 1000 / fps
  then = performance.now()
  startTime = then
  gameLoop()
}


function gameLoop(){


  if(!isGameOn) return

  window.requestAnimationFrame(gameLoop)

  now = performance.now()
  elapsed = now - then

  if(elapsed > fpsInterval){
    then = now - (elapsed % fpsInterval)

    clearCanvas()
    updatePlayer()
    drawCanvas()
    drawMap()
    drawCamera()
    drawPlayer()
    globalFrameCounter++
  }

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

  /* if(player.state.name == 'crouching'){
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

    if(movingTo.up && player.state.name == 'jumping'){
      tilesArray[i].posY += cameraJumpingSpeed/1.5
    }

    if(movingTo.down && player.state.name == 'falling' && isTilesBelow){
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
  if(player.state.name == 'jumping') risingSpeed -= 4
  if(player.state.name == 'falling' && fallingSpeed < 32) fallingSpeed += 4

  //* get if player is under any name of collision tile
  isUnderTile = isPlayerUnderTile()

  //* if player is not moving at all, it is idle
  if(!playerMovement.left && !playerMovement.right && !playerMovement.jump && !playerMovement.crouch && !playerMovement.run && player.state.name != 'falling' && player.state.name != 'jumping' && player.state.name != 'landing' && player.state.name != 'bonk' && player.state.name != 'idle' && (!isUnderTile)){
    setState('idle')
    stateFrameCount = 0
  }
  
  //* if crouch is pressed, decrease the horizontal speed
  if(playerMovement.crouch && !playerMovement.run){
    if(!player.state.name != 'jumping') playerSpeedX = playerCrouchSpeed
    else playerSpeedX = playerWalkSpeed
  }

  //* if run is pressed, increase the horizontal speed
  if(playerMovement.run && !playerMovement.crouch) playerSpeedX = playerRunSpeed
  
  //* if crouch or run are not pressed, horizontal speed is normal
  if(!playerMovement.crouch && !playerMovement.run) playerSpeedX = playerWalkSpeed
  
  //* if opposite directions are held, do not try to move
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true

  //* horizontal movement
  if(!opositesHorizontal){

    //* Move Right
    if(playerMovement.right && player.state.name != 'landing' && player.state.name != 'bonk'){
      if(!isPlayerNotInBounds('right')){

        player.posX += playerSpeedX

        if(player.state.name == 'crouching'){
          player.state = statesArray[8]
          stateFrameCount = 0
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
    if(playerMovement.left  && player.state.name != 'landing' && player.state.name != 'bonk'){

      if(!isPlayerNotInBounds('left')){
        
        player.posX -= playerSpeedX

        if(player.state.name == 'crouching'){
          player.state = statesArray[8]
          stateFrameCount = 0
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

  switch (player.state.name) {
    case 'idle':
      //^ check if player can move, which means there is no collision on either side, then set the move state

      //* all horizontal movement occurs only if both directions are NOT pressed at the same time
      if(!opositesHorizontal && (playerMovement.left || playerMovement.right)){
        
        //*Walk conditional
        if(!playerMovement.run && !playerMovement.crouch){
          setState('walking')
        }
        //*Run conditional
        if (playerMovement.run && !playerMovement.crouch){
          setState('running')
        }
        //*Crouchwalk conditional
        if (!playerMovement.run && playerMovement.crouch){
          setState('crouchwalk')
        }
        //* if crouch and run are pressed, player is walking
        if (playerMovement.run && playerMovement.crouch){
          playerMovement.run = false
          playerMovement.crouch = false
          setState['walking']
        }
      }
      if((opositesHorizontal || !playerMovement.left && !playerMovement.right) && playerMovement.crouch && !playerMovement.run){
        setState('crouching')
      }

      
      break;
    case 'jumping':
      
      break;
    case 'falling':
      
      break;
    case 'walking':
      
      break;
    case 'running':
      
      break;
    case 'crouching':
      
      break;
    case 'landing':
      
      break;
    case 'bonk':
      
      break;
    case 'crouchwalk':
      
      break;
    case 'sliding':
      
      break;

    default:
    console.log('What the dog doin?');
      break;
  }
  



  
  //* if jump pressed, and not already jumping or falling, jump
  if(playerMovement.jump && player.state.name != 'jumping' && player.state.name != 'falling' && player.state.name != 'landing' && player.state.name != 'bonk'){
    player.state = statesArray[1]
    stateFrameCount = 0
  }

  //* if player is not touching a tile, and inside the canvas, fall by gravity
  fallIfAirBorne()

  //* if in jumping state - if rising time has not ended, keep rising
  if(player.state.name == 'jumping' && stateFrameCount < player.state.framesTotal){

    player.posY -= risingSpeed

    //* check for collision while rising, if collided, go into bonk(head collision) state
    for (let i = 0; i < tilesArray.length; i++) {
      if (newCollisionCheck(player, tilesArray[i])) {
        player.posY = tilesArray[i].posY + tilesArray[i].height
        player.state = statesArray[2]
        stateFrameCount = 0
        risingSpeed = 48
        break
      }
    }
  }

  //* if in jumping state - if rising time has ended, start falling
  if(player.state.name == 'jumping' && stateFrameCount >= player.state.framesTotal){
    player.state = statesArray[2]
    stateFrameCount = 0
    risingSpeed = 48
  }

  //* if in bonk state (head collision), after x frames, start falling
  if(player.state.name == 'bonk'){
    if(stateFrameCount < player.state.framesTotal) {

    }
    if(stateFrameCount >= player.state.framesTotal){
      player.state = statesArray[2]
      stateFrameCount = 0
    }
  }

  //* if on falling state, move down
  if(player.state.name == 'falling'){

    let landed = false

    player.posY += fallingSpeed

    if(isPlayerNotInBounds('down')){
      player.posY = canvas.height - player.height
      player.state = statesArray[6]
      stateFrameCount = 0
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
      stateFrameCount = 0
      risingSpeed = 48
      fallingSpeed = 0
    }

  }

  //* if in landing state, count landing frames and change state if needed
  if(player.state.name == 'landing'){
    if(stateFrameCount < player.state.framesTotal){
      //* check frame and do animation, not needed for functionality right now
    }
    if(stateFrameCount >= player.state.framesTotal){
      //console.log('landed');
      player.state = statesArray[0]
      stateFrameCount = 0
    }

  }

  //* if crouching, reduce size to half  
  if((player.state.name == 'crouching' || player.state.name == 'crouchwalk') && playerMovement.crouch && player.height > playerLength/2){
    if(playerMovement.crouch){
      player.posY += player.height/2
      player.height = player.height / 2
    }
  }


  /* if(isUnderTile){
        player.height = playerLength/2
        player.posY += playerLength/2
      } */

    if(!playerMovement.crouch && player.height < playerLength && !isUnderTile){
      player.height = playerLength
      player.posY -= playerLength/2
    }


  //*
  if(player.state.name == 'walking' && playerMovement.crouch){
    player.state = statesArray[8]
    stateFrameCount = 0
  }


  //* if crouching, not moving, and pressed jump after x frames, do a higher jump
  if(player.state.name == 'crouching' && stateFrameCount > player.state.framesTotal/2){

    risingSpeed = 64

    if(playerMovement.jump){
      player.state = statesArray[1]
      stateFrameCount = 0
    }
  }


  //* if running, then pressed crouch, change into a slide, which boost speed and reduces height

  console.log(player.state.name)
  stateFrameCount++
}



function fallIfAirBorne(){
  if((player.state.name == 'idle' || player.state.name == 'walking' || player.state.name == 'crouching' || player.state.name == 'crouchwalk'  || player.state.name == 'running') && player.state.name != 'bonk'){

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
    
    if(isAirBorne){
      player.state = statesArray[2]
      stateFrameCount = 0
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

//*NEW
function isPlayerAirborne(){

}

//*NEW
function isPlayerUnderTile(){
  let isIt = false

  let ceilingCheck = {...player};
  ceilingCheck.posY -= playerLength/2

  for (let i = 0; i < tilesArray.length; i++){
    if(newCollisionCheck(ceilingCheck, tilesArray[i])){
      isIt = true
      break
    }
  }

  /* if(!playerMovement.crouch && player.height < playerLength){

      
  } */
  return isIt
}

//*NEW
function canPlayerJump(){

}

//*NEW
function shouldPlayerFall(){

}

//*NEW - testing...
function isPlayerMovingSideways(){

}

//*

function setState(name){
  player.state = statesArray.find(state => state.name = name)
  stateFrameCount = 0
}

//*Watch
menu_button_start.addEventListener('click', () => {
  main_menu.classList.add('closed')
  isGameOn = !isGameOn
  enemyCollision = !enemyCollision
  startAnimating()
})

document.addEventListener('keydown', (key) => {
  if(key.code == "Escape"){
    if(pause_menu.classList.contains('closed')){
      pause_menu.classList.remove('closed')
      isGameOn = false
    }else{
      pause_menu.classList.add('closed')
      isGameOn = true
      startAnimating()
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

