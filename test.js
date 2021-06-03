var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var rectCanvas = new Rect(0, 0, canvas.width, canvas.height);
var c = canvas.getContext('2d');


const circleColor = 'white';
const nCircles = 5;
const velConst = 2;
const g = (new Vector(0, 1)).scalarMult(0.0);
const radius = 30;

function Circle(x, y, r, dx=0, dy=0) {
    this.body = new CircleBody(x, y, r, m=1, dx, dy);
    this.radius = r;
    this.color = circleColor;

    this.draw = function() {
        c.beginPath();
        c.arc(this.body.pos.x, this.body.pos.y, this.radius, 0, 2*Math.PI, false);
        c.fillStyle = this.color;
        c.strokeStyle = this.color;
        c.stroke();
        c.fill();
    }
    this.update = function() {
        this.body.update();
    }
}


function randomX() {
    return radius + Math.random()*(canvas.width - 2*radius);
}

function randomY() {
    return radius + Math.random()*(canvas.height - 2*radius);
}

function randomVel() {
    return velConst * (-1 + 2*Math.random())
}

function initCircles(n) {
    circles = [];
    for (var i = 0; i < n; i++) {
        circles.push(new Circle(randomX(), randomY(), radius, randomVel(), randomVel()));
    }
    return circles;
}


function animate() {
    requestAnimationFrame(animate);
    circlebodies = [];
    for (var i = 0; i < circles.length; i++) {
        circlebodies.push(circles[i].body);
    }
    c.clearRect(0,0, canvas.width, canvas.height);
    for (var i = 0; i < circles.length; i++) {
        circles[i].draw();
    }
    for (var i = 0; i < circles.length; i++) {
        circles[i].update();
        handleCollisions(circles[i].body, circlebodies);
    }
    // random energy check
    if (Math.random() < 0.01){
        console.log(getTotalKineticEnergy(circlebodies));
    }
    
}


function drawAxes()
{
    var qt = new QuadTree(0, rectCanvas);
    
    // Draw axes for reference
    c.beginPath();
    c.strokeStyle = "white";
    c.moveTo(rectCanvas.getCenter().x, 0);
    c.lineTo(rectCanvas.getCenter().x, rectCanvas.height);
    c.moveTo(0, rectCanvas.getCenter().y);
    c.lineTo(rectCanvas.width, rectCanvas.getCenter().y);
    c.stroke();
}

function drawRect(rect) {
    c.rect(rect.x, rect.y, rect.width, rect.height);
    c.stroke();
}

function testQuadTree()
{
    drawAxes();
    rect1 = new Rect(0, 0, canvas.width/8, canvas.height/8);
    rect1.setCenter(canvas.width/4, canvas.height/4);
    rect2 = new Rect(0, 0, canvas.width/8, canvas.height/8);
    rect2.setCenter(rectCanvas.width/2 + canvas.width/4, canvas.height/4);
    rect3 = new Rect(0, 0, canvas.width/8, canvas.height/8);
    rect3.setCenter(canvas.width/4, canvas.height/4 + canvas.height/2);
    rect4 = new Rect(0, 0, canvas.width/8, canvas.height/8);
    rect4.setCenter(canvas.width/2 + canvas.width/4, canvas.height/2 + canvas.height/4);
    
    var rects = [rect1, rect2, rect3, rect4];
    rects.push(new Rect(1,1, canvas.width/9, canvas.width/9));

    
    var qt = new QuadTree(0, rectCanvas);
    for (var i=0; i < rects.length; i++) {
        drawRect(rects[i]);
        console.log(rects[i]);
        console.log(qt.getIndex(rects[i]));
    }
}

function testCollision1() {
    var circ1 = new Circle(radius, canvas.height/2, radius, 1, 0);
    var circ2 = new Circle(canvas.width - radius, canvas.height/2, radius, -1, 0);
    var circles = [circ1, circ2];
    console.log(circles);
    animate();
}


// Actual code that runs
var circles = initCircles(nCircles);
animate();
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