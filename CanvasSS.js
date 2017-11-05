class CanvasSSRenderContext {
  constructor(id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.width = 0;
    this.height = 0;
    this.time = -1;
    this.selectionTimes = {};
    this.data = {};
  }
}

class CanvasSS {
  static id(el) {
    let id = this.elementMap.get(el);
    if (!this.elementMap.get(el)) {
      id = CanvasSS._elementID++;
      this.elementMap.set(el, id);
    }
    return id;
  }

  static registerLayer(layer) {
    CanvasSS.layers.push(layer);
  }

  static renderLayers(time = performance.now()) {
    for (let i = 0; i < CanvasSS.layers.length; i++) {
      let layer = CanvasSS.layers[i];
      if (layer.running) {
        layer.render(time);
      }
    }
  }

  static start() {
    if (CanvasSS.running) return;
    CanvasSS.running = true;
    CanvasSS.loop();
  }

  static stop() {
    CanvasSS.running = false;
  }

  static loop(time) {
    if (!CanvasSS.running) return;
    CanvasSS.renderLayers(time);
    requestAnimationFrame(CanvasSS.loop);
  }

  constructor(container, canvas, options = {}) {
    this.container = container;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.pixelRatio = pixelRatio;

    this.containerX = null;
    this.containerY = null;
    this.canvasX = 0;
    this.canvasY = 0;
    this.width = 0;
    this.height = 0;
    this.logicalWidth = 0;
    this.logicalHeight = 0;
    this.canvas.width = 0;
    this.canvas.height = 0;

    this.prerender = null;
    this.postrender = null;

    this.prerenderPrograms = {};
    this.renderPrograms = {};
    this.postrenderPrograms = {};
    this.renderOptions = {};
    this.renderCollections = {};
    this.renderContexts = {};
    this.selectors = [];

    this.running = true;
    this.time = 0;

    this.resetCanvas();
    CanvasSS.registerLayer(this);
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  getRenderContext(el) {
    let id = CanvasSS.id(el);
    if (this.renderContexts[id] == null) {
      this.renderContexts[id] = new CanvasSSRenderContext(id);
      this.locateElement(el);
    }
    return this.renderContexts[id];
  }

  select(selector, program, options = {}) {
    if (this.selectors.indexOf(selector) < 0) {
      this.selectors.push(selector);
    }

    let renderOptions = {};
    Object.assign(renderOptions, CanvasSS.defaultRenderOptions, options);

    this.renderPrograms[selector] = program;
    this.renderOptions[selector] = renderOptions;
    this.renderCollections[selector] = this.renderCollections[selector] || [];
  }

  deselect(selector) {
    let index = this.selectors.indexOf(selector);
    if (index > -1) {
      this.selectors.splice(index, 1);
      this.prerenderPrograms[selector] = null;
      this.renderPrograms[selector] = null;
      this.postrenderPrograms[selector] = null;
      this.renderOptions[selector] = {};
      this.renderCollections[selector] = [];
    }
  }

  collect(selector) {
    if (selector != null) {
      let queryResults = this.container.querySelectorAll(selector);
      let lastCollection = this.renderCollections[selector] || [];
      this.renderCollections[selector] = [];
      let seenElements = {};
      for (let i = 0 ; i < queryResults.length; i++) {
        let el = queryResults[i];
        let renderContext = this.getRenderContext(el);
        this.renderCollections[selector].push(el);
        if (renderContext.selectionTimes[selector] == null) {
          renderContext.selectionTimes[selector] = this.time;
        }
        seenElements[renderContext.id] = 1;
      }

      for (let i = 0; i < lastCollection.length; i++) {
        let el = lastCollection[i];
        let renderContext = this.getRenderContext(el);
        if (seenElements[renderContext.id] == null) {
          renderContext.selectionTimes[selector] = null;
        }
      }
    }
    else {
      for (let i = 0; i < this.selectors.length; i++) {
        let selector = this.selectors[i];
        let renderOptions = this.renderOptions[selector];
        if (renderOptions.autoCollection) {
          this.collect(selector);
        }
      }
    }
  }

  locateElement(el, lazy) {
    let renderContext = this.getRenderContext(el);
    if (!lazy || renderContext.time !== this.time) {
      let elBCR = el.getBoundingClientRect();
      renderContext.x = elBCR.left - this.canvasX;
      renderContext.y = elBCR.top - this.canvasY;
      renderContext.offsetX = elBCR.left - this.containerX;
      renderContext.offsetY = elBCR.top - this.containerY;
      renderContext.width = elBCR.right - elBCR.left;
      renderContext.height = elBCR.bottom - elBCR.top;
      renderContext.time = this.time;
    }
  }

  locateStaticElement(el, lazy) {
    let renderContext = this.getRenderContext(el);
    if (!lazy || renderContext.time !== this.time) {
      renderContext.x = renderContext.offsetX + this.containerX - this.canvasX;
      renderContext.y = renderContext.offsetY + this.containerY - this.canvasY;
      renderContext.time = this.time;
    }
  }

  locate(selector, lazy) {
    if (selector != null) {
      let renderOptions = this.renderOptions[selector];
      let autoCollection = this.renderCollections[selector] || [];
      if (renderOptions.autoLocation === 'static') {
        for (let i = 0; i < autoCollection.length; i++) {
          this.locateStaticElement(autoCollection[i], lazy);
        }
      }
      else {
        for (let i = 0; i < autoCollection.length; i++) {
          this.locateElement(autoCollection[i], lazy);
        }
      }
    }
    else {
      for (let i = 0; i < this.selectors.length; i++) {
        let selector = this.selectors[i];
        let renderOptions = this.renderOptions[selector];
        if (renderOptions.autoLocation) {
          this.locate(selector, lazy);
        }
      }
    }
  }

  resetCanvas() {
    let canvasBCR = this.canvas.getBoundingClientRect();
    let containerBCR = this.container.getBoundingClientRect();
    this.canvasX = canvasBCR.left;
    this.canvasY = canvasBCR.top;
    this.containerX = containerBCR.left;
    this.containerY = containerBCR.top;

    let canvasWidth = this.pixelRatio * (canvasBCR.right - canvasBCR.left);
    let canvasHeight = this.pixelRatio * (canvasBCR.bottom - canvasBCR.top);
    if (this.width !== canvasWidth || this.height !== canvasHeight) {
      this.width = canvasWidth;
      this.height = canvasHeight;
      this.logicalWidth = canvasWidth / this.pixelRatio;
      this.logicalHeight = canvasHeight / this.pixelRatio;
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.context.scale(this.pixelRatio, this.pixelRatio);
    }
    else {
      this.context.clearRect(0, 0, this.width, this.height);
    }
  }

  render(time) {
    if (time != null) this.time = time;

    this.resetCanvas();
    this.collect();
    this.locate(null, true);

    let ctx = this.context;

    if (this.prerender) {
      this.prerender(ctx);
    }

    for (let i = 0; i < this.selectors.length; i++) {
      let selector = this.selectors[i];
      let renderProgram = this.renderPrograms[selector];
      let renderOptions = this.renderOptions[selector];
      let renderCollection = this.renderCollections[selector];

      if (this.prerenderPrograms[selector]) {
        this.prerenderPrograms[selector](ctx);
      }

      for (let j = 0; j < renderCollection.length; j++) {
        let el = renderCollection[j];
        let renderContext = this.getRenderContext(el);
        let {x, y, width, height} = this.getRenderContext(el);
        renderContext.time = this.time;

        if (renderOptions.clip && !renderOptions.clip.invert) {
          if (x > this.logicalWidth || y > this.logicalHeight ||
            x + width < 0 || y + height < 0) continue;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        if (renderOptions.clip) {
          let clip = renderOptions.clip;
          let p = clip.padding || 0;
          if (clip.borderRadius) {
            let r = Math.min(clip.borderRadius, height / 2, width / 2);
            ctx.moveTo(r, p);
            ctx.lineTo(width - r, p);
            ctx.arc(width - r, r, r - p, 3 * Math.PI / 2, 0);
            ctx.lineTo(width - p, height - r);
            ctx.arc(width - r, height - r, r - p, 0, Math.PI / 2);
            ctx.lineTo(r, height - p);
            ctx.arc(r, height - r, r - p, Math.PI / 2, Math.PI);
            ctx.lineTo(p, r);
            ctx.arc(r, r, r - p, Math.PI, 3 * Math.PI / 2);
          }
          else {
            ctx.rect(p, p, width - 2 * p, height - 2 * p);
          }
          if (clip.invert) {
            ctx.rect(this.logicalWidth - x, -y, -this.logicalWidth, this.logicalHeight);
          }
          ctx.clip();
          ctx.closePath();
          ctx.beginPath();
        }
        renderProgram(ctx, renderContext, el);
        ctx.closePath();
        ctx.restore();
      }

      if (this.postrenderPrograms[selector]) {
        this.postrenderPrograms[selector](ctx);
      }
    }

    if (this.postrender) {
      this.postrender(ctx);
    }
  }

  onPrerender(selector, f) {
    if (typeof selector === 'function') {
      this.prerender = selector;
    }
    else this.prerenderPrograms[selector] = f;
  }

  onPostrender(selector, f) {
    if (typeof selector === 'function') {
      this.postrender = selector;
    }
    else this.postrenderPrograms[selector] = f;
  }

  offPrerender(selector) {
    if (typeof selector !== 'string') {
      this.prerender = null;
    }
    else this.prerenderPrograms[selector] = null;
  }

  offPostrender(selector) {
    if (typeof selector !== 'string') {
      this.postrender = null;
    }
    else this.postrenderPrograms[selector] = null;
  }
}
CanvasSS._elementID = 0;
CanvasSS.elementMap = new WeakMap();
CanvasSS.defaultRenderOptions = {clip: true, autoCollection: true, autoLocation: true};
CanvasSS.layers = [];
CanvasSS.running = false;
CanvasSS.start();
