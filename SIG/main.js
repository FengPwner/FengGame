// Space Invaders — Phaser 3
// Pixel art sprites inspired by Kenney's Space Shooter assets (CC0)
// https://opengameart.org/content/space-shooter-redux

// ── Constants ────────────────────────────────────────────────────────────────

var W = 480, H = 640;
var COLS = 10, ROWS = 5;
var CELL_W = 36, CELL_H = 36;
var PLAYER_SPEED = 220;
var BULLET_SPEED = 400;
var ALIEN_BULLET_SPEED = 180;
var ALIEN_FIRE_INTERVAL = 1200; // ms between alien shots
var FIRE_INTERVAL = 400;        // ms between player auto-fire shots
var STEP_INTERVAL_START = 800;  // ms between alien steps (shrinks as they die)
var STEP_DX = 12;               // pixels per horizontal step
var STEP_DY = 18;               // pixels to drop when hitting a wall

// Points per row (bottom → top)
var ROW_POINTS = [30, 20, 20, 10, 10];

// ── Scene ────────────────────────────────────────────────────────────────────

class GameScene extends Phaser.Scene {

  constructor() { super('GameScene'); }

  // ── preload: build procedural textures ───────────────────────────────────

  preload() {
    this.makePlayerTexture();
    this.makeAlienTextures();
    this.makeBulletTexture();
    this.makeExplosionTexture();
  }

  makePlayerTexture() {
    var g = this.make.graphics({ add: false });
    g.fillStyle(0x44aaff);
    // body
    g.fillRect(11, 16, 10, 12);
    // cockpit
    g.fillRect(14, 8, 4, 8);
    // left wing
    g.fillRect(2, 22, 9, 6);
    // right wing
    g.fillRect(21, 22, 9, 6);
    // engine nozzle
    g.fillStyle(0x88ddff);
    g.fillRect(13, 28, 6, 4);
    g.generateTexture('player', 32, 32);
    g.destroy();
  }

  makeAlienTextures() {
    var types = [
      { key: 'alienA', color: 0x00eeff }, // bottom rows  — crab shape
      { key: 'alienB', color: 0xffee00 }, // middle rows  — squid shape
      { key: 'alienC', color: 0xff44cc }, // top rows     — bug shape
    ];

    types.forEach(({ key, color }) => {
      var g = this.make.graphics({ add: false });
      g.fillStyle(color);
      // shared base: body + eyes + legs vary slightly per type
      if (key === 'alienA') {
        g.fillRect(8, 8, 16, 12);
        g.fillRect(4, 16, 4, 6); g.fillRect(24, 16, 4, 6); // outer legs
        g.fillRect(12, 18, 4, 4); g.fillRect(20, 18, 4, 4); // inner legs
        g.fillRect(10, 10, 4, 4); g.fillRect(18, 10, 4, 4); // eyes
        g.fillRect(6, 6, 4, 4); g.fillRect(22, 6, 4, 4);   // antennae
      } else if (key === 'alienB') {
        g.fillRect(10, 6, 12, 14);
        g.fillRect(6, 12, 4, 8); g.fillRect(22, 12, 4, 8);
        g.fillRect(4, 20, 4, 4); g.fillRect(24, 20, 4, 4);
        g.fillRect(12, 8, 3, 3); g.fillRect(17, 8, 3, 3);  // eyes
        g.fillRect(11, 16, 10, 2);                          // mouth
      } else {
        g.fillRect(8, 10, 16, 10);
        g.fillRect(4, 14, 4, 6); g.fillRect(24, 14, 4, 6);
        g.fillRect(12, 18, 8, 6);
        g.fillRect(10, 12, 4, 4); g.fillRect(18, 12, 4, 4); // eyes
        g.fillRect(8, 6, 4, 4); g.fillRect(20, 6, 4, 4);    // horns
        g.fillRect(14, 22, 2, 4); g.fillRect(16, 22, 2, 4); // mandibles
      }
      g.generateTexture(key, 32, 32);
      g.destroy();
    });
  }

  makeBulletTexture() {
    var g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff);
    g.fillRect(2, 0, 4, 14);
    g.generateTexture('bullet', 8, 16);
    g.destroy();
  }

  makeExplosionTexture() {
    var g = this.make.graphics({ add: false });
    g.fillStyle(0xff8800);
    g.fillRect(12, 4, 8, 8);
    g.fillRect(4, 12, 8, 8);
    g.fillRect(20, 12, 8, 8);
    g.fillRect(12, 20, 8, 8);
    g.fillStyle(0xffff00);
    g.fillRect(14, 8, 4, 16);
    g.fillRect(8, 14, 16, 4);
    g.generateTexture('explosion', 32, 32);
    g.destroy();
  }

  // ── create: place objects ────────────────────────────────────────────────

  create() {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.alienDir = 1;           // 1 = right, -1 = left
    this.stepTimer = 0;
    this.stepInterval = STEP_INTERVAL_START;
    this.alienFireTimer = 0;

    this.player = this.createPlayer();
    this.aliens = this.createAliens();

    this.playerBullet = null;    // only one bullet in flight at a time
    this.alienBullets = [];
    this.fireTimer = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Tap anywhere to restart after game over
    this.input.on('pointerdown', () => { if (this.gameOver) this.scene.restart(); });

    this.scoreText = this.add.text(10, 10, '分数 0', { font: '16px monospace', fill: '#ffffff' });
    this.livesText = this.add.text(W - 10, 10, '生命数 3', { font: '16px monospace', fill: '#ffffff' }).setOrigin(1, 0);
    this.msgText   = this.add.text(W / 2, H / 2, '', { font: '28px monospace', fill: '#ffffff', align: 'center' }).setOrigin(0.5);
  }
  
  

  createPlayer() {
    return this.add.image(W / 2, H - 40, 'player');
  }

  createAliens() {
    var aliens = [];
    var startX = (W - COLS * CELL_W) / 2 + 16;
    var startY = 80;

    for (var row = 0; row < ROWS; row++) {
      var textureKey = row < 1 ? 'alienC' : row < 3 ? 'alienB' : 'alienA';
      for (var col = 0; col < COLS; col++) {
        var x = startX + col * CELL_W;
        var y = startY + row * CELL_H;
        var img = this.add.image(x, y, textureKey);
        var hp = (textureKey === 'alienC') ? 2 : 1;
        aliens.push({ img, points: ROW_POINTS[row], alive: true, hp: hp });

      }
    }
    return aliens;
  }

  // ── update: game loop ────────────────────────────────────────────────────

  update(time, delta) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.fireKey)) this.scene.restart();
      return;
    }

    this.movePlayer(delta);
    this.autoFire(delta);
    this.moveBullets(delta);
    this.stepAliens(delta);
    this.fireAliens(delta);
    this.checkCollisions();
    this.checkWinLose();
  }

  movePlayer(delta) {
    var pointer = this.input.activePointer;
    if (pointer.isDown) {
      // Snap ship X to finger position (clamped to game bounds)
      this.player.x = Phaser.Math.Clamp(pointer.worldX, 16, W - 16);
    } else {
      var dx = 0;
      if (this.cursors.left.isDown)  dx = -PLAYER_SPEED * delta / 1000;
      if (this.cursors.right.isDown) dx =  PLAYER_SPEED * delta / 1000;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx, 16, W - 16);
    }
  }

  autoFire(delta) {
    this.fireTimer += delta;
    if (this.fireTimer >= FIRE_INTERVAL && !this.playerBullet) {
      this.playerBullet = this.add.image(this.player.x, this.player.y - 20, 'bullet');
      this.fireTimer = 0;
    }
  }

  moveBullets(delta) {
    var dt = delta / 1000;

    if (this.playerBullet) {
      this.playerBullet.y -= BULLET_SPEED * dt;
      if (this.playerBullet.y < -10) this.destroyBullet('player');
    }

    this.alienBullets.forEach(b => {
      b.y += ALIEN_BULLET_SPEED * dt;
    });
    this.alienBullets = this.alienBullets.filter(b => {
      if (b.y > H + 10) { b.destroy(); return false; }
      return true;
    });
  }

  stepAliens(delta) {
    this.stepTimer += delta;
    if (this.stepTimer < this.stepInterval) return;
    this.stepTimer = 0;

    var alive = this.aliens.filter(a => a.alive);
    if (alive.length === 0) return;

    // Check if any alien would go out of bounds
    var hitWall = alive.some(a => {
      var nx = a.img.x + STEP_DX * this.alienDir;
      return nx < 20 || nx > W - 20;
    });

    if (hitWall) {
      this.alienDir *= -1;
      alive.forEach(a => { a.img.y += STEP_DY; });
    } else {
      alive.forEach(a => { a.img.x += STEP_DX * this.alienDir; });
    }

    // Speed up as aliens die
    var ratio = alive.length / (COLS * ROWS);
    this.stepInterval = STEP_INTERVAL_START * Math.max(0.15, ratio);
  }

  fireAliens(delta) {
    this.alienFireTimer += delta;
    if (this.alienFireTimer < ALIEN_FIRE_INTERVAL) return;
    this.alienFireTimer = 0;

    // Pick a random alive alien from the bottom of each column
    var columns = {};
    this.aliens.forEach(a => {
      if (!a.alive) return;
      var col = Math.round(a.img.x);
      if (!columns[col] || a.img.y > columns[col].img.y) columns[col] = a;
    });
    var shooters = Object.values(columns);
    if (shooters.length === 0) return;

    var shooter = Phaser.Utils.Array.GetRandom(shooters);
    var b = this.add.image(shooter.img.x, shooter.img.y + 16, 'bullet').setTint(0xff4444);
    this.alienBullets.push(b);
  }

  checkCollisions() {
    var alive = this.aliens.filter(a => a.alive);
    
    // Player bullet vs aliens
    if (this.playerBullet) {
    var br = this.playerBullet.getBounds();

    this.aliens.some(a => {
        if (!a.alive) return false;

        if (Phaser.Geom.Intersects.RectangleToRectangle(br, a.img.getBounds())) {
            a.hp = (a.hp || 1) - 1;
            if (a.hp <= 0) {
                this.score += a.points;
                this.scoreText.setText('分数 ' + this.score);
                
                this.explode(a.img.x, a.img.y);
                a.img.destroy();
                a.alive = false;
            } else {
                 a.img.setTint(0xff0000); 
                 this.time.delayedCall(100, () => a.img.clearTint());
            }

            this.destroyBullet('player');
            return true;
        }
        return false;
    });
}





    // Alien bullets vs player
    if (!this.player) return;
    var pr = this.player.getBounds();
    this.alienBullets = this.alienBullets.filter(b => {
      if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), pr)) {
        this.explode(this.player.x, this.player.y);
        b.destroy();
        this.lives--;
        this.livesText.setText('生命数 ' + this.lives);
        if (this.lives <= 0) {
          this.player.destroy();
          this.player = null;
        } else {
          this.player.x = W / 2;
        }
        return false;
      }
      return true;
    });
  }

  checkWinLose() {
    var alive = this.aliens.filter(a => a.alive);

    if (alive.length === 0) {
      this.endGame('完成游戏!\n\n点击屏幕重新开始');
      return;
    }

    if (this.lives <= 0) {
      this.endGame('游戏结束\n\n点击屏幕重新开始');
      return;
    }

    // Aliens reached the bottom
    if (alive.some(a => a.img.y > H - 60)) {
      this.endGame('游戏结束\n\n点击屏幕重新开始');
    }
  }

  endGame(msg) {
    this.gameOver = true;
    this.msgText.setText(msg);
  }

  explode(x, y) {
    var img = this.add.image(x, y, 'explosion');
    this.time.delayedCall(300, () => img.destroy());
  }

  destroyBullet(who) {
    if (who === 'player' && this.playerBullet) {
      this.playerBullet.destroy();
      this.playerBullet = null;
    }
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000010',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: GameScene
});
