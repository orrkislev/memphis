
const shapes = []
class Shape {
    constructor() {
        shapes.push(this)
        this.topShadow = new Path()
    }
    makeSections() { }
    get minHeight() { }
    get maxHeight() { }
    get floorPos() { }
    dropShadow_floor() {
        const shadowOnFloor = this.getShadowAtHeight(0)
        floorShadow = uniteReplace(floorShadow, shadowOnFloor)
    }
    getShadowAtHeight(h) {
        let translation = p(0, 0)
        if (h <= this.minHeight) translation = p(shadowDir.x * (this.minHeight - h), (shadowDir.y + 1) * (this.minHeight - h))
        else if (h < this.maxHeight) translation = p(0, -h)
        else return null
        return this.shadow.clone().translate(translation)
    }
    applyShadowFrom(other) {
        if (this.maxHeight > other.maxHeight) return
        if (this.y < other.y) return

        const newShadow = other.getShadowAtHeight(this.maxHeight)
        if (!newShadow) return
        this.topShadow = uniteReplace(this.topShadow, newShadow)
    }
    shadow_post() { }
    arrange() {
        if (this.shadow) this.shadow.remove()
        if (this.basePath) this.basePath.remove()

        setColors(this.sections, bodyColors, 'black')
        if (this.top) setColors(this.top, topColors, 'black')
        setColors(this.topShadow, shadowColor, null)

        this.group = new Group([this.sections, this.top, this.topShadow])
        this.group.bringToFront()
    }
}





class FlatExtrude extends Shape {
    constructor(path, thickness, height) {
        super()
        this.path = path; this.basePath = path.clone()
        this.thickness = thickness
        this.height = height
    }
    get minHeight() {
        return this.height
    }
    get maxHeight() {
        return this.height + this.thickness
    }
    get floorPos() {
        return this.basePath.position
    }
    get holePos() {
        return this.top.position
    }
    makeSections() {
        const breaks = breakPath(this.path, ['corners', 'rightleft'])
        const sections = []
        for (let i = 0; i < breaks.length; i++) {
            const place1 = breaks[i]
            const place2 = breaks[(i + 1) % breaks.length]
            sections.push(makeSection(this.path, place1, place2, this.thickness))
        }
        this.sections = new Group(sections.sort((a, b) => a.position.y < b.position.y ? -1 : 1))
        this.sections.strokeColor = 'black'

        this.top = this.path.clone()
        this.top.translate(0, -this.thickness)
    }
    makeShadow() {
        this.shadow = new Path()
        for (let i = 0; i < this.thickness; i++) {
            const shadow = this.path.clone()
            shadow.translate(shadowDir.x * i, shadowDir.y * i)
            this.shadow = uniteReplace(this.shadow, shadow)
        }
    }
    shadow_post() {
        this.topShadow = intersectReplace(this.topShadow, this.top, false)
    }
}




class SphereShape extends Shape {
    constructor(x, y, z, radius) {
        super()
        this.x = x; this.y = y; this.z = z; this.radius = radius
        this.path = new Path.Circle(p(x, y), radius)
    }
    get minHeight() {
        return this.z
    }
    get maxHeight() {
        return this.z + this.radius * 1.6
    }
    get floorPos() {
        return p(this.x, this.y)
        // return p(this.x - this.radius / 2, this.y + this.radius * .5)
    }
    get holePos() {
        return this.path.position.add(p(0, -this.radius * .75))
    }
    makeSections() {
        this.shadow = this.path.clone()
        this.shadow.scale(shadowDir.length, 1)
        this.shadow.rotate(shadowDir.angle)
        this.shadow.translate(shadowDir.x * this.radius, shadowDir.y * this.radius)

        const pos = this.path.position
        this.path.remove()
        this.path = new Path.Circle(pos, this.radius)
        this.path.translate(0, -this.radius * 0.8)
        this.path.strokeColor = 'black'
        this.sections = this.path
    }

    makeShadow() {
    }
    shadow_post() {
        this.topShadow = intersectReplace(this.topShadow, this.path, false)
    }
}






class SideExtrude extends Shape {
    constructor(path, thickness, offset) {
        super()
        this.path = path; this.basePath = path.clone()
        this.thickness = thickness; this.offset = offset
    }
    get minHeight() {
        return this.basePath.bounds.bottom
    }
    get maxHeight() {
        return abs(this.basePath.bounds.top)
    }
    get floorPos() {
        return p(this.basePath.bounds.left, -this.offset)
    }
    get holePos() {
        return false
    }
    makeSections() {
        const pos = this.path.position
        this.path.remove()
        this.path = this.basePath.clone()
        this.path.position = pos
        this.path.translate(-this.offset, -this.offset)
        this.path.rotate(45)
        this.path.scale(1, 0.8)
        this.path.rotate(-45)

        const breaks = breakPath(this.path, ['corners', 'topbottom'])
        const sections = []
        for (let i = 0; i < breaks.length; i++) {
            const place1 = breaks[i]
            const place2 = breaks[(i + 1) % breaks.length]
            sections.push(makeSection(this.path, place1, place2, this.thickness, p(-1, -1).normalize()))
        }
        this.sections = new Group(sections
            .sort((a, b) => a.position.x + a.position.y > b.position.x + b.position.y ? -1 : 1))
        this.sections.strokeColor = 'black'

        this.top = this.path.clone()
    }
    makeShadow() {
        this.shadow = new Path()
        for (let i = 0; i < this.path.length; i++) {
            const pos = this.path.getPointAt(i).subtract(this.path.bounds.bottomLeft)
            if (abs(pos.y) > pos.x * 0.11) {
                const p1 = p(pos.x, -pos.x * 0.11)
                const p2 = shadowDir.multiply(abs(pos.y) - pos.x * 0.11)
                this.shadow.add(p1.add(p2))
            } else this.shadow.add(pos)
        }
        this.shadow.translate(this.path.bounds.bottomLeft)

        const shadowBase = this.shadow.clone()
        for (let i = 0; i < this.thickness; i++) {
            shadowBase.translate(p(-1, -1).normalize())
            this.shadow = uniteReplace(this.shadow, shadowBase, false)
        }
        shadowBase.remove()
    }
    shadow_post() {
        let unitedSections = new Path()
        this.sections.children.forEach(c => {
            unitedSections = uniteReplace(unitedSections, c, false)
        })

        this.topShadow = intersectReplace(this.topShadow, unitedSections)
        this.topShadow = subtractReplace(this.topShadow, this.top, false)
    }
}