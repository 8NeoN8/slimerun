//TODO IMPLEMENT IMPLEMENT SLIDING, AFTER THOSE ARE DONE, THEN IMPLEMENT WALK STICK
//TODo Bug, while jumping, crouch speed reduction should not apply
//TODO Bug, while crouching and under a half tile, jump should not be processed,
//TODO bug, while crouching under a half tile, crouchinh should be the state even if crouch is not pressed
//TODO bug, if under a any size tile, jumping should not cause falling, bonk, or landing states, but instead keep it as idle or any moving state after the jump
//TODO Refactor, change most conditionals in updatePlayer to be their own function to better control the amount of calculations done

//~ fixed bug that jumping while crouched would keep the crouching speed instead of going to normal

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
    totalFrames: 24,
    framecount: 0
  },
  {
    name: 'jumping',
    totalFrames: 10,
    framecount: 0
  },
  {
    name: 'falling',
    totalFrames: 4,
    framecount: 0
  },
  {
    name: 'walking',
    totalFrames: 24,
    framecount: 0
  },
  {
    name: 'running',
    totalFrames: 24,
    framecount: 0
  },
  {
    name: 'crouching',
    totalFrames: 24,
    framecount: 0,
    isCrouching: true
  },
  {
    name: 'landing',
    totalFrames: 2,
    framecount: 0
  },
  {
    name: 'bonk',
    totalFrames: 2,
    framecount: 0
  },
  {
    name: 'crouchwalk',
    totalFrames: 24,
    framecount: 0,
    isCrouching: true
  },
  {
    name: 'sliding',
    totalFrames: 8,
    framecount: 0
  },
]
let player = new Slime(playerLength, playerLength, 0, canvas.height - playerLength*4, statesArray[0], null)
let playerSpeedX = 6
let playerCrouchSpeed = 3
let playerWalkSpeed = 8
let playerRunSpeed = 12
let cameraFallingSpeed = 28
let cameraJumpingSpeed = 16

let globalFrameCounter = 0
let stateFrameCount = 0

let playerSpeedY = 0
let gravity = 4

let tileSize = 64

let risingSpeed = 48
let fallingSpeed = 0

let isSliding = false

let lastSlideFrame = 60

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
let fallBetween = false

let isAirBorne = false

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


let canPlayerFall = false

let canPlayerJump = null

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

function drawPlayer(){{
    context.fillStyle = 'red';
    context.fillRect(player.posX,player.posY,player.width,player.height);
  }
}

function resizeCanvas(){
  let width = Math.ceil(window.innerWidth/64)*64 - 64
  let height = Math.ceil(window.innerHeight/64)*64
  canvas.width = width
  canvas.height =  height - playerLength
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
    if(i % 2 != 0) context.fillStyle = 'darkcyan'
    if(tilesArray[i].height < playerLength) context.fillStyle='teal';
    if(tilesArray[i].width < playerLength) context.fillStyle='blue';


    context.fillRect(tilesArray[i].posX, tilesArray[i].posY, tilesArray[i].width, tilesArray[i].height);
  }
}

function updatePlayer(){
  opositesHorizontal = false

  //* get if player is under any type of collision tile
  isUnderTile = isPlayerUnderTile()

  //* get if player is airborne so that it can fall
  canPlayerFall = isPlayerAirborne()

  //* get if playe can jump
  canPlayerJump = canJump(isUnderTile)

  //* manage all horizotal movement and speeds
  playerHorizontalMovement()

  //* if player is not moving at all, it is idle
  if(!playerMovement.left && !playerMovement.right && !playerMovement.jump && !playerMovement.crouch && !playerMovement.run && player.state.name != 'falling' && player.state.name != 'jumping' && player.state.name != 'landing' && player.state.name != 'bonk' && player.state.name != 'idle' && (!isUnderTile)){
    setState('idle')
  }

  switch (player.state.name) {
    case 'idle':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24
      if(!isUnderTile && player.height < playerLength && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
      }
      risingSpeed = 48

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
        /* //* if crouch and run are pressed, player is walking
        if (playerMovement.run && playerMovement.crouch){
          playerMovement.run = false
          playerMovement.crouch = false
          setState['walking']
        } */
        
      }
      if((!playerMovement.left && !playerMovement.right) && playerMovement.crouch){
        setState('crouching')
      }

      if(canPlayerJump && playerMovement.jump){
        setState('jumping')
      }

      if(canPlayerFall.air) setState('falling')

      
      break;
    case 'jumping':
      if(player.state.totalFrames != 12) player.state.totalFrames = 12

      //* decrease rising speed until apex (total frames) reached
      risingSpeed -= 4

      //* if in jumping state - if rising time has not ended, keep rising
      if(stateFrameCount < player.state.totalFrames){

        if(playerMovement.crouch) playerSpeedX = playerWalkSpeed

        let collision = false
        collisionTester = {...player}
        collisionTester.posY -= risingSpeed

        //* check for collision while rising, if collided, go into bonk(head collision) state
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(collisionTester, tilesArray[i])) {
            player.posY = tilesArray[i].posY + tilesArray[i].height
            risingSpeed = 48
            collision = true
            setState('falling')
            break
          }
        }

        if(!collision){
          player.posY -= risingSpeed
          
        }
        
      }

      //* if in jumping state - if rising time has ended, start falling
      if(stateFrameCount >= player.state.totalFrames){
        risingSpeed = 48
        setState('falling')
      }
      break;
    case 'falling':
      if(player.state.totalFrames != 4) player.state.totalFrames = 4

      if(playerSpeedY < 20){
        playerSpeedY += gravity
      }
      let testGrav = {...player}
      testGrav.posY = Math.floor(Math.min(testGrav.posY + playerSpeedY, canvas.height - testGrav.height))

      //* increase falling speed until landed
      if(fallingSpeed < 28) fallingSpeed += 2

      let landed = false

      if(!canPlayerFall.air){
        player.posY = canPlayerFall.tile.posY - player.height
        risingSpeed = 48
        fallingSpeed = 0
        landed = true
      }
      
      if(landed){
        setState('landing')
        risingSpeed = 48
        fallingSpeed = 4
      }else player.posY += fallingSpeed //= testGrav.posY

      break;
    case 'walking':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      playerSpeedX = playerWalkSpeed

      if(canPlayerFall.air){
        fallBetween = true
        setState('falling')
      }

      //* if crouch is pressed while walkin, crouch
      if(player.state.name == 'walking' && playerMovement.crouch){
        setState('crouchwalk')
      }

      //* if run is pressed while walkin, run
      if(player.state.name == 'walking' && playerMovement.run && player.height == playerLength){
        setState('running')
      }

      if(canPlayerJump && playerMovement.jump){
        setState('jumping')
      }

      if(!playerMovement.right && !playerMovement.left) setState('idle')
      
      
      break;
    case 'running':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      playerSpeedX = playerRunSpeed
      risingSpeed = 48

      if(canPlayerFall.air){
        fallBetween = true
        setState('falling')
      }

      if(canPlayerJump && playerMovement.jump){
        setState('jumping')
      }

      if(!isUnderTile && !playerMovement.run){
        setState('walking')
      }

      if(playerMovement.crouch){
        if(globalFrameCounter < 60){
          isSliding = true
          setState('sliding')
        }
        if(globalFrameCounter - lastSlideFrame >= 30){
          isSliding = true
          setState('sliding')
        }
      }
      
      
      break;
    case 'crouching':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      playerSpeedX = playerWalkSpeed
      

      //* if crouching, reduce size to half  
      if(playerMovement.crouch && player.height > playerLength/2){
        player.posY += player.height/2
        player.height = player.height / 2
      }

      //* jump if you must
      if(canPlayerJump && playerMovement.jump){
        playerSpeedX = playerWalkSpeed
        setState('jumping')
      }

      //* if not under a tile and not pressing crouch, go back to normal size
      if(!isUnderTile && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
        setState('idle')
      }


      //* if crouching, not moving, and pressed jump after x frames, do a higher jump
      if(stateFrameCount > 12){
        risingSpeed = 64
      }

     
      
      break;
    case 'landing':
      if(player.state.totalFrames != 2) player.state.totalFrames = 2
      fallBetween = false
      playerSpeedY = -10

      //* if in landing state, count landing frames and change state if needed
      if(player.state.name == 'landing' && stateFrameCount < player.state.totalFrames){
        //* check frame and do animation, not needed for functionality right now
      }
      if(player.state.name == 'landing' && stateFrameCount >= player.state.totalFrames){
        if(!playerMovement.left && !playerMovement.right) setState('idle')
        if(playerMovement.left || playerMovement.right){
          setState('walking')
          if(playerMovement.crouch) setState('crouchwalk')
          if(playerMovement.run) setState('running')
        }
      }
      
      break;
    case 'bonk':
      if(player.state.totalFrames != 2) player.state.totalFrames = 2
      //* if in bonk state (head collision), after x frames, start falling
      if(player.state.name == 'bonk'){
        if(stateFrameCount < player.state.totalFrames) {

        }
        if(stateFrameCount >= player.state.totalFrames && canPlayerFall){
          setState('falling')
        }
      }
      break;
    case 'crouchwalk':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      if(player.height < playerLength){
        playerSpeedX = playerCrouchSpeed
      }
      risingSpeed = 48

      if(canPlayerFall.air){
        fallBetween = true
        setState('falling')
      }

      //* if crouching, reduce size to half  
      if(playerMovement.crouch && player.height > playerLength/2){
        player.posY += player.height/2
        player.height = player.height / 2
      }

      //* if can jump and jump pressed, perhaps, jump
      if(canPlayerJump && playerMovement.jump){
        setState('jumping')
      }

      //* if not under a tile and not pressing crouch, go back to normal size
      if(!isUnderTile && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
        setState('walking')
      }

      if(!playerMovement.left && !playerMovement.right) setState('crouching')

      if(canPlayerFall.air) setState('falling')
      
      break;
    case 'sliding':
      if(player.state.totalFrames != 12) player.state.totalFrames = 12

      if(player.height > playerLength/2){
        player.height = playerLength/2
        player.posY += playerLength/2
      }

      playerSpeedX = playerRunSpeed*1.5


      if(stateFrameCount > 12){

        lastSlideFrame = globalFrameCounter

        if(!isUnderTile){
          player.posY -= playerLength/2
          player.height = playerLength
          setState('running')
        }else setState('crouchwalk')

        if(canPlayerFall.air) {
          playerSpeedX = playerRunSpeed
          setState('falling')
        }
      }

      if(canPlayerJump && playerMovement.jump){
        risingSpeed = 56
        setState('jumping')
      }

      
      break;

    default:
      console.log('What the dog doin?');
      break;
  }

  console.log(player.state.name)
  stateFrameCount++
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

function isPlayerNotInBounds(bound, entity){
  if(bound == 'left'){
    if(entity.posX <= 0) return true
  }
  if(bound == 'right'){
    if(entity.posX >= canvas.width - entity.width) return true
  }
  if(bound == 'up'){
    if(entity.posY <= 0) return true
  }
  if(bound == 'down'){
    if(entity.posY >= canvas.height - entity.height) return true
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

      if(map.mapInfo.tiles[arrayIndex] == 3){
        let tile = new collisionTile(tileSize/2, tileSize, tileSize*j, tileSize*i)
        tilesArray.push(tile)
      }

      if(map.mapInfo.tiles[arrayIndex] == 4){
        let tile = new collisionTile(tileSize/2, tileSize, tileSize*j + playerLength/2, tileSize*i)
        tilesArray.push(tile)
      }

      arrayIndex++      
    }
  }
}

//*NEW
function isPlayerAirborne(){

  let isAirBorne = true
  let tileCollided = {}

  collisionTester = {...player}
  collisionTester.posY += playerLength/2


  for (let i = 0; i < tilesArray.length; i++){
    //console.log(collisionTester.posY + collisionTester.height, tilesArray[i].posY, 'check in the for');
    if(newCollisionCheck(collisionTester, tilesArray[i])){
      //console.log('NO ESTA EN EL AIRE NOJODA');
      isAirBorne = false
      tileCollided = tilesArray[i]
      break
    }
  }

  if(isPlayerNotInBounds('down', collisionTester)) {
    isAirBorne = false
    tileCollided = {
      posY: canvas.height
    }
  }

  return {
    air: isAirBorne,
    tile: tileCollided
  }
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
  return isIt
}

//*NEW
function canJump(underTile){
  if((player.state.name == 'idle' || player.state.name == 'walking' || player.state.name == 'crouching' || player.state.name == 'running' || player.state.name == 'crouchwalk' || player.state.name == 'sliding') && !underTile){
    return true
  }else return false
}

//*NEW
function playerHorizontalMovement(){
  //if(player.state.name == 'falling' && stateFrameCount <= 1 && fallBetween) return

  //* if opposite directions are held, do not try to move
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true

  //* horizontal movement
  if(!opositesHorizontal && player.state.name != 'landing' && player.state.name != 'bonk'){

    //* Move Right
    if(playerMovement.right){

      collisionTester = {...player}
      collisionTester.posX += collisionTester.width/4



      //* if the player is not going outside the canvas on the right
      let isCollision = false
      if(isPlayerNotInBounds('right', collisionTester)){
        player.posX = canvas.width - player.width
        isCollision = true
      }

      if(!isCollision){
        //*If there is a collision tile to the right
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(collisionTester, tilesArray[i])) {
            player.posX = tilesArray[i].posX - tilesArray[i].width
            if(tilesArray[i].width < playerLength) player.posX = tilesArray[i].posX - tilesArray[i].width*2
            isCollision = true
            break
          }
        }
      }

      if(!isCollision) player.posX += playerSpeedX

      /* //* if viewport goes to the right, change the player position relative to the map movement
      if(movingTo.right){
        player.posX -= playerSpeedX
      } */

      collisionTester = {}

    }

    //* Move Left
    if(playerMovement.left){

      collisionTester = {...player}
      collisionTester.posX -= collisionTester.width/4
      
      //* if the player is not going outside the canvas on the left
      let isCollision = false
      if(!isPlayerNotInBounds('left', collisionTester)){
        
        //*If there is a collision tile to the left, correct player position
        for (let i = 0; i < tilesArray.length; i++) {
          if (newCollisionCheck(collisionTester, tilesArray[i])) {
            player.posX = tilesArray[i].posX + tilesArray[i].width
            isCollision = true
            break
          }
        }

        if(!isCollision) player.posX -= playerSpeedX
  
        /* //* if viewport goes to the left, change the player position relative to the map movement
        if(movingTo.left){
          player.posX += playerSpeedX
        } */

      }else player.posX = 0
      
      collisionTester = {}
    }

    if(player.state.name == 'crouching' && (playerMovement.left || playerMovement.right)){
      setState('crouchwalk')
    }
  }
}

function setState(name){
  let newState = statesArray.find(state => state.name = name)
  player.state = newState
  player.state.totalFrames = newState.totalFrames
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
resizeCanvas()
clearCanvas()
drawPlayer()

