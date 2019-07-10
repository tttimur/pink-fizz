import * as THREE from 'three'
/*
 * Cloth Simulation using a relaxed constraints solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

//var DAMPING = 0.0278;
var DAMPING = 0.01278;
var DRAG = 1 - DAMPING; // 1
var MASS = 0.11;
var restDistance = 10 

var xSegs = 80;
var ySegs = 50;

export const clothFunction = plane(restDistance * xSegs, restDistance * ySegs);

export const cloth = new Cloth(xSegs, ySegs);

var GRAVITY = 981 * 1.4;
var gravity = new THREE.Vector3(0, - GRAVITY, 0).multiplyScalar(MASS);

var TIMESTEP = 24 / 1000; // 18
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var pins = [];

var wind = true;
var windStrength = 20;

export const windForce = new THREE.Vector3(0, 0, 0);

var ballPosition = new THREE.Vector3(0, - 45, 0);
var ballSize = 100; //40

var tmpForce = new THREE.Vector3();
var lastTime;

var sphere
function createSphere() {
}

function plane(width, height) {

	return function (u, v, target) {

		var x = (u - 0.5) * width;
		var y = (v + 0.5) * height;
		var z = 0;

		target.set(x, y, z);

	};

}

function Particle(x, y, z, mass) {
	this.position = new THREE.Vector3();
	this.previous = new THREE.Vector3();
	this.original = new THREE.Vector3();
	this.a = new THREE.Vector3(0, 0, 0); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();

	// init

	clothFunction(x, y, this.position); // position
	clothFunction(x, y, this.previous); // previous
	clothFunction(x, y, this.original);

}

// Force -> Acceleration

Particle.prototype.addForce = function (force) {
	this.a.add(
		this.tmp2.copy(force).multiplyScalar(this.invMass)
	);

};

Particle.prototype.bindToBottom = function () {
  this.position.copy(this.original)
  this.previous.copy(this.original) 

	this.position.multiplyScalar(4)
  this.previous.multiplyScalar(4)
  this.position.z = 100
  this.previous.z = 100

  this.position.y = -900
  this.previous.y = -900
}

Particle.prototype.lockToOriginal = function (increase) {
	this.position.copy(this.original)
	this.previous.copy(this.original)

  this.position.multiplyScalar(4)
  this.previous.multiplyScalar(4)

  this.position.z = -100
  this.previous.z = -100

	//  this.position.multiplyScalar(1)
	//  this.previous.multiplyScalar(1)

  /*  
    if (increase) {
      this.position.y = 0 
      this.previous.y = 0 
    } else {
  */
//	this.position.z = this.original.y
//	this.previous.z = this.original.y
	this.position.y = 100 
	this.previous.y = 100 

}

// Performs Verlet integration

Particle.prototype.integrate = function (timesq) {

	var newPos = this.tmp.subVectors(this.position, this.previous);
	newPos.multiplyScalar(DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));

	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;

	this.a.set(0, 0, 0);

};


var diff = new THREE.Vector3();

function repelParticles(p1, p2, distance) {

	diff.subVectors(p2.position, p1.position);
	var currentDist = diff.length();
	if (currentDist == 0) return; // prevents division by 0
	if (currentDist < distance) {
		var correction = diff.multiplyScalar((currentDist - distance) / currentDist);
		var correctionHalf = correction.multiplyScalar(0.5);
		p1.position.add(correctionHalf);
		p2.position.sub(correctionHalf);
	}

}

function satisfyConstraints(p1, p2, distance) {

	diff.subVectors(p2.position, p1.position);
	var currentDist = diff.length();
	if (currentDist === 0) return; // prevents division by 0
	var correction = diff.multiplyScalar(1 - distance / currentDist);
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);

}


function Cloth(w, h) {

	w = w || 10;
	h = h || 10;
	this.w = w;
	this.h = h;

	var particles = [];
	var constraints = [];

	var u, v;

	// Create particles
	for (v = 0; v <= h; v++) {

		for (u = 0; u <= w; u++) {

			particles.push(
				new Particle(u / w, v / h, 0, MASS)
			);

		}

	}

	// Structural

	for (v = 0; v < h; v++) {

		for (u = 0; u < w; u++) {

			constraints.push([
				particles[index(u, v)],
				particles[index(u, v + 1)],
				restDistance
			]);

			constraints.push([
				particles[index(u, v)],
				particles[index(u + 1, v)],
				restDistance
			]);

		}

	}

	for (u = w, v = 0; v < h; v++) {

		constraints.push([
			particles[index(u, v)],
			particles[index(u, v + 1)],
			restDistance

		]);

	}

	for (v = h, u = 0; u < w; u++) {

		constraints.push([
			particles[index(u, v)],
			particles[index(u + 1, v)],
			restDistance
		]);

	}

	// While many systems use shear and bend springs,
	// the relaxed constraints model seems to be just fine
	// using structural springs.
	// Shear
//  var diagonalDist = Math.sqrt(restDistance * restDistance * 2);
//   for (v=0;v<h;v++) {
//   	for (u=0;u<w;u++) {

//   		constraints.push([
//   			particles[index(u, v)],
//   			particles[index(u+1, v+1)],
//   			diagonalDist
//   		]);

//   		constraints.push([
//   			particles[index(u+1, v)],
//   			particles[index(u, v+1)],
//   			diagonalDist
//   		]);

//   	}
//   }
	


	this.particles = particles;
	this.constraints = constraints;

	function index(u, v) {
		return u + v * (w + 1);
	}

	this.index = index;
}



var avoidClothSelfIntersection = true
export const simulate = (time, clothGeometry, pins, windForce, mousex, mousey, windStrength) => {


	if (!lastTime) {

		lastTime = time;
		return;

	}

	var p_i, i, il, particles, particle, pt, constraints, constraint;

	// Aerodynamics forces

	if (wind) {

		var indx;
		var normal = new THREE.Vector3();

		var indices = clothGeometry.index;
		var normals = clothGeometry.attributes.normal;

		particles = cloth.particles;

		for (i = 0, il = indices.count; i < il; i += 3) {

			for (let j = 0; j < 3; j++) {

				indx = indices.getX(i + j);
				normal.fromBufferAttribute(normals, indx)
				tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
				particles[indx].addForce(tmpForce);

			}

		}

	}

	for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {

		particle = particles[i];
		particle.addForce(gravity);

		particle.integrate(TIMESTEP_SQ);

	}

	// Start Constraints

	constraints = cloth.constraints;
	il = constraints.length;

	for (i = 0; i < il; i++) {
		constraint = constraints[i];
		satisfyConstraints(constraint[0], constraint[1], constraint[2]);
	}

	// Ball Constraints
  /*
      ballPosition.z = - Math.sin( Date.now() / 600 ) * 20; //+ 40;
      ballPosition.x = Math.cos( Date.now() / 400 ) * 20;
  
      sphere.position.x = ballPosition.x
      sphere.position.z = ballPosition.z
  
    if (sphere.length && sphere.visible ) {
      for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ) {
  
        particle = particles[ i ];
        var pos = particle.position;
        diff.subVectors( pos, ballPosition );
        if ( diff.length() < ballSize ) {
  
          // collided
          diff.normalize().multiplyScalar( ballSize );
          pos.copy( ballPosition ).add( diff );
  
        }
  
      }
  
    }
  */

	// Floor Constraints

	for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {

		particle = particles[i];
		let pos = particle.position;
		if (pos.y < - 1500) {
			pos.y = - 1500;
		} else if (pos.y > 150) {
			pos.y = 150
		}

		if (pos.x < -800) {
//			pos.x = -800
		}
		if (pos.x > 900) {
//			pos.x = 900
		}
	}

	// Pin Constraints

  for (let j = xSegs; j > 0; j--){
    var p = particles[particles.length - j]
    p.bindToBottom()
  }

	for (i = 0, il = xSegs - 1; i < il; i++) {
		// var o = pins[i]
			var p = particles[i];
			p.lockToOriginal()
		//    console.log(cloth.index(0, i))  

    /*
    var x = cloth.index(0, o)
    var y = cloth.index(xSegs, o)
    var z = cloth.index(o, ySegs)
    var n = cloth.index(xSegs, ySegs)
    */

		// var x = cloth.index(0, o)
		// var y = cloth.index(xSegs, o)
		// var z = cloth.index(o, 0)
		// var n = cloth.index(o, xSegs)

		// particles[x].lockToOriginal(false)
		// particles[y].lockToOriginal(false)
		// particles[z].lockToOriginal(true)
		// particles[n].lockToOriginal(true)

	}

}


