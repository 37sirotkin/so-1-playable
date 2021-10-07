const container = document.getElementById('menu-container');
const gameContainer = document.getElementById('game-container');
const packshot = document.getElementById('packshot');

const bananaMenu = document.getElementById('banana-menu');

window.PIXI = PIXI;

const button = document.getElementById('button');

const hand = document.getElementById('hand');
const gameHand = document.getElementById('game-hand');

const yellowColor = document.getElementById('yellow-color');
const purpleColor = document.getElementById('purple-color');
const blueColor = document.getElementById('blue-color');

//music

let isPlaying = false;

const music = new Howl({
  src: './assets/audio/OSNOVA.mp3',
  volume: 0.3,
  loop: true,
})

const chooseColorSound = new Howl({
  src: './assets/audio/COLOR_SELECTION.mp3',
})

const slap = new Howl({
  src: './assets/audio/SLAP.mp3',
  volume: 1.2
})

// document.addEventListener('visibilitychange', function () {
//   if (document.visibilityState === 'visible') {
//     music.play();
//   } else {
//     music.pause();
//   }
// });

let opts = {
  image: './assets/img/banana.png',
  gravity: 800,
  friction: 0.9,
  bounce: 0.5,
  pointsX: 15,
  pointsY: 15,
  renderCloth: true,
  mouseInfluence: 60,
  pinCorners: true,
};

const colors = [
  yellowColor,
  purpleColor,
  blueColor
]

function chooseBananaColor() {
  // if (!isPlaying) music.play();
  chooseColorSound.play();
  bananaMenu.className = '';
  hand.classList.replace('hand-animation-choose-color', 'hand-animation-touch-color');
  switch (this) {
    case yellowColor:
      bananaMenu.classList.add('banana-yellow-image');
      opts.image = './assets/img/banana.png';
      break;
    case purpleColor:
      bananaMenu.classList.add('banana-purple-image');
      opts.image = './assets/img/banana_purple.png';
      break;
    case blueColor:
      bananaMenu.classList.add('banana-blue-image');
      opts.image = './assets/img/banana_blue.png';
      break;
  }
  isPlaying = true;
}

const buttonHandler = () => {
  dapi.openStoreUrl();
}

function getOrientation() {
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

const calculateSize = {
  ratioX: container.offsetWidth / 414,
  ratioY: container.offsetHeight / 736,
  calculateWidth: function() {
    return 30 * this.ratioX;
  },
  calculateHeight: function() {
    return 150 * this.ratioY;
  },
  calculateX: function() {
    return 30 * this.ratioX;
  },
  calculateY: function() {
    return 150 * this.ratioY;
  }
}

// const calculateSizeLandscape = {
//   ratioX: 736 / container.offsetWidth,
//   ratioY: 414 / container.offsetHeight,
//   calculateWidth: function() {
//     return 240 / this.ratioX;
//   },
//   calculateHeight: function() {
//     return 300 / this.ratioY;
//   },
//   calculateX: function() {
//     return 40 * this.ratioX;
//   },
//   calculateY: function() {
//     return 37 * this.ratioY;
//   },
// }

const start = () => {
  colors.forEach(color => color.onclick = chooseBananaColor);
  bananaMenu.onclick = () => {
    gameContainer.classList.remove('hide');
    showGame();
    container.classList.add('hide');
  }
};

//game 

function showGame() {
  let mesh;
  let cloth;
  let spacingX;
  let spacingY;
  let accuracy = 1;
  let touchCount = 0;
  const maxTouches = 100;

  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  canvas.classList.add('game-canvas-2')

  gameContainer.appendChild(canvas);

  ctx.strokeStyle = '#555';

  let mouse = {
    button: null,
    down: false,
    x: 0,
    y: 0,
    px: 0,
    py: 1
  };

  /*////////////////////////////////////////*/

  const setRerendererSize = {
    width: function() {
      if (getOrientation() === 'portrait') {
        return 400
      } else {
        return 400
      }
    },
    height: function() {
      if (getOrientation() === 'portrait') {
        return 600
      } else {
        return 800
      }
    }
  }

  let stage = new PIXI.Container();
  let renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { transparent: true });
  renderer.view.classList.add('game-canvas-1');
  gameContainer.insertBefore(renderer.view, canvas);
  renderer.render(stage);

  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  /*////////////////////////////////////////*/

  function loadTexture() {
    document.body.className = 'loading';

    let texture = new PIXI.Texture.fromImage(opts.image);

    if (!texture.requiresUpdate) { texture.update(); }

    texture.on('error', function () { console.error('AGH!'); });

    texture.on('update', function () {
      document.body.className = '';

      if (mesh) { stage.removeChild(mesh); }

      mesh = new PIXI.mesh.Plane(this, opts.pointsX, opts.pointsY);

      if (getOrientation() === 'portrait') {
        console.log(this)
        mesh.width = this.width;
        mesh.height = this.height;
      } else {
        console.log(getOrientation())
        mesh.width = this.width;
        mesh.height = this.height;
      }
      
      spacingX = mesh.width / (opts.pointsX - 1);
      spacingY = mesh.height / (opts.pointsY - 1);

      cloth = new Cloth(opts.pointsX - 1, opts.pointsY - 1, !opts.pinCorners);
      stage.addChild(mesh);
    });
  }

  loadTexture(opts.image);

  (function update() {
    requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cloth) { cloth.update(0.023); }
    renderer.render(stage);
  })(0);

  /*////////////////////////////////////////*/

  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.px = x;
      this.py = y;
      this.vx = 0;
      this.vy = 0;
      this.pinX = null;
      this.pinY = null;

      this.constraints = [];
    }

    update(delta) {
      if (this.pinX && this.pinY) return this;

      if (mouse.down) {
        let dx = this.x - mouse.x + 30;
        let dy = this.y - mouse.y;

        let dist = Math.sqrt(dx * dx + dy * dy);

        if (mouse.button === 1 && dist < opts.mouseInfluence) {
          this.px = this.x - (mouse.x - mouse.px);
          this.py = this.y - (mouse.y - mouse.py);
        } else if (dist < mouse.cut) {
          this.constraints = [];
        }
      }

      this.addForce(0, opts.gravity);

      let nx = this.x + (this.x - this.px) * opts.friction + this.vx * delta;
      let ny = this.y + (this.y - this.py) * opts.friction + this.vy * delta;

      this.px = this.x;
      this.py = this.y;

      this.x = nx;
      this.y = ny;

      this.vy = this.vx = 0;

      if (this.x >= canvas.width) {
        this.px = canvas.width + (canvas.width - this.px) * opts.bounce;
        this.x = canvas.width;
      } else if (this.x <= 0) {
        this.px *= -1 * opts.bounce;
        this.x = 0;
      }

      if (this.y >= canvas.height) {
        this.py = canvas.height + (canvas.height - this.py) * opts.bounce;
        this.y = canvas.height;
      } else if (this.y <= 0) {
        this.py *= -1 * opts.bounce;
        this.y = 0;
      }
      return this;
    }

    draw() {
      let i = this.constraints.length;
      while (i--) this.constraints[i].draw();
    }

    resolve() {
      if (this.pinX && this.pinY) {
        this.x = this.pinX;
        this.y = this.pinY;
        return;
      }
      this.constraints.forEach(constraint => constraint.resolve());
    }

    attach(point) {
      this.constraints.push(new Constraint(this, point));
    }

    free(constraint) {
      this.constraints.splice(this.constraints.indexOf(constraint), 1);
    }

    addForce(x, y) {
      this.vx += x;
      this.vy += y;
    }

    pin(pinx, piny) {
      this.pinX = pinx;
      this.pinY = piny;
    }

    unpin() {
      this.pinX = null;
      this.pinY = null;
    }
  }
  /*////////////////////////////////////////*/

  class Constraint {
    constructor(p1, p2, length) {
      this.p1 = p1;
      this.p2 = p2;
      this.length = length || spacingX;
    }

    resolve() {
      let dx = this.p1.x - this.p2.x;
      let dy = this.p1.y - this.p2.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.length) return;

      let diff = (this.length - dist) / dist;

      // if (dist > tearDist) this.p1.free(this)

      let mul = diff * 0.5 * (1 - this.length / dist);

      let px = dx * mul;
      let py = dy * mul;

      !this.p1.pinX && (this.p1.x += px);
      !this.p1.pinY && (this.p1.y += py);
      !this.p2.pinX && (this.p2.x -= px);
      !this.p2.pinY && (this.p2.y -= py);

      return this;
    }

    draw() {
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
    }
  }


  /*////////////////////////////////////////*/

  let count = 0;

  class Cloth {
    constructor(clothX, clothY, free) {
      this.points = [];

      let startX = calculateSize.calculateX();
      let startY = calculateSize.calculateY();

      for (let y = 0; y <= clothY; y++) {
        for (let x = 0; x <= clothX; x++) {
          let point = new Point(
            startX + x * spacingX - spacingX * Math.sin(y),
            y * spacingY + startY + (y !== 0 ? 2 * Math.cos(x) : 0) + 20);

          !free && y === 0 && point.pin(point.x, point.y);
          x !== 0 && point.attach(this.points[this.points.length - 1]);
          y !== 0 && point.attach(this.points[x + (y - 1) * (clothX + 1)]);

          this.points.push(point);
        }
      }
    }

    update(delta) {
      let i = accuracy;

      while (i--) {
        this.points.forEach(point => {
          point.resolve();
        });
      }

      ctx.beginPath();

      this.points.forEach((point, i) => {
        point.update(delta * delta);

        if (opts.renderCloth) { point.draw(); }

        if (mesh) {
          i *= 2;
          mesh.vertices[i] = point.x;
          mesh.vertices[i + 1] = point.y;
        }
      });

      ctx.stroke();
    }
  }


  function pointerMove(e) {
    const windowHight = window.innerHeight;
    console.log('height: ' + windowHight)
    let pointer = e.touches ? e.touches[0] : e;
    mouse.px = mouse.x || pointer.clientX;
    mouse.py = mouse.y || pointer.clientY;

    mouse.x = pointer.clientX;
    mouse.y = pointer.clientY;
    console.log(mouse);
  }

  function pointerDown(e) {
    mouse.down = true;
    mouse.button = 1;
    pointerMove(e);
    slap.play();
    touchCount++;
    if (touchCount == 1) {
      gameHand.classList.add('hide');
    }
    if (touchCount == maxTouches) endGame();
  }

  function pointerUp(e) {
    mouse.down = false;
    mouse.px = null;
    mouse.py = null;
  }

  document.body.addEventListener('mousedown', pointerDown);
  document.body.addEventListener('touchstart', pointerDown);

  document.body.addEventListener('mousemove', pointerMove);
  document.body.addEventListener('touchmove', pointerMove);

  document.body.addEventListener('mouseup', pointerUp);
  document.body.addEventListener('touchend', pointerUp);
  document.body.addEventListener('mouseleave', pointerUp);
  button.onclick = buttonHandler;
}

const endGame = () => {
  gameContainer.classList.add('blur');
  packshot.classList.add('unblur');
  packshot.classList.remove('hide');
  packshot.onanimationend = () => button.classList.add('button-animation');
}

start();