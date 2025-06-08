window.onkeydown = (e) =>
    e.keyCode == 32
        ? (pVid(), splatStack.push(parseInt(Math.random() * 20) + 5))
        : e.preventDefault();
let audio = document.getElementById("audio"),
    txtelem = document.querySelector(".txt"),
    pp = document.getElementById("play");

function pVid() {
    audio.paused
        ? ((pp.innerHTML = "PAUSE"), audio.play())
        : ((pp.innerHTML = "PLAY"), audio.pause());
}

function renderTime() {
    setTimeout("renderTime()", 1e3);
    let r = document.getElementById("clockDisplay");
    r.textContent = r.innerText = new Date()
        .toLocaleTimeString()
        .toUpperCase();
}
renderTime();
txtelem.innerHTML =
    " <span> " +
    txtelem.innerHTML.trim().split(" ").join(" <\/span> <span> ") +
    " <\/span> ";

const canvas = document.getElementsByTagName("canvas")[0];
resizeCanvas();

let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 2,
    VELOCITY_DISSIPATION: 0.27,
    PRESSURE: 0.7,
    PRESSURE_ITERATIONS: 3,
    CURL: 3,
    SPLAT_RADIUS: 0.15,
    SPLAT_FORCE: 6e3,
    SHADING: !0,
    COLOR_UPDATE_SPEED: 2.5,
    BLOOM: !0,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: !0,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1,
},
    pointers = [],
    splatStack = [];

function pointerPrototype() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = !1;
    this.moved = !1;
    this.color = [30, 0, 300];
}

pointers.push(new pointerPrototype());
const { gl: gl, ext: ext } = getWebGLContext(canvas);

function getWebGLContext(e) {
    const r = {
        alpha: !0,
        depth: !1,
        stencil: !1,
        antialias: !1,
        preserveDrawingBuffer: !1,
    };
    let t = e.getContext("webgl2", r);
    const n = !!t;
    let i, o;
    n ||
        (t =
            e.getContext("webgl", r) || e.getContext("experimental-webgl", r)),
        n
            ? (t.getExtension("EXT_color_buffer_float"),
                (o = t.getExtension("OES_texture_float_linear")))
            : ((i = t.getExtension("OES_texture_half_float")),
                (o = t.getExtension("OES_texture_half_float_linear"))),
        t.clearColor(0, 0, 0, 1);
    const a = n ? t.HALF_FLOAT : i.HALF_FLOAT_OES;
    let l, u, c;
    return (
        n
            ? ((l = getSupportedFormat(t, t.RGBA16F, t.RGBA, a)),
                (u = getSupportedFormat(t, t.RG16F, t.RG, a)),
                (c = getSupportedFormat(t, t.R16F, t.RED, a)))
            : ((l = getSupportedFormat(t, t.RGBA, t.RGBA, a)),
                (u = getSupportedFormat(t, t.RGBA, t.RGBA, a)),
                (c = getSupportedFormat(t, t.RGBA, t.RGBA, a))),
        {
            gl: t,
            ext: {
                formatRGBA: l,
                formatRG: u,
                formatR: c,
                halfFloatTexType: a,
                supportLinearFiltering: o,
            },
        }
    );
}

function getSupportedFormat(e, r, t, n) {
    if (!supportRenderTextureFormat(e, r, t, n))
        switch (r) {
            case e.R16F:
                return getSupportedFormat(e, e.RG16F, e.RG, n);

            case e.RG16F:
                return getSupportedFormat(e, e.RGBA16F, e.RGBA, n);

            default:
                return null;
        }
    return {
        internalFormat: r,
        format: t,
    };
}

function supportRenderTextureFormat(e, r, t, n) {
    let i = e.createTexture();
    e.bindTexture(e.TEXTURE_2D, i),
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST),
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST),
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE),
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE),
        e.texImage2D(e.TEXTURE_2D, 0, r, 4, 4, 0, t, n, null);
    let o = e.createFramebuffer();
    return (
        e.bindFramebuffer(e.FRAMEBUFFER, o),
        e.framebufferTexture2D(
            e.FRAMEBUFFER,
            e.COLOR_ATTACHMENT0,
            e.TEXTURE_2D,
            i,
            0
        ),
        e.checkFramebufferStatus(e.FRAMEBUFFER) == e.FRAMEBUFFER_COMPLETE
    );
}

function framebufferToTexture(e) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, e.fbo);
    let r = e.width * e.height * 4,
        t = new Float32Array(r);
    return gl.readPixels(0, 0, e.width, e.height, gl.RGBA, gl.FLOAT, t), t;
}

function normalizeTexture(e, r, t) {
    let n = new Uint8Array(e.length),
        i = 0;
    for (let o = t - 1; o >= 0; o--)
        for (let t = 0; t < r; t++) {
            let a = o * r * 4 + 4 * t;
            (n[a + 0] = 255 * clamp01(e[i + 0])),
                (n[a + 1] = 255 * clamp01(e[i + 1])),
                (n[a + 2] = 255 * clamp01(e[i + 2])),
                (n[a + 3] = 255 * clamp01(e[i + 3])),
                (i += 4);
        }
    return n;
}

function clamp01(e) {
    return Math.min(Math.max(e, 0), 1);
}

/Mobi|Android/i.test(navigator.userAgent) &&
    (config.DYE_RESOLUTION = 512),
    ext.supportLinearFiltering ||
    ((config.DYE_RESOLUTION = 512),
        (config.SHADING = !1),
        (config.BLOOM = !1),
        (config.SUNRAYS = !1));

class Material {
    constructor(e, r) {
        (this.vertexShader = e),
            (this.fragmentShaderSource = r),
            (this.programs = []),
            (this.activeProgram = null),
            (this.uniforms = []);
    }
    setKeywords(e) {
        let r = 0;
        for (let t = 0; t < e.length; t++) r += hashCode(e[t]);
        let t = this.programs[r];
        if (null == t) {
            let n = compileShader(
                gl.FRAGMENT_SHADER,
                this.fragmentShaderSource,
                e
            );
            (t = createProgram(this.vertexShader, n)), (this.programs[r] = t);
        }
        t != this.activeProgram &&
            ((this.uniforms = getUniforms(t)), (this.activeProgram = t));
    }
    bind() {
        gl.useProgram(this.activeProgram);
    }
}

class Program {
    constructor(e, r) {
        (this.uniforms = {}),
            (this.program = createProgram(e, r)),
            (this.uniforms = getUniforms(this.program));
    }
    bind() {
        gl.useProgram(this.program);
    }
}

function createProgram(e, r) {
    let t = gl.createProgram();
    return (
        gl.attachShader(t, e),
        gl.attachShader(t, r),
        gl.linkProgram(t),
        gl.getProgramParameter(t, gl.LINK_STATUS) ||
        console.trace(gl.getProgramInfoLog(t)),
        t
    );
}

function getUniforms(e) {
    let r = [],
        t = gl.getProgramParameter(e, gl.ACTIVE_UNIFORMS);
    for (let n = 0; n < t; n++) {
        let t = gl.getActiveUniform(e, n).name;
        r[t] = gl.getUniformLocation(e, t);
    }
    return r;
}

function compileShader(e, r, t) {
    r = addKeywords(r, t);
    const n = gl.createShader(e);
    return (
        gl.shaderSource(n, r),
        gl.compileShader(n),
        gl.getShaderParameter(n, gl.COMPILE_STATUS) ||
        console.trace(gl.getShaderInfoLog(n)),
        n
    );
}

function addKeywords(e, r) {
    if (null == r) return e;
    let t = "";
    return (
        r.forEach((e) => {
            t += "#define " + e + "\n";
        }),
        t + e
    );
}

const baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    "\nprecision highp float;\nattribute vec2 aPosition;\nvarying vec2 vUv;\nvarying vec2 vL;\nvarying vec2 vR;\nvarying vec2 vT;\nvarying vec2 vB;\nuniform vec2 texelSize;\nvoid main () {\nvUv = aPosition * 0.5 + 0.5;\nvL = vUv - vec2(texelSize.x, 0.0);\nvR = vUv + vec2(texelSize.x, 0.0);\nvT = vUv + vec2(0.0, texelSize.y);\nvB = vUv - vec2(0.0, texelSize.y);\ngl_Position = vec4(aPosition, 0.0, 1.0);\n}\n"
),
    blurVertexShader = compileShader(
        gl.VERTEX_SHADER,
        "\nprecision highp float;\nattribute vec2 aPosition;\nvarying vec2 vUv;\nvarying vec2 vL;\nvarying vec2 vR;\nuniform vec2 texelSize;\nvoid main () {\nvUv = aPosition * 0.5 + 0.5;\nfloat offset = 1.33333333;\nvL = vUv - texelSize * offset;\nvR = vUv + texelSize * offset;\ngl_Position = vec4(aPosition, 0.0, 1.0);\n}\n"
    ),
    blurShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying vec2 vUv;\nvarying vec2 vL;\nvarying vec2 vR;\nuniform sampler2D uTexture;\nvoid main () {\nvec4 sum = texture2D(uTexture, vUv) * 0.29411764;\nsum += texture2D(uTexture, vL) * 0.35294117;\nsum += texture2D(uTexture, vR) * 0.35294117;\ngl_FragColor = sum;\n}\n"
    ),
    copyShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nuniform sampler2D uTexture;\nvoid main () {\ngl_FragColor = texture2D(uTexture, vUv);\n}\n"
    ),
    clearShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nuniform sampler2D uTexture;\nuniform float value;\nvoid main () {\ngl_FragColor = value * texture2D(uTexture, vUv);\n}\n"
    ),
    colorShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nuniform vec4 color;\nvoid main () {\ngl_FragColor = color;\n}\n"
    ),
    checkerboardShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform float aspectRatio;\n#define SCALE 25.0\nvoid main () {\nvec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));\nfloat v = mod(uv.x + uv.y, 2.0);\nv = v * 0.1 + 0.8;\ngl_FragColor = vec4(vec3(v), 1.0);\n}\n"
    ),
    displayShaderSource =
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nvarying vec2 vL;\nvarying vec2 vR;\nvarying vec2 vT;\nvarying vec2 vB;\nuniform sampler2D uTexture;\nuniform sampler2D uBloom;\nuniform sampler2D uSunrays;\nuniform sampler2D uDithering;\nuniform vec2 ditherScale;\nuniform vec2 texelSize;\nvec3 linearToGamma (vec3 color) {\ncolor = max(color, vec3(0));\nreturn max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));\n}\nvoid main () {\nvec3 c = texture2D(uTexture, vUv).rgb;\n#ifdef SHADING\nvec3 lc = texture2D(uTexture, vL).rgb;\nvec3 rc = texture2D(uTexture, vR).rgb;\nvec3 tc = texture2D(uTexture, vT).rgb;\nvec3 bc = texture2D(uTexture, vB).rgb;\nfloat dx = length(rc) - length(lc);\nfloat dy = length(tc) - length(bc);\nvec3 n = normalize(vec3(dx, dy, length(texelSize)));\nvec3 l = vec3(0.0, 0.0, 1.0);\nfloat diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\nc *= diffuse;\n#endif\n#ifdef BLOOM\nvec3 bloom = texture2D(uBloom, vUv).rgb;\n#endif\n#ifdef SUNRAYS\nfloat sunrays = texture2D(uSunrays, vUv).r;\nc *= sunrays;\n#ifdef BLOOM\nbloom *= sunrays;\n#endif\n#endif\n#ifdef BLOOM\nfloat noise = texture2D(uDithering, vUv * ditherScale).r;\nnoise = noise * 2.0 - 1.0;\nbloom += noise / 255.0;\nbloom = linearToGamma(bloom);\nc += bloom;\n#endif\nfloat a = max(c.r, max(c.g, c.b));\ngl_FragColor = vec4(c, a);\n}\n",
    bloomPrefilterShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform vec3 curve;\nuniform float threshold;\nvoid main () {\nvec3 c = texture2D(uTexture, vUv).rgb;\nfloat br = max(c.r, max(c.g, c.b));\nfloat rq = clamp(br - curve.x, 0.0, curve.y);\nrq = curve.z * rq * rq;\nc *= max(rq, br - threshold) / max(br, 0.0001);\ngl_FragColor = vec4(c, 0.0);\n}\n"
    ),
    bloomBlurShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying vec2 vL;\nvarying vec2 vR;\nvarying vec2 vT;\nvarying vec2 vB;\nuniform sampler2D uTexture;\nvoid main () {\nvec4 sum = vec4(0.0);\nsum += texture2D(uTexture, vL);\nsum += texture2D(uTexture, vR);\nsum += texture2D(uTexture, vT);\nsum += texture2D(uTexture, vB);\nsum *= 0.25;\ngl_FragColor = sum;\n}\n"
    ),
    bloomFinalShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying vec2 vL;\nvarying vec2 vR;\nvarying vec2 vT;\nvarying vec2 vB;\nuniform sampler2D uTexture;\nuniform float intensity;\nvoid main () {\nvec4 sum = vec4(0.0);\nsum += texture2D(uTexture, vL);\nsum += texture2D(uTexture, vR);\nsum += texture2D(uTexture, vT);\nsum += texture2D(uTexture, vB);\nsum *= 0.25;\ngl_FragColor = sum * intensity;\n}\n"
    ),
    sunraysMaskShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nvoid main () {\nvec4 c = texture2D(uTexture, vUv);\nfloat br = max(c.r, max(c.g, c.b));\nc.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);\ngl_FragColor = c;\n}\n"
    ),
    sunraysShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nuniform float weight;\n#define ITERATIONS 16\nvoid main () {\nfloat Density = 0.3;\nfloat Decay = 0.95;\nfloat Exposure = 0.7;\nvec2 coord = vUv;\nvec2 dir = vUv - 0.5;\ndir *= 1.0 / float(ITERATIONS) * Density;\nfloat illuminationDecay = 1.0;\nfloat color = texture2D(uTexture, vUv).a;\nfor (int i = 0; i < ITERATIONS; i++)\n{\n    coord -= dir;\n    float col = texture2D(uTexture, coord).a;\n    color += col * illuminationDecay * weight;\n    illuminationDecay *= Decay;\n}\ngl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);\n}\n"
    ),
    splatShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uTarget;\nuniform float aspectRatio;\nuniform vec3 color;\nuniform vec2 point;\nuniform float radius;\nvoid main () {\nvec2 p = vUv - point.xy;\np.x *= aspectRatio;\nvec3 splat = exp(-dot(p, p) / radius) * color;\nvec3 base = texture2D(uTarget, vUv).xyz;\ngl_FragColor = vec4(base + splat, 1.0);\n}\n"
    ),
    advectionShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nuniform sampler2D uVelocity;\nuniform sampler2D uSource;\nuniform vec2 texelSize;\nuniform vec2 dyeTexelSize;\nuniform float dt;\nuniform float dissipation;\nvec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {\nvec2 st = uv / tsize - 0.5;\nvec2 iuv = floor(st);\nvec2 fuv = fract(st);\nvec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);\nvec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);\nvec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);\nvec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);\nreturn mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);\n}\nvoid main () {\n#ifdef MANUAL_FILTERING\nvec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;\nvec4 result = bilerp(uSource, coord, dyeTexelSize);\n#else\nvec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;\nvec4 result = texture2D(uSource, coord);\n#endif\nfloat decay = 1.0 + dissipation * dt;\ngl_FragColor = result / decay;\n}",
        ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]
    ),
    divergenceShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nvarying highp vec2 vL;\nvarying highp vec2 vR;\nvarying highp vec2 vT;\nvarying highp vec2 vB;\nuniform sampler2D uVelocity;\nvoid main () {\nfloat L = texture2D(uVelocity, vL).x;\nfloat R = texture2D(uVelocity, vR).x;\nfloat T = texture2D(uVelocity, vT).y;\nfloat B = texture2D(uVelocity, vB).y;\nvec2 C = texture2D(uVelocity, vUv).xy;\nif (vL.x < 0.0) { L = -C.x; }\nif (vR.x > 1.0) { R = -C.x; }\nif (vT.y > 1.0) { T = -C.y; }\nif (vB.y < 0.0) { B = -C.y; }\nfloat div = 0.5 * (R - L + T - B);\ngl_FragColor = vec4(div, 0.0, 0.0, 1.0);\n}\n"
    ),
    curlShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nvarying highp vec2 vL;\nvarying highp vec2 vR;\nvarying highp vec2 vT;\nvarying highp vec2 vB;\nuniform sampler2D uVelocity;\nvoid main () {\nfloat L = texture2D(uVelocity, vL).y;\nfloat R = texture2D(uVelocity, vR).y;\nfloat T = texture2D(uVelocity, vT).x;\nfloat B = texture2D(uVelocity, vB).x;\nfloat vorticity = R - L - T + B;\ngl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);\n}\n"
    ),
    vorticityShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision highp float;\nprecision highp sampler2D;\nvarying vec2 vUv;\nvarying vec2 vL;\nvarying vec2 vR;\nvarying vec2 vT;\nvarying vec2 vB;\nuniform sampler2D uVelocity;\nuniform sampler2D uCurl;\nuniform float curl;\nuniform float dt;\nvoid main () {\nfloat L = texture2D(uCurl, vL).x;\nfloat R = texture2D(uCurl, vR).x;\nfloat T = texture2D(uCurl, vT).x;\nfloat B = texture2D(uCurl, vB).x;\nfloat C = texture2D(uCurl, vUv).x;\nvec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\nforce /= length(force) + 0.0001;\nforce *= curl * C;\nforce.y *= -1.0;\nvec2 velocity = texture2D(uVelocity, vUv).xy;\nvelocity += force * dt;\nvelocity = min(max(velocity, -1000.0), 1000.0);\ngl_FragColor = vec4(velocity, 0.0, 1.0);\n}\n"
    ),
    pressureShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nvarying highp vec2 vL;\nvarying highp vec2 vR;\nvarying highp vec2 vT;\nvarying highp vec2 vB;\nuniform sampler2D uPressure;\nuniform sampler2D uDivergence;\nvoid main () {\nfloat L = texture2D(uPressure, vL).x;\nfloat R = texture2D(uPressure, vR).x;\nfloat T = texture2D(uPressure, vT).x;\nfloat B = texture2D(uPressure, vB).x;\nfloat C = texture2D(uPressure, vUv).x;\nfloat divergence = texture2D(uDivergence, vUv).x;\nfloat pressure = (L + R + B + T - divergence) * 0.25;\ngl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);\n}\n"
    ),
    gradientSubtractShader = compileShader(
        gl.FRAGMENT_SHADER,
        "\nprecision mediump float;\nprecision mediump sampler2D;\nvarying highp vec2 vUv;\nvarying highp vec2 vL;\nvarying highp vec2 vR;\nvarying highp vec2 vT;\nvarying highp vec2 vB;\nuniform sampler2D uPressure;\nuniform sampler2D uVelocity;\nvoid main () {\nfloat L = texture2D(uPressure, vL).x;\nfloat R = texture2D(uPressure, vR).x;\nfloat T = texture2D(uPressure, vT).x;\nfloat B = texture2D(uPressure, vB).x;\nvec2 velocity = texture2D(uVelocity, vUv).xy;\nvelocity.xy -= vec2(R - L, T - B);\ngl_FragColor = vec4(velocity, 0.0, 1.0);\n}\n"
    ),
    blit = (() => (
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()),
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
            gl.STATIC_DRAW
        ),
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()),
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 0, 2, 3]),
            gl.STATIC_DRAW
        ),
        gl.vertexAttribPointer(0, 2, gl.FLOAT, !1, 0, 0),
        gl.enableVertexAttribArray(0),
        (e, r = !1) => {
            null == e
                ? (gl.viewport(
                    0,
                    0,
                    gl.drawingBufferWidth,
                    gl.drawingBufferHeight
                ),
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null))
                : (gl.viewport(0, 0, e.width, e.height),
                    gl.bindFramebuffer(gl.FRAMEBUFFER, e.fbo)),
                r && (gl.clearColor(0, 0, 0, 1), gl.clear(gl.COLOR_BUFFER_BIT)),
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
    ))();

function CHECK_FRAMEBUFFER_STATUS() {
    let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    e != gl.FRAMEBUFFER_COMPLETE &&
        console.trace("Framebuffer error: " + e);
}

let dye,
    velocity,
    divergence,
    curl,
    pressure,
    bloom,
    sunrays,
    sunraysTemp,
    bloomFramebuffers = [];

const blurProgram = new Program(blurVertexShader, blurShader),
    copyProgram = new Program(baseVertexShader, copyShader),
    clearProgram = new Program(baseVertexShader, clearShader),
    colorProgram = new Program(baseVertexShader, colorShader),
    checkerboardProgram = new Program(baseVertexShader, checkerboardShader),
    bloomPrefilterProgram = new Program(
        baseVertexShader,
        bloomPrefilterShader
    ),
    bloomBlurProgram = new Program(baseVertexShader, bloomBlurShader),
    bloomFinalProgram = new Program(baseVertexShader, bloomFinalShader),
    sunraysMaskProgram = new Program(baseVertexShader, sunraysMaskShader),
    sunraysProgram = new Program(baseVertexShader, sunraysShader),
    splatProgram = new Program(baseVertexShader, splatShader),
    advectionProgram = new Program(baseVertexShader, advectionShader),
    divergenceProgram = new Program(baseVertexShader, divergenceShader),
    curlProgram = new Program(baseVertexShader, curlShader),
    vorticityProgram = new Program(baseVertexShader, vorticityShader),
    pressureProgram = new Program(baseVertexShader, pressureShader),
    gradienSubtractProgram = new Program(
        baseVertexShader,
        gradientSubtractShader
    ),
    displayMaterial = new Material(baseVertexShader, displayShaderSource);

function initFramebuffers() {
    let e = getResolution(config.SIM_RESOLUTION),
        r = getResolution(config.DYE_RESOLUTION);
    const t = ext.halfFloatTexType,
        n = ext.formatRGBA,
        i = ext.formatRG,
        o = ext.formatR,
        a = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    gl.disable(gl.BLEND),
        (dye =
            null == dye
                ? createDoubleFBO(
                    r.width,
                    r.height,
                    n.internalFormat,
                    n.format,
                    t,
                    a
                )
                : resizeDoubleFBO(
                    dye,
                    r.width,
                    r.height,
                    n.internalFormat,
                    n.format,
                    t,
                    a
                )),
        (velocity =
            null == velocity
                ? createDoubleFBO(
                    e.width,
                    e.height,
                    i.internalFormat,
                    i.format,
                    t,
                    a
                )
                : resizeDoubleFBO(
                    velocity,
                    e.width,
                    e.height,
                    i.internalFormat,
                    i.format,
                    t,
                    a
                )),
        (divergence = createFBO(
            e.width,
            e.height,
            o.internalFormat,
            o.format,
            t,
            gl.NEAREST
        )),
        (curl = createFBO(
            e.width,
            e.height,
            o.internalFormat,
            o.format,
            t,
            gl.NEAREST
        )),
        (pressure = createDoubleFBO(
            e.width,
            e.height,
            o.internalFormat,
            o.format,
            t,
            gl.NEAREST
        )),
        initBloomFramebuffers(),
        initSunraysFramebuffers();
}

function initBloomFramebuffers() {
    let e = getResolution(config.BLOOM_RESOLUTION);
    const r = ext.halfFloatTexType,
        t = ext.formatRGBA,
        n = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    (bloom = createFBO(
        e.width,
        e.height,
        t.internalFormat,
        t.format,
        r,
        n
    )),
        (bloomFramebuffers.length = 0);
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
        let o = e.width >> (i + 1),
            a = e.height >> (i + 1);
        if (o < 2 || a < 2) break;
        let l = createFBO(o, a, t.internalFormat, t.format, r, n);
        bloomFramebuffers.push(l);
    }
}

function initSunraysFramebuffers() {
    let e = getResolution(config.SUNRAYS_RESOLUTION);
    const r = ext.halfFloatTexType,
        t = ext.formatR,
        n = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    (sunrays = createFBO(
        e.width,
        e.height,
        t.internalFormat,
        t.format,
        r,
        n
    )),
        (sunraysTemp = createFBO(
            e.width,
            e.height,
            t.internalFormat,
            t.format,
            r,
            n
        ));
}

function createFBO(e, r, t, n, i, o) {
    gl.activeTexture(gl.TEXTURE0);
    let a = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, a),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, o),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
        gl.texImage2D(gl.TEXTURE_2D, 0, t, e, r, 0, n, i, null);
    let l = gl.createFramebuffer();
    return (
        gl.bindFramebuffer(gl.FRAMEBUFFER, l),
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            a,
            0
        ),
        gl.viewport(0, 0, e, r),
        gl.clear(gl.COLOR_BUFFER_BIT),
        {
            texture: a,
            fbo: l,
            width: e,
            height: r,
            texelSizeX: 1 / e,
            texelSizeY: 1 / r,
            attach: (e) => (
                gl.activeTexture(gl.TEXTURE0 + e),
                gl.bindTexture(gl.TEXTURE_2D, a),
                e
            ),
        }
    );
}

function createDoubleFBO(e, r, t, n, i, o) {
    let a = createFBO(e, r, t, n, i, o),
        l = createFBO(e, r, t, n, i, o);
    return {
        width: e,
        height: r,
        texelSizeX: a.texelSizeX,
        texelSizeY: a.texelSizeY,
        get read() {
            return a;
        },
        set read(e) {
            a = e;
        },
        get write() {
            return l;
        },
        set write(e) {
            l = e;
        },
        swap() {
            let e = a;
            (a = l), (l = e);
        },
    };
}

function resizeFBO(e, r, t, n, i, o, a) {
    let l = createFBO(r, t, n, i, o, a);
    return (
        copyProgram.bind(),
        gl.uniform1i(copyProgram.uniforms.uTexture, e.attach(0)),
        blit(l),
        l
    );
}

function resizeDoubleFBO(e, r, t, n, i, o, a) {
    return e.width == r && e.height == t
        ? e
        : ((e.read = resizeFBO(e.read, r, t, n, i, o, a)),
            (e.write = createFBO(r, t, n, i, o, a)),
            (e.width = r),
            (e.height = t),
            (e.texelSizeX = 1 / r),
            (e.texelSizeY = 1 / t),
            e);
}

function createTextureAsync(e) {
    let r = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, r),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT),
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            1,
            1,
            0,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255])
        );
    let t = {
        texture: r,
        width: 1,
        height: 1,
        attach: (e) => (
            gl.activeTexture(gl.TEXTURE0 + e),
            gl.bindTexture(gl.TEXTURE_2D, r),
            e
        ),
    },
        n = new Image();
    return (
        (n.onload = () => {
            (t.width = n.width),
                (t.height = n.height),
                gl.bindTexture(gl.TEXTURE_2D, r),
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    n
                );
        }),
        (n.src = e),
        t
    );
}

displayMaterial.setKeywords(["SUNRAYS", "BLOOM", "SHADING"]),
    initFramebuffers(),
    multipleSplats(parseInt(20 * Math.random()) + 5);

let lastUpdateTime = Date.now(),
    colorUpdateTimer = 0;

function update() {
    const e = calcDeltaTime();
    resizeCanvas() && initFramebuffers(),
        updateColors(e),
        applyInputs(),
        config.PAUSED || step(e),
        render(),
        requestAnimationFrame(update);
}

function calcDeltaTime() {
    let e = Date.now(),
        r = (e - lastUpdateTime) / 1e3;
    return (r = Math.min(r, 0.016666)), (lastUpdateTime = e), r;
}

function resizeCanvas() {
    let e = scaleByPixelRatio(canvas.clientWidth),
        r = scaleByPixelRatio(canvas.clientHeight);
    return (
        (canvas.width != e || canvas.height != r) &&
        ((canvas.width = e), (canvas.height = r), !0)
    );
}

function updateColors(e) {
    (colorUpdateTimer += e * config.COLOR_UPDATE_SPEED) >= 1 &&
        ((colorUpdateTimer = wrap(colorUpdateTimer, 0, 1)),
            pointers.forEach((e) => {
                e.color = generateColor();
            }));
}

function applyInputs() {
    splatStack.length > 0 && multipleSplats(splatStack.pop()),
        pointers.forEach((e) => {
            e.moved && ((e.moved = !1), splatPointer(e));
        });
}

function step(e) {
    gl.disable(gl.BLEND),
        curlProgram.bind(),
        gl.uniform2f(
            curlProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0)),
        blit(curl),
        vorticityProgram.bind(),
        gl.uniform2f(
            vorticityProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        gl.uniform1i(
            vorticityProgram.uniforms.uVelocity,
            velocity.read.attach(0)
        ),
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1)),
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL),
        gl.uniform1f(vorticityProgram.uniforms.dt, e),
        blit(velocity.write),
        velocity.swap(),
        divergenceProgram.bind(),
        gl.uniform2f(
            divergenceProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        gl.uniform1i(
            divergenceProgram.uniforms.uVelocity,
            velocity.read.attach(0)
        ),
        blit(divergence),
        clearProgram.bind(),
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0)),
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE),
        blit(pressure.write),
        pressure.swap(),
        pressureProgram.bind(),
        gl.uniform2f(
            pressureProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        gl.uniform1i(
            pressureProgram.uniforms.uDivergence,
            divergence.attach(0)
        );
    for (let e = 0; e < config.PRESSURE_ITERATIONS; e++)
        gl.uniform1i(
            pressureProgram.uniforms.uPressure,
            pressure.read.attach(1)
        ),
            blit(pressure.write),
            pressure.swap();
    gradienSubtractProgram.bind(),
        gl.uniform2f(
            gradienSubtractProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        gl.uniform1i(
            gradienSubtractProgram.uniforms.uPressure,
            pressure.read.attach(0)
        ),
        gl.uniform1i(
            gradienSubtractProgram.uniforms.uVelocity,
            velocity.read.attach(1)
        ),
        blit(velocity.write),
        velocity.swap(),
        advectionProgram.bind(),
        gl.uniform2f(
            advectionProgram.uniforms.texelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        ),
        ext.supportLinearFiltering ||
        gl.uniform2f(
            advectionProgram.uniforms.dyeTexelSize,
            velocity.texelSizeX,
            velocity.texelSizeY
        );
    let r = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, r),
        gl.uniform1i(advectionProgram.uniforms.uSource, r),
        gl.uniform1f(advectionProgram.uniforms.dt, e),
        gl.uniform1f(
            advectionProgram.uniforms.dissipation,
            config.VELOCITY_DISSIPATION
        ),
        blit(velocity.write),
        velocity.swap(),
        ext.supportLinearFiltering ||
        gl.uniform2f(
            advectionProgram.uniforms.dyeTexelSize,
            dye.texelSizeX,
            dye.texelSizeY
        ),
        gl.uniform1i(
            advectionProgram.uniforms.uVelocity,
            velocity.read.attach(0)
        ),
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1)),
        gl.uniform1f(
            advectionProgram.uniforms.dissipation,
            config.DENSITY_DISSIPATION
        ),
        blit(dye.write),
        dye.swap();
}

function render(e) {
    config.BLOOM && applyBloom(dye.read, bloom),
        config.SUNRAYS &&
        (applySunrays(dye.read, dye.write, sunrays),
            blur(sunrays, sunraysTemp, 1)),
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA),
        gl.enable(gl.BLEND),
        drawColor(e, {
            r: 0,
            g: 0,
            b: 0,
        }),
        drawDisplay(e);
}

function drawColor(e, r) {
    colorProgram.bind(),
        gl.uniform4f(colorProgram.uniforms.color, r.r, r.g, r.b, 1),
        blit(e);
}

function drawDisplay(e) {
    let r = null == e ? gl.drawingBufferWidth : e.width,
        t = null == e ? gl.drawingBufferHeight : e.height;
    displayMaterial.bind(),
        config.SHADING &&
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / r, 1 / t),
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0)),
        config.BLOOM &&
        gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1)),
        config.SUNRAYS &&
        gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3)),
        blit(e);
}

function applyBloom(e, r) {
    if (bloomFramebuffers.length < 2) return;
    let t = r;
    gl.disable(gl.BLEND), bloomPrefilterProgram.bind();
    let n = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 1e-4,
        i = config.BLOOM_THRESHOLD - n,
        o = 2 * n,
        a = 0.25 / n;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, i, o, a),
        gl.uniform1f(
            bloomPrefilterProgram.uniforms.threshold,
            config.BLOOM_THRESHOLD
        ),
        gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, e.attach(0)),
        blit(t),
        bloomBlurProgram.bind();
    for (let e = 0; e < bloomFramebuffers.length; e++) {
        let r = bloomFramebuffers[e];
        gl.uniform2f(
            bloomBlurProgram.uniforms.texelSize,
            t.texelSizeX,
            t.texelSizeY
        ),
            gl.uniform1i(bloomBlurProgram.uniforms.uTexture, t.attach(0)),
            blit(r),
            (t = r);
    }
    gl.blendFunc(gl.ONE, gl.ONE), gl.enable(gl.BLEND);
    for (let e = bloomFramebuffers.length - 2; e >= 0; e--) {
        let r = bloomFramebuffers[e];
        gl.uniform2f(
            bloomBlurProgram.uniforms.texelSize,
            t.texelSizeX,
            t.texelSizeY
        ),
            gl.uniform1i(bloomBlurProgram.uniforms.uTexture, t.attach(0)),
            gl.viewport(0, 0, r.width, r.height),
            blit(r),
            (t = r);
    }
    gl.disable(gl.BLEND),
        bloomFinalProgram.bind(),
        gl.uniform2f(
            bloomFinalProgram.uniforms.texelSize,
            t.texelSizeX,
            t.texelSizeY
        ),
        gl.uniform1i(bloomFinalProgram.uniforms.uTexture, t.attach(0)),
        gl.uniform1f(
            bloomFinalProgram.uniforms.intensity,
            config.BLOOM_INTENSITY
        ),
        blit(r);
}

function applySunrays(e, r, t) {
    gl.disable(gl.BLEND),
        sunraysMaskProgram.bind(),
        gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, e.attach(0)),
        blit(r),
        sunraysProgram.bind(),
        gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT),
        gl.uniform1i(sunraysProgram.uniforms.uTexture, r.attach(0)),
        blit(t);
}

function blur(e, r, t) {
    blurProgram.bind();
    for (let n = 0; n < t; n++)
        gl.uniform2f(blurProgram.uniforms.texelSize, e.texelSizeX, 0),
            gl.uniform1i(blurProgram.uniforms.uTexture, e.attach(0)),
            blit(r),
            gl.uniform2f(blurProgram.uniforms.texelSize, 0, e.texelSizeY),
            gl.uniform1i(blurProgram.uniforms.uTexture, r.attach(0)),
            blit(e);
}

function splatPointer(e) {
    let r = e.deltaX * config.SPLAT_FORCE,
        t = e.deltaY * config.SPLAT_FORCE;
    splat(e.texcoordX, e.texcoordY, r, t, e.color);
}

function multipleSplats(e) {
    for (let r = 0; r < e; r++) {
        const e = generateColor();
        (e.r *= 10),
            (e.g *= 10),
            (e.b *= 10),
            splat(
                Math.random(),
                Math.random(),
                1e3 * (Math.random() - 0.5),
                1e3 * (Math.random() - 0.5),
                e
            );
    }
}

function splat(e, r, t, n, i) {
    splatProgram.bind(),
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0)),
        gl.uniform1f(
            splatProgram.uniforms.aspectRatio,
            canvas.width / canvas.height
        ),
        gl.uniform2f(splatProgram.uniforms.point, e, r),
        gl.uniform3f(splatProgram.uniforms.color, t, n, 0),
        gl.uniform1f(
            splatProgram.uniforms.radius,
            correctRadius(config.SPLAT_RADIUS / 100)
        ),
        blit(velocity.write),
        velocity.swap(),
        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0)),
        gl.uniform3f(splatProgram.uniforms.color, i.r, i.g, i.b),
        blit(dye.write),
        dye.swap();
}

function correctRadius(e) {
    let r = canvas.width / canvas.height;
    return r > 1 && (e *= r), e;
}

function updatePointerDownData(o, e, d, t) {
    o.id = e;
    o.down = !0;
    o.moved = !1;
    o.texcoordX = d / canvas.width;
    o.texcoordY = 1 - t / canvas.height;
    o.prevTexcoordX = o.texcoordX;
    o.prevTexcoordY = o.texcoordY;
    o.deltaX = 0;
    o.deltaY = 0;
    o.color = generateColor();
}

function updatePointerMoveData(e, o, t) {
    e.prevTexcoordX = e.texcoordX;
    e.prevTexcoordY = e.texcoordY;
    e.texcoordX = o / canvas.width;
    e.texcoordY = 1 - t / canvas.height;
    e.deltaX = correctDeltaX(e.texcoordX - e.prevTexcoordX);
    e.deltaY = correctDeltaY(e.texcoordY - e.prevTexcoordY);
    e.moved = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0;
}

function correctDeltaX(t) {
    let a = canvas.width / canvas.height;
    return a < 1 && (t *= a), t;
}

function correctDeltaY(t) {
    let a = canvas.width / canvas.height;
    return a > 1 && (t /= a), t;
}

function generateColor() {
    let e,
        r,
        t,
        n,
        i,
        o,
        a,
        l,
        u = Math.random();
    switch (
    ((o = 0),
        (a = 1 * (1 - 1 * (i = 6 * u - (n = Math.floor(6 * u))))),
        (l = 1 * (1 - 1 * (1 - i))),
        n % 6)
    ) {
        case 0:
            (e = 1), (r = l), (t = o);
            break;

        case 1:
            (e = a), (r = 1), (t = o);
            break;

        case 2:
            (e = o), (r = 1), (t = l);
            break;

        case 3:
            (e = o), (r = a), (t = 1);
            break;

        case 4:
            (e = l), (r = o), (t = 1);
            break;

        case 5:
            (e = 1), (r = o), (t = a);
    }
    return {
        r: (e *= 0.15),
        g: (r *= 0.15),
        b: (t *= 0.15),
    };
}

function wrap(e, r, t) {
    let n = t - r;
    return 0 == n ? r : ((e - r) % n) + r;
}

function getResolution(e) {
    let r = gl.drawingBufferWidth / gl.drawingBufferHeight;
    r < 1 && (r = 1 / r);
    let t = Math.round(e),
        n = Math.round(e * r);
    return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? {
            width: n,
            height: t,
        }
        : {
            width: t,
            height: n,
        };
}

function getTextureScale(e, r, t) {
    return {
        x: r / e.width,
        y: t / e.height,
    };
}

function scaleByPixelRatio(e) {
    let r = window.devicePixelRatio || 1;
    return Math.floor(e * r);
}

function hashCode(e) {
    if (0 == e.length) return 0;
    let r = 0;
    for (let t = 0; t < e.length; t++)
        (r = (r << 5) - r + e.charCodeAt(t)), (r |= 0);
    return r;
}

update(),
    canvas.addEventListener("mousedown", (e) => {
        let r = scaleByPixelRatio(e.offsetX),
            t = scaleByPixelRatio(e.offsetY),
            n = pointers.find((e) => -1 == e.id);
        null == n && (n = new pointerPrototype()),
            updatePointerDownData(n, -1, r, t);
    }),
    canvas.addEventListener("mousemove", (e) => {
        updatePointerMoveData(
            pointers[0],
            scaleByPixelRatio(e.offsetX),
            scaleByPixelRatio(e.offsetY)
        );
    }),
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const r = e.targetTouches;
        for (; r.length >= pointers.length;)
            pointers.push(new pointerPrototype());
        for (let e = 0; e < r.length; e++) {
            let t = scaleByPixelRatio(r[e].pageX),
                n = scaleByPixelRatio(r[e].pageY);
            updatePointerDownData(pointers[e + 1], r[e].identifier, t, n);
        }
    }),
    canvas.addEventListener(
        "touchmove",
        (e) => {
            e.preventDefault();
            const r = e.targetTouches;
            for (let e = 0; e < r.length; e++) {
                let t = pointers[e + 1];
                t.down &&
                    updatePointerMoveData(
                        t,
                        scaleByPixelRatio(r[e].pageX),
                        scaleByPixelRatio(r[e].pageY)
                    );
            }
        },
        !1
    ),
    window.addEventListener("touchend", (e) => {
        const r = e.changedTouches;
        for (let e = 0; e < r.length; e++) {
            pointers.find((t) => t.id == r[e].identifier);
        }
    });