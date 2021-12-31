const DEV_MODE = false;

const stage = document.createElement('canvas'),
    ctx = stage.getContext('2d'),
    dialogue = document.querySelector('.dialogue'),
    startBtn = dialogue.querySelector('button'),
    hud = document.querySelector('.hud'),
    scoreNode = hud.querySelector('.hud__score span');

let ship, lasers = [], enemies = [],
    playing = false,
    gameStarted = false,
    speedMultiplier,
    enemySeedFrameInterval,
    score = 0,
    tick = 0,
    laserTick = 0;

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcScore(x) {
    return Math.floor((1 / x) * 500);
}

function Ship(options) {
    this.radius = 15;
    this.x = options.x || stage.width * .5 - this.radius - .5;
    this.y = options.y || stage.height - this.radius - 30;
    this.width = this.radius * 2;
    this.height = this.width;
    this.color = options.color || 'white';
    this.left = false;
    this.right = false;
    this.speed = 10;
    this.active = true;

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
}

Ship.prototype.update = function(x) {
    this.x = x;
    this.y = stage.height - this.radius - 30;
}

Ship.prototype.draw = function() {
    ctx.save();

    if (DEV_MODE) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.width);
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + this.radius - 5, this.y, 10, this.radius);
    ctx.fillRect(this.x, this.y + this.radius, this.width, 10);
    ctx.restore();
}

Ship.prototype.onKeyDown = function(e) {
    if (ship.active) {
        if (e.keyCode === 39) this.right = true;
        else if (e.keyCode === 37) this.left = true;

        if (e.keyCode == 32 && !this.shooting) {
            this.shooting = true;
            laserTick = 0;
        }
    }
}

Ship.prototype.onKeyUp = function(e) {
    if (e.key === 'ArrowRight') this.right = false;
    else if (e.key === 'ArrowLeft') this.left = false;
    else if (e.keyCode == 32) this.shooting = false;
}
// rang tiir
function Laser(options) {
    this.x = options.x - .5;
    this.y = options.y || stage.height - 50;
    this.width = 6;
    this.height = 20;
    this.speed = 15;
    this.color = options.color || 'white';
    this.active = true;
}

Laser.prototype.update = function(y) {
    this.y = y;
}

Laser.prototype.draw = function() {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function Enemy(options) {
    this.radius = 20;
    this.width = this.radius * 2;
    this.height = this.width;
    this.x = randomBetween(0, stage.width - this.width);
    this.y = -this.radius * 2;
    this.color = options != undefined && options.color ? options.color : 'red';
    this.speed = 2;
    this.active = true;
}

Enemy.prototype.update = function(x, y) {
    this.x = x;
    this.y = y;
}

Enemy.prototype.draw = function() {
    if (DEV_MODE) {
        ctx.fillStyle = 'skyblue';
        ctx.fillRect(this.x, this.y, 100, 100);
    }

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(this.x , this.y , 30, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function hitTest(item1, item2) {
    let collision = true;
    if (
        item1.x > item2.x + item2.width ||
        item1.y > item2.y + item2.height ||
        item2.x > item1.x + item1.width ||
        item2.y > item1.y + item1.height
    ) {
        collision = false;
    }
    return collision;
}

function handleLaserCollision() {
    for (let enemy of enemies) {
        for (let laser of lasers) {
            let collision = hitTest(laser, enemy);
            if (collision && laser.active) {
                console.log('شما یک دشمن کشتید');
                enemy.active = false;
                laser.active = false;

                // sorat doshman
                speedMultiplier += .025;
                if (enemySeedFrameInterval > 20) {
                    enemySeedFrameInterval -= 2;
                }

                // emtyaz
                score += calcScore(enemy.radius);
                scoreNode.textContent = score;
            }
        }
    }
}

function handleShipCollision() {
    if (enemies.length) {
        for (let enemy of enemies) {
            let collision = hitTest(ship, enemy);
            if (collision) {
                console.log('شما نابود شدید');
                ship.active = false;
                setTimeout(() => {
                    ship.active = true;
                    speedMultiplier = 1;
                    enemySeedFrameInterval = 100;
                    score = 0;
                    scoreNode.textContent = score;
                }, 2000);
            }
        }
    }
}

function drawShip(xPosition) {
    if (ship.active) {
        ship.update(xPosition);
        ship.draw();
    }
}

function drawEnemies() {
    if (enemies.length) {

        for (let enemy of enemies) {
            // sakht enemy
            if (enemy.active) {
                enemy.update(enemy.x, enemy.y += enemy.speed * speedMultiplier);
                enemy.draw();
            }
        }
    }
}

function enemyCleanup() {
    if (enemies.length) {
        enemies = enemies.filter(enemy => {
            let visible = enemy.y < stage.height + enemy.width;
            let active = enemy.active === true;
            return visible && active;
        });
    }
}

function drawLasers() {
    if (lasers.length) {
        for (let laser of lasers) {
            if (laser.active) {
                laser.update(laser.y -= laser.speed);
                laser.draw();
            }
        }
    }
}

function laserCleanup() {
    lasers = lasers.filter(laser => {
        let visible = laser.y > -laser.height;
        let active = laser.active === true;
        return visible && active;
    });
}

function render(delta) {
    if (playing) {
        let xPos = ship.x;

        // doshman jadid
        if (tick % enemySeedFrameInterval === 0 && ship.active) {
            const enemy = new Enemy();
            enemies.push(enemy);
            console.log({enemySeedFrameInterval, speedMultiplier})
        }

        // background
        ctx.save();
        ctx.fillStyle = '#202735';
        ctx.fillRect(0, 0, stage.width, stage.height);
        ctx.restore();

        // harkat
        if (ship.left)
            xPos = ship.x -= ship.speed;
        else if (ship.right)
            xPos = ship.x += ship.speed;

        // emtyaz sahne
        if (gameStarted) {
            if (xPos < 0)
                xPos = 0;
            else if (xPos > stage.width - ship.width)
                xPos = stage.width - ship.width;
        }

        // shore laser
        if (ship.active && ship.shooting) {
            if (laserTick === 0 || laserTick % 10 === 0) {
                let laser = new Laser({
                    color: 'white',
                    x: ship.x + ship.radius - 3
                });
                lasers.push(laser);
            }
        }

        drawShip(xPos);

        handleShipCollision();
        handleLaserCollision();

        drawLasers();
        drawEnemies();

        enemyCleanup();
        laserCleanup();

        if (ship.shooting) laserTick++;
        tick++;
    }

    requestAnimationFrame(render);
}

function startGame(e) {
    console.log('شروع بازی...');
    dialogue.classList.add('dialogue--hidden');
    hud.classList.remove('hud--hidden');
    e.currentTarget.blur();

    // reset bazi
    speedMultiplier = 1;
    enemySeedFrameInterval = 100;
    ship.x = stage.width * .5 - ship.radius - .5;
    ship.y = stage.height - ship.radius - 30;
    enemies = [];
    gameStarted = true;
}

function onResize() {
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
}

startBtn.addEventListener('click', startGame);
window.addEventListener('resize', onResize);

document.body.appendChild(stage);
onResize();

// shoro ship
ship = new Ship({ color:'white', x: -100, y: -100});

speedMultiplier = 6,
    enemySeedFrameInterval = 20;

playing = true;
render();
