var hello = "hello";

var canvas = document.querySelector('canvas');
canvas.width = 800;
canvas.height = 600;
var c = canvas.getContext('2d');

c.fillStyle = 'rgba(255, 0, 0, 0.5)';
// c.fillRect(100, 100, 100, 100);
// c.fillRect(50, 200, 30, 40);

// create a physics world 1000 meters by 1000 meters
world = new World(1000, 1000);  
/* v^2/r = f/m1
   v = sqrt(r * f/m1) */
const density = 1;

function random_vel(max) {
    dir = 1;
    if (Math.random() > 0.5) {
        dir = -1;
    }
    return new Vector(Math.random()*max, Math.random()*max).scalarMult(dir);
}

v1 = random_vel(1);
let body1 = new CircleBody(5, 0, .5, 1, v1.x, v1.y);
let body2 = new CircleBody(0, 0, 1, 20, 0, 0);
//body1.vel.y = Math.sqrt(body1.pos.subtract(body2.pos).getLength() * getGravityForce(body1, body2).getLength()/body1.mass);
function getGravityForce(body1, body2) {
    let G = 0.2;
    r_vec = body1.pos.subtract(body2.pos);
    r = r_vec.getLength();
    return r_vec.getUnitVector().scalarMult(G * body1.mass*body2.mass/(r*r));
}


// define an attractive force between the two bodies
let force = getGravityForce(body1, body2);
body2.applyForce(force);
body1.applyForce(force.scalarMult(-1));

world.addBody(body1);
world.addBody(body2);

world.setCollisions(true);

// Create a Physics window for rendering world to canvas
worldView = new WorldView(world, canvas, center=[0,0], pixelsPerMeter=30);
worldView.render();


function animate() {
    worldView.ctx.clearRect(0, 0, canvas.width, canvas.height);
    com = centerOfMass([body1, body2]);
    worldView.setCenter(com);
    world.update(.1);
    worldView.render();
    force = getGravityForce(body1, body2);
    body2.applyForce(force);
    body1.applyForce(force.scalarMult(-1));
    window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);
