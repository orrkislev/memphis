function compo_packing() {
    const startSize = random(20, 100)
    const startPos = random() < 0.5 ? p(0, 0) : p(random(-100, 100), random(-100, 100))
    const minDist = 20
    const maxRadius = 60

    const shapeSpacing = 0
    circles = [{ position: startPos, radius: startSize }]
    for (let i = 0; i < 100; i++) {
        const pos = p(random(-100, 100), random(-100, 100))
        let distances = circles.map(c => c.position.getDistance(pos) - c.radius).sort((a, b) => a - b)
        distances = distances.map(d => d + shapeSpacing)
        if (distances[0] < minDist) continue
        circles.push({ position: pos, radius: random(minDist, min(distances[0], maxRadius)) })
    }

    largestRadius = circles.reduce((a, b) => a.radius > b.radius ? a : b).radius
    smallestRadius = circles.reduce((a, b) => a.radius < b.radius ? a : b).radius
    circles.forEach(c => c.relR = c.radius / largestRadius)

    leftestPos = circles.reduce((a, b) => a.position.x < b.position.x ? a : b).position.x
    rightestPos = circles.reduce((a, b) => a.position.x > b.position.x ? a : b).position.x
    circles.forEach(c => c.relX = (c.position.x - leftestPos) / (rightestPos - leftestPos))

    shaper = new stackShaper()
    circles.forEach(c => c.stack = shaper.getStack(c))

    const selected = circles
        .filter(c => c.stack.length > 0)
        .reduce((a, b) => a.radius > b.radius ? a : b)
    if (selected.radius > 50) selected.stack[selected.stack.length - 1].withSmokeHole = true
}






function stackShaper() {
    // const heightsType = choose([1, 2, 3])
    // if (heightsType == 1) this.heights = Array(4).fill(0).map(() => random(10, 60))
    // if (heightsType == 2) {
    //     const h = random(10, 60)
    //     this.heights = [h, h, h, h]
    // }
    // if (heightsType == 3) {
    //     let h = random(10, 20)
    //     this.heights = []
    //     for (let i = 0; i < 4; i++) {
    //         this.heights.push(h)
    //         h += random(10, 20)
    //     }
    // }
    const heights = optionCreator(4, [random(10, 60), random(10, 20), random(10, 20), random(10, 20)])
    const heightDeviation = random()


    const stackSize = round_random(1, 2)
    const stackDeviation = round_random(0, 1)
    const shapes = optionCreator(4, ['sphere', 'cylinder', 'rect', 'triangle', 'hexagon', 'none'])
    const shapeDeviation = random()
    const angles = optionCreator(4, [0,10,20,30,40])
    const angleDeviation = random(10)

    this.getStack = function (c) {
        const thisStackSize = constrain(stackSize + random(-stackDeviation, stackDeviation), 1, 4)
        const stack = []
        let h = 0
        for (let i = 0; i < thisStackSize; i++) {
            let shape = shapes[i]
            if (random() < shapeDeviation) shape = choose(['sphere', 'cylinder', 'rect', 'triangle', 'hexagon'])

            if (shape == 'sphere') {
                stack.push(new SphereShape(c.position.x, c.position.y, h, c.radius))
                h += c.radius * 1.8
                continue
            }
            const thisHeight = heights[i] * (1 + random(-heightDeviation, heightDeviation))
            if (shape != 'none') {
                let path
                if (shape == 'cylinder') path = new Path.Circle(c.position, c.radius)
                if (shape == 'rect') path = new Path.Rectangle(p(c.position.x - c.radius / 2, c.position.y - c.radius / 2), new Size(c.radius, c.radius))
                if (shape == 'triangle') path = new Path.RegularPolygon(c.position, 3, c.radius)
                if (shape == 'hexagon') path = new Path.RegularPolygon(c.position, 6, c.radius)
                path.position = c.position
                const rotation = angles[i] + random(-angleDeviation, angleDeviation)
                const newShape = new FlatExtrude(path.rotate(rotation), thisHeight, h)
                stack.push(newShape)
            }
            h += thisHeight

        }
        return stack
    }
}


function optionCreator(size, options) {
    const optionType = choose([0, 1, 2, 3, 4, 5])
    if (optionType == 0)
        return Array(size).fill(0).map(() => choose(options))
    if (optionType == 1) {
        const opt1 = choose(options)
        return Array(size).fill(0).map(_ => opt1)
    }
    if (optionType == 2) {
        const opt1 = choose(options)
        const opt2 = choose(options.filter(o => o != opt1))
        return Array(size).fill(0).map((_, i) => i % 2 == 0 ? opt1 : opt2)
    }
    if (optionType == 3) {
        const opt1 = choose(options)
        const opt2 = choose(options.filter(o => o != opt1))
        const opt3 = choose(options.filter(o => o != opt1 && o != opt2))
        return Array(size).fill(0).map((_, i) => i % 3 == 0 ? opt1 : i % 3 == 1 ? opt2 : opt3)
    }
    if (optionType == 4)
        return Array(size).fill(0).map((_, i) => options[i % 2])
    if (optionType == 5)
        return Array(size).fill(0).map((_, i) => options[i % 3])
}



function compo_2() {
    path1 = new Path.Rectangle(p(0, 0), new Size(10, -200))
    path1 = uniteReplace(path1, new Path.Rectangle(p(0, -200), new Size(200, 10)))
    path1 = uniteReplace(path1, new Path.Rectangle(p(200, -200), new Size(10, 200)))
    new SideExtrude(path1, 10, 0, 0)
    path2 = new Path.Circle(p(0, 0), 5)
    new FlatExtrude(path2, 100, 100)
    new SphereShape(60, 0, 30, 30)

    stack({ position: p(-50, -50), radius: 30 })
}