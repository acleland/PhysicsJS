const QUADTREE_MAX_OBJECTS = 10;
const QUADTREE_MAX_LEVELS = 5;
const FORCE_THRESHOLD = 0; // Newtons
const VELOCITY_THRESHOLD = 0; // meters/second

const Constants = {
    g: 9.8,
}

/* Math Functions */

class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    
    getLength() {
        return Math.sqrt((this.x**2 + this.y**2));
    }
    scalarMult(s) {
        return new Vector(s*this.x, s*this.y);
    }

    dotProduct(v) {
        return this.x*v.x + this.y*v.y;
    }
    
    cosTheta(v) {
        return this.dotProduct(v) / (this.getLength() * v.getLength())
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    getUnitVector() {
        return this.scalarMult(1/this.getLength());
    }

    getUnitNormal() {
        let unit = this.getUnitVector();
        return new Vector(-unit.y, unit.x);      
    }

    // vector increment
    inc(v) {
        this.x += v.x;
        this.y += v.y;
    }
    // vector decrement
    dec(v) {
        this.x -= v.x;
        this.y -= v.y;
    }
    // set vector
    set(x, y) {
        this.x = x;
        this.y = y;
    }
}


class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.bodies = [];
        this.collisions = true;
    }
    
    addBody(body){
        this.bodies.push(body);
        body.setWorld(this);
    }

    update(dt) {
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update(dt);
            if (this.collisions) {
                handleCollisions(this.bodies[i], this.bodies);
            }
        }
    }

    setCollisions(collisionValue) {
        this.collisions = collisionValue;
    }
}


class WorldView { 
    constructor(world, canvas, center=[0,0], pixelsPerMeter=10) {
        this.world = world;
        this.canvas = canvas;
        this.center = new Vector(center[0], center[1]);
        this.pixelsPerMeter = pixelsPerMeter;
        this.translationConst = this.getTranslationConst();

        this.ctx = canvas.getContext('2d');
        this.start = undefined;
        this.laststamp = undefined;
    }

    getTranslationConst() {
        return [canvas.width/2 - this.pixelsPerMeter*this.center.x, 
            canvas.height/2 + this.pixelsPerMeter*this.center.y]
    }
    
    setCenter(center) {
        this.center = center;
        this.translationConst = this.getTranslationConst();
    }

    transformCoord(worldCoord) {
        /** 
         * (center_x, center_y) => (canvas.width/2, canvas.height/2)
         * pixelsPerMeter * (center_x, center_y) + offset = (canvas.width/2, canvas_height/2)
         * offset = (canvas.width/2, canvas.height/2) - pixelsPerMeter * (center_x, center_y)
         *        = (canvas.width/2 - pixelsPerMeter * center_x, canvas.height/2 - pixelsPerMeter * center_y)
        */
        return new Vector(this.translationConst[0] + pixelsPerMeter*worldCoord.x, 
                this.translationConst[1] - pixelsPerMeter*worldCoord.y);
    }

    drawCircleBody(circleBody) {
        let coord = this.transformCoord(circleBody.pos);
        let r = this.pixelsPerMeter * circleBody.radius;
        this.ctx.beginPath();
        this.ctx.arc(coord.x, coord.y, r, 0, Math.PI *2, false);
        this.ctx.stroke();
    }

    drawBody(circleBody) {
        this.drawCircleBody(circleBody); 
    }

    render() {
        for (let i = 0; i < this.world.bodies.length; i++){
            this.drawBody(this.world.bodies[i]); 
        }
    }
}

class RigidBody {
    constructor(x, y, shape, m=1, dx=0, dy=0) {
        this.pos = new Vector(x,y);
        this.vel = new Vector(dx, dy);
        this.shape = shape;
        this.mass = m;
    }

    update() {
        this.vel.inc(this.acc);
        this.pos.inc(this.vel);
        
        if (this.pos.x + this.radius >= canvas.width) {
            this.pos.x = canvas.width - this.radius - 1;
            this.vel.x *= -1
        }
        if (this.pos.x - this.radius <= 0) {
            this.pos.x = this.radius + 1;
            this.vel.x *= -1
        }   
    
        if (this.pos.y + this.radius >= canvas.height) {
            this.pos.y = canvas.height - this.radius - 1;
            this.vel.y *= -1
        }
        if (this.pos.y - this.radius <= 0) {
            this.pos.y = this.radius + 1;
            this.vel.y *= -1
        } 
        
    }

    resetOnCollision(other) {
        vecdiff = other.pos.subtract(this.pos);
        dist = vecdiff.getLength();
        // compute how much they intersect:
        overlap = dist - (this.radius + other.radius);
        // adjust pos by half the overlap distance
        this.pos.inc(vecdiff.scalarMult(1/dist * overlap));
    }

    onCollision(other) {
        this.resetOnCollision(other);
        elasticCircleCollision(this, other);
    }
}

class CircleBody {
    constructor(x, y, r, m, vx, vy) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.acc = new Vector(0, 0);
        this.radius = r;
        this.mass = m;
        this.forceList = [];

        this.world = undefined;
    }

    setWorld(world) {
        this.world = world;
    }

    applyForce(f) {
        this.forceList.push(f);
    }
    
    update(dt) {
        let netForce = new Vector(0, 0);
        while (this.forceList.length > 0) {
            netForce.inc(this.forceList.pop());
        }
        // if (netForce.getLength() < FORCE_THRESHOLD) {
        //     netForce.set(0, 0);
        // }
        this.acc = netForce.scalarMult(1/this.mass);
        this.vel.inc(this.acc.scalarMult(dt));
        // if (this.vel.getLength() < VELOCITY_THRESHOLD) {
        //     this.vel.set(0,0);
        // }
        this.pos.inc(this.vel.scalarMult(dt));

    }

    resetOnCollision(other) {
        vecdiff = other.pos.subtract(this.pos);
        dist = vecdiff.getLength();
        // compute how much they intersect:
        overlap = dist - (this.radius + other.radius);
        // adjust pos by half the overlap distance
        this.pos.inc(vecdiff.scalarMult(1/dist * overlap));
    }

    onCollision(other){
        this.resetOnCollision(other);
        elasticCircleCollision(this, other);
    }
    
}

function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.getCenter = function () {
        return new Vector((x+w)/2, (y+h)/2);
    }

    this.setCenter = function(x, y) {
        this.x = x - this.width/2;
        this.y = y - this.height/2;
    }

    this.fitsIn = function(other) {
        return ((this.x > other.x) && (this.x + this.width < other.x + other.width)
        && (this.y > other.y) && (this.y+this.height < other.y + other.height))
    }
}

function circlesIntersect(circ1, circ2) {
    /*Assumes circles have a position vector and a radius*/
    let distance = (circ1.pos.subtract(circ2.pos)).getLength();
    return (distance < circ1.radius + circ2.radius);
}

function elasticCircleCollision (circBody1, circBody2) {
    // Compute unit radial vector
    radial = circBody2.pos.subtract(circBody1.pos);
    unitRadial = radial.scalarMult(1/radial.getLength());
    // Compute unit tangential vector
    unitTangential = new Vector(-unitRadial.y, unitRadial.x);
    //Break velocities into radial and tangential components
    vr1 = circBody1.vel.dotProduct(unitRadial);
    vt1 = circBody1.vel.dotProduct(unitTangential);
    vr2 = circBody2.vel.dotProduct(unitRadial);
    vt2 = circBody2.vel.dotProduct(unitTangential);
    /*
    momentum conservation:
    m1*vr1 + m2*vr2 = m1*new_vr1 + m2*new_vr2

    energy conservation:
    .5*m1*(vr1)^2 + .5*m2*(vr2)^2 = m


    */
    // Tangential components are not affected by collision
    // New radial velocities are given by
    // new vr1 = ((m1 - m2)*vr1 + 2*(m2*vr2))/(m1 + m2)
    //         = m1*vr1 - m2*vr1 + 2*m2/(m1 + m2) * vr2
    // new vr2 = (m2 - m2)*vr2 + 2*(m1*vr1)/(m1 + m2)
    new_vr1 = ((circBody1.mass - circBody2.mass)*vr1 + 2*circBody2.mass*vr2)/(circBody1.mass + circBody2.mass)
    new_vr2 = ((circBody2.mass - circBody1.mass)*vr2 + 2*circBody1.mass*vr1)/(circBody1.mass + circBody2.mass)
    // Compute total new velocities by adding radial and tangential components
    circBody1.vel = unitRadial.scalarMult(new_vr1).add(unitTangential.scalarMult(vt1));
    circBody2.vel = unitRadial.scalarMult(new_vr2).add(unitTangential.scalarMult(vt2));
}

function handleCollisions(body, bodies) {
    // exhaustive collision search
    for (var i = 0; i < bodies.length; i++) {
        if (bodies[i] === body) {
            continue;
        }
        if (circlesIntersect(body, bodies[i])) {
            body.onCollision(bodies[i]);
        }
    }
}

function getNormalForce(body, surfaceVector) {
    let gravityForce = (new Vector(0, -1)).scalarMult(body.mass * Constants.g);
    let unitNorm = surfaceVector.getUnitNormal();
    NormalForce_x = -gravityForce.dotProduct(unitNorm);
    NormalForce_y = -gravityForce.dotProduct(surfaceVector);
    return new Vector(NormalForce_x, NormalForce_y);
}

function getFrictionForce(body, surfaceVector, k) {
    return getNormalForce(body, surfaceVector).scalarMult(k);
}


function QuadTree(level, bounds) {
    this.MAX_LEVELS = QUADTREE_MAX_LEVELS;
    this.MAX_OBJECTS = QUADTREE_MAX_OBJECTS;
    this.level = level;
    this.bounds = bounds;
    this.objects = new Array(0); 
    this.nodes = new Array(4);

    this.clear = function() {
        this.objects = new Array(0);
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] != undefined) {
                this.nodes[i].clear();
                this.nodes[i] = undefined;
            }
        }
    }

    this.split = function() {
        let midWidth = bounds.width/2;
        let midHeight = bounds.height/2;
        let x = bounds.x;
        let y = bounds.y;
        nodes[0] = new QuadTree(this.level+1, new Rect(x, y, midWidth, midHeight));
        nodes[1] = new QuadTree(this.level+1, new Rect(x+midWidth, y, midWidth, midHeight));
        nodes[2] = new QuadTree(this.level+1, new Rect(x, y+midHeight, midWidth, midHeight));
        nodes[3] = new QuadTree(this.level+1, new Rect(x+midWidth, y+midHeight, midWidth, midHeight));
    }


    this.getIndex = function(rectObject) 
    {
        var index = -1;
        var center = bounds.getCenter();
        if (rectObject.y < center.y && 
            rectObject.y + rectObject.height < center.y) 
        {
                if (rectObject.x > bounds.x && rectObject.x + rectObject.width < center.x)
                {
                    index = 0;
                }
                else if (rectObject.x > center.x && rectObject.x + rectObject.width < bounds.x + bounds.width) 
                {
                    index = 1;
                }
        }
        else if (rectObject.y > center.y && rectObject.y + rectObject.height < bounds.y + bounds.height) 
        {
            if (rectObject.x > bounds.x && rectObject.x + rectObject.width < center.x)
            {
                index = 2;
            }
            else if (rectObject.x > center.x && rectObject.x + rectObject.width < bounds.x + bounds.width) 
            {
                index = 3;
            }
        }
        return index;
    }

}

function getTotalKineticEnergy(bodies) {
    var KE = 0;
    for (var i=0; i < bodies.length; i++) {
        KE += .5*bodies[i].mass*(bodies[i].vel.getLength())**2
    }
    return KE;
}

function centerOfMass(bodies) {
    let total_mass = 0;
    let r = new Vector(0,0);
    for (let i = 0; i < bodies.length; i++) {
        total_mass += bodies[i].mass;
        r.inc(bodies[i].pos.scalarMult(bodies[i].mass));
    }
    return r.scalarMult(1/total_mass);
}