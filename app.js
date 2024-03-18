const gameData = {
    "startTime": 0,
    "time": 0,
    "lastBullet": 0,
    "container": document.getElementById('playArea').getBoundingClientRect()
}

const player = {
    x: gameData["container"].left+300,
    y: gameData["container"].top+500,
    speedX: 0,
    speedY: 0
}

const keys = {
    "up": false,
    "down": false,
    "left": false,
    "right": false,
    "space": false
}

const enemies = [{x:50, y:150},{x:100, y:150},{x:150, y:150}];

const bullets = [];

const displayPlayer = _ => {
    document.getElementById('player').style['left'] = player.x + "px";
    document.getElementById('player').style['top'] = player.y + "px";
}

const movePlayer = _ => {
    player.x += player.speedX;
    player.y += player.speedY;
}

const handleKeys = _ => {
    if(keys["up"]){
        player.speedY=-2;
    }else if(keys["down"]){
        player.speedY=2;
    }else{
        player.speedY=0;
    }
    if(keys["left"]){
        player.speedX=-2;
    }else if(keys["right"]){
        player.speedX=2;
    }else{
        player.speedX=0;
    }
    if(keys["space"]){
        if(gameData["time"]-gameData["lastBullet"]>100){
            bullets.push({x:player.x, y:player.y});
            gameData["lastBullet"]=gameData["time"];
        }
    }
}

const displayEnemies = _ => {
    let output = "";
    for(let i=0;i<enemies.length;i++){
        output+=`<div class='mini' style='top:${enemies[i].y}px; left:${enemies[i].x}px;'></div>`;
    }
    document.getElementById('enemies').innerHTML = output;
}

const moveEnemies = _ => {
    for(let i=0;i<enemies.length;i++){
        enemies[i].y += 1;
        if(enemies[i].y>550){
            enemies[i].y = 0;
            enemies[i].x = Math.floor(Math.random()*500);
        }
    }
}

const displayBullets = _ => {
    let output = "";
    for(let i=0;i<bullets.length;i++){
        output+=`<div class='bullet' style='top:${bullets[i].y}px; left:${bullets[i].x}px;'></div>`;
    }
    document.getElementById('bullets').innerHTML = output;
}

const moveBullets = _ => {
    for(let i=0;i<bullets.length;i++){
        bullets[i].y -= 2;
        if(bullets[i].y<0){
            bullets.shift();
        }
    }
}

const gameLoop = _ => {
    gameData["time"] = new Date()-gameData["startTime"];
    document.getElementById("time").innerHTML=gameData["time"];
    handleKeys();
    movePlayer();
    displayPlayer();
    moveBullets();
    displayBullets();
    moveEnemies();
    displayEnemies();
}

document.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){
        keys["left"] = true;
    }
    if(e.key === 'ArrowRight'){
        keys["right"] = true;
    }
    if(e.key === 'ArrowUp'){
        keys["up"] = true;
    }
    if(e.key === 'ArrowDown'){
        keys["down"] = true;
    }
    if(e.key === ' '){
        keys["space"] = true;
    }
});

document.addEventListener('keyup', e => {
    if(e.key === 'ArrowLeft'){
        keys["left"] = false;
    }
    if(e.key === 'ArrowRight'){
        keys["right"] = false;
    }
    if(e.key === 'ArrowUp'){
        keys["up"] = false;
    }
    if(e.key === 'ArrowDown'){
        keys["down"] = false;
    }
    if(e.key === ' '){
        keys["space"] = false;
    }
});

gameData["startTime"] = new Date();

setInterval(() => {
    gameLoop();
}, 10);