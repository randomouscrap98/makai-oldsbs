//Carlos Sanchez - 2015
//randomouscrap98@aol.com

//This is a "class" that represents an animation. main is the function which
//runs one frame of animation.
function Animation(main, drawLevel, frameStop, begin, end)
{
   this.main = main;
   this.begin = getOrDefault(begin, false);
   this.end = getOrDefault(end, false);
   this.drawLevel = drawLevel;
   
   this.startTime = 0;  //High Performance clock tells us exactly when we started.
   this.framesRun = 0;  //Total frames run (including skips)
   this.frameSkip = 0;  //How many frames to skip while rendering
   this.frameStop = getOrDefault(frameStop, 0);  //The frame to stop on (if applicable)
   this.started = false;
   this.fast2DContext = true;
   this.endNow = false;

   //Any animation data should go in here. It will be handled by the user of
   //the animation for restarting, etc. Data that's not in here will be
   //controlled solely by the animation and may cause errors if not properly
   //handled by various canvas events (like resize)
   this.data = {};
}

//Did the animation finish? Maybe it's just stopped... who knows
Animation.prototype.finished = function ()
{
   return (this.frameStop > 0 && (this.framesRun >= this.frameStop ||
      (performance.now() - this.startTime) / 1000 * 60 >= this.frameStop * 1.3) || 
      this.endNow);
};

//An animation is running if it has started but not finished.
Animation.prototype.running = function ()
{
   return this.started && !this.finished();
};

//Call this when you're about to run an animation.
Animation.prototype.start = function (canvas)
{
   //Starting the animation will HOPEFULLY restart the animation. We can't
   //guarantee what the animation will do or how it will do it.
   this.framesRun = 0;
   this.startTime = performance.now();
   this.data = {};

   if(this.begin)
      this.begin(canvas);

   this.started = true;
};

//Run one frame of animation
Animation.prototype.runFrame = function (canvasOrContext, animate)
{
   animate = getOrDefault(animate, true);

   if(this.finished())
      return;

   //Call main if we're not skipping this time.
   if((animate || this.framesRun < 1) && 
      (this.frameSkip === 0 || this.framesRun % (this.frameSkip + 1) === 0))
      this.main(canvasOrContext);

   this.framesRun++;
};

//Try to stop an animation. It'll only mean anything if there's something to
//run the animation in the first place; animations don't run themselves.
Animation.prototype.stop = function()
{
   this.endNow = true;
};

Animation.prototype.complete = function()
{
   debuglog("Animation Completed");
   if(this.end)
      this.end();
};

//Class for running an instance of a game. Has areas for animations, etc.
function GameRunner(canvas)
{
   //public stuff? Ehhhh javascript sucks
   this.canvas = canvas;
   this.animations = [];
   this.running = false;
   this.animate = true;
   this.framesRun = 0;
}

//This is the recursive runtime thing that happens every frame. You don't need
//to worry about this!
GameRunner.prototype._frameRun = function (timestamp)
{
   //Stop now since we're done I guess
   if(!this.running)
      return;

   var context = this.canvas.getContext("2d");
   //var animate = !getOption("lowperformance");

   if(this.animate)
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);

   //Iterate over all animations and do the thing. We go backwards so we can
   //remove the animations as they are completed
   for(var i = this.animations.length - 1; i >= 0; i--)
   {
      if(!this.animations[i].hidden)
      {
         if(this.animations[i].fast2DContext)
            this.animations[i].runFrame(context, this.animate);
         else
            this.animations[i].runFrame(this.canvas, this.animate);

         //Remove animation when completed
         if(this.animations[i].finished())
         {
            this.animations.splice(i, 1)[0].complete();
         }
      }
   }

   this.framesRun++;

   if(window.requestAnimationFrame)
      requestAnimationFrame(this._frameRun.bind(this));
   else if(window.webkitRequestAnimationFrame)
      webkitRequestAnimationFrame(this._frameRun.bind(this));
   else if(window.mozRequestAnimationFrame)
      mozRequestAnimationFrame(this._frameRun.bind(this));
   else if(window.oRequestAnimationFrame)
      oRequestAnimationFrame(this._frameRun.bind(this));
};

//Begin the game (start all animations, run everything, blah blah blah). You
//should only call this once; when it starts, it runs by itself
GameRunner.prototype.start = function ()
{
   this.running = true;
   this._frameRun(0); 
};

//This should completely halt the game at whatever frame it's currently on.
GameRunner.prototype.stop = function ()
{
   this.running = false;
};

//This will add a new animation to the draw queue. It will be added to preserve
//sorting based on drawLevel. A higher drawlevel will be on top of other
//drawlevels.
GameRunner.prototype.addAnimation = function (animation)//, prepare)
{
   debuglog("added animation");
   //prepare = getOrDefault(prepare, true);

   //Just prepare the animation if it wasn't already (none should be)
   if(!animation.started) // && prepare)
      animation.start(this.canvas);

   //Insert animation into correct location
   for(var i = 0; i < this.animations.length; i++)
   {
      //Greatest drawlevel goes in front. Newer animations get drawn on top of
      //older animations with the same drawlevel (hence the = on >=)
      if(animation.drawLevel >= this.animations[i].drawLevel)
      {
         this.animations.splice(i, 0, animation);
         return;
      }
   }

   //Insert at the end if it is the smallest
   this.animations.push(animation);
};

//Add a chain of animations.
GameRunner.prototype.addAnimationChain = function (chain)
{
   var runner = this;

   function getCapturedAnimation(animation)
   {
      return function() { runner.addAnimation(animation); };
   }

   //"chain" is a list of animations
   for(var i = 1; i < chain.length; i++)
   {
      chain[i - 1].end = getCapturedAnimation(chain[i]);
   }

   this.addAnimation(chain[0]);
};

GameRunner.prototype.hideAnimationByFunction = function(main)
{
   for(var i = 0; i < this.animations.length; i++)
   {
      if(this.animations[i].main === main)
      {
         debuglog("Hiding animation " + i);
         this.animations[i].hidden = true;
      }
   }

   //Refresh... just in case!
   this.refresh();
};

GameRunner.prototype.unhideAnimationByFunction = function(main)
{
   for(var i = 0; i < this.animations.length; i++)
   {
      if(this.animations[i].main === main)
      {
         debuglog("UnHiding animation " + i);
         this.animations[i].hidden = false;
      }
   }

   //Refresh... just in case!
   this.refresh();
};

//Just completely remove said animation
GameRunner.prototype.removeAnimationByFunction = function(main)
{
   for(var i = 0; i < this.animations.length; i++)
   {
      if(this.animations[i].main === main)
      {
         debuglog("Removing animation " + i);
         this.animations.splice(i, 1);
         break;
      }
   }

   //Refresh... just in case!
   this.refresh();
};

GameRunner.prototype.refresh = function()
{
   var context = this.canvas.getContext("2d");
   context.clearRect(0, 0, this.canvas.width, this.canvas.height);

   for(var i = 0; i < this.animations.length; i++)
      this.animations[i].start(this.canvas);
};

//This happens when the canvas gets resized?
GameRunner.prototype.resize = function()
{
   this.refresh();
};

//Get the smallest dimension of the given canvas. If in landscape, this is
//height, otherwise it's width. The following is the opposite
function smallestDimension(canvas)
{
   return Math.min(canvas.width, canvas.height);
}
function largestDimension(canvas)
{
   return Math.max(canvas.width, canvas.height);
}

//Like vmin and vmax in html
function minUnit(canvas)
{
   return smallestDimension(canvas) / 100.0;
}
function maxUnit(canvas)
{
   return largestDimension(canvas) / 100.0;
}

//A class which represents a simple 3D engine. This engine leaves the drawing
//up to the user, but gives all the tools necessary to perform the nasty
//calculations and stuff.
function My3DEngine()
{
   this.points = [];
   this.outPoints = [];
   this.realPoints = [];
   this.xMatrix = [[0,0,0],[0,0,0],[0,0,0]];
   this.yMatrix = [[0,0,0],[0,0,0],[0,0,0]];
   this.zMatrix = [[0,0,0],[0,0,0],[0,0,0]];

   this.xTheta = 0;
   this.yTheta = 0;
   this.zTheta = 0;

   this.zoom = 10;
   this.pointSize = 1;
   this.gridSize = 100;
}

//Call this to initialize the 3D engine with a set of points. It doesn't matter
//what you're actually rendering; this engine works with points. It's up to you
//to render shapes with points!
My3DEngine.prototype.initPoints = function(points)
{
   for(var i = 0; i < points.length; i++)
   {
      this.points[i] = points[i];
      this.outPoints[i] = [0,0,0];
      this.realPoints[i] = { "x" : 10, "y" : 10, "size" : 5, "zScale" : 1 };
   }
};

//Sets the internal points to be randomly spread throughout the grid.
My3DEngine.prototype.initRandomPoints = function(pointCount)
{
   var points = [];

   for(var i = 0; i < pointCount; i++)
   {
      points[i] = [intRandom(-this.gridSize + 1, this.gridSize), 
         intRandom(-this.gridSize + 1, this.gridSize), 
         intRandom(-this.gridSize + 1, this.gridSize)];
   }

   this.initPoints(points);
};

//Sets the internal points to be evenly spread throughout the grid.
My3DEngine.prototype.initEvenPoints = function(gridSize)
{
   var n = 0;
   var points = [];
   this.gridSize = Math.floor(gridSize / 2);

   for(var i = -this.gridSize; i <= this.gridSize; i++)
      for(var j = -this.gridSize; j <= this.gridSize; j++)
         for(var k = -this.gridSize; k <= this.gridSize; k++)
            points[n++] = [i,j,k];

   this.initPoints(points);
};

//Perform the costly conversion between 3D points and screen points
My3DEngine.prototype.convertPoints = function(canvas)
{
   this.xMid = canvas.width / 2;
   this.yMid = canvas.height / 2;
   this.realPointSize = this.zoom * this.pointSize;

   var n = 0;
   var perspective = 0;

   for(n = 0; n < this.points.length; n++)
   {
      this.realPoints[n].zScale = (this.outPoints[n][2] + this.gridSize * 1.7321) / 
         (3.4642 * this.gridSize);
      this.realPoints[n].size = this.realPointSize * 
         (0.5 + 4 * this.realPoints[n].zScale);
         //(0.5 + 7 * Math.pow(this.realPoints[n].zScale, 2));
      perspective = (0.5 + 0.5 * this.realPoints[n].zScale);
      this.realPoints[n].x = this.xMid + perspective * this.outPoints[n][0] * this.zoom;
      this.realPoints[n].y = this.yMid + perspective * this.outPoints[n][1] * this.zoom;
   }
};

My3DEngine.prototype.matrixMultiply = function(R, P, OUT)
{
   /* Assumes that R is a 3 x 3 matrix and that this.points (i.e.,
    * P) is a 3 x n matrix. This method performs P = R * P.       */
   var V, Rrow, Px, Py, Pz;

   for (V = 0; V < P.length; V++) // For all 3 x 1 vectors in the point list.
   {
      Px = P[V][0]; Py = P[V][1]; Pz = P[V][2];
      for (Rrow = 0; Rrow < 3; Rrow++) // For each row in the R matrix.
         OUT[V][Rrow] = (R[Rrow][0] * Px) + (R[Rrow][1] * Py) + (R[Rrow][2] * Pz); 

      OUT[V].color = P[V].color;
   }
};
My3DEngine.prototype.xRotateMatrix = function(theta, OUT)
{
   OUT[0][0] = 1;
   OUT[0][1] = OUT[0][2] = OUT[1][0] = OUT[2][0] = 0;
   OUT[1][1] = OUT[2][2] = Math.cos(theta);
   OUT[1][2] = -Math.sin(theta);
   OUT[2][1] = Math.sin(theta);
};
My3DEngine.prototype.yRotateMatrix = function(theta, OUT)
{
   OUT[1][1] = 1;
   OUT[0][1] = OUT[1][2] = OUT[1][0] = OUT[2][1] = 0;
   OUT[0][0] = OUT[2][2] = Math.cos(theta);
   OUT[2][0] = -Math.sin(theta);
   OUT[0][2] = Math.sin(theta);
};
My3DEngine.prototype.zRotateMatrix = function(theta, OUT)
{
   OUT[2][2] = 1;
   OUT[0][2] = OUT[1][2] = OUT[2][0] = OUT[2][1] = 0;
   OUT[0][0] = OUT[1][1] = Math.cos(theta);
   OUT[0][1] = -Math.sin(theta);
   OUT[1][0] = Math.sin(theta);
};
My3DEngine.prototype.zSort = function(a, b)
{
   return a[2] - b[2];
};
My3DEngine.prototype.updateRotation = function()
{
   this.xRotateMatrix(this.xTheta, this.xMatrix);
   this.yRotateMatrix(this.yTheta, this.yMatrix);
   this.zRotateMatrix(this.zTheta, this.zMatrix);
   this.matrixMultiply(this.xMatrix, this.points, this.outPoints);
   this.matrixMultiply(this.yMatrix, this.outPoints, this.outPoints);
   this.matrixMultiply(this.zMatrix, this.outPoints, this.outPoints);
   this.outPoints.sort(this.zSort);
};

function resizeCanvas(canvas)
{
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
}

function debuglog(message)
{
   if(debuglog.log)
      console.log(message);
}
