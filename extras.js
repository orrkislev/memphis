function smokeHole(pos, w) {
    holeEllipse = new Path.Ellipse(p(pos.x - w / 2, pos.y - w / 6), new Size(w, w / 3))
    holeBottom = holeEllipse.clone().translate(0, holeEllipse.bounds.height / 2)
    const temp = holeBottom.intersect(holeEllipse)
    holeBottom.remove()
    holeBottom = temp

    holeEllipse.strokeColor = 'black'
    holeBottom.fillColor = 'black'

    smokeContainer = new Path.Rectangle(p(0, -50), new Size(width, holeEllipse.position.y + 50)).unite(holeEllipse)

    const pos1_1 = holeEllipse.getPointAt(holeEllipse.length * random(.6, .75)).add(0, 5)
    const pos2_1 = holeEllipse.getPointAt(holeEllipse.length * random(.75, .9)).add(0, 5)
    const pos1_2 = pos1_1.add(pointFromAngle(random(270, 300), holeEllipse.position.y * 2))
    const pos2_2 = pos2_1.add(pointFromAngle(random(240, 270), holeEllipse.position.y * 2))

    const smokeSide1 = new Path([pos1_1, pos1_2]).rebuild(10)
    const smokeSide2 = new Path([pos2_1, pos2_2]).rebuild(10)
    smokeSide1.smooth()
    smokeSide2.smooth()
    for (let i = 1; i < smokeSide1.segments.length; i++) {
        const p1 = smokeSide1.segments[i - 1].point
        const p2 = smokeSide1.segments[i].point
        const d = p1.getDistance(p2)
        smokeSide1.segments[i].point.x += random(-d / 2, d / 2)
        smokeSide2.segments[i].point.x += random(-d / 2, d / 2)
    }
    smokeSide2.reverse()
    smokeFull = new Path([...smokeSide1.segments, ...smokeSide2.segments])
    smokeSide1.remove()
    smokeSide2.remove()

    smokeFull.closePath()

    const smokeTemp = smokeFull.intersect(smokeContainer)
    smokeFull.remove()
    smokeContainer.remove()
    smokeFull = smokeTemp
    smokeFull.fillColor = 'white'

    if (smokeFull.children) {
        const temp = smokeFull.children.reduce((a, b) => a.area > b.area ? a : b)
        smokeFull.children.forEach(c => c.remove())
        smokeFull = temp
    }

    fill(0, 100)
    if (withStroke) stroke(0)
    else noStroke()
    pathShape(holeEllipse)
    fill(0)
    pathShape(holeBottom)
    fill(255)
    pathShape(smokeFull)
}