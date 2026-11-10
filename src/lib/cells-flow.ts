/**
 * Faz a imagem de células ondular como matéria viva em líquido.
 * Só soma senos antes de ler a textura: é leve o bastante para o celular e não recria
 * nada, apenas desloca os pixels da imagem original por uma fração mínima.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes, uImg;
uniform float uT;
uniform vec3 uPointer; // xy na tela, z intensidade
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1. - uv.y;
  // Enquadramento em "cover", igual ao da imagem de reserva
  float ra = uRes.x / uRes.y, ia = uImg.x / uImg.y;
  vec2 s = ra > ia ? vec2(1., ia / ra) : vec2(ra / ia, 1.);
  vec2 o = (1. - s) * vec2(.72, .5);
  vec2 w = vec2(
    sin(uv.y * 6.7 + uT * .46) + .6 * sin(uv.y * 3.1 + uv.x * 4.3 - uT * .33),
    cos(uv.x * 5.9 + uT * .39) + .6 * sin(uv.x * 2.7 + uv.y * 5.1 + uT * .27)
  );
  // Ondulação ao redor do cursor, como um toque na superfície do líquido
  vec2 toPointer = (uv - uPointer.xy) * vec2(ra, 1.);
  float dist = length(toPointer);
  vec2 ripple = toPointer / max(dist, .001) * sin(dist * 34. - uT * 2.4) * exp(-dist * 7.) * uPointer.z * .0075;
  vec3 color = texture2D(uTex, o + (uv + w * .0065 + ripple) * s).rgb;
  // Só o que já é dourado cintila, em ondas lentas que atravessam a imagem
  float warm = smoothstep(.04, .3, color.r - color.b * .72);
  float wave = .5 + .5 * sin(uv.x * 7. - uv.y * 4. + uT * .7);
  color *= 1. + warm * wave * wave * .42;
  gl_FragColor = vec4(color, 1.);
}`;

const shader = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
};

/** Retorna null sem WebGL: a imagem parada continua por baixo. */
export function createCellsFlow(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const vs = shader(gl, gl.VERTEX_SHADER, VERT), fs = shader(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uT = gl.getUniformLocation(program, "uT");
  const uPointer = gl.getUniformLocation(program, "uPointer");
  const target = { x: 0.5, y: 0.5, z: 0 };
  const pointer = { x: 0.5, y: 0.5, z: 0 };
  gl.uniform2f(gl.getUniformLocation(program, "uImg"), image.naturalWidth, image.naturalHeight);

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio, 1.5);
    const w = Math.min(1920, Math.round(canvas.clientWidth * ratio)), h = Math.round((w * canvas.clientHeight) / Math.max(1, canvas.clientWidth));
    canvas.width = Math.max(1, w);
    canvas.height = Math.max(1, h);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  let running = false;
  let last = 0;
  const begin = performance.now();
  const draw = (now: number) => {
    // Segue o cursor com atraso e a ondulação se apaga sozinha quando ele para
    pointer.x += (target.x - pointer.x) * 0.08;
    pointer.y += (target.y - pointer.y) * 0.08;
    pointer.z += (target.z - pointer.z) * 0.06;
    target.z *= 0.985;
    gl.uniform3f(uPointer, pointer.x, pointer.y, pointer.z);
    gl.uniform1f(uT, (now - begin) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return; // 30 quadros bastam para um movimento tão lento
    last = now;
    draw(now);
  };
  draw(begin);

  return {
    /** Coordenadas de 0 a 1, relativas ao canvas. */
    touch(x: number, y: number) {
      target.x = x;
      target.y = y;
      target.z = 1;
    },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(texture);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
    },
  };
}
