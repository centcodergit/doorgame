var introCanvas = document.getElementById("introCanvas");
introCanvas.width = window.innerWidth;
introCanvas.height = window.innerHeight;

var peepImg = document.getElementById("peep");
var keyImg = document.getElementById("key");
var doorImg = document.getElementById("door");
var clockImg = document.getElementById("clock");

let dingSound = new Audio("sounds/ding.mp3");
let rewindSound = new Audio("sounds/rewind.mp3");
let jazzSound = new Audio("sounds/jazz.mp3");
let stepSound = new Audio("sounds/step.mp3");
let unlockSound = new Audio("sounds/unlock.mp3");
let errorSound = new Audio("sounds/error.mp3");
stepSound.volume = 0.5;

var stage = "play";
var level = null;
var levels = [];
var currentLevel = 0;
var rewindLevel = null;
var rewindFrame = 0;
var jazzPlayed = false;
var needsDraw = false;
var bouncy = [0, 0.25, 1, 0.9, 0, 0, 0.25, 1, 0.9, 0];

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

function makePlayer(x, y) {
    var p = {
        type: "player",
        x: x,
        y: y,
        velX: 0,
        velY: 0,
        frame: 0,
        direction: 1,
        bounce: 1,
        bounceVel: 0,
        sway: 0,
        swayVel: 0
    };
    return p;
}

function makeKey(x, y) {
    var k = {
        type: "key",
        x: x,
        y: y,
        hover: 0
    };
    return k;
}

function makeDoor(x, y) {
    var d = {
        type: "door",
        x: x,
        y: y,
        frame: 0
    };
    return d;
}

function makeIntro() {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;

    var lvl = {};
    lvl.isIntro = true;
    lvl.canvas = introCanvas;
    lvl.ctx = introCanvas.getContext("2d");
    lvl.width = introCanvas.width;
    lvl.height = introCanvas.height;
    lvl.player = makePlayer(cx - 150, cy - 30);
    lvl.door = makeDoor(cx + 150, cy - 30);
    lvl.key = makeKey(cx, cy + 125);
    lvl.circles = [
        {x: cx, y: cy, radius: 120, invisible: true}
    ];
    lvl.keyCollected = false;
    return lvl;
}

function makeLevel(num) {
    var lvl = {};
    lvl.isIntro = false;
    lvl.canvas = document.getElementById("canvas" + (num + 1));
    lvl.ctx = lvl.canvas.getContext("2d");
    lvl.width = 300;
    lvl.height = 300;

    if (num == 0) {
        lvl.player = makePlayer(150, 175);
        lvl.door = makeDoor(150, 75);
        lvl.key = makeKey(150, 275);
        lvl.circles = [
            {x: 0, y: 150, radius: 100},
            {x: 300, y: 150, radius: 100}
        ];
        lvl.countdown = 90;
    }
    else if (num == 1) {
        lvl.player = makePlayer(150, 250);
        lvl.door = makeDoor(150, 249);
        lvl.key = makeKey(150, 75);
        lvl.circles = [
            {x: 100, y: 100, radius: 50},
            {x: 200, y: 100, radius: 50},
            {x: 150, y: 100, radius: 10, invisible: true},
            {x: 0, y: 300, radius: 145},
            {x: 300, y: 300, radius: 145}
        ];
        lvl.countdown = 200;
    }
    else if (num == 2) {
        lvl.player = makePlayer(30, 75);
        lvl.door = makeDoor(270, 75);
        lvl.key = makeKey(150, 270);
        lvl.circles = [
            {x: 150, y: 150, radius: 115}
        ];
        lvl.countdown = 130;
    }

    lvl.keyCollected = false;
    lvl.lastCollected = false;
    lvl.clockFrame = 0;
    lvl.clockSpeed = 30 / lvl.countdown;
    lvl.enterSide = "";
    lvl.exitSide = "";
    lvl.hideClock = false;
    lvl.frames = [];
    lvl.drawPath = false;
    lvl.path = [];
    return lvl;
}

function updatePlayer(lvl) {
    var p = lvl.player;

    var dx = 0;
    var dy = 0;
    if (leftPressed) dx = dx - 1;
    if (rightPressed) dx = dx + 1;
    if (upPressed) dy = dy - 1;
    if (downPressed) dy = dy + 1;

    var d = Math.sqrt(dx*dx + dy*dy);
    if (d > 0) {
        p.velX = p.velX + (dx / d) * 2;
        p.velY = p.velY + (dy / d) * 2;
    }

    if (leftPressed == true) {
        p.direction = -1;
    }
    if (rightPressed == true) {
        p.direction = 1;
    }

    if (leftPressed || rightPressed || upPressed || downPressed) {
        p.frame++;
        if (p.frame > 9) {
            p.frame = 1;
        }
    } else {
        if (p.frame > 0) {
            p.bounce = 0.8;
        }
        p.frame = 0;
    }

    p.x = p.x + p.velX;
    p.y = p.y + p.velY;
    p.velX = p.velX * 0.7;
    p.velY = p.velY * 0.7;

    if (p.x < 0) p.x = 0;
    if (p.y < 0) p.y = 0;
    if (p.x > lvl.width) p.x = lvl.width;
    if (p.y > lvl.height) p.y = lvl.height;

    for (var i = 0; i < lvl.circles.length; i++) {
        var c = lvl.circles[i];
        var cdx = p.x - c.x;
        var cdy = p.y - c.y;
        var dist = Math.sqrt(cdx*cdx + cdy*cdy);
        var overlap = (c.radius + 5) - dist;
        if (overlap > 0) {
            p.x = p.x + (cdx / dist) * overlap;
            p.y = p.y + (cdy / dist) * overlap;
        }
    }

    p.sway = p.sway + p.swayVel;
    p.swayVel = p.swayVel + ((-p.velX * 0.08) - p.sway) * 0.2;
    p.swayVel = p.swayVel * 0.9;
    p.bounce = p.bounce + p.bounceVel;
    p.bounceVel = p.bounceVel + (1 - p.bounce) * 0.2;
    p.bounceVel = p.bounceVel * 0.9;
}

function updateKey(lvl) {
    if (lvl.keyCollected == true) {
        return;
    }
    var k = lvl.key;
    k.hover = k.hover + 0.07;

    var dx = k.x - lvl.player.x;
    var dy = k.y - lvl.player.y;
    var dist = Math.sqrt(dx*dx/4 + dy*dy);
    if (dist < 5) {
        lvl.keyCollected = true;
        playSound(unlockSound);
    }
}

function updateDoor(lvl) {
    var door = lvl.door;

    if (lvl.keyCollected && door.frame < 10) {
        door.frame = door.frame + 0.5;
    }

    if (lvl.keyCollected == true) {
        var dx = door.x - lvl.player.x;
        var dy = door.y - lvl.player.y;
        var dist = Math.sqrt(dx*dx/25 + dy*dy);
        if (dist < 6) {
            if (lvl.isIntro) {
                document.getElementById("container").style.top = "-100%";
                playSound(dingSound);
                currentLevel = 0;
                var first = makeLevel(0);
                levels[0] = first;
                level = null;
                setTimeout(function() {
                    level = first;
                }, 1200);
            } else {
                nextLevel();
            }
            return true;
        }
    }
    return false;
}

function updateClock(lvl) {
    if (currentLevel == 1) {
        if (lvl.keyCollected) {
            if (lvl.exitSide == "" && Math.abs(lvl.player.x - 150) > 30) {
                if (lvl.player.x < 150) {
                    lvl.exitSide = "left";
                } else {
                    lvl.exitSide = "right";
                }
            }
        } else {
            if (lvl.enterSide == "" && lvl.player.y < 150) {
                if (lvl.player.x < 150) {
                    lvl.enterSide = "left";
                } else {
                    lvl.enterSide = "right";
                }
            }
        }
        if (lvl.exitSide != "" && lvl.enterSide != "") {
            if (lvl.exitSide == lvl.enterSide) {
                lvl.clockFrame = lvl.clockFrame + lvl.clockSpeed * 1.8;
            }
        }
    }

    lvl.clockFrame = lvl.clockFrame + lvl.clockSpeed;
    if (lvl.clockFrame >= 30) {
        playSound(errorSound);
        resetLevel();
    }
}

function updateLevel(lvl) {
    updatePlayer(lvl);
    updateKey(lvl);
    var done = updateDoor(lvl);

    if (lvl.isIntro == false) {
        if (done == true) {
            lvl.ctx.clearRect(0, lvl.height, lvl.canvas.width, 80);
        } else {
            updateClock(lvl);
        }
        saveFrame(lvl);
    }
}

function saveFrame(lvl) {
    var p = lvl.player;
    lvl.frames.push({
        x: p.x,
        y: p.y,
        sway: p.sway,
        bounce: p.bounce,
        frame: p.frame,
        direction: p.direction,
        hover: lvl.key.hover,
        doorFrame: lvl.door.frame,
        keyCollected: lvl.keyCollected
    });
}

function playFrame(lvl, i) {
    var f = lvl.frames[i];
    var p = lvl.player;
    p.x = f.x;
    p.y = f.y;
    p.sway = f.sway;
    p.bounce = f.bounce;
    p.frame = f.frame;
    p.direction = f.direction;
    lvl.key.hover = f.hover;
    lvl.door.frame = f.doorFrame;
    lvl.keyCollected = f.keyCollected;

    if (lvl.keyCollected && lvl.lastCollected == false && stage == "replay") {
        playSound(unlockSound);
    }
    lvl.lastCollected = lvl.keyCollected;

    lvl.hideClock = true;
    drawLevel(lvl);
}

function drawPlayer(ctx, p) {
    var y = p.y - 6 * bouncy[p.frame];

    if (p.frame == 4 || p.frame == 9) {
        playSound(stepSound);
    }

    ctx.save();
    ctx.translate(p.x, y);
    ctx.scale(0.5, 0.5);
    ctx.rotate(p.sway);
    ctx.scale(p.direction, 1);
    ctx.scale(1 / p.bounce, p.bounce);
    ctx.drawImage(peepImg, -25, -100, 50, 100);
    ctx.restore();
}

function drawPlayerShadow(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(0.5, 0.5);
    var s = (3 - bouncy[p.frame]) / 3;
    ctx.scale(s, 0.3 * s);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.fill();
    ctx.restore();
}

function drawKey(ctx, lvl) {
    if (lvl.keyCollected == true) {
        return;
    }
    var k = lvl.key;
    ctx.save();
    ctx.translate(k.x, k.y - 20 - Math.sin(k.hover) * 5);
    ctx.scale(0.7, 0.7);
    ctx.drawImage(keyImg, -25, -21, 50, 42);
    ctx.restore();
}

function drawKeyShadow(ctx, lvl) {
    if (lvl.keyCollected == true) {
        return;
    }
    var k = lvl.key;
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.scale(0.7, 0.7);
    var s = 1 - Math.sin(k.hover) * 0.5;
    ctx.scale(s, 0.3 * s);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.fill();
    ctx.restore();
}

function drawDoor(ctx, door) {
    var f = Math.floor(door.frame);
    var col = f % 4;
    var row = Math.floor(f / 4);

    ctx.save();
    ctx.translate(door.x, door.y);
    ctx.scale(0.7, 0.7);
    ctx.drawImage(doorImg, col * 68, row * 96, 68, 96, -34, -91, 68, 96);
    ctx.restore();
}

function drawDoorShadow(ctx, door) {
    ctx.save();
    ctx.translate(door.x, door.y);
    ctx.scale(0.7, 0.7);
    ctx.scale(1, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.fill();
    ctx.restore();
}

function drawClock(ctx, lvl) {
    var f = Math.floor(lvl.clockFrame);
    var col = f % 6;
    var row = Math.floor(f / 6);

    ctx.save();
    ctx.translate(lvl.width / 2, lvl.height + 40);
    ctx.drawImage(clockImg, col * 82, row * 82, 82, 82, -30, -30, 60, 60);
    ctx.restore();
}

function drawPathLine(ctx, path) {
    ctx.beginPath();
    ctx.strokeStyle = "#cc2727";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

function drawLevel(lvl) {
    var ctx = lvl.ctx;

    if (lvl.isIntro) {
        ctx.clearRect(0, 0, lvl.canvas.width, lvl.canvas.height);
        ctx.save();
        ctx.translate(lvl.width / 2, lvl.height / 2);
        ctx.scale(1.5, 1.5);
        ctx.translate(-lvl.width / 2, -lvl.height / 2);
    } else {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, lvl.width, lvl.height);
    }

    drawPlayerShadow(ctx, lvl.player);
    drawKeyShadow(ctx, lvl);
    drawDoorShadow(ctx, lvl.door);

    ctx.fillStyle = "#333";
    for (var i = 0; i < lvl.circles.length; i++) {
        var c = lvl.circles[i];
        if (c.invisible != true) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    var things = [lvl.player, lvl.key, lvl.door];
    things.sort(function(a, b) {
        return a.y - b.y;
    });
    for (var j = 0; j < things.length; j++) {
        if (things[j].type == "player") {
            drawPlayer(ctx, lvl.player);
        } else if (things[j].type == "key") {
            drawKey(ctx, lvl);
        } else if (things[j].type == "door") {
            drawDoor(ctx, lvl.door);
        }
    }

    if (lvl.drawPath == true) {
        if (lvl.path.length == 0) {
            lvl.path.push({x: lvl.player.x - 0.1, y: lvl.player.y});
        }
        lvl.path.push({x: lvl.player.x, y: lvl.player.y});
        drawPathLine(ctx, lvl.path);
    }

    if (lvl.isIntro) {
        ctx.restore();
    } else {
        ctx.clearRect(0, lvl.height, lvl.canvas.width, 80);
        if (lvl.hideClock == false) {
            drawClock(ctx, lvl);
        }
    }
}

function clearCanvas(lvl) {
    lvl.ctx.clearRect(0, 0, lvl.canvas.width, lvl.canvas.height);
}

function resetLevel() {
    var lvl = makeLevel(currentLevel);
    levels[currentLevel] = lvl;
    if (level != null) {
        clearCanvas(level);
    }
    level = null;
    setTimeout(function() {
        level = lvl;
    }, 500);
}

function resetGame() {
    location.reload();
}

function nextLevel() {
    currentLevel++;
    console.log("level " + currentLevel);

    if (currentLevel < 3) {
        playSound(dingSound);
        var lvl = makeLevel(currentLevel);
        levels[currentLevel] = lvl;
        level = null;
        setTimeout(function() {
            level = lvl;
        }, 500);
    } else {
        level = null;
        stage = "rewind";
        currentLevel = 2;
        startRewind();

        var totalFrames = levels[0].frames.length + levels[1].frames.length + levels[2].frames.length;
        console.log(totalFrames);
        var rewindTime = totalFrames / 60;
        var skip = 6.6 - rewindTime;
        if (skip > 0) {
            rewindSound.currentTime = skip;
        }
        rewindSound.play();

        document.getElementById("rewindText").style.display = "block";
    }
}

function startRewind() {
    rewindLevel = levels[currentLevel];
    rewindFrame = rewindLevel.frames.length - 1;
}

function startReplay() {
    rewindLevel = levels[currentLevel];
    rewindLevel.drawPath = true;
    rewindFrame = 0;
}

function showEnding() {
    for (let i = 0; i < levels.length; i++) {
        clearCanvas(levels[i]);
        drawPathLine(levels[i].ctx, levels[i].path);
    }

    document.getElementById("levels").style.backgroundPosition = "0px -390px";
    document.getElementById("screen2").style.backgroundColor = "black";

    let message = document.getElementById("message");
    message.style.display = "block";
    setTimeout(function() {
        message.style.letterSpacing = "3px";
    }, 10);
}

function update() {
    if (stage == "play") {
        if (level != null) {
            updateLevel(level);
            needsDraw = true;
        }
    } else if (stage == "rewind" || stage == "replay") {
        needsDraw = true;
    }

    if (stage == "replay" && jazzPlayed == false && currentLevel == 1) {
        var framesLeft = (rewindLevel.frames.length - rewindFrame) + levels[2].frames.length;
        if (framesLeft < 135) {
            jazzPlayed = true;
            jazzSound.play();
        }
    }
}

function render() {
    if (stage == "play") {
        if (level != null) {
            drawLevel(level);
        }
        needsDraw = false;
    }
    else if (stage == "rewind") {
        playFrame(rewindLevel, rewindFrame);
        rewindFrame--;
        if (rewindFrame < 0) {
            currentLevel--;
            if (currentLevel >= 0) {
                startRewind();
            } else {
                stage = "replay";
                currentLevel = 0;
                startReplay();
                document.getElementById("rewindText").style.display = "none";
                document.getElementById("replayText").style.display = "block";
            }
        }
    }
    else if (stage == "replay") {
        playFrame(rewindLevel, rewindFrame);
        rewindFrame++;
        if (rewindFrame >= rewindLevel.frames.length) {
            currentLevel++;
            if (currentLevel < 3) {
                startReplay();
            } else {
                document.getElementById("replayText").style.display = "none";
                showEnding();
                stage = "end";
            }
        }
        needsDraw = false;
    }
}

function loop() {
    requestAnimationFrame(loop);
    if (needsDraw == true) {
        render();
    }
}

window.onload = function() {
    console.log("loaded")
    setTimeout(function() {
        document.getElementById("loading").style.display = "none";
    }, 300);

    level = makeIntro();

    setInterval(update, 1000 / 30);
    loop();
}
