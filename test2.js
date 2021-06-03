var canvas = document.querySelector('canvas');
canvas.width = 800;
canvas.height = 600;
var c = canvas.getContext('2d');

c.fillStyle = 'rgba(255, 0, 0, 0.5)';
// c.fillRect(100, 100, 100, 100);
// c.fillRect(50, 200, 30, 40);

// create a physics world 1000 meters by 1000 meters
world = new World(1000, 1000);  
console.log(world);
world.add(new CircleBody(0,0,1,1));
console.log(world);

// Create a Physics window for rendering world to canvas
worldView = new WorldView(world, canvas, center=[0,0], pixelsPerMeter=30);
console.log(worldView); 
bounds = worldView.getWindowBounds(); 
console.log(worldView.world.bodies);
let body = worldView.world.bodies[0];
worldView.ctx.fillRect(100,100,100,100);
bodyCoord = worldView.transformCoord([body.pos.x, body.pos.y]);
console.log(bodyCoord);
worldView.drawCircleBody(body);



// var circ1 = new Circle(radius, canvas.height/2, radius, 1, 0);
// circ1.body.mass = 2;
// var circ2 = new Circle(canvas.width - radius, canvas.height/2, radius, -1, 0);
// var circles = [circ1, circ2];
// console.log(circles);
// animate();

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