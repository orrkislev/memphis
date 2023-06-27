
function makeIsometric(paths) {
    const group = new Group(paths)
    group.scale(1, 0.5)
    group.rotate(45)
    group.scale(1, 2)
    group.rotate(-45)
    group.rotate(-25)
}




function breakPath(path, techniques = []) {
    breaks = []

    if (techniques.includes('angles')) {
        let currAngleRange
        for (let i = 0; i < path.length; i++) {
            const loc = path.getLocationAt(i)
            const angleRange = getAngleRange(loc)
            if (!currAngleRange) currAngleRange = angleRange
            if (currAngleRange != angleRange) {
                breaks.push(loc.point)
                currAngleRange = angleRange
            }
        }
    }

    if (techniques.includes('corners')) {
        for (let i = 0; i < path.segments.length; i++) {
            const seg = path.segments[i]
            let angle1, angle2
            if (seg.handleIn.length > 0) angle1 = (seg.handleIn.angle + 360) % 360
            else angle1 = path.getPointAt((seg.location.offset - 2 + path.length) % path.length).subtract(seg.point).angle
            if (seg.handleOut.length > 0) angle2 = (seg.handleOut.angle + 360) % 360
            else angle2 = path.getPointAt((seg.location.offset + 2) % path.length).subtract(seg.point).angle
            const a = abs(angle1 - angle2)
            if (a < 170 || a > 190) {
                breaks.push(seg.location.offset)
            }
        }
    }

    if (techniques.includes('rightleft')) {
        for (let i = 2; i < path.length - 2; i++) {
            const p1 = path.getPointAt(i - 2)
            const p2 = path.getPointAt(i)
            const p3 = path.getPointAt(i + 2)
            if ((p2.x < p1.x && p2.x < p3.x) || (p2.x > p1.x && p2.x > p3.x)) {
                breaks.push(i)
            }
        }
    }

    if (techniques.includes('topbottom')) {
        path.rotate(33)
        for (let i = 2; i < path.length - 2; i++) {
            const p1 = path.getPointAt(i - 2)
            const p2 = path.getPointAt(i)
            const p3 = path.getPointAt(i + 2)
            if ((p2.x < p1.x && p2.x < p3.x) || (p2.x > p1.x && p2.x > p3.x)) {
                breaks.push(i)
            }
        }
        path.rotate(-33)
    }

    breaks = breaks.sort((a, b) => a - b)
    breaks = breaks.filter((place, i) => {
        if (i == 0) return true
        if (place - breaks[i - 1] > 2) return true
        return false
    })
    return breaks
}


function getAngleRange(loc) {
    const angle = (loc.tangent.angle + 360) % 360
    return floor(angle / 30) * 30
}


function makeSection(path, offset1, offset2, height, dir = p(0, -1)) {
    const path1 = getSection(path, offset1, offset2)
    const path2 = path1.clone()
    path2.translate(dir.x * height, dir.y * height)
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
