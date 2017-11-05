    'use strict';
    const id = document.getElementById.bind(document);
    const qs = (selector) => Array.prototype.slice.call(document.querySelectorAll(selector));

    for (let i = 0; i < 25; i++) {
      let div = document.createElement('div');
      div.style.width = (100 + 100 * Math.random() | 0) + 'px';
      div.style.height = (100 + 100 * Math.random() | 0) + 'px';
      div.classList.add('cell');
      let div2 = document.createElement('div');
      div2.textContent = `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
      div.appendChild(div2);
      id('container').appendChild(div);
    }



    const layer1 = new CanvasSS(id('container'), id('layer1'), {ratio: 1});
    const layer2 = new CanvasSS(id('container'), id('layer2'), {ratio: 1});

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

    function Particle() {
      this.speed = {x: -2.5 + Math.random() * 5, y: -15 + Math.random() * 10};
      this.speed.x *= 0.0001;
      this.speed.y *= 0.001;
      this.location = {x: Math.random(), y: Math.random() * 0.2};
      this.radius = 10 + Math.random() * 20;
      this.originalRadius = this.radius;
      this.opacity = 1;
      this.r = 100 + Math.round(Math.random() * 155);
      this.s = 20 + Math.random() * 60 | 0;
      this.l = 20 + Math.random() * 60 | 0;
    }

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }

    layer2.select('.hover', (ctx, cursor) => {
      const w = cursor.width;
      const h = cursor.height;
      let s = Math.floor(cursor.time / 100) % colors.length;

      for (let i = 1; i < 5; i++) {
        ctx.strokeStyle = colors[s];
        // ctx.beginPath();
        ctx.strokeRect(i, i, w - 2 * i, h - 2 * i);
        s = (s + 1) % colors.length;
      }
    }, {location: true, collection: true});

    layer2.onPrerender(() => {
      particles.forEach((p, i) => {
        p.opacity = Math.round(p.radius / p.originalRadius * 100) / 100;
        p.radius--;
        p.location.x += p.speed.x;
        p.location.y += p.speed.y;
        if(p.radius < 0) {
          Particle.call(particles[i]);
        }
      });
    });

    // layer1.collect('.cell');
    // layer1.locate('.cell');

    let hue = 1;
    layer2.select('.fire', (ctx, cursor) => {
      hue = (hue + 0.5) % 360;
      particles.forEach((p, i) => {
        ctx.beginPath();
        let x = p.location.x * cursor.width;
        let y = p.location.y * cursor.height;
        let gradient = ctx.createRadialGradient(x, y, 0, x, y, p.radius);
        gradient.addColorStop(0, "hsla(" + hue + ", " + p.s + "%, " + p.l + "%, " + p.opacity + ")");
        gradient.addColorStop(0.5, "hsla(" + hue + ", " + p.s + "%, " + p.l + "%, " + p.opacity + ")");
        gradient.addColorStop(1, "hsla(" + hue + ", " + p.s + "%, " + p.l + "%, 0)");
        ctx.fillStyle = gradient;
        ctx.arc(x, y, p.radius, Math.PI*2, false);
        ctx.fill();
      });
    }, {clip: {invert: true}});

    // layer2.select('.hover', (ctx, cursor) => {
    //   let elapsed = cursor.time - cursor.selectionTimes['.hover'];
    //   elapsed = Math.min(elapsed, 400);
    //   let r = elapsed / 400;
    //   let w = cursor.width;
    //   let h = cursor.height;
    //   let cx = Math.max(w, h);
    //   ctx.beginPath();
    //   ctx.fillStyle = `rgba(255,0,0,${r / 2})`;
    //   ctx.ellipse(2 * cx, h / 2, h * 1.0, cx * 2.5,
    //     (Math.PI / 8) + r * (3 * Math.PI / 8), 0, Math.PI * 2);
    //   ctx.fill();
    //   ctx.beginPath();
    //   ctx.fillStyle = `rgba(255,0,0,${r / 2})`;
    //   ctx.ellipse(-cx, h / 2, h * 1.0, cx * 2.5,
    //     (Math.PI / 8) + r * (3 * Math.PI / 8), 0, Math.PI * 2);
    //   ctx.fill();
    // })//, {clip: {borderRadius: 30, padding: 3}});

    // layer2.select('.clicked', (ctx, cursor) => {
    //   let elapsed = cursor.time - cursor.selectionTimes['.clicked'];
    //   elapsed = Math.min(500, elapsed);
    //   ctx.fillStyle = 'rgba(180,180,180,0.7)';
    //   ctx.beginPath();
    //   ctx.arc(cursor.data.mx, cursor.data.my, elapsed, 0, 2 * Math.PI);
    //   ctx.fill();
    //   ctx.fillStyle = 'rgba(80,80,80,0.7)';
    //   ctx.beginPath();
    //   ctx.arc(cursor.mx, cursor.my, elapsed / 2, 0, 2 * Math.PI);
    //   ctx.fill();
    // }, {auto: true, dynamic: false, clip: {borderRadius: 30, padding: 3}});

    // layer2.collect('.cell');
    // layer2.locate('.cell');

    // layer2.onPrerender((ctx) => {
    //   ctx.globalCompositeOperation = 'xor';
    //   // ctx.fillStyle = 'black';
    //   // ctx.fillRect(0,0,layer2.width,layer2.height);
    // });

    layer2.canvas.style.background = 'rgba(50,50,50,0.1)'

    // layer2.onPrerender('.cell', (ctx) => {
    //   ctx.fillStyle = 'black';
    // });

    // layer2.collect('.cell');
    // layer2.locate('.cell');

    // layer2.select('.cell', (ctx, renderContext) => {
    //   const {x, y} = renderContext;
    //   const gradient = ctx.createRadialGradient(mx - x, my - y, 20, mx - x, my - y, 200);
    //   gradient.addColorStop(0, 'rgba(0,0,0,1)');
    //   gradient.addColorStop(1, 'rgba(0,0,0,0)');
    //   ctx.fillStyle = 'black';
    //   ctx.fillRect(0, 0, renderContext.width, renderContext.height);
    //   ctx.fillStyle = gradient;
    //   ctx.fillRect(0, 0, layer2.width, layer2.height);

    // }, {auto: false, dynamic: false, clip: {borderRadius: 0, padding: 2.5}});



    let mx = -9990;

    let my = -9990;

    container.onmousemove = e => {
      const {x, y} = layer2.getRenderContext(e.target);
      mx = e.offsetX + x;
      my = e.offsetY + y;
    };

    container.onmouseleave = e => {
      my = mx = -9999;
    }

    qs('.cell').forEach(div => {
      div.onmouseenter = () => {
        div.classList.add('hover');
        div.classList.add('fire');
      }
      div.onmouseleave = () => {
        // div.classList.remove('hover');
        div.classList.remove('fire');
        div.classList.remove('clicked');
        // layer1.locate('.fire');
      }
      div.onclick = (e) => {
        div.classList.remove('clicked');
        let rctx = layer2.getRenderContext(div);
        rctx.selectionTimes['.clicked'] = null;
        rctx.data.mx = e.offsetX;
        rctx.data.my = e.offsetY;
        div.classList.add('clicked');
      }
    });
