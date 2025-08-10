//* IMPORTS
import { Slime } from './slime.js'
import map1 from './map1.js';
import { collisionTile } from './collisionTile.js';

//* DATA VARIABLES
const canvas = document.getElementById('slimerun-game')
const context = canvas.getContext('2d')
context.mozImageSmoothingEnabled = true;
context.webkitImageSmoothingEnabled = true;
context.msImageSmoothingEnabled = true;
context.imageSmoothingEnabled = true;
let playerLength = 64
resizeCanvas()


//* player variables
let playerSpeedX = 6
let playerCrouchSpeed = 3
let playerWalkSpeed = 6
let playerRunSpeed = 12
let player = new Slime(playerLength, playerLength, 64, 64, {type: 'idle', totalFrames: 24}, null)
let playerSpeedY = 0
let collisionTester = null
let playerSpawn = {
  posX: 0,
  posY: 0
}
let playerMovement = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  run: false
}

//* map variables
let collisionTiles = []
let tileSize = 64
let tutorialText = ['"Spacebar" to jump', '"shift" to run', '"Control" to crouch', 'Hold Crouch and dont move to do a high jump', 'Crouch while running to slide']
let tutorialTiles = []
let borderTiles = []

//* gameloop variables
let globalFrameCounter = 0
let stateFrameCount = 0
let fps = 60
let fpsInterval
let startTime
let now
let then
let elapsed

//* state variables
let lastSlideFrame = 60
let movingTo = {
  right: false,
  left: false,
  up: false,
  down: false
}
let cameraCollision = {
  right: false,
  left: false,
  up: false,
  down: false
}
let statesArray = [
  {
    name: 'idle',
    totalFrames: 24
  },
  {
    name: 'jumping',
    totalFrames: 10
  },
  {
    name: 'falling',
    totalFrames: 4
  },
  {
    name: 'walking',
    totalFrames: 24
  },
  {
    name: 'running',
    totalFrames: 24
  },
  {
    name: 'crouching',
    totalFrames: 24,
    isCrouching: true
  },
  {
    name: 'landing',
    totalFrames: 2
  },
  {
    name: 'bonk',
    totalFrames: 2
  },
  {
    name: 'crouchwalk',
    totalFrames: 24,
    isCrouching: true
  },
  {
    name: 'sliding',
    totalFrames: 8
  },
]

//* mechanics variables
let cameraFallingSpeed = 28
let cameraJumpingSpeed = 16
let fallingSpeed = 0
let risingSpeed = 48
let lockSlideRight = false
let lockSlideLeft = false
let opositesHorizontal = false
const camera = {
  get posX () {
    return -(canvas.width / 4 - player.posX)
  },
  get posY () {
    return -(canvas.height / 4 - player.posY)
  },
}

//* global variables
let gravity = 4
let isGameOn = false


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
    if(globalFrameCounter <= 1){
      player.posX = playerSpawn.posX
      player.posY = playerSpawn.posY
    }
    updatePlayer()
    drawCanvas()
    drawMap()
    drawCamera()
    drawPlayer()
    globalFrameCounter++

    fps_display.innerText = `Fps: ${parseInt(1000 / elapsed)} - mspf: ${parseInt(elapsed)}`
  }

}

function clearCanvas(){
  context.clearRect(0,0,canvas.width,canvas.height);
}

function updatePlayer(){
  opositesHorizontal = false
  let playerIsUnderTile = false
  let playerIsAirborne = false
  let playerCanJump = false
  let playerCollision = {
    right: {
      collision: false,
      position: 0
    },
    left: {
      collision: false,
      position: 0
    },
    up: {
      collision: false,
      position: 0
    },
    down: {
      collision: false,
      position: 0
    }
  }

  let collisionRightTest = {...player, posX: player.posX + playerSpeedX}
  let collisionLeftTest = {...player, posX: player.posX - playerSpeedX}
  let collisionUpTest = {...player, posY: player.posY - playerLength/3}
  let collisionDownTest = {...player, posY: player.posY + playerLength/3}

  for (let i = 0; i < collisionTiles.length; i++) {

    if (checkCollision(collisionRightTest, collisionTiles[i])) {
      playerCollision.right.collision = true
      playerCollision.right.position = collisionTiles[i].posX
    }
    if (checkCollision(collisionLeftTest, collisionTiles[i])) {
      playerCollision.left.collision = true
      playerCollision.left.position = collisionTiles[i].posX + collisionTiles[i].width
    }
    if (checkCollision(collisionUpTest, collisionTiles[i])) {
      playerCollision.up.collision = true
      playerCollision.up.position = collisionTiles[i].posY + collisionTiles[i].width
    }
    if (checkCollision(collisionDownTest, collisionTiles[i])) {
      playerCollision.down.collision = true
      playerCollision.down.position = collisionTiles[i].posY
    }

    if(isPlayerNotInBounds('Right', collisionRightTest)){
      playerCollision.right.collision = true
      playerCollision.right.position = canvas.width
    }

    if(isPlayerNotInBounds('left', collisionLeftTest)){
      playerCollision.left.collision = true
      playerCollision.left.position = 0
    }

    if(isPlayerNotInBounds('up', collisionUpTest)){
      playerCollision.up.collision = true
      playerCollision.up.position = 0
    }

    if(isPlayerNotInBounds('down', collisionDownTest)){
      playerCollision.down.collision = true
      playerCollision.down.position = canvas.height
    }

  }

  //* get if player is under any type of collision tile
  if(playerCollision.down.collision && playerCollision.up.collision) playerIsUnderTile = true

  //* get if playe can jump
  if(playerCollision.down.collision && !playerIsUnderTile ) playerCanJump = true

  //* get if player is airborne so that it can fall
  if(!playerCollision.down.collision) playerIsAirborne = true

  //* manage all horizotal movement and speeds
  playerHorizontalMovement(playerCollision)

  //TODO sideways player and camera movement updated, need to update all the state managing of the player next

  //* if player is not moving at all, it is idle
  if(
    !playerMovement.left 
    && !playerMovement.right 
    && !playerMovement.jump 
    && !playerMovement.crouch 
    && !playerMovement.run 
    && player.state.name != 'falling' 
    && player.state.name != 'jumping' 
    && player.state.name != 'landing' 
    && player.state.name != 'bonk' 
    && player.state.name != 'idle' 
    ){
    setState('idle')
  }

  switch (player.state.name) {
    case 'idle':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      if(stateFrameCount > 24) stateFrameCount = 0

      //* if player is not under a tile and crouched without pressing button, uncrouch
      if(!playerIsUnderTile && player.height < playerLength && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
      }

      //* reset jumpt speed
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
      }

      //* if not holding direction and crouch pressed
      if((!playerMovement.left && !playerMovement.right) && playerMovement.crouch){
        setState('crouching')
      }

      //* if can jump and pressed
      if(playerCanJump && playerMovement.jump){
        setState('jumping')
      }

      //* if airborne
      if(playerIsAirborne) setState('falling')
      
      break;
    case 'jumping':
      if(player.state.totalFrames != 12) player.state.totalFrames = 12

        lockSlideRight = false
        lockSlideLeft = false

      //* decrease rising speed until apex (total frames) reached
      risingSpeed -= 4

      //* if in jumping state - if rising time has not ended, keep rising
      if(stateFrameCount < player.state.totalFrames){

        if(playerMovement.crouch && playerSpeedX != playerWalkSpeed) playerSpeedX = playerWalkSpeed
        if(playerMovement.run && playerSpeedX != playerRunSpeed) playerSpeedX = playerRunSpeed

        if(playerCollision.up.collision){
          player.posY = playerCollision.up.position
          risingSpeed = 48
          setState('falling')
        }
        
        if(!playerCollision.up.collision){
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

      //* increase falling speed until landed
      if(fallingSpeed < 28) fallingSpeed += 2

      if(playerIsAirborne){
        player.posY += fallingSpeed
      }

      if(!playerIsAirborne){
        player.posY = playerCollision.down.position - player.height
        fallingSpeed = 4
        risingSpeed = 48
        setState('landing')
      }

      break;
    case 'walking':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      lockSlideRight = false
      lockSlideLeft = false

      playerSpeedX = playerWalkSpeed

      if(player.height < playerLength && playerCanJump){
        player.posY -= playerLength/2
        player.height = playerLength
      }

      if(playerIsAirborne){
        setState('falling')
      }

      //* if crouch is pressed while walkin, crouch
      if(playerMovement.crouch){
        setState('crouchwalk')
      }

      //* if run is pressed while walkin, run
      if(playerMovement.run && player.height == playerLength && !playerMovement.crouch){
        setState('running')
      }

      if(playerCanJump && playerMovement.jump){
        setState('jumping')
      }

      if(!playerMovement.right && !playerMovement.left) setState('idle')
      
      
      break;
    case 'running':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      lockSlideRight = false
      lockSlideLeft = false

      if(player.height < playerLength && playerCanJump){
        player.posY -= playerLength/2
        player.height = playerLength
      }

      playerSpeedX = playerRunSpeed

      if(playerIsAirborne){
        setState('falling')
      }

      if(playerCanJump && playerMovement.jump){
        setState('jumping')
      }

      if(!playerIsUnderTile && !playerMovement.run && !playerMovement.crouch){
        setState('walking')
      }

      if(!playerMovement.right && !playerMovement.left) setState('idle')

      if(playerMovement.crouch){
        if(playerMovement.right) lockSlideRight = true
        if(playerMovement.left) lockSlideLeft = true
        if(globalFrameCounter < 60){
          setState('sliding')
        }
        if(globalFrameCounter - lastSlideFrame >= 30){
          setState('sliding')
        }
      }
      
      
      break;
    case 'crouching':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      playerSpeedX = playerWalkSpeed
      

      //* if crouching, reduce size to half  
      if(player.height > playerLength/2){
        player.posY += player.height/2
        player.height = player.height / 2
      }

      //* jump if you must
      if(playerCanJump && playerMovement.jump){
        playerSpeedX = playerWalkSpeed
        setState('jumping')
      }

      //* if not under a tile and not pressing crouch, go back to normal size
      if(!playerIsUnderTile && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
        setState('idle')
      }

      //* if crouching, not moving, and pressed jump after x frames, do a higher jump
      if(stateFrameCount > 12 && playerMovement.crouch){
        risingSpeed = 64
      }

      break;
    case 'landing':
      if(player.state.totalFrames != 2) player.state.totalFrames = 2

      lockSlideRight = false
      lockSlideLeft = false

      //* if in landing state, count landing frames and change state if needed

      if(stateFrameCount < player.state.totalFrames){
        //* check frame and do animation, not needed for functionality right now
      }

      if(stateFrameCount >= player.state.totalFrames){

        if(!playerMovement.left && !playerMovement.right) setState('idle')

        if(playerMovement.left || playerMovement.right){
          setState('walking')
        }
      }
      
      break;
    case 'crouchwalk':
      if(player.state.totalFrames != 24) player.state.totalFrames = 24

      lockSlideRight = false
      lockSlideLeft = false

      if(player.height < playerLength){
        playerSpeedX = playerCrouchSpeed
      }
      risingSpeed = 48

      if(playerIsAirborne){
        setState('falling')
      }

      //* reduce size to half  
      if(playerMovement.crouch && player.height > playerLength/2){
        player.posY += player.height/2
        player.height = player.height / 2
      }

      //* if can jump and jump pressed, perhaps, jump
      if(playerCanJump && playerMovement.jump){
        setState('jumping')
      }

      //* if not under a tile and not pressing crouch, go back to normal size
      if(!playerIsUnderTile && !playerMovement.crouch){
        player.posY -= playerLength/2
        player.height = playerLength
        setState('walking')
      }

      if(!playerMovement.left && !playerMovement.right) setState('crouching')

      if(playerIsAirborne) setState('falling')
      
      break;
    case 'sliding':
      if(player.state.totalFrames != 12) player.state.totalFrames = 12

      if(player.height > playerLength/2){
        player.height = playerLength/2
        player.posY += playerLength/2
      }

      playerSpeedX = playerRunSpeed*1.5

      if(playerMovement.right) lockSlideRight = true
      if(playerMovement.left) lockSlideLeft = true


      if(stateFrameCount > 12){
        lockSlideRight = false
        lockSlideLeft = false

        lastSlideFrame = globalFrameCounter

        if(!playerIsUnderTile){
          player.posY -= playerLength/2
          player.height = playerLength
          setState('running')
        }else setState('crouchwalk')

        if(playerIsAirborne){
          playerSpeedX = playerRunSpeed
          setState('falling')
        }
      }

      if(playerCanJump && playerMovement.jump){
        risingSpeed = 56
        setState('jumping')
      }
      break;
    default:
      console.log('What the dog doin?');
      break;
  /* case 'bonk':
      if(player.state.totalFrames != 2) player.state.totalFrames = 2
      //* if in bonk state (head collision), after x frames, start falling
      if(player.state.name == 'bonk'){
        if(stateFrameCount < player.state.totalFrames) {

        }
        if(stateFrameCount >= player.state.totalFrames && canPlayerFall){
          setState('falling')
        }
      }
      break; */
  }
  
  //^ Notice: slide locking is not working how it was intented fully, can't change direction after pressing slide as intented, but pressing opposite direction stops slide movement
  console.log(player.state.name);
  stateFrameCount++
}

function drawPlayer(){
  context.fillStyle = 'lime';
  /* if (player.state.name == 'idle' && stateFrameCount < 6) {
    context.fillStyle = 'lime';
  }
  if (player.state.name == 'idle' && stateFrameCount < 12 && stateFrameCount > 6) {
    context.fillStyle = 'yellow';
  }
  if (player.state.name == 'idle' && stateFrameCount < 18 && stateFrameCount > 12 ) {
    context.fillStyle = 'orange';
  }
  if (player.state.name == 'idle' && stateFrameCount <= 24 && stateFrameCount > 18) {
    context.fillStyle = 'red';
  } */
  context.fillRect(player.posX,player.posY,player.width,player.height);
}

function resizeCanvas(){
  let width = Math.ceil(window.innerWidth/64)*64
  let height = Math.ceil(window.innerHeight/64)*64
  canvas.width = width
  canvas.height =  height - playerLength

  if(window.innerWidth > 1408) canvas.width = 1408
  if(window.innerHeight > 960) canvas.height = 960

  console.log(canvas.height, canvas.width);
}

function drawCamera(){
  context.strokeStyle='red';
  context.strokeRect(camera.posX + player.width/2, camera.posY, canvas.width/2, canvas.height/1.5);
  context.fillRect(camera.posX, camera.posY, 64, 64)
}

function drawCanvas(){
  context.beginPath();
  context.fillStyle='rgba(43, 105, 63, 1)';
  context.fillRect(0,0,canvas.width, canvas.height);
}

function drawMap(){
  updateCameraMovement()

  updateTilePositionToBottomBorder()
  
  for (let i = 0; i < collisionTiles.length; i++) {

    //if(camera.posX > collisionTiles[0])
    
    collisionTiles[i] = moveTileByCamera(collisionTiles[i])

    if(tutorialTiles[i]) moveTileByCamera(tutorialTiles[i])

    if(tutorialText[i] && tutorialTiles[i]){
      context.fillStyle = 'white'
      context.font = '20px Helvetica'
      context.fillText(tutorialText[i], tutorialTiles[i].posX, tutorialTiles[i].posY, 256);
    }

    context.fillStyle = getTileColor(collisionTiles[i]); 
    context.fillRect(collisionTiles[i].posX, collisionTiles[i].posY, collisionTiles[i].width, collisionTiles[i].height);
  }
}

function getTileColor(tile){
  let color = '#ffffff'

  if(tile.type == 'basic') color = 'orange'
  if(tile.type == 'border-bottom') color = 'darkorange'
  if(tile.type == 'border-top') color = 'beige'
  if(tile.type == 'border-side') color = 'salmon'
  if(tile.type == 'reset') color = 'white'
  if(tile.type == 'pathway') color = 'purple'
  if(tile.type == 'half-top') color = 'blue'

  return color
}

function updateTilePositionToBottomBorder(){
  if(globalFrameCounter >= 1) return
  let anyBottomBorderTile = null

  //* get the posY of any bottom tile
  for (let i = 0; i < borderTiles.length; i++) {
    if(borderTiles[i].type == 'border-bottom'){
      anyBottomBorderTile = borderTiles[i]
      break
    }
  }

  //* calculate how much is needed to reach the canvas bottom, from above or below
  let heightToAdjust = 0
  if((anyBottomBorderTile.posY + anyBottomBorderTile.height) < canvas.height){
    heightToAdjust = canvas.height - (anyBottomBorderTile.posY + anyBottomBorderTile.height) 
  }

  if((anyBottomBorderTile.posY + anyBottomBorderTile.height) > canvas.height){
    heightToAdjust = (((anyBottomBorderTile.posY + anyBottomBorderTile.height) - canvas.height) * -1)
  }

  //* Adjut tile's height to align with the canvas bottom border
  if(heightToAdjust != 0){
    for (let i = 0; i < collisionTiles.length; i++) {
      collisionTiles[i].posY += heightToAdjust
    }
    for (let i = 0; i < tutorialTiles.length; i++) {
      tutorialTiles[i].posY += heightToAdjust
    }
    playerSpawn.posY += heightToAdjust
  }
}

function updateCameraMovement(){
  movingTo = {
    up: false,
    down: false,
    left: false,
    right: false
  }

  let cameraBorders = {
    right: camera.posX + (canvas.width/2) + (player.width/2),
    left: camera.posX + player.width/2,
    up: camera.posY,
    down: camera.posY + (canvas.height/1.5)
  }

  //collisionTiles[0].posX
  
  //* right canvas border
  if( cameraBorders.right > canvas.width && cameraBorders.right < collisionTiles[collisionTiles.length-1].posX + playerLength){
    movingTo.right = true
  }

  //* top canvas border
  if(cameraBorders.up < 0){
    movingTo.up = true
  }

  //* left canvas border
  if( cameraBorders.left < 0 && cameraBorders.left > collisionTiles[0].posX){
    movingTo.left = true
  }

  //*  bottom canvas border
  if( cameraBorders.down > canvas.height){
    movingTo.down = true
  }
}

function moveTileByCamera(tile){
  if(movingTo.right && playerMovement.right){
    tile.posX -= playerSpeedX
  }
  if(movingTo.left && playerMovement.left){
    tile.posX += playerSpeedX
  }

  if(movingTo.up && player.state.name == 'jumping'){
    //tile.posY += cameraJumpingSpeed/1.5
  }

  if(movingTo.down && player.state.name == 'falling'){
    //tile.posY -= cameraFallingSpeed
  }

  return tile
}

function checkCollision(player, tile){
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

function getCollisionTiles(){

  collisionTiles = []
  tutorialTiles = []
  let mapData = map1.mapInfo
  let arrayIndex = 0

  for (let i = 0; i < mapData.rows; i++) {
    for (let j = 0; j < mapData.columns; j++) {

      if(mapData.tiles[arrayIndex] == 1){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'basic')
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 2){
        let tile = new collisionTile(tileSize, tileSize/2, tileSize*j, tileSize*i, 'half-top')
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 5){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'reset')
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 6){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'pathway')
        //* make this the teleport tiles to change between maps
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 7){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'border-top')
        borderTiles.push(tile)
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 8){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'border-bottom')
        borderTiles.push(tile)
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 9){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'border-side')
        borderTiles.push(tile)
        collisionTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 10){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'text')
        tutorialTiles.push(tile)
      }

      if(mapData.tiles[arrayIndex] == 300){
        let tile = new collisionTile(tileSize, tileSize, tileSize*j, tileSize*i, 'spawn')
        playerSpawn = tile
        player.posX = playerSpawn.posX
        player.posY = playerSpawn.posY
      }

      arrayIndex++      
    }
  }
}

function isPlayerAirborne(){

  let isAirBorne = true
  let tileCollided = {}

  collisionTester = {...player}
  collisionTester.posY += playerLength/2


  for (let i = 0; i < collisionTiles.length; i++){
    //console.log(collisionTester.posY + collisionTester.height, collisionTiles[i].posY, 'check in the for');
    if(checkCollision(collisionTester, collisionTiles[i]) && collisionTiles[i].type != 'text'){
      //console.log('NO ESTA EN EL AIRE NOJODA');
      isAirBorne = false
      tileCollided = collisionTiles[i]
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

function isPlayerUnderTile(){
  let isIt = false

  let ceilingCheck = {...player};
  ceilingCheck.posY -= playerLength/3

  for (let i = 0; i < collisionTiles.length; i++){
    if(checkCollision(ceilingCheck, collisionTiles[i])){
      isIt = true
      break
    }
  }
  return isIt
}

function canJump(underTile){
  if((player.state.name == 'idle' || player.state.name == 'walking' || player.state.name == 'crouching' || player.state.name == 'running' || player.state.name == 'crouchwalk' || player.state.name == 'sliding') && !underTile){
    return true
  }else return false
}

function playerHorizontalMovement(playerCollision){
  //if(player.state.name == 'falling' && stateFrameCount <= 1 && fallBetween) return

  //* if opposite directions are held, do not try to move
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true

  if(!opositesHorizontal && player.state.name != 'landing' && player.state.name != 'bonk'){

    //* Move Right
    if((playerMovement.right && !lockSlideLeft) || lockSlideRight){

      if(playerCollision.right.collision){
        player.posX = playerCollision.right.position - player.width
      }

      if(!playerCollision.right.collision) player.posX += playerSpeedX

      //* if viewport goes to the right, change the player position relative to the map movement
      if(movingTo.right){
        player.posX -= playerSpeedX
      }

       /* collisionTester = {...player}
      collisionTester.posX += collisionTester.width/4

      //* if the player is not going outside the canvas on the right
      let isCollision = false
      if(isPlayerNotInBounds('right', collisionTester)){
        player.posX = canvas.width - player.width
        isCollision = true
      }

      if(!isCollision){
        //*If there is a collision tile to the right
        for (let i = 0; i < collisionTiles.length; i++) {
          if (checkCollision(collisionTester, collisionTiles[i]) && collisionTiles[i].type != 'text') {
            player.posX = collisionTiles[i].posX - collisionTiles[i].width
            if(collisionTiles[i].width < playerLength) player.posX = collisionTiles[i].posX - collisionTiles[i].width*2
            isCollision = true
            break
          }
        }
      } */

      //if(!isCollision) player.posX += playerSpeedX
    }

    //* Move Left
    if((playerMovement.left && !lockSlideRight) || lockSlideLeft){

      if(playerCollision.left.collision){
        player.posX = playerCollision.left.position
      }

      if(!playerCollision.left.collision) player.posX -= playerSpeedX

      //* if viewport goes to the left, change the player position relative to the map movement
      if(movingTo.left){
        player.posX += playerSpeedX
      }

      /* collisionTester = {...player}
      collisionTester.posX -= collisionTester.width/4
      
      //* if the player is not going outside the canvas on the left
      let isCollision = false
      if(!isPlayerNotInBounds('left', collisionTester)){
        
        //*If there is a collision tile to the left, correct player position
        for (let i = 0; i < collisionTiles.length; i++) {
          if (checkCollision(collisionTester, collisionTiles[i]) && collisionTiles[i].type != 'text') {
            player.posX = collisionTiles[i].posX + collisionTiles[i].width
            isCollision = true
            break
          }
        }

        if(!isCollision) player.posX -= playerSpeedX
  
      }else player.posX = 0 */
      
    }

    if(player.state.name == 'crouching' && ((!playerCollision.left.collision && playerMovement.left) || ( !playerCollision.right.collision && playerMovement.right))){
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
  
  if(key.code == "KeyK") playerMovement.crouch = true

  if(key.code == "KeyL") playerMovement.run = true

  if(key.code == "KeyD") playerMovement.right = true

  if(key.code == "KeyA") playerMovement.left = true

  if(key.code == 'KeyJ') playerMovement.jump = true;

  if(key.code == "Space") playerMovement.jump = true

})

document.addEventListener('keyup', (key) => {

  if(key.code == "KeyK") playerMovement.crouch = false

  if(key.code == "KeyL") playerMovement.run = false

  if(key.code == "KeyD") playerMovement.right = false

  if(key.code == "KeyA") playerMovement.left = false

  if(key.code == 'KeyJ') playerMovement.jump = false;

  if(key.code == "Space") playerMovement.jump = false
})

window.addEventListener('resize', () => {
  resizeCanvas()
})

//*Run
getCollisionTiles()
resizeCanvas()
clearCanvas()

