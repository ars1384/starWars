const DEV_MODE = false;

class Game {
    constructor() {
        this.stage = document.createElement('canvas');
        this.ctx = this.stage.getContext('2d');
        this.dialogue = document.querySelector('.dialogue');
        this.startBtn = this.dialogue.querySelector('button');
        this.hud = document.querySelector('.hud');
        this.scoreNode = this.hud.querySelector('.hud__score span');
        
        this.ship = null;
        this.lasers = [];
        this.enemies = [];
        this.playing = false;
        this.gameStarted = false;
        this.speedMultiplier = 1;
        this.enemySeedFrameInterval = 100;
        this.score = 0;
        this.tick = 0;
        this.laserTick = 0;

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', this.startGame.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        document.body.appendChild(this.stage);
        this.onResize();
        
        this.ship = new Ship({ color: 'white', x: -100, y: -100 });
        this.playing = true;
        this.render();
    }

    startGame(e) {
        console.log('Starting game...');
        this.dialogue.classList.add('dialogue--hidden');
        this.hud.classList.remove('hud--hidden');
        e.currentTarget.blur();

        this.speedMultiplier = 1;
        this.enemySeedFrameInterval = 100;
        this.ship.x = this.stage.width * 0.5 - this.ship.radius - 0.5;
        this.ship.y = this.stage.height - this.ship.radius - 30;
        this.enemies = [];
        this.gameStarted = true;
    }

    onResize() {
        this.stage.width = window.innerWidth;
        this.stage.height = window.innerHeight;
    }

    render() {
        if (this.playing) {
            let xPos = this.ship.x;

            if (this.tick % this.enemySeedFrameInterval === 0 && this.ship.active) {
                const enemy = new Enemy();
                this.enemies.push(enemy);
            }

            this.ctx.save();
            this.ctx.fillStyle = '#202735';
            this.ctx.fillRect(0, 0, this.stage.width, this.stage.height);
            this.ctx.restore();

            if (this.ship.left)
                xPos = this.ship.x -= this.ship.speed;
            else if (this.ship.right)
                xPos = this.ship.x += this.ship.speed;

            if (this.gameStarted) {
                if (xPos < 0)
                    xPos = 0;
                else if (xPos > this.stage.width - this.ship.width)
                    xPos = this.stage.width - this.ship.width;
            }

            if (this.ship.active && this.ship.shooting) {
                if (this.laserTick === 0 || this.laserTick % 10 === 0) {
                    let laser = new Laser({ color: 'white', x: this.ship.x + this.ship.radius - 3 });
                    this.lasers.push(laser);
                }
            }

            this.drawShip(xPos);
            this.handleShipCollision();
            this.handleLaserCollision();
            this.drawLasers();
            this.drawEnemies();
            this.enemyCleanup();
            this.laserCleanup();

            if (this.ship.shooting) this.laserTick++;
            this.tick++;
        }

        requestAnimationFrame(this.render.bind(this));
    }

    drawShip(xPosition) {
        if (this.ship.active) {
            this.ship.update(xPosition);
            this.ship.draw(this.ctx);
        }
    }

    handleShipCollision() {
        if (this.enemies.length) {
            for (let enemy of this.enemies) {
                let collision = Game.hitTest(this.ship, enemy);
                if (collision) {
                    console.log('You have been destroyed');
                    this.ship.active = false;
                    setTimeout(() => {
                        this.ship.active = true;
                        this.speedMultiplier = 1;
                        this.enemySeedFrameInterval = 100;
                        this.score = 0;
                        this.scoreNode.textContent = this.score;
                    }, 2000);
                }
            }
        }
    }

    handleLaserCollision() {
        for (let enemy of this.enemies) {
            for (let laser of this.lasers) {
                let collision = Game.hitTest(laser, enemy);
                if (collision && laser.active) {
                    console.log('You destroyed an enemy');
                    enemy.active = false;
                    laser.active = false;

                    this.speedMultiplier += 0.025;
                    if (this.enemySeedFrameInterval > 20) {
                        this.enemySeedFrameInterval -= 2;
                    }

                    this.score += Game.calcScore(enemy.radius);
                    this.scoreNode.textContent = this.score;
                }
            }
        }
    }

    drawEnemies() {
        if (this.enemies.length) {
            for (let enemy of this.enemies) {
                if (enemy.active) {
                    enemy.update(enemy.x, enemy.y += enemy.speed * this.speedMultiplier);
                    enemy.draw(this.ctx);
                }
            }
        }
    }

    enemyCleanup() {
        if (this.enemies.length) {
            this.enemies = this.enemies.filter(enemy => {
                let visible = enemy.y < this.stage.height + enemy.width;
                let active = enemy.active === true;
                return visible && active;
            });
        }
    }

    drawLasers() {
        if (this.lasers.length) {
            for (let laser of this.lasers) {
                if (laser.active) {
                    laser.update(laser.y -= laser.speed);
                    laser.draw(this.ctx);
                }
            }
        }
    }

    laserCleanup() {
        this.lasers = this.lasers.filter(laser => {
            let visible = laser.y > -laser.height;
            let active = laser.active === true;
            return visible && active;
        });
    }

    static hitTest(item1, item2) {
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

    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static calcScore(x) {
        return Math.floor((1 / x) * 500);
    }
}

class Ship {
    constructor(options) {
        this.radius = 15;
        this.x = options.x || stage.width * 0.5 - this.radius - 0.5;
        this.y = options.y || stage.height - this.radius - 30;
        this.width = this.radius * 2;
        this.height = this.width;
        this.color = options.color || 'white';
        this.left = false;
        this.right = false;
        this.speed = 10;
        this.active = true;
        this.shooting = false;

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    update(x) {
        this.x = x;
        this.y = stage.height - this.radius - 30;
    }

    draw(ctx) {
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

    onKeyDown(e) {
        if (this.active) {
            if (e.keyCode === 39) this.right = true;
            else if (e.keyCode === 37) this.left = true;

            if (e.keyCode == 32 && !this.shooting) {
                this.shooting = true;
                laserTick = 0;
            }
        }
    }

    onKeyUp(e) {
        if (e.key === 'ArrowRight') this.right = false;
        else if (e.key === 'ArrowLeft') this.left = false;
        else if (e.keyCode == 32) this.shooting = false;
    }
}

class Laser {
    constructor(options) {
        this.x = options.x - 0.5;
        this.y = options.y || stage.height - 50;
        this.width = 6;
        this.height = 20;
        this.speed = 15;
        this.color = options.color || 'white';
        this.active = true;
    }

    update(y) {
        this.y = y;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(options) {
        this.radius = 20;
        this.width = this.radius * 2;
        this.height = this.width;
        this.x = Game.randomBetween(0, stage.width - this.width);
        this.y = -this.radius * 2;
        this.color = options !== undefined && options.color ? options.color : 'red';
        this.speed = 2;
        this.active = true;
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        if (DEV_MODE) {
            ctx.fillStyle = 'skyblue';
            ctx.fillRect(this.x, this.y, 100, 100);
        }
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, 30, 30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

const game = new Game();
