var canvas = document.getElementById('canvas');
var ctx    = canvas.getContext('2d');


ctx.imageSmoothingQuality = 'high';
ctx.imageSmoothingEnabled = true;
ctx.textRendering = 'geometricPrecision';

var COLORS = {
  bg:        '#1a1a2e',
  grid:      '#16213e',
  snakeHead: '#56ef83',
  snakeBody: '#2ecc71',
  food:      '#e74c3c',
  text:      '#ffffff',
  dimText:   'rgba(255,255,255,0.5)',
  overlay:   'rgba(0,0,0,0.55)',
};

function cell(x, y, color) {
  var pad = 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
}

function draw() {
  var W = canvas.width, H = canvas.height;

   ctx.fillStyle = COLORS.bg;
   ctx.fillRect(0, 0, W, H);
  
  
  
   ctx.strokeStyle = '#000000'; 
   ctx.lineWidth = 4;           
   ctx.strokeRect(0, 0, W, H);  




  // Subtle grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (var x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
  }
  for (var y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
  }
  
if (phase !== 'idle') {
  // Food (circle
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}
      
    var len = snake.length;
    
    snake.forEach(function(s, i) {
        
        var x = s.x * CELL + 2; 
        var y = s.y * CELL + 2;
        var size = CELL - 4; 
        var r = size / 3; 

        
        if (i === 0) {
            ctx.fillStyle = COLORS.snakeHead; 
        } else {
            
            ctx.fillStyle = COLORS.snakeBody; 
        }

        
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + size, y, x + size, y + size, r);
        ctx.arcTo(x + size, y + size, x, y + size, r);
        ctx.arcTo(x, y + size, x, y, r);
        ctx.arcTo(x, y, x + size, y, r);
        ctx.closePath();
        ctx.fill();

                
        if (i === 0) {
            ctx.fillStyle = '#ffffff'; 
            
            
            var offset = size * 0.25; 
            var eyeSize = size * 0.25; 

            var eye1X, eye1Y, eye2X, eye2Y;

            
            if (dir.x === 1) { 
                
                eye1X = x + size - eyeSize - 2; eye1Y = y + 2;
                eye2X = x + size - eyeSize - 2; eye2Y = y + size - eyeSize - 2;
            } else if (dir.x === -1) { 
                
                eye1X = x + 2; eye1Y = y + 2;
                eye2X = x + 2; eye2Y = y + size - eyeSize - 2;
            } else if (dir.y === -1) { 
                
                eye1X = x + 2; eye1Y = y + 2;
                eye2X = x + size - eyeSize - 2; eye2Y = y + 2;
            } else { 
                
                eye1X = x + 2; eye1Y = y + size - eyeSize - 2;
                eye2X = x + size - eyeSize - 2; eye2Y = y + size - eyeSize - 2;
            }

            
            ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
            ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);

            
            ctx.fillStyle = '#000000';
            var pupilSize = eyeSize / 2;
            var pOff = (eyeSize - pupilSize) / 2;
            
            
            ctx.fillRect(eye1X + pOff, eye1Y + pOff, pupilSize, pupilSize);
            ctx.fillRect(eye2X + pOff, eye2Y + pOff, pupilSize, pupilSize);
        }

    });
    


  // Score
  var fontSize = Math.max(12, CELL * 2.5);
  ctx.font = 'bold ' + fontSize + 'px monospace';
  ctx.fillStyle = COLORS.dimText;
  ctx.textAlign = 'right';
  ctx.fillText(score, W - CELL * 0.5, CELL * 2.5);
  if (typeof best !== 'undefined') {
    ctx.font = Math.max(10, CELL * 1) + 'px monospace';
    ctx.fillText('最高分数 ' + best, W - CELL * 0.5, CELL * 3.5);
  
  var textX = W - CELL * 0.5;
  var textY = CELL * 2.8;
  
  ctx.font = Math.max(10, CELL * 1.0) + 'px monospace';
  ctx.fillText('当前速度: '+speed, W - CELL * 0.5, CELL * 4.5);
  
  }
  ctx.textAlign = 'left';


  if (phase === 'idle') {
    drawOverlay('贪吃蛇','点击任意地方开始','版本 '+Version);
  } else if (phase === 'dead') {
    drawOverlay('游戏结束', '分数' + score + '  点击屏幕重新开始');
  }
}

function drawOverlay(title,sub,sub2) {
  var W = canvas.width, H = canvas.height;
  var titleSize = Math.max(20, CELL * 1.5);
  var subSize   = Math.max(11, CELL * 0.85);

  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.font = 'bold ' + titleSize + 'px monospace';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(title, W / 2, H / 2 - titleSize * 0.6);

  ctx.font = subSize + 'px monospace';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText(sub, W / 2, H / 2 + subSize * 1.8);
  
  if (sub2) {
        
        ctx.fillText(sub2, W / 2, H / 2 + subSize * 3.0); 
    }
  
  ctx.textAlign = 'left';
}
