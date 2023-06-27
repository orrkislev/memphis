blackShadow = random() < 0.5
shadowColor = '#000000' + (blackShadow ? '' : '55')
floorShadowColor = '#000000' + (blackShadow ? '' : '55')

withStroke = random() < 0.5
strokeColor = 0

pallete0 = ['#3D79BA', '#D53A26', '#EFCA4A', '#E5729E', '#D31C29', '#F3EDE6', '#22A699', '#047053', '#ED841F', '#ECEAE2', '#9FD5DE']
pallete1 = ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25', '#264653']
pallete2 = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#fde2e4']
pallete3 = ["#590d22", "#800f2f", "#a4133c", "#c9184a", "#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1", "#ffccd5"]



async function setup() {
    initP5(true)
    initPaper(false)
    await makeImage()
}

function initColors() {
    colors = choose([pallete0, pallete1, pallete2, pallete3, null])
    if (!colors) colors = Array(10).fill(0).map(_ => random(100, 200))

    newColors = colors.sort(() => random() - .5)
    bodyColors = colors.slice(0, 3)
    topColors = colors.slice(3, 6)
    bgColor = colors[colors.length - 1]
}

async function makeImage() {
    initColors()

    initTextures()
    floorShadow = new Path()
    floorShadow.fillColor = floorShadowColor

    shadowAngle = random(-30, 30)
    if (random() < 0.5) shadowAngle = 180 - shadowAngle
    shadowDir = pointFromAngle(shadowAngle, 1)

    // halfCircle1 = new Path.Arc(p(-100, 0), p(0, -190), p(100, 0))
    // flat11 = new SideExtrude(halfCircle1, 140, 50)

    // halfCircle = new Path.Arc(p(-50, 0), p(0, -50), p(50, 0))
    // circle = new Path.Circle(p(35, -45), 20)
    // circle2 = new Path.Circle(p(-35, -45), 20)
    // halfCircle = uniteReplace(halfCircle, circle)
    // halfCircle = uniteReplace(halfCircle, circle2)
    // // halfCircle.translate(50, 0)
    // flat1 = new SideExtrude(halfCircle, 10, 0)

    // path = new Path.Rectangle(p(-100, 0), new Size(30, 120))
    // flat12 = new FlatExtrude(path, 10, 0)

    // path2 = new Path.RegularPolygon(p(-130, -120), 3, 50)
    // path2Base = new Path.Rectangle(p(-135,-120), new Size(10, 100))
    // path2 = uniteReplace(path2, path2Base)
    // newFlat = new SideExtrude(path2, 10, -50)

    // {
    //     path = makeLayerPath().path
    //     path.position.y = -path.bounds.height / 2
    //     flat1 = new SideExtrude(path, 60, 0)

    //     path = makeLayerPath().path
    //     path.translate(0, -path.bounds.bottom)
    //     flat1 = new SideExtrude(path, 60, -100)

    //     path = makeLayerPath().path
    //     path.translate(0, -path.bounds.bottom)
    //     flat1 = new SideExtrude(path, 60, -200)
    // }

    compo_packing()
    // compo_2()

    prepareShapes()
    await render()
}

async function render() {
    background(bgColor)
    strokeWeight(3)
    paper.project.activeLayer.scale(width * .8 / paper.project.activeLayer.bounds.width)
    paper.project.activeLayer.position = paper.view.center
    drawObject(floorShadow)
    shapes.forEach(s => {
        renderShape(s)
        // stroke(255)
        // strokeWeight(5)
        // fill(0)
        // text(`${round(s.relPos.x)}, ${round(s.relPos.y)}`, s.path.position.x, s.path.position.y)
    })
}

function renderShape(shape) {
    drawObject(shape.group)
    if (shape.withSmokeHole) smokeHole(shape.holePos, 60)
}

let maskGraphics
async function drawObject(path) {
    if (path.children) return await path.children.forEach(async child => await drawObject(child))
    if (path.segments.length == 0) return

    if (path.fillColor) fill(color(path.fillColor.toCSS()))
    else fill(255)

    if (withStroke && path.strokeColor) stroke(strokeColor)
    else if (blackShadow && !path.strokeColor) stroke(0)
    else noStroke()

    if (!maskGraphics) maskGraphics = createGraphics(width, height)
    maskGraphics.clear()
    maskGraphics.beginShape()
    beginShape()
    for (let i = 0; i < path.length; i++) {
        const pos = path.getPointAt(i)
        maskGraphics.vertex(pos.x, pos.y)
        vertex(pos.x, pos.y)
    }
    endShape(CLOSE)
    maskGraphics.endShape(CLOSE)
    getTexture().apply({ path, mask: maskGraphics, scale: random(.5), onlyBlack: true })
}




function prepareShapes() {
    const bottomMost = shapes.reduce((a, b) => a.floorPos.y > b.floorPos.y ? a : b).floorPos.y
    const leftMost = shapes.reduce((a, b) => a.floorPos.x < b.floorPos.x ? a : b).floorPos.x
    shapes.forEach(s => s.relPos = s.floorPos.subtract(leftMost, bottomMost).multiply(1, 8))
    shapes
        .sort((a, b) => a.minHeight - b.minHeight)
        .sort((a, b) => round(b.relPos.length) - round(a.relPos.length))

    makeIsometric(shapes.map(shape => shape.path))

    shapes.forEach(s => s.path.translate(width / 2, height / 2 - s.minHeight))
    shapes.forEach(s => s.makeSections())
    shapes.forEach(s => s.makeShadow())
    shapes.forEach(s => s.dropShadow_floor())
    shapes.forEach(s => {
        shapes.forEach(s2 => {
            if (s == s2) return
            s.applyShadowFrom(s2)
        })
    })
    shapes.forEach(s => s.shadow_post())
    shapes.forEach(s => s.arrange())

    if (floorShadow.children) floorShadow.children.forEach(c => c.fillColor = floorShadowColor)
    if (floorShadow.children) floorShadow.children.forEach(c => c.strokeColor = null)
    floorShadow.fillColor = floorShadowColor
    floorShadow.strokeColor = null
}






function makeLayerPath() {
    let path
    centers = []
    for (let i = 0; i < 20; i++) {
        const pos = pointFromAngle(random(360), random(100))
        centers.push(pos)
        const newCircle = new Path.Circle(pos, random(10, 30))
        if (!path) path = newCircle.clone()
        else {
            newPath = path.unite(newCircle)
            path.remove()
            path = newPath
        }
        newCircle.remove()
    }
    if (path.children) {
        selectedPath = path.children.reduce((a, b) => a.area > b.area ? a : b).clone()
        selectedPath.parent = selectedPath.layer
        path.remove()
        path = selectedPath
        centers = centers.filter(c => path.contains(c))
    }
    return { path, centers }
}