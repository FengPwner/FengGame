var phase = 'idle';
function getBestScore() {
    try {
        return parseInt(localStorage.getItem('snake_best_score') || '0', 10);
    } catch (e) {
        return 0;
    }
}


function saveBestScore(newScore) {
    const oldBest = getBestScore();
    if (newScore > oldBest) {
        localStorage.setItem('snake_best_score', newScore.toString());
        return true;
    }
    return false;
}



var pauseCount = 3; 
var pauseTimer = null; 

function togglePause() {
    if (phase === 'dead') return;

    var btn = document.getElementById('pauseBtn');
    if (!btn) return;
    if (pauseCount <= 0) {
        return; 
    }
    if (phase === 'paused') return;

    pauseCount--; 
    
    phase = 'paused';
    clearInterval(loopTimer); 

    var remaining = 2; 
    
    if (pauseTimer) clearInterval(pauseTimer);

    pauseTimer = setInterval(function() {
        remaining--;

        if (remaining > 0) {
            btn.innerText = "暂停中……" + remaining + "s";
        } else {
            clearInterval(pauseTimer);
            pauseTimer = null;

            phase = 'running';
            loopTimer = setInterval(tick, 1000 / speed);

            if (pauseCount <= 0) {
                btn.classList.add('hidden');
                // btn.style.visibility = 'hidden'; 
            } else {
                btn.innerText = "暂停(" + pauseCount + "/3)";
            }
        }
    }, 1000); 

    btn.innerText = "暂停中……" + remaining + "s";
}





var MIN_CELL_SIZE = 20; 
var COLS, ROWS, CELL;
var FPS = 120;
var CELL; 


// --- State ---
var snake, dir, nextDir, food, score, best, phase, loopTimer;

function init() {
    var startX = Math.floor(COLS / 2);
    var startY = Math.floor(ROWS / 2);
    
    snake = [
        { x: startX, y: startY },    
        { x: startX - 1, y: startY }, 
        { x: startX - 2, y: startY }  
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    pauseCount = 3
    score = 0;
    best = getBestScore();
    placeFood();
}



function placeFood() {
    do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(function(s) { return s.x === food.x && s.y === food.y; }));
}

function resetGame() {
    if (loopTimer) clearInterval(loopTimer);
    if (pauseTimer) {
        clearInterval(pauseTimer);
        pauseTimer = null;
    }
    

    init();
    

    snake = [
        { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2) }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    
    
    score = 0;
    speed = 3;
    pauseCount = 3;
    best = getBestScore();
    placeFood();
    draw(); 

}



function start() {
    if (loopTimer) clearInterval(loopTimer);
    init();
    best = getBestScore();
    pauseCount = 3; 
    speed = 3;
    phase = 'running';
    var btn = document.getElementById('pauseBtn');
    if (btn) {
        btn.classList.remove('hidden');
        btn.innerText = '暂停(3/3)';
    }
    pauseCount = 3;
    if (pauseTimer) {
        clearInterval(pauseTimer);
        pauseTimer = null;
    }
    loopTimer = setInterval(tick, 1000 / speed);
}

// --- Game loop  ---
function tick() {
    
    if (phase === 'paused') return; 
    dir = nextDir;

    
    var head = { 
        x: snake[0].x + dir.x, 
        y: snake[0].y + dir.y 
    };

    
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        phase = 'dead';

        var btn = document.getElementById('pauseBtn');
        btn.classList.add('hidden');

        best = Math.max(best, score);
        saveBestScore(score);
        clearInterval(loopTimer);
        draw(); 
        return;
    }

    if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
        phase = 'dead';
       
        var btn = document.getElementById('pauseBtn');
        btn.classList.add('hidden');

        best = Math.max(best, score);
        saveBestScore(best);
        clearInterval(loopTimer);
        draw();
        return;
    }
    
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        speed++;
        if (score > best) {
        best = score; 
        saveBestScore(best);
        }
        clearInterval(loopTimer); 
        loopTimer = setInterval(tick, 1000 / speed); 
        
        placeFood();
    } else {
        snake.pop();
    }

    draw();
}

// ── Resize ────────────────────────────────────────────────────────────────

function resize() {
    var winW = window.innerWidth;
    var winH = window.innerHeight;

    var idealCols = Math.floor(winW / MIN_CELL_SIZE);
    var idealRows = Math.floor(winH / MIN_CELL_SIZE);

    var cellByWidth = winW / idealCols;
    var cellByHeight = winH / idealRows;

    CELL = Math.floor(Math.min(cellByWidth, cellByHeight));

    COLS = Math.floor(winW / CELL);
    ROWS = Math.floor(winH / CELL);

    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    resetGame();
    draw();
}





window.addEventListener('resize', resize);

// ── Boot ──────────────────────────────────────────────────────────────────

best  = 0;
var speed = 3;
phase = 'idle';
init();
resize();
