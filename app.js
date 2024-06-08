const gameData = {
    "startTime": 0,
    "time": 0,
    "lastBullet": 0,
    "bulletSpeed": 250,
    "tempBulletSpeed": 250,
    "rampage": false,
    "rampageStart": 0,
    "lastEnemy": 0,
    "enemySpots": [[60,-100],[128,-100],[196,-100],[264,-100]],
    "gameOver": true,
    "muzzleFlash": false,
    "message": "Press 'a' to start",
    "lastMessage": 0,
    "soundVolume": 1,
    "bossFight": false,
    "lastTrash": 0,
    "levelComplete": false,
    "nextLevel": false
}

const canvas = document.querySelector('canvas');
// canvas.width = window.innerWidth;
canvas.width = 360;
canvas.height = 740;
let ctx = canvas.getContext('2d');
ctx.font = '32px Arial';
ctx.fillStyle = 'white';
const scale = 1;
// ctx.scale(scaleFactor, scaleFactor);
const music = new Audio('media/level1.ogg');
const shotSound = new Audio('media/shot.ogg');
const enemySound = new Audio('media/enemy.ogg');
const playerSound = new Audio('media/player.ogg');
const sounds = [shotSound, enemySound, playerSound];

const enemySprites = [
    [29,56,87,70],[24,46,82,10],[33,70,54,56],[26,48,223,78],[28,51,54,5],[16,33,227,45],[25,38,106,32],[27,47,170,79],[28,48,116,78],[26,48,197,78]
];

const contain = (pos,width,height,isPlayer=false) => {
    if(isPlayer){
        if(pos.y<0){
            pos.y=0;
        }else if(pos.y>canvas.height-height){
            pos.y=canvas.height-height;
        }
    }
    if(pos.x<30){
        pos.x=30;
    }else if(pos.x>canvas.width-width-30){
        pos.x=canvas.width-width-30;
    }
    return pos;
}

class Player {
    constructor(){
        this.lives = 2;
        this.rage = 0;

        this.position = {
            x: 200,
            y: 600
        }
        this.velocity = {
            x: 0,
            y: 0
        }

        this.width = 26;
        this.height = 49;

        this.imgX = 144;
        this.imgY = 77;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';

        this.muzzleX = 246;
        this.muzzleY = 0;
        this.muzzleW = 10;
        this.muzzleH = 12;
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
        if(gameData["muzzleFlash"]){
            ctx.drawImage(this.image, this.muzzleX, this.muzzleY, this.muzzleW, this.muzzleH, this.position.x+8, this.position.y-8, this.muzzleW, this.muzzleH);
        }
    }

    move(){
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        contain(this.position,this.width,this.height,true);
    }
}

class Bullet {
    constructor(x,y){
        this.position = {
            x: x,
            y: y
        }

        this.width = 4;
        this.height = 10;

        this.imgX = 251;
        this.imgY = 119;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y -= 4;
        if(this.position.y<0){
            bullets = bullets.filter(bullet=>bullet!==this);
        }
    }
}

class Enemy {
    constructor(x,y,isDumpTruck=false,isBoss=false){
        this.position = {
            x: x,
            y: y
        }

        this.distance = {
            x: 0,
            y: 0
        }

        let spriteIndex = isDumpTruck ? enemySprites.length-1 : Math.floor(Math.random()*(enemySprites.length-1));

        this.isDumpTruck = isDumpTruck;

        this.isBoss = isBoss;
        this.moveLeft = Math.random()>0.5;
        if(this.isBoss){
            spriteIndex=0;
        }

        this.width = enemySprites[spriteIndex][0];
        this.height = enemySprites[spriteIndex][1];

        this.imgX = enemySprites[spriteIndex][2];
        this.imgY = enemySprites[spriteIndex][3];
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        if(this.isDumpTruck){
            if(gameData.levelComplete){
                if(this.position.y+this.height>-5){
                    this.position.y--;
                }else{
                    enemies.length=0;
                    gameData.nextLevel=true;
                }
            }else{
                if(this.position.y<canvas.height/2){
                    this.position.y+=0.5;
                }
            }
        }else if(this.isBoss){
            if(this.position.y<canvas.height/2-100){
                this.position.y+=0.5;
            }
            if(this.position.x<32){
                this.moveLeft=false;
            }
            if(this.position.x>canvas.width-32-this.width){
                this.moveLeft=true;
            }
            this.moveLeft ? this.position.x-=0.25 : this.position.x+=0.25;
        }else{
            this.position.y++;
            contain(this.position,this.width,this.height);
        }
    }
}

class Explosion {
    constructor(x,y){
        this.position = {
            x: x-16, // offset for exp width
            y: y+16 // offset for exp height
        }

        this.currentFrame = 0;
        this.spriteLoc = [[106,0],[106,0],[106,0],[138,13],[138,13],[170,13],[170,13],[163,45],[170,13],[170,13],[138,13],[138,13],[106,0],[106,0]];
        this.width = 32;
        this.height = 32;

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        if(this.currentFrame<14){
            ctx.drawImage(this.image, 
                this.spriteLoc[this.currentFrame][0], 
                this.spriteLoc[this.currentFrame][1], 
                this.width, this.height, this.position.x, this.position.y, this.width, this.height);
            this.currentFrame++;
        }else{
            explosions.shift();
        }
    }
}

class YellowLine {
    constructor(x){
        this.position = {
            x: x,
            y: 0
        }

        this.width = 4;
        this.height = canvas.height;

        this.imgX = 251;
        this.imgY = 112;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, 1, 1, this.position.x, this.position.y, this.width, this.height);
    }
}

class WhiteLine {
    constructor(x,y){
        this.position = {
            x: x,
            y: y
        }

        this.width = 4;
        this.height = 36;

        this.imgX = 249;
        this.imgY = 112;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, 1, 1, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y+=4;
        if(this.position.y>canvas.height+this.height){
            this.position.y=-this.height;
        }
    }
}

class Item {
    constructor(x,y,type){
        this.position = {
            x: x-5, // offset for item width
            y: y
        }

        this.type=type;

        if(type=='bullet'){
            this.width = 10;
            this.height = 10;
            this.imgX = 22;
            this.imgY = 65;
        }else{
            this.width = 10;
            this.height = 10;
            this.imgX = 22;
            this.imgY = 15;
        }

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y++;
    }
}

class Trash {
    constructor(x,y){
        this.position = {
            x: x,
            y: y
        }

        this.width = 25;
        this.height = 20;
        this.imgX = 202;
        this.imgY = 24;

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';

        const angles = [-0.5,-0.25,0,0.25,0.5];
        this.speedX = angles[Math.floor(Math.random()*angles.length)];
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y+=0.75;
        this.position.x+=this.speedX;
    }
}

const resetPlayer = _ => {
    player.position.x=30; // Handle this later
    player.lives--;
    gameData.bulletSpeed=250;
    gameData.tempBulletSpeed=gameData.bulletSpeed;
    if(gameData.rampage){
        player.rage=0;
        gameData.rampage=false;
    }
    playerSound.play();
    if(player.lives<0){
        gameData.gameOver = true;
    }
}

const detectCollisions = _ => {
    let bulletsToRemove = new Set();
    let enemiesToRemove = new Set();
    let itemsToRemove = new Set();
    let trashToRemove = new Set();
    for(let i=bullets.length-1; i>=0; i--){
        for(let j=enemies.length-1; j>=0; j--){
            if(bullets[i].position.y<=enemies[j].position.y+enemies[j].height
            &&bullets[i].position.y+bullets[i].height>=enemies[j].position.y
            &&bullets[i].position.x+bullets[i].width>=enemies[j].position.x
            &&bullets[i].position.x<=enemies[j].position.x+enemies[j].width){
                if(!enemies[j].isDumpTruck){
                    explosions.push(new Explosion(enemies[j].position.x+enemies[j].width/2, enemies[j].position.y));
                    enemySound.currentTime=0;
                    enemySound.play();
                    enemiesToRemove.add(j);
                    if(!gameData.rampage){
                        const itemChance = Math.floor(Math.random()*10);
                        if(itemChance==0){
                            items.push(new Item(enemies[j].position.x+enemies[j].width/2,enemies[j].position.y,'rage'));
                        }else if(itemChance==1){
                            items.push(new Item(enemies[j].position.x+enemies[j].width/2,enemies[j].position.y,'bullet'));
                        }
                    }
                }
                bulletsToRemove.add(i);
                break;
            }
        }
        for(let j=trash.length-1; j>=0; j--){
            if(bullets[i].position.y<=trash[j].position.y+trash[j].height
            &&bullets[i].position.y+bullets[i].height>=trash[j].position.y
            &&bullets[i].position.x+bullets[i].width>=trash[j].position.x
            &&bullets[i].position.x<=trash[j].position.x+trash[j].width){
                explosions.push(new Explosion(trash[j].position.x+trash[j].width/2, trash[j].position.y));
                enemySound.currentTime=0;
                enemySound.play();
                trashToRemove.add(j);
                bulletsToRemove.add(i);
                break;
            }
        }
    }
    for(let i=enemies.length-1; i>=0; i--){
        if(enemies[i].isBoss&&enemies.length>5){
            if(enemies.length>6){
                if(enemies[5].position.x+enemies[5].width>=enemies[6].position.x){
                    enemies[5].moveLeft=!enemies[5].moveLeft;
                    enemies[6].moveLeft=!enemies[6].moveLeft;
                }
                if(enemies[5].position.x<=enemies[4].position.x+enemies[4].width){
                    enemies[5].moveLeft=!enemies[5].moveLeft;
                    enemies[4].moveLeft=!enemies[4].moveLeft;
                }
            }else{
                if(enemies[4].position.x+enemies[4].width>canvas.width/2-20){
                    enemies[4].moveLeft=true;
                }
                if(enemies[5].position.x<canvas.width/2+20){
                    enemies[5].moveLeft=false;
                }
            }
        }
        if(enemies[i].position.y>canvas.height+100){
            enemiesToRemove.add(i);
        }else{
            if(!enemies[i].isDumpTruck){
                enemies[i].distance.y = enemies[i].position.y-player.position.y;
                if(enemies[i].distance.y>-player.height*3){
                    if(enemies[i].distance.y<player.height){
                        enemies[i].distance.x = enemies[i].position.x-player.position.x;
                        if(enemies[i].distance.x>0){
                            if(enemies[i].distance.y%10==0){
                                enemies[i].position.x-=1;
                            }
                        }else{
                            if(enemies[i].distance.y%10==0){
                                enemies[i].position.x+=1;
                            }
                        }
                        if(enemies[i].position.y+enemies[i].height>=player.position.y
                        &&enemies[i].position.x+enemies[i].width>=player.position.x
                        &&enemies[i].position.x<=player.position.x+player.width){
                            explosions.push(new Explosion(player.position.x, player.position.y));
                            explosions.push(new Explosion(enemies[i].position.x, enemies[i].position.y));
                            enemiesToRemove.add(i);
                            resetPlayer();
                        }
                    }
                }
            }else{
                if(enemies[i].position.y+enemies[i].height>=player.position.y
                    &&enemies[i].position.x+enemies[i].width>=player.position.x
                    &&enemies[i].position.x<=player.position.x+player.width){
                        explosions.push(new Explosion(player.position.x, player.position.y));
                        resetPlayer();
                    }
            }
        }
    }
    for(let i=items.length-1; i>=0; i--){
        if(items[i].position.y>canvas.height+100){
            itemsToRemove.add(i);
        }else{
            if(items[i].position.y<=player.position.y+player.height
            &&items[i].position.y+items[i].height>=player.position.y
            &&items[i].position.x+items[i].width>=player.position.x
            &&items[i].position.x<=player.position.x+player.width){
                //play sound
                itemsToRemove.add(i);
                // console.log(items[i].type)
                if(items[i].type=='bullet'){
                    if(gameData.bulletSpeed>150){
                        gameData.bulletSpeed-=10;
                        gameData.tempBulletSpeed=gameData.bulletSpeed;
                    }
                }else{
                    player.rage++;
                    if(!gameData.rampage){
                        if(player.rage>=10){
                            player.rage=10;
                            gameData.bulletSpeed=100;
                            gameData.rampage=true;
                            gameData.rampageStart=gameData.time;
                        }
                    }
                }
            }
        }
    }
    for(let i=trash.length-1; i>=0; i--){
        if(trash[i].position.y>canvas.height+100){
            trashToRemove.add(i);
        }else{
            if(trash[i].position.y<=player.position.y+player.height
            &&trash[i].position.y+trash[i].height-8>=player.position.y // Slight offset on trash height due to sprite shape
            &&trash[i].position.x+trash[i].width>=player.position.x
            &&trash[i].position.x<=player.position.x+player.width){
                explosions.push(new Explosion(player.position.x, player.position.y));
                explosions.push(new Explosion(trash[i].position.x, trash[i].position.y));
                trashToRemove.add(i);
                resetPlayer();
                //play sound
            }
        }
    }


    bullets = bullets.filter((_,i)=>!bulletsToRemove.has(i));
    enemies = enemies.filter((_,i)=>!enemiesToRemove.has(i));
    items = items.filter((_,i)=>!itemsToRemove.has(i));
    trash = trash.filter((_,i)=>!trashToRemove.has(i));

    bulletsToRemove=new Set();
    enemiesToRemove=new Set();
    itemsToRemove=new Set();
    trashToRemove=new Set();

    if(enemies.length==4&&gameData.bossFight&&!gameData.levelComplete){
        gameData.levelComplete=true;
    }
}

const keys = {
    "up": false,
    "down": false,
    "left": false,
    "right": false,
    "space": false
}

let enemies = [];
let items = [];
let trash = [];
const whiteLines = [];

let whiteLineY = 0;
for(let i=0; i<6; i++){
    let x = 108;
    for(let j=0; j<3; j++){
        whiteLines.push(new WhiteLine(x,whiteLineY));
        x+=68;
    }
    whiteLineY+=134;
}

let bullets = [];
const explosions = [];

const handleKeys = _ => {
    if(keys["up"]){
        player.velocity.y=-2;
    }else if(keys["down"]){
        player.velocity.y=2;
    }else{
        player.velocity.y=0;
    }
    if(keys["left"]){
        player.velocity.x=-2;
    }else if(keys["right"]){
        player.velocity.x=2;
    }else{
        player.velocity.x=0;
    }
    if(keys["space"]){
        if(gameData["time"]-gameData["lastBullet"]>gameData["bulletSpeed"]){
            bullets.push(new Bullet(player.position.x+11, player.position.y));
            shotSound.currentTime=0;
            shotSound.play();
            gameData["muzzleFlash"] = true;
            gameData["lastBullet"]=gameData["time"];
        }
    }
}

const startBossFight = _ => {
    enemySprites.push([54,123,0,3]);
    enemies.push(new Enemy(47,-100,true),new Enemy(117,-100,true),new Enemy(186,-100,true),new Enemy(257,-100,true));
    enemies.push(new Enemy(60,-160,false,true),new Enemy(120,-160,false,true),new Enemy(180,-160,false,true));
}

const convertTime = totalMs => {
    let ms = totalMs % 1000;
    let minutes = Math.floor((totalMs / 60000)) % 60;
    let seconds = Math.floor((totalMs / 1000)) % 60;
    if(seconds<10){
        if(ms<10){
            return ''+minutes+':0'+seconds+':00'+ms+'';
        }else if(ms<100){
            return ''+minutes+':0'+seconds+':0'+ms+'';
        }else{
            return ''+minutes+':0'+seconds+':'+ms+'';
        }
    }else{
        if(ms<10){
            return ''+minutes+':'+seconds+':00'+ms+'';
        }else if(ms<100){
            return ''+minutes+':'+seconds+':0'+ms+'';
        }else{
            return ''+minutes+':'+seconds+':'+ms+'';
        }
    }
}

const update = _ => {
    for(let i=0; i<whiteLines.length; i++){
        whiteLines[i].move();
    }
    player.move();
    for(let i=0; i<bullets.length; i++){
        bullets[i].move();
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].move();
    }
    for(let i=0; i<items.length; i++){
        items[i].move();
    }
    for(let i=0; i<trash.length; i++){
        trash[i].move();
    }
    detectCollisions();
}

const draw = _ => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    yellowLineLeft.draw();
    yellowLineRight.draw();
    for(let i=0; i<whiteLines.length; i++){
        whiteLines[i].draw();
    }
    player.draw();
    for(let i=0; i<bullets.length; i++){
        bullets[i].draw();
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].draw();
    }
    for(let i=0; i<items.length; i++){
        items[i].draw();
    }
    for(let i=0; i<trash.length; i++){
        trash[i].draw();
    }
    for(let i=0; i<explosions.length; i++){
        explosions[i].draw();
    }
    if(gameData["gameOver"]){
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameData["message"], canvas.width/2, canvas.height/2);
    }else if(gameData["nextLevel"]){
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Level Complete", canvas.width/2, canvas.height/2);
    }else{
        if(gameData["lastMessage"]>gameData["time"]){
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Vol ${gameData["soundVolume"]}`, canvas.width/2, canvas.height/2);
        }
    }
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${player.lives}`, 10, 25);
    ctx.fillText(`Rage: ${player.rage}`, 10, 50);
    ctx.fillText(`Bullet Speed: ${gameData.bulletSpeed}`, 10, 75);
    if(gameData.time<12000){ // 2 minutes == 120000)
        ctx.fillText(`Time: ${convertTime(gameData.time)}`, 10, 100);
    }else{
        ctx.fillText(`BOSS`, 10, 100);
        if(!gameData.bossFight){
            enemies.length=0;
            bullets.length=0;
            items.length=0;
            startBossFight();
            gameData.bossFight=true;
        }
    }
}

// Use second (standbyEnemies) array to recycle enemies instead of deleting them
const gameLoop = _ => {
    gameData["time"] = new Date()-gameData["startTime"];
    if(gameData["time"]-gameData["lastEnemy"]>750&&enemies.length<16&&!gameData.bossFight){ // Change based on difficulty
        if(gameData["enemySpots"].length>2){
            const enemyIndex = Math.floor(Math.random()*(gameData["enemySpots"].length-1));
            enemies.push(new Enemy(gameData["enemySpots"][enemyIndex][0],gameData["enemySpots"][enemyIndex][1]));
            const temp = gameData["enemySpots"][enemyIndex];
            gameData["enemySpots"][enemyIndex] = gameData["enemySpots"][gameData["enemySpots"].length-1];
            gameData["enemySpots"][gameData["enemySpots"].length-1] = temp;
            gameData["enemySpots"].length-=1;
        }else{
            enemies.push(new Enemy(gameData["enemySpots"][0][0],gameData["enemySpots"][0][1]));
            enemies.push(new Enemy(gameData["enemySpots"][1][0],gameData["enemySpots"][1][1]+10));
            gameData["enemySpots"]=[[60,-100],[128,-100],[196,-100],[264,-100]];
        }
        gameData["lastEnemy"]=gameData["time"];
    }
    if(gameData.rampage){
        if(gameData.time-gameData.rampageStart>10000){
            player.rage=0;
            gameData.bulletSpeed=gameData.tempBulletSpeed;
            gameData.rampage=false;
        }
    }
    if(gameData.bossFight&&!gameData.levelComplete){
        if(gameData["time"]-gameData["lastTrash"]>1500){
            for(let i=0; i<4; i++){
                if(enemies[i].position.y>canvas.height*0.33){
                    trash.push(new Trash(enemies[i].position.x+enemies[i].width/2,enemies[i].position.y+enemies[i].height-33));
                }
            }
            gameData["lastTrash"]=gameData["time"];
        }
    }

    gameData["muzzleFlash"] = false;
    handleKeys();
    update();
    draw();
    
    if(!gameData["gameOver"]){
        requestAnimationFrame(gameLoop);
    }else{
        music.pause();
    }
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
        // console.log(items.length)
    }
    if(e.key === ' '){
        keys["space"] = true;
    }
    if(e.key === 'q'){
        gameData["gameOver"] = true;
    }
    if(e.key === 'a'){
        if(gameData["gameOver"]){
            gameData["gameOver"]=false;
            // music.play();
            gameLoop();
        }
    }
    if(e.key === 'n'){
        // items.push(new Item(200,55,'rage'));
        // console.log(items.length)
    }
    if(e.key === 'v'){
        gameData["soundVolume"]++;
        if(gameData["soundVolume"]>3){
            gameData["soundVolume"]=0;
        }
        for(let i=0; i<sounds.length; i++){
            switch(gameData["soundVolume"]){
                case 0:
                    sounds[i].volume=0;
                    break;
                case 1:
                    sounds[i].volume=0.33;
                    break;
                case 2:
                    sounds[i].volume=0.66;
                    break;
                default:
                    sounds[i].volume=1;
                    break;
            }
        }
        gameData["lastMessage"]=gameData["time"]+500;
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
const player = new Player();
const yellowLineLeft = new YellowLine(36);
const yellowLineRight = new YellowLine(canvas.width-40)

gameLoop();