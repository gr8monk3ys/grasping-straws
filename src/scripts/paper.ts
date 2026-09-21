/*
 * Paper material — one quad per card face, drawn with a fragment shader.
 *
 * What this buys over the CSS grain it replaces: the fibre structure is
 * generated rather than a tiled bitmap, so it never repeats; the stock has
 * laid lines and a vignette; and the specular band tracks the card's LIVE
 * rotation instead of approximating it with a fixed keyframe.
 *
 * The DOM text stays on top and is never rendered here. It is what the
 * aria-live region announces, what a reader selects, and what the /c/<id>/
 * pages serve — none of which survives being rasterised into a texture. That
 * is also why the sheet does not bend: the text plane would stay flat and
 * tear away from a curved material.
 *
 * Entirely optional. If WebGL is missing or the context is lost, the CSS
 * grain layer stays visible and nothing else changes.
 */

const VERT = `attribute vec2 p;varying vec2 vUv;void main(){vUv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;

const FRAG = `precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec3 uPaper;
uniform float uAngle;
uniform float uDark;
uniform float uFibre;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}
  return v;
}

void main(){
  vec2 uv=vUv;
  vec2 px=uv*uRes;

  /* Fibres lie ALONG x, which means a low x frequency and a higher y one —
     the reverse stretches the noise vertically and reads as streaking down
     the card rather than as pulp. Two scales: coarse pulp, fine tooth. */
  float pulp=fbm(vec2(px.x*0.14,px.y*0.5));
  float tooth=fbm(px*2.4);
  float grain=(mix(pulp,tooth,0.6)-0.5)*2.0;

  vec3 col=uPaper;
  col+=grain*uFibre;

  /* Specular band, driven by the live angle rather than a keyframe, so it
     peaks exactly when the sheet is most oblique to the viewer — and is
     absent entirely at rest, where a static highlight would look painted
     on. No laid lines: at screen scale their period lands near the pixel
     grid and reads as corrugation, not as stock. */
  float turning=abs(sin(uAngle));
  float bandPos=0.5+0.5*sin(uAngle);
  float band=exp(-pow((uv.x-bandPos)*2.6,2.0));
  col+=band*turning*mix(0.10,0.045,uDark);

  /* barely there — enough to stop the sheet reading as flat fill */
  float vig=1.0-length((uv-0.5)*vec2(0.9,1.1))*0.05;
  col*=vig;

  gl_FragColor=vec4(col,1.0);
}`;

type Sheet = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
  face: HTMLElement;
  // The angle and theme this sheet was last fully painted at, so a rest
  // that changes neither is not repainted. Null while a paint is partial.
  painted: { angle: number; dark: number } | null;
};

function compile(gl: WebGLRenderingContext, src: string, kind: number): WebGLShader | null {
  const s = gl.createShader(kind);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function makeSheet(face: HTMLElement): Sheet | null {
  const canvas = document.createElement("canvas");
  canvas.className = "paper";
  canvas.setAttribute("aria-hidden", "true");
  const gl = (canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    // The material is redrawn only while the card turns, so the buffer has
    // to survive between frames rather than being cleared by the compositor.
    preserveDrawingBuffer: true,
  }) ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!gl) return null;

  const vs = compile(gl, VERT, gl.VERTEX_SHADER);
  const fs = compile(gl, FRAG, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // Left detached here: the mount attaches it once it holds real paper.
  return {
    canvas,
    gl,
    face,
    painted: null,
    u: {
      res: gl.getUniformLocation(prog, "uRes"),
      paper: gl.getUniformLocation(prog, "uPaper"),
      angle: gl.getUniformLocation(prog, "uAngle"),
      dark: gl.getUniformLocation(prog, "uDark"),
      fibre: gl.getUniformLocation(prog, "uFibre"),
    },
  };
}

const rgb = (css: string): [number, number, number] => {
  const m = css.match(/[\d.]+/g);
  if (!m) return [1, 1, 1];
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
};

export type Paper = { follow(): void; settle(): void; redraw(): void };

// Work that can wait for a quiet moment. The mount is sliced into these so
// no single task runs long enough to block a tap; each slice is short and the
// next one waits for the browser to be idle (with a ceiling, so a busy page
// still gets its paper within a few hundred milliseconds).
function whenIdle(fn: () => void): void {
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, o: { timeout: number }) => number })
      .requestIdleCallback(fn, { timeout: 120 });
  } else {
    setTimeout(fn, 16);
  }
}

export function mountPaper(faces: HTMLElement[], inner: HTMLElement): Paper | null {
  const sheets: Sheet[] = [];
  // Nothing draws until every sheet is compiled, sized and painted. Until
  // then follow/settle/redraw are no-ops and the CSS grain stays in charge;
  // the canvases only join the DOM once they hold real paper, so a visitor
  // never sees the buffer's initial black.
  let ready = false;

  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  let raf = 0;

  // Returns whether any buffer was reallocated. Assigning canvas.width CLEARS
  // the drawing buffer — to opaque black, since the context is alpha: false —
  // so a caller that then repaints only one sheet would leave the other one
  // black until something repainted it. The caller has to know.
  function resize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cleared = false;
    for (const s of sheets) {
      const r = s.face.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (s.canvas.width !== w || s.canvas.height !== h) {
        s.canvas.width = w;
        s.canvas.height = h;
        s.gl.viewport(0, 0, w, h);
        cleared = true;
      }
    }
    return cleared;
  }

  // rotateY(t) puts cos(t) in m11 and -sin(t) in m13, so the live angle can
  // be read straight back off the composited matrix. Driving the shader from
  // the element itself keeps the highlight locked to the card even if the
  // flip timing changes.
  function currentAngle(): number {
    const m = new DOMMatrix(getComputedStyle(inner).transform);
    return Math.atan2(-m.m13, m.m11);
  }

  function paint(s: Sheet, angle: number, isDark: number): void {
    const { gl, u } = s;
    gl.uniform2f(u.res, s.canvas.width, s.canvas.height);
    gl.uniform3fv(u.paper, rgb(getComputedStyle(s.face).backgroundColor));
    gl.uniform1f(u.angle, angle);
    gl.uniform1f(u.dark, isDark);
    gl.uniform1f(u.fibre, isDark ? 0.03 : 0.016);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    s.painted = { angle, dark: isDark };
  }

  function draw(angle: number): void {
    const isDark = dark.matches ? 1 : 0;
    for (const s of sheets) paint(s, angle, isDark);
  }

  // Settle onto the current angle and theme. A rest that changes neither —
  // the ResizeObserver's first callback, a settle after a mount that already
  // painted this angle — costs nothing: the full-card draw is the one
  // expensive thing here and must not run for no reason.
  function rest(): void {
    const cleared = resize();
    const angle = currentAngle();
    const isDark = dark.matches ? 1 : 0;
    for (const s of sheets) {
      const p = s.painted;
      if (cleared || !p || p.angle !== angle || p.dark !== isDark) paint(s, angle, isDark);
    }
  }

  // Which sheet the viewer is actually looking at. The other one is behind
  // backface-visibility: hidden, so painting it is pure waste — and this
  // shader is five octaves of fbm over the whole card at DPR 2, which is not
  // a cheap thing to waste.
  const frontIndex = (angle: number): number => (Math.cos(angle) >= 0 ? 0 : 1);

  // Redraw skips a repaint the eye could not resolve anyway. Sub-degree
  // pointer jitter was re-running the shader for nothing.
  let lastPainted = NaN;

  function follow(): void {
    draw(currentAngle());
    raf = requestAnimationFrame(follow);
  }

  // The material is painted in horizontal strips, one per idle slice: five
  // octaves of fbm over a whole card at DPR 2 is the one expensive draw in
  // the mount, and a software renderer can take longer than a frame on it.
  const STRIPS = 8;
  function paintStrip(s: Sheet, i: number, angle: number, isDark: number): void {
    const { gl, canvas } = s;
    const h = Math.ceil(canvas.height / STRIPS);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, i * h, canvas.width, h);
    paint(s, angle, isDark);
    gl.disable(gl.SCISSOR_TEST);
    // Draw calls are queued, not executed: without this the whole card's
    // raster lands in one task when the canvas is first composited, which
    // is exactly the long task the strips exist to avoid. finish() makes
    // each strip pay its own way, here, inside its own idle slice.
    gl.finish();
    if (i < STRIPS - 1) s.painted = null; // not whole yet
  }

  // The mount, as a list of short steps: one context per slice, then one
  // strip per slice, then attach. Any step that fails leaves the CSS grain
  // in place and nothing else changes.
  const steps: Array<() => boolean> = [];
  for (const face of faces) {
    steps.push(() => {
      let sheet: Sheet | null = null;
      try {
        sheet = makeSheet(face);
      } catch {
        return false;
      }
      if (!sheet) return false;
      sheets.push(sheet);
      return true;
    });
  }
  steps.push(() => {
    resize();
    return true;
  });
  for (let n = 0; n < faces.length; n++) {
    for (let i = 0; i < STRIPS; i++) {
      steps.push(() => {
        paintStrip(sheets[n]!, i, currentAngle(), dark.matches ? 1 : 0);
        return true;
      });
    }
  }
  steps.push(() => {
    for (const s of sheets) {
      s.face.insertBefore(s.canvas, s.face.firstChild);
      s.canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        document.documentElement.classList.remove("gl");
      });
    }
    const ro = new ResizeObserver(rest);
    ro.observe(faces[0]!);
    dark.addEventListener("change", rest);
    ready = true;
    document.documentElement.classList.add("gl");
    // The card may have turned or resized while the sheets were being
    // prepared; settle onto whatever is true now.
    rest();
    return true;
  });

  let step = 0;
  const run = (): void => {
    if (step >= steps.length) return;
    if (!steps[step++]!()) return;
    whenIdle(run);
  };
  whenIdle(run);

  // Nothing renders on its own, so an idle tab costs no GPU. The caller
  // tracks while a flip runs, settles when it ends, and asks for a single
  // frame when the pointer tilts the card at rest — one draw per pointermove
  // is far cheaper than a rAF loop that spins whether or not the card moved.
  return {
    follow() {
      if (!ready) return;
      cancelAnimationFrame(raf);
      follow();
    },
    settle() {
      if (!ready) return;
      cancelAnimationFrame(raf);
      raf = 0;
      lastPainted = NaN;
      rest();
    },
    // The tilt path, called from a pointermove. Only the visible sheet, and
    // only when the angle has actually moved. Measured at 3.3ms per event
    // before this — a fifth of a 60fps frame, spent on a face nobody can see.
    redraw() {
      if (!ready) return;
      const angle = currentAngle();
      if (Math.abs(angle - lastPainted) < 0.0026) return; // ~0.15 degrees
      lastPainted = angle;
      // A reallocated buffer is a cleared buffer, so the saving does not
      // apply on that frame: both sheets have to be repainted or the hidden
      // one is left black, ready to flash on the next flip.
      if (resize()) draw(angle);
      else paint(sheets[frontIndex(angle)]!, angle, dark.matches ? 1 : 0);
    },
  };
}
