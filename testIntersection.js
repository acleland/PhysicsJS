var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var rectCanvas = new Rect(0, 0, canvas.width, canvas.height);
var c = canvas.getContext('2d');


const circleColor = 'white';
const nCircles = 20;
const velConst = 3;
const g = (new Vector(0, 1)).scalarMult(0);
const radius = 10;

function Circle(x, y, r, dx=0, dy=0) {
    this.body = new CircleBody(x, y, r, dx, dy);
    this.radius = r;
    this.color = circleColor;

    this.draw = function() {
        c.beginPath();
        c.arc(this.body.pos.x, this.body.pos.y, this.radius, 0, 2*Math.PI, false);
        c.fillStyle = this.color;
        c.strokeStyle = this.color;
        c.stroke();
        //c.fill();
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
    c.clearRect(0,0, canvas.width, canvas.height);
    for (var i = 0; i < circles.length; i++) {
        circles[i].draw();
    }
    for (var i = 0; i < circles.length; i++) {
        circles[i].update();
    }

}



// Actual code that runs

//var circles = initCircles(nCircles);
//animate();

circ1 = new Circle(100, 100, 50, 0, 0);
circ2 = new Circle(130, 130, 50, 0 ,0);
circles = [circ1, circ2];

animate();







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