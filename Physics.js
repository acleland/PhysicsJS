const QUADTREE_MAX_OBJECTS = 10;
const QUADTREE_MAX_LEVELS = 5;

/*
A physical body has a position
A physical body has a shape
A physical body has a mass

A moveable body is a physical body

A circular body is a physical body

a rectangular body is a physical body




*/



function Vector(x, y) {
    this.x = x;
    this.y = y;
    this.getLength = function() {
        return Math.sqrt((this.x**2 + this.y**2));
    }
    this.scalarMult = function(s) {
        return new Vector(s*this.x, s*this.y);
    }

    this.dotProduct = function(v) {
        return this.x*v.x + this.y*v.y;
    }
    
    this.cosTheta = function(v) {
        return this.dotProduct(v) / (this.getLength() * v.getLength())
    }

    this.add = function(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    this.subtract = function(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    this.inc = function(v) {
        this.x += v.x;
        this.y += v.y;
    }

    this.dec = function(v) {
        this.x -= v.x;
        this.y -= v.y;
    }
}



function CircleBody(x, y, r, m=1, dx=0, dy=0) {
    this.pos = new Vector(x,y);
    this.vel = new Vector(dx, dy);
    this.acc = g;
    this.radius = r;
    this.mass = m;
    this.dx = dx;
    this.dy = dx;

    this.update = function() {
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

    this.resetOnCollision = function(other) {
        vecdiff = other.pos.subtract(this.pos);
        dist = vecdiff.getLength();
        // compute how much they intersect:
        overlap = dist - (this.radius + other.radius);
        // adjust pos by half the overlap distance
        this.pos.inc(vecdiff.scalarMult(1/dist * overlap));
    }

    this.onCollision = function(other){
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


// Visual code
function drawVec(ctx, vector, startX, startY) {
    ctx.beginPath();
    pos = new Vector(startX, startY);
    ctx.moveTo(pos.x, pos.y);
    tipPos = pos.add(vector);
    ctx.lineTo(tipPos.x, tipPos.y);

    ctx.strokeStyle="white";
    ctx.stroke();
}


// For reference:

// c.fillStyle = 'rgba(255, 0, 0, 0.5)';
// c.fillRect(100, 100, 100, 100);
// c.fillRect(50, 200, 30, 40);

// // Line
// c.beginPath();
// c.moveTo(50, 300); 
// c.lineTo(300, 100);
// c.lineTo(400, 300);
// c.strokeStyle = "blue";
// c.stroke();

// // arc or circle
// c.beginPath();
// c.arc(300,300, 30, 0, Math.PI *2, false);
// c.stroke();