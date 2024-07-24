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
    "gamePaused": false,
    "muzzleFlash": false,
    "message": "Click/Tap to play",
    "bossFight": false,
    "lastTrash": 0,
    "levelComplete": false,
    "nextLevel": false,
    "extraLife": 100,
    "invincibleTimer": 0,
    "alpha": 1,
    "raiseAlpha": false,
    "mouseDown": false,
    "lastFrameTime": 0
}

gameData.lastFrameTime = performance.now();
const canvas = document.querySelector('canvas');
canvas.width = 360;
canvas.height = 740;
let ctx = canvas.getContext('2d');
ctx.font = '40px SpaceJunkXL, Arial, Helvetica, sans-serif';
ctx.fillStyle = 'white';
const scale = 1;
const music = new Audio('media/level1.ogg');
const bossMusic = new Audio('media/boss_fight.ogg');
const rampageMusic = new Audio('media/rampage.ogg');
const shotSound = new Audio('media/shot.ogg');
shotSound.volume=0.25;
const enemySound = new Audio('media/enemy.ogg');
const playerSound = new Audio('media/player.ogg');
const explosionSound = new Audio('media/explosion.ogg');
const powSound = new Audio('media/pow.ogg');
const sounds = [shotSound, enemySound, playerSound, explosionSound, powSound];

const enemySprites = [
    [29,56,87,70],[24,46,82,10],[33,70,54,56],[26,48,223,78],[28,51,54,5],[16,33,227,45],[25,38,106,32],
    [30,51,146,128],[30,51,176,128],[28,51,206,128],[18,37,235,128],[27,47,170,79],[28,48,116,78],[26,48,197,78]
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

const bgFill = _ => {
    ctx.fillStyle = 'rgb(33,33,33)';
    ctx.fillRect(0,canvas.height/2-100,canvas.width,200);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'whitesmoke';
}

class Player {
    constructor(){
        this.lives = 2;
        this.rage = 0;
        this.bullets = 1;
        this.score = 0;
        this.invincible = false;

        this.position = {
            x: 200,
            y: 600
        }
        this.velocity = {
            x: 0,
            y: 0
        }
        this.target = {
            x: 0,
            y: 0
        }

        this.maxSpeed = 250;
        this.speedLimit = 50;
        this.offsetMultiplier = 3;

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
        if(this.invincible){
            if(gameData.alpha<=.2){
                gameData.raiseAlpha=true;
            }
            if(gameData.alpha>=1){
                gameData.raiseAlpha=false;
            }
            gameData.raiseAlpha ? gameData.alpha+=.02 : gameData.alpha-=.02;
            ctx.globalAlpha=gameData.alpha;
            ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
            ctx.globalAlpha=1;
        }else{
            ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
        }
        if(gameData.muzzleFlash){
            ctx.drawImage(this.image, this.muzzleX, this.muzzleY, this.muzzleW, this.muzzleH, this.position.x+8, this.position.y-8, this.muzzleW, this.muzzleH);
        }
    }

    move(dt){
        if(this.invincible){
            this.position.x += this.velocity.x*dt*.5;
            this.position.y += this.velocity.y*dt*.5;
        }else{
            this.position.x += this.velocity.x*dt;
            this.position.y += this.velocity.y*dt;
        }
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

    move(dt){
        this.position.y -= 450*dt;
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

        this.speedX = 0;

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

    move(dt){
        if(this.isDumpTruck){
            if(gameData.levelComplete){
                if(this.position.y+this.height>-5){
                    this.position.y-=200*dt;
                }else{
                    enemies.length=0;
                    gameData.nextLevel=true;
                }
            }else{
                if(this.position.y<canvas.height/2-50){
                    this.position.y+=100*dt;
                }
            }
        }else if(this.isBoss){
            if(this.position.y<canvas.height/2-160){
                this.position.y+=100*dt;
            }
            if(this.position.x<32){
                this.moveLeft=false;
            }
            if(this.position.x>canvas.width-32-this.width){
                this.moveLeft=true;
            }
            this.moveLeft ? this.position.x-=50*dt : this.position.x+=50*dt;
        }else{
            this.position.x+=this.speedX*dt;
            this.position.y+=200*dt;
            contain(this.position,this.width,this.height);
        }
    }
}

class Explosion {
    constructor(x,y,isNuke){
        this.position = {
            x: x-16, // offset for exp width
            y: y+16 // offset for exp height
        }
        this.isNuke=isNuke;

        this.currentFrame = 0;
        this.spriteLoc = [[106,0],[106,0],[106,0],[138,13],[138,13],[170,13],[170,13],[163,45],[170,13],[170,13],[138,13],[138,13],[106,0],[106,0]];
        this.width = 32;
        this.height = 32;

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        if(this.currentFrame<14){
            if(this.isNuke){
                ctx.drawImage(this.image, 
                    this.spriteLoc[this.currentFrame][0], 
                    this.spriteLoc[this.currentFrame][1], 
                    this.width, this.height, this.position.x, this.position.y, 320, 320);
            }else{
                ctx.drawImage(this.image, 
                    this.spriteLoc[this.currentFrame][0], 
                    this.spriteLoc[this.currentFrame][1], 
                    this.width, this.height, this.position.x, this.position.y, this.width, this.height);
            }
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

    move(dt){
        this.position.y+=4; // Needs dt
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
            this.width = 20;
            this.height = 15;
            this.imgX = 1;
            this.imgY = 156;
        }else{
            this.width = 25;
            this.height = 28;
            this.imgX = 21;
            this.imgY = 156;
        }

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(dt){
        this.position.y+=100*dt;
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

        const angles = [-33,-25,0,25,33];
        this.speedX = angles[Math.floor(Math.random()*angles.length)];
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(dt){
        this.position.y+=100*dt;
        this.position.x+=this.speedX*dt;
    }
}

const resetPlayer = _ => {
    player.position.x=66;
    player.position.y=canvas.height-150;
    player.invincible=true;
    gameData.invincibleTimer=gameData.time;
    player.lives--;
    player.bullets=1;
    gameData.bulletSpeed=250;
    gameData.tempBulletSpeed=gameData.bulletSpeed;
    if(gameData.rampage){
        player.rage=0;
        gameData.rampage=false;
        rampageMusic.pause();
        rampageMusic.currentTime=0;
        music.play();
    }
    playerSound.play();
    if(player.lives<0){
        explosions=[];
        gameData.alpha=0;
        gameData.message="Game Over";
        gameData.gameOver=true;
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
                    player.score++;
                    if(!gameData.rampage&&!gameData.bossFight){
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
                            enemies[i].speedX=-50;
                        }else{
                            enemies[i].speedX=50;
                        }
                        if(enemies[i].position.y+enemies[i].height>=player.position.y
                        &&enemies[i].position.x+enemies[i].width>=player.position.x
                        &&enemies[i].position.x<=player.position.x+player.width){
                            explosions.push(new Explosion(player.position.x, player.position.y));
                            explosions.push(new Explosion(enemies[i].position.x, enemies[i].position.y));
                            enemiesToRemove.add(i);
                            player.score++;
                            if(!player.invincible){
                                resetPlayer();
                            }
                        }
                    }else{
                        enemies[i].speedX=0;
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
                powSound.play();
                itemsToRemove.add(i);
                player.score+=5;
                if(items[i].type=='bullet'){
                    if(player.bullets<9){
                        player.bullets++;
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
                            music.pause();
                            music.currentTime=0;
                            rampageMusic.play();
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
                player.score++;
                if(!player.invincible){
                    resetPlayer();
                }
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
let explosions = [];

const startBossFight = _ => {
    enemySprites.push([54,123,0,3]);
    enemies.push(new Enemy(47,-100,true),new Enemy(117,-100,true),new Enemy(186,-100,true),new Enemy(257,-100,true));
    enemies.push(new Enemy(60,-160,false,true),new Enemy(120,-160,false,true),new Enemy(180,-160,false,true));
}

const update = deltaTime => {
    const dt = deltaTime/1000;
    for(let i=0; i<whiteLines.length; i++){
        whiteLines[i].move(dt);
    }
    if(player.invincible){
        if(gameData.time-gameData.invincibleTimer>2000){
            player.invincible=false;
        }
    }
    player.move(dt);
    for(let i=0; i<bullets.length; i++){
        bullets[i].move(dt);
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].move(dt);
    }
    for(let i=0; i<items.length; i++){
        items[i].move(dt);
    }
    for(let i=0; i<trash.length; i++){
        trash[i].move(dt);
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
    for(let i=0; i<items.length; i++){
        items[i].draw();
    }
    for(let i=0; i<bullets.length; i++){
        bullets[i].draw();
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].draw();
    }
    for(let i=0; i<trash.length; i++){
        trash[i].draw();
    }
    for(let i=0; i<explosions.length; i++){
        explosions[i].draw();
    }
    if(gameData.gameOver){
        bgFill();
        ctx.font = '40px SpaceJunkXL, Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gameData.message, canvas.width/2, canvas.height/2-25);
        if(player.lives<=0){
            ctx.fillText("Click here to try again", canvas.width/2, canvas.height/2+25);
            document.onmousedown = e => {
                e.preventDefault();
                location.reload();
            }
            document.ontouchstart = e => {
                e.preventDefault();
                location.reload();
            }
        }
    }else if(gameData.nextLevel){
        bgFill();
        ctx.font = '40px SpaceJunkXL, Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Level Complete", canvas.width/2, canvas.height/2-25);
        ctx.fillText("Click here for more", canvas.width/2, canvas.height/2+25);
        document.onmousedown = e => {
            e.preventDefault();
            window.location.href = "https://tmdstudios.github.io/";
        }
        document.ontouchstart = e => {
            e.preventDefault();
            window.location.href = "https://tmdstudios.github.io/";
        }
    }
    if(!gameData.gameOver&&!gameData.gamePaused&&!gameData.levelComplete){
        ctx.font = '20px SpaceJunkXL, Arial, Helvetica, sans-serif';
        ctx.textAlign = 'left';
        for(let i=0; i<player.lives; i++){
            ctx.drawImage(player.image, player.imgX, player.imgY, player.width, player.height, 5+i*player.width*.8, 10, player.width*.8, player.height*.8);
        }
        ctx.textAlign = 'center';
        ctx.fillText(`Level 1`, canvas.width/2, 30);
        if(gameData.time<60000){ // 1 minute == 60000)
            let seconds = 60-(Math.floor((gameData.time / 1000)) % 60);
            if(seconds<60){
                seconds<10 ? ctx.fillText(`Time: 0:0${seconds}`, canvas.width/2, 55) : ctx.fillText(`Time: 0:${seconds}`, canvas.width/2, 55);
            }else{
                ctx.fillText(`Time: 1:00`, canvas.width/2, 55);
            }
        }else{
            ctx.fillText(`BOSS`, canvas.width/2, 55);
            if(!gameData.bossFight){
                enemies.length=0;
                bullets.length=0;
                items.length=0;
                startBossFight();
                gameData.bossFight=true;
                music.pause();
                rampageMusic.pause();
                bossMusic.play();
                explosions.push(new Explosion(canvas.width/2-160, canvas.height/2-160, true));
                explosionSound.play();
            }
        }
        if(gameData.rampage){
            ctx.drawImage(player.image, 241, 178, 6, 6, canvas.width-136, 12, 13*player.rage, 24);
        }else{
            ctx.drawImage(player.image, 249, 178, 6, 6, canvas.width-136, 12, 13*player.rage, 24);
        }
        ctx.drawImage(player.image, 0, 128, 133, 28, canvas.width-137, 10, 132, 28);
        for(let i=0; i<player.bullets; i++){
            ctx.drawImage(player.image, 133, 128, 13, 28, (canvas.width-18)-i*15, 42, 13, 28);
        }
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${player.score}`, 5, 68);
    }
    if(gameData.gamePaused&&!gameData.levelComplete){
        bgFill();
        ctx.font = '40px SpaceJunkXL, Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Game Paused", canvas.width/2, canvas.height/2-25);
    }
}

// Use second (standbyEnemies) array to recycle enemies instead of deleting them
const gameLoop = _ => {
    const timeStamp = performance.now();
    const deltaTime = timeStamp-gameData.lastFrameTime;
    gameData.lastFrameTime=timeStamp;
    if(!gameData.gamePaused){
        gameData.time = new Date()-gameData.startTime;
    }
    if(gameData.time-gameData.lastEnemy>750&&enemies.length<16&&!gameData.bossFight&&!gameData.gameOver){
        if(gameData.enemySpots.length>2){
            const enemyIndex = Math.floor(Math.random()*(gameData.enemySpots.length-1));
            enemies.push(new Enemy(gameData.enemySpots[enemyIndex][0],gameData.enemySpots[enemyIndex][1]));
            const temp = gameData.enemySpots[enemyIndex];
            gameData.enemySpots[enemyIndex] = gameData.enemySpots[gameData.enemySpots.length-1];
            gameData.enemySpots[gameData.enemySpots.length-1] = temp;
            gameData.enemySpots.length-=1;
        }else{
            enemies.push(new Enemy(gameData.enemySpots[0][0],gameData.enemySpots[0][1]));
            enemies.push(new Enemy(gameData.enemySpots[1][0],gameData.enemySpots[1][1]+10));
            gameData.enemySpots=[[60,-100],[128,-100],[196,-100],[264,-100]];
        }
        gameData.lastEnemy=gameData.time;
    }
    if(gameData.rampage){
        if(gameData.time-gameData.rampageStart>10000||gameData.bossFight){
            player.rage=0;
            gameData.bulletSpeed=gameData.tempBulletSpeed;
            gameData.rampage=false;
            rampageMusic.pause();
            rampageMusic.currentTime=0;
            if(!gameData.bossFight){
                music.play();
            }
        }
    }
    if(gameData.bossFight&&!gameData.levelComplete){
        if(gameData.time-gameData.lastTrash>1500){
            for(let i=0; i<4; i++){
                if(enemies[i].position.y>canvas.height*0.33){
                    trash.push(new Trash(enemies[i].position.x+enemies[i].width/2,enemies[i].position.y+enemies[i].height-33));
                }
            }
            gameData.lastTrash=gameData.time;
        }
    }

    gameData.muzzleFlash = false;
    if(player.score>=gameData.extraLife){
        gameData.extraLife*=2;
        player.lives++;
        if(player.lives>=4){
            player.lives=4;
        }
    }

    if(gameData.mouseDown){
        if(gameData.time-gameData.lastBullet>gameData.bulletSpeed){
            bullets.push(new Bullet(player.position.x+11, player.position.y));
            shotSound.currentTime=0;
            shotSound.play();
            gameData.muzzleFlash = true;
            gameData.lastBullet=gameData.time;
        }
        const offsetX = player.target.x - player.position.x;
        const offsetY = player.target.y - player.position.y;
        player.velocity.x=offsetX*player.offsetMultiplier;
        player.velocity.y=offsetY*player.offsetMultiplier;
        if(player.velocity.x>player.maxSpeed){
            player.velocity.x=player.maxSpeed;
        }
        if(player.velocity.x<-player.maxSpeed){
            player.velocity.x=-player.maxSpeed;
        }
        if(player.velocity.y>player.maxSpeed){
            player.velocity.y=player.maxSpeed;
        }
        if(player.velocity.y<-(player.maxSpeed-player.speedLimit)){
            player.velocity.y=-(player.maxSpeed-player.speedLimit);
        }
    }else{
        player.velocity.x=0;
        player.velocity.y=0;
    }

    if(!gameData.gamePaused){
        update(deltaTime);
    }
    draw();
    
    if(!gameData.gameOver){
        requestAnimationFrame(gameLoop);
    }else{
        music.pause();
    }
}

canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    gameData.gamePaused=false;
    gameData.startTime = new Date() - gameData.time;
    player.maxSpeed=250;
    player.speedLimit=50;
    player.offsetMultiplier=3;
    if(gameData.gameOver){
        gameData.gameOver=false;
        music.play();
        gameData.startTime = new Date();
        gameLoop();
    }
    const rect = canvas.getBoundingClientRect();
    player.target.x = e.clientX-rect.left;
    player.target.y = e.clientY-rect.top-25;
    gameData.mouseDown=true;
});

canvas.addEventListener('mouseup', e => {
    e.preventDefault();
    gameData.mouseDown=false;
    gameData.gamePaused=true;
});

canvas.addEventListener('mousemove', e => {
    e.preventDefault();
    if(gameData.mouseDown){
        const rect = canvas.getBoundingClientRect();
        player.target.x = e.clientX-rect.left;
        player.target.y = e.clientY-rect.top-25;
    }
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    gameData.gamePaused=false;
    gameData.startTime = new Date() - gameData.time;
    player.maxSpeed=500;
    player.speedLimit=200;
    player.offsetMultiplier=6;
    if(gameData.gameOver){
        gameData.gameOver=false;
        music.play();
        gameData.startTime = new Date();
        gameLoop();
    }
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX-rect.left;
    const touchY = e.touches[0].clientY-rect.top-50;
    player.target.x = touchX;
    player.target.y = touchY;
    gameData.mouseDown=true;
});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    gameData.gamePaused=true;
    gameData.mouseDown=false;
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if(gameData.mouseDown){
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX-rect.left;
        const touchY = e.touches[0].clientY-rect.top-50;
        player.target.x = touchX;
        player.target.y = touchY;
    }
});

gameData.startTime = new Date();
const player = new Player();
const yellowLineLeft = new YellowLine(36);
const yellowLineRight = new YellowLine(canvas.width-40);

ctx.font = '40px SpaceJunkXL, Arial, Helvetica, sans-serif';
ctx.textAlign = 'center';
ctx.fillText(gameData.message, canvas.width/2, canvas.height/2);

const startGame = _ => {
    document.getElementById('welcomeScreen').style.display='none';
    document.getElementById('canvas').style.display='block';
    gameLoop();
}