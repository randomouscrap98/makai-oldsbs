//Carlos Sanchez - 2015
//randomouscrap98@aol.com

//This is a "class" that represents an animation. main is the function which
//runs one frame of animation.
function Animation(main, drawLevel)
{
   this.main = main;
   this.start = false;
   this.end = false;
   this.drawLevel = drawLevel;
   
   this.framesRun = 0;  //Total frames run (including skips)
   this.frameSkip = 0;  //How many frames to skip while rendering
   this.frameStop = 0;  //The frame to stop on (if applicable)
   this.started = false;
   this.fast2DContext = true;

   //Any animation data should go in here. It will be handled by the user of
   //the animation for restarting, etc. Data that's not in here will be
   //controlled solely by the animation and may cause errors if not properly
   //handled by various canvas events (like resize)
   this.data = {};
}

//Did the animation finish? Maybe it's just stopped... who knows
Animation.prototype.finished = function ()
{
   return (this.frameStop > 0 && this.framesRun >= this.frameStop) || this.endNow;
};

//An animation is running if it has started but not finished.
Animation.prototype.running = function ()
{
   return this.started && !this.finished();
};

//Call this when you're about to run an animation.
Animation.prototype.prepare = function (canvas)
{
   //Starting the animation will HOPEFULLY restart the animation. We can't
   //guarantee what the animation will do or how it will do it.
   this.framesRun = 0;
   this.endNow = false;
   this.data = {};

   if(this.start)
      this.start(canvas);

   this.started = true;
};

//Run one frame of animation
Animation.prototype.runFrame = function (canvasOrContext)
{
   //if(this.framesRun === this.frameStop || this.endNow)
   if(this.finished())
      return;

   //Call main if we're not skipping this time.
   if(this.frameSkip === 0 || this.framesRun % (this.frameSkip + 1) === 0)
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
   this.framesRun = 0;

   //These aren't actually private, but I'll know they are because of the _
}

//This is the recursive runtime thing that happens every frame. You don't need
//to worry about this!
GameRunner.prototype._frameRun = function (timestamp)
{
   //Stop now since we're done I guess
   if(!this.running)
      return;

   var context = this.canvas.getContext("2d");
   context.clearRect(0, 0, this.canvas.width, this.canvas.height);
   //Iterate over all animations and do the thing. We go backwards so we can
   //remove the animations as they are completed
   for(var i = this.animations.length - 1; i >= 0; i--)
   {
      if(this.animations[i].fast2DContext)
         this.animations[i].runFrame(context);
      else
         this.animations[i].runFrame(this.canvas);

      //Remove animation when completed
      if(this.animations[i].finished())
      {
         this.animations[i].complete();
         this.animations.splice(i, 1);
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
GameRunner.prototype.addAnimation = function (animation)
{
   //Just prepare the animation if it wasn't already (none should be)
   if(!animation.started)
      animation.prepare(this.canvas);

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

//This happens when the canvas gets resized?
GameRunner.prototype.resize = function()
{
   for(var i = 0; i < this.animations.length; i++)
      this.animations[i].prepare(this.canvas);
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

function resizeCanvas(canvas)
{
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;

   if(sudokuGame)
      sudokuGame.resize();
}

function getScreen()
{
   return document.getElementById("gameScreen");
}

//Initialization shared by both the grid and the pulsing squares
function initGridGeneral(canvas)
{
   //grid width is 1/10th the size of the window
   this.data.gridWidth = 10 * minUnit(canvas);
   this.data.startX = - this.data.gridWidth / 2.0;
   this.data.startY = this.data.startX;
}

//A function for animation to initialize a grid
function initGrid(canvas)
{
   initGridGeneral.bind(this)(canvas);

   if(typeof this.lineWidthAbsolute !== 'undefined')
      this.data.lineWidthReal = this.lineWidthAbsolute;
   else if(typeof this.lineWidth !== 'undefined')
      this.data.lineWidthReal = this.lineWidth * minUnit(canvas);
}

//A function for animation to draw a grid
function drawGrid(context)
{
   if(typeof this.color !== 'undefined')
      context.strokeStyle = this.color;
   if(typeof this.data.lineWidthReal !== 'undefined')
      context.lineWidth = this.data.lineWidthReal;

   var i;
   context.beginPath();

   for(i = this.data.startX; i <= context.canvas.width; i += this.data.gridWidth)
   {
      context.moveTo(i, 0);
      context.lineTo(i, context.canvas.height);
   }
   for(i = this.data.startY; i <= context.canvas.height; i += this.data.gridWidth)
   {
      context.moveTo(0, i);
      context.lineTo(context.canvas.width, i);
   }

   context.stroke();
}

function initSquares(canvas)
{
   initGridGeneral.bind(this)(canvas);
   this.data.randoms = [];
   this.data.squares = [];
   this.data.canvas = document.createElement("canvas");
   this.data.canvas.width = Math.floor(canvas.width / this.data.gridWidth + 2);
   this.data.canvas.height = Math.floor(canvas.height / this.data.gridWidth + 2);

   for(var i = 0; i < 1000; i++)
      this.data.randoms.push(Math.PI * 2 * Math.random());
}

function drawSquares(context)
{
   var n = 0, x = 0, y = 0, i, j, multiplier = Math.random(), multiplier2 = Math.random();
   var mini = this.data.canvas.getContext("2d");

   for(i = this.data.startY; i <= context.canvas.height; i += this.data.gridWidth)
   {
      x = 0;
      for(j = this.data.startX; j <= context.canvas.width; j += this.data.gridWidth)
      {
         //if this square is already marked for drawing, let's do it
         if(this.data.squares[n])
         {
            mini.globalAlpha = Math.sin(this.data.squares[n].angle);
            //context.globalAlpha = Math.sin(this.data.squares[n].angle);
            
            if(this.data.squares[n].color !== context.fillStyle)
               mini.fillStyle = this.data.squares[n].color;
               //context.fillStyle = this.data.squares[n].color;

            mini.fillRect(x, y, 1, 1);//j, i, this.data.gridWidth, this.data.gridWidth);
            //context.fillRect(j, i, this.data.gridWidth, this.data.gridWidth);
            this.data.squares[n].angle += this.data.squares[n].increase;

            //We're done with this square
            if(Math.sin(this.data.squares[n].angle) <= 0)
               this.data.squares[n] = false;
         }
         else
         {
            if(Math.random() <= 0.01)
            //this.data.randoms[Math.floor(n + 103 * multiplier2) % 1000] <= 0.1)
            {
               this.data.squares[n] = 
               {
                  angle: 0,
                  color: "#EEE",
                  increase: Math.PI / 64 * (0.2 + 0.8 * multiplier)
               };
            }
         }
         n++; x++;
      }
      y++;
   }
   context.globalAlpha = 1.0;
   context.imageSmoothingEnabled = false;
   context.drawImage(this.data.canvas, this.data.startX, this.data.startY, 
      x * this.data.gridWidth, y * this.data.gridWidth);
}

var sudokuGame;

//Onload and event type stuff can be anonymous since other functions shoule
//PROBABLY not be using this stuff and I don't want them to clash
(function(){
   function onLoad(e)
   {
      var canvas = getScreen();
      var fpsCounter = document.getElementById("fps");
      resizeCanvas(canvas);

      sudokuGame = new GameRunner(canvas);
      sudokuGame.start();
      /*animation = new Animation(function(ctx)
      {
         if(typeof this.data.x === 'undefined')
         {
            this.data.x = 0;
            this.data.y = 0;
         }
         ctx.strokeRect(this.data.x,this.data.y,150,100);
         this.data.x++; this.data.y++;
      },1);
      animation.frameStop = 600;*/
      animation = new Animation(drawGrid, 10);
      animation.start = initGrid;
      animation.color = '#DDD';
      animation.lineWidth = 0.35;
      sudokuGame.addAnimation(animation);

      animation = new Animation(drawSquares, 9);
      animation.start = initSquares;
      sudokuGame.addAnimation(animation);

      if(fpsCounter)
      {
         var lastCount = 0;
         setInterval(function()
         {
            fpsCounter.innerHTML = (sudokuGame.framesRun - lastCount) + " fps";
            lastCount = sudokuGame.framesRun;
         }, 1000);
      }
   }

   function onResize(e)
   {
      resizeCanvas(getScreen());
   }

   window.addEventListener("load", onLoad);
   window.addEventListener("resize", onResize);
})();
