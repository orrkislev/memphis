strokeColor = 0
fillColorBody = '255'
fillColorTop = 'lightgreen'
bgColor = 'gray'

async function setup() {
    initP5(false)
    initPaper(true)
    await makeImage()
}


async function makeImage() {
    // maskGraphics = createGraphics(width, height)



    // floorGraphics = new GraphicsLayer()


    base = new Layer(0, 30).makePath(5).make()

    // base.centers.sort((a, b) => a.y - b.y).forEach((pos, i) => {
    //     column1 = new Layer(30, random(20,80))
    //     column1.basePath = new Path.Circle(pos, 5)
    //     column1.make()
    // })

    // const [pos,pos2] = base.centers.sort((a, b) => a.x - b.x).slice(0, 2).sort((a,b)=>a.y-b.y)

    // column1 = new Layer(30, 80)
    // column1.basePath = new Path.Circle(pos, 5)
    // column1.make()

    // base2 = new Layer(110, 30).makePath(3).make()


    // column2 = new Layer(30, 80)
    // column2.basePath = new Path.Circle(pos2, 5)
    // column2.make()

    // background(bgColor)
    // floorGraphics.apply()
    // layers.forEach(layer => layer.draw())
}

const layers = []
class Layer {
    constructor(offset, thickness) {
        this.graphics = {}
        this.offset = offset
        this.thickness = thickness
        layers.push(this)
    }

    make() {
        this.makePath()
        return this
        this.breakPath()
        this.makeSections()
        this.makeTop()
        this.makeShadow()
        this.dropShadow()
        return this
    }

    makePath(circles = 10) {
        if (!this.basePath) {
            this.basePath = null

            // this.path = new Path()
            // const noiseOffset = p(random(1000), random(1000))
            // for (let a=0;a<360;a+=10){
            //     const noisePos = pointFromAngle(a, 1).add(noiseOffset)
            //     const r = 10 + noise(noisePos.x, noisePos.y) * 30
            //     const pos = p(r, 0).rotate(a)
            //     this.path.add(pos)
            // }

            this.centers = []
            for (let i = 0; i < circles; i++) {
                const pos = pointFromAngle(random(360), random(100))
                this.centers.push(pos)
                const newCircle = new Path.Circle(pos, random(10, 30))
                if (!this.basePath) this.basePath = newCircle
                else this.basePath = this.basePath.unite(newCircle)
            }
            // this.basePath.position = p(0,0)

            if (this.basePath.children) {
                this.basePath = this.basePath.children.reduce((a, b) => a.area > b.area ? a : b)
                this.centers = this.centers.filter(c => this.basePath.contains(c))
            }
        }
        if (!this.path) {
            const parentPath = new Path.Rectangle(p(-300, -300), p(600, 600))
            this.path = this.basePath.clone()

            const group = new Group([parentPath, this.path])
            group.scale(1, 0.5)
            group.rotate(45)
            group.scale(1, 2)
            group.rotate(-45)
            group.rotate(-25)
            group.translate(150, -50)

            this.path = group.children[1]
            parentPath.remove()
            group.remove()

            // this.path.scale(1, 0.5)
            // this.path.rotate(45)
            // this.path.scale(1, 2)
            // this.path.rotate(-45)
            // this.path.rotate(-25)
            // this.path.position = p(width / 2, height / 2 - this.offset)
            this.path.translate(width / 2, height / 2 - this.offset)
            this.path.fillColor = 'red'
            this.path.strokeColor = 'black'
        }
        return this
    }
    breakPath() {
        this.breaks = []
        // let currAngleRange
        // for (let i=0;i<this.path.length;i++){
        //     const loc = this.path.getLocationAt(i)
        //     const angleRange = getAngleRange(loc)
        //     if (!currAngleRange) currAngleRange = angleRange
        //     if (currAngleRange != angleRange) {
        //         this.breaks.push(loc.point)
        //         currAngleRange = angleRange
        //     }
        // }
        for (let i = 0; i < this.path.segments.length; i++) {
            const seg = this.path.segments[i]
            const angle1 = (seg.handleIn.angle + 360) % 360
            const angle2 = (seg.handleOut.angle + 360) % 360
            const a = abs(angle1 - angle2)
            if (a < 170 || a > 190) {
                this.breaks.push(seg.point)
            }
        }

        for (let i = 2; i < this.path.length - 2; i++) {
            const p1 = this.path.getPointAt(i - 2)
            const p2 = this.path.getPointAt(i)
            const p3 = this.path.getPointAt(i + 2)
            if ((p2.x < p1.x && p2.x < p3.x) || (p2.x > p1.x && p2.x > p3.x)) {
                this.breaks.push(p2)
            }
        }

        this.breaks = this.breaks.map(place => this.path.getOffsetOf(place))
        this.breaks = this.breaks.sort((a, b) => a - b)
        this.breaks = this.breaks.filter((place, i) => {
            if (i == 0) return true
            if (place - this.breaks[i - 1] > 2) return true
            return false
        })
    }
    makeSections() {
        this.sections = []
        for (let i = 0; i < this.breaks.length; i++) {
            const place1 = this.breaks[i]
            const place2 = this.breaks[(i + 1) % this.breaks.length]
            const midPlace = (place1 + place2) / 2
            const angleRange = getAngleRange(this.path.getLocationAt(midPlace))

            // const section = makeSection(this.path, place1, place2, this.thickness)
            const section = getSection(this.path, place1, place2)
            this.sections.push(section)
        }
        this.sections = this.sections.sort((a, b) => a.position.y < b.position.y ? -1 : 1)
        this.sections = new Group(this.sections)

        clear()
        for (const section of this.sections.children) {
            maskGraphics.clear()
            // maskGraphics.beginShape()
            stroke(fillColorBody)
            for (let i = 0; i < section.length; i++) {
                const pos = section.getPointAt(i)
                maskGraphics.line(pos.x, pos.y, pos.x, pos.y - this.thickness)
                line(pos.x, pos.y, pos.x, pos.y - this.thickness)
                // maskGraphics.vertex(pos.x, pos.y)
            }
            // maskGraphics.endShape(CLOSE)

            // fillPath(section, fillColorBody, strokeColor)
            getTexture().apply({ mask: maskGraphics, scale: random(.5), onlyBlack: true })

        }
        this.graphics.sections = new GraphicsLayer()
    }

    makeTop() {
        this.top = this.path.clone()
        this.top.translate(0, -this.thickness)
        clear()

        const topType = 3

        if (topType == 1) {
            drawingContext.filter = 'blur(10px)'
            fillPath(this.top, fillColorTop, strokeColor)
            drawingContext.filter = 'none'
            this.graphics.top = new GraphicsLayer()
            fillPath(this.top, 255, strokeColor)
            getTexture().apply({ scale: random(.3, .5), onlyBlack: true })
            this.graphics.top.apply()
            this.graphics.top.save()
        } else if (topType == 2) {
            fillPath(this.top, fillColorTop, strokeColor)
            this.graphics.top = new GraphicsLayer()
        } else if (topType == 3) {
            fillPath(this.top, fillColorTop, strokeColor)
            getTexture().apply({ scale: random(.3, .5), onlyBlack: true })
            this.graphics.top = new GraphicsLayer()
        }

        this.graphics.top.lockalpha = true
    }

    makeShadow() {
        clear()
        for (let i = 0; i < this.thickness; i++) {
            push()
            translate(i, i / 2)
            beginShape()
            for (let i = 0; i < this.path.length; i++) {
                const pos = this.path.getPointAt(i)
                vertex(pos.x, pos.y)
            }
            endShape(CLOSE)
            pop()
        }
        this.graphics.shadow = new GraphicsLayer()
    }

    draw() {
        this.graphics.sections.apply()
        this.graphics.top.apply()
    }

    dropShadow() {
        clear()
        let temp = this.putShadow(this.offset, true)
        floorGraphics.apply()
        temp.apply()
        floorGraphics.save()

        layers.forEach(otherLayer => {
            if (otherLayer == this) return
            if (otherLayer.offset > this.offset) return
            clear()
            const h = this.offset - otherLayer.offset - otherLayer.thickness
            temp = this.putShadow(h, true)
            otherLayer.graphics.top.apply()
            temp.apply()
            otherLayer.graphics.top.save()
        })
    }

    putShadow(height, onlyBlack) {
        clear()
        this.graphics.shadow.apply(round(height), round(height * 1.5))
        const mask = get()
        clear()
        gridTexture.apply({ mask, scale: .95, onlyBlack })
        return new GraphicsLayer()
    }
}






function getAngleRange(loc) {
    const angle = (loc.tangent.angle + 360) % 360
    return floor(angle / 30) * 30
}


function makeSection(path, offset1, offset2, height) {
    const path1 = getSection(path, offset1, offset2)
    const path2 = path1.clone()
    path2.translate(0, -height)
    path2.reverse()
    const path3 = path1.join(path2)
    path3.closePath()
    return path3
}

function getSection(path, offset1, offset2) {
    if (offset1 > offset2) offset2 += path.length
    const path1 = new Path()
    for (let i = offset1; i < offset2; i++) {
        const pos = path.getPointAt(i % path.length)
        path1.add(pos)
    }
    return path1
}