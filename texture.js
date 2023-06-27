function initTextures() {

    noiseTexture = new ShaderTexture('noise').set(['noise', 'onlyBlack'])
    noiseTexture.main = `vec2 pos = uv * uResolution;
                        pos.x -= pos.y;
                        float n = cnoise(.5 * pos * scale + noiseOffset);
                        if (n<.1) n = 1.;
                        else n = 0.;
                        texColor = vec4(n,n,n, maskColor.a);`

    gridTexture = makeLineTexture(random(5, 20), 1)
    // gridTexture = new Texture('grid').set('onlyBlack')
    // gridTexture.main = `vec2 pos = uv * uResolution;
    //                     pos.x -= pos.y;
    //                     texColor = vec4(1.0, 1.0, 1.0, maskColor.a);
    //                     if (mod(pos.x, (1.0-scale)*30.0) < 1.0 || mod(pos.y, (1.0-scale)*30.0) < 1.0) {
    //                             texColor = vec4(0.0, 0.0, 0.0, maskColor.a);
    //                         }`

    dotsTexture = new ShaderTexture('dots').set('onlyBlack')
    dotsTexture.main = `    vec2 pos = uv * uResolution;
                            float gridScale = (1.0-scale)*5.0;
                            float tolerance = .4;
                            texColor = vec4(1.0, 1.0, 1.0, maskColor.a);
                            float rowVal = mod(pos.y, gridScale);
                            float offsetX = mod(pos.y, gridScale*2.0) < gridScale ? 0.0 : gridScale/2.0;
                            float colVal = mod(pos.x + offsetX, gridScale);
                            float x = abs(rowVal - gridScale/2.0);
                            float y = abs(colVal - gridScale/2.0);
                            float v = sqrt(x*x + y*y) < tolerance*gridScale/2.0 ? 0.0 : 1.0;
                            texColor = vec4(v,v,v, maskColor.a); 
                            `

    clear()
    fill(0)
    noStroke()
    for (let i = 0; i < 5000; i++) {
        path = new Path.Circle(p(width * random(), height * random()), 2)
        path.wonky(-5,5)
        beginShape()
        for (let i=0;i<path.length;i++) {
            const pos = path.getPointAt(i)
            vertex(pos.x, pos.y)
        }
        endShape()
        path.remove()
    }
    txtr = new Texture(get())

    getTexture = () => choose([noiseTexture, gridTexture, dotsTexture, txtr])
}


function makeLineTexture(spacing, thickness, directions, wavy) {
    if (!directions) directions = `${choose(['h', 'v', 'd', 'a'])}${choose(['h', 'v', 'd', 'a'])}`
    if (wavy == null) wavy = random() < 0.5 ? true : false
    lineTexture = new ShaderTexture('lines').set('onlyBlack')
    lineTexture.main = `    vec2 pos = uv * uResolution;
                            ${wavy ? 'pos.y += sin(pos.x / 25.0) * 25.0;' : ''}
                            float gridScale = (1.0-scale)*${spacing.toFixed(2)};
                            texColor = vec4(1.0, 1.0, 1.0, maskColor.a);
                            ${directions.includes('h') ?
            `if (mod(pos.y, gridScale) < ${thickness.toFixed(2)}) texColor = vec4(0.0, 0.0, 0.0, maskColor.a);` : ''}
                            ${directions.includes('v') ?
            `if (mod(pos.x, gridScale) < ${thickness.toFixed(2)}) texColor = vec4(0.0, 0.0, 0.0, maskColor.a);` : ''}
                            ${directions.includes('d') ?
            `if (mod(pos.x + pos.y, gridScale) < ${(thickness * 1.61).toFixed(3)}) texColor = vec4(0.0, 0.0, 0.0, maskColor.a);` : ''}
                            ${directions.includes('a') ?
            `if (mod(pos.x - pos.y, gridScale) < ${(thickness * 1.61).toFixed(3)}) texColor = vec4(0.0, 0.0, 0.0, maskColor.a);` : ''}
                            `
    return lineTexture
}


function Texture() {
    loadPixels()
    const d = pixelDensity()
    this.imgData = new ImageData(new Uint8ClampedArray(pixels), width * d, height * d)

    this.apply = (applyParams) => {
        drawingContext.save()
        drawingContext.beginPath()
        const p0 = applyParams.path.getPointAt(0)
        drawingContext.moveTo(p0.x, p0.y)
        for (let i = 0; i < applyParams.path.length; i++) {
            const pos = applyParams.path.getPointAt(i)
            drawingContext.lineTo(pos.x, pos.y)
        }
        drawingContext.lineTo(p0.x, p0.y)
        drawingContext.clip()
        maskGraphics.drawingContext.putImageData(this.imgData, 0, 0)
        image(maskGraphics, random(-100,100), random(-100,100))
        drawingContext.restore()
    }
}

function ShaderTexture(name) {
    this.set = (name, val = true) => {
        if (Array.isArray(name)) name.forEach(n => this.set(n))
        else this[name] = val
        return this
    }
    this.makeShader = () => {
        const code = `precision mediump float;
                varying vec2 vTexCoord;
    
                uniform sampler2D uTexture;
                uniform vec2 uResolution;
                uniform sampler2D mask;
                uniform float scale;
                ${this.onlyBlack ? 'uniform bool onlyBlack;' : ''}
                ${this.uniforms || ''}
    
                ${shaderNoise}
    
                ${this.func || ''}
    
                void main() {
                    vec2 uv = vTexCoord ${this.wobble ? '+cnoise(vTexCoord * 10.0 + noiseOffset) * 0.03' : ''};
                    vec4 maskColor = texture2D(mask, uv);
                    if (maskColor.a == 0.0) discard;
                    vec4 texColor = texture2D(uTexture, uv);
    
                    ${this.main || ''}
    
                    ${this.onlyBlack ? 'if (onlyBlack==true && texColor.rgb != vec3(0.0,0.0,0.0)) texColor.a = 0.0;' : ''}

                    gl_FragColor = texColor;
                    } `
        this.shader = { name, code }
    }

    this.apply = (applyParams) => {
        if (!applyParams.mask) applyParams.mask = get()
        if (applyParams.onlyBlack == false) clear()
        if (!this.shader) this.makeShader()

        if (this.preApply) this.preApply(applyParams)
        if (this.noise && !applyParams.noiseOffset) applyParams.noiseOffset = [random(100), random(100)]

        applyShader(this.shader, applyParams)
    }
}