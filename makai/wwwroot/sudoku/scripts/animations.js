//Carlos Sanchez - 2015
//randomouscrap98@aol.com


//Initialization shared by both the grid and the pulsing squares
function initGridGeneral(canvas)
{
   //grid width is 1/10th the size of the window
   this.data.gridWidth = 10 * maxUnit(canvas);
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
      this.data.lineWidthReal = this.lineWidth * maxUnit(canvas);
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
   this.data.squares = [];

   for(var i = 0; i < 1000; i++)
   {
      this.data.squares[i] = 
      {
         angle: 0,
         color: "",
         increase: 0
      };
   }
}

function drawSquares(context)
{
   var n = 0, i, j, multiplier = Math.random(), multiplier2 = Math.random();
   var localRandom = 0;

   for(i = this.data.startY; i <= context.canvas.height; i += this.data.gridWidth)
   {
      for(j = this.data.startX; j <= context.canvas.width; j += this.data.gridWidth)
      {
         //if this square is already marked for drawing, let's do it
         if(this.data.squares[n].increase > 0)
         {
            //context.globalAlpha = 0.5 * Math.pow(Math.sin(this.data.squares[n].angle), 1.25);
            context.globalAlpha = Math.pow(Math.sin(this.data.squares[n].angle), 2.0);
            
            if(this.data.squares[n].color !== context.fillStyle)
               context.fillStyle = this.data.squares[n].color;

            context.fillRect(j, i, this.data.gridWidth, this.data.gridWidth);
            this.data.squares[n].angle += this.data.squares[n].increase;

            //We're done with this square
            if(Math.sin(this.data.squares[n].angle) <= 0)
               this.data.squares[n].increase = 0;
         }
         else
         {
            localRandom = Math.random() * multiplier;
            if(localRandom <= 0.00075)
            {
               this.data.squares[n].angle = 0; 
               if(localRandom > 0.000075)
                  this.data.squares[n].color = "#FFF"; //"#F0F0F0"; 
               else if(localRandom >= 0.00006)
                  this.data.squares[n].color = "#F3E0FF"; //"#CEF6F5"; 
               else if(localRandom >= 0.000045)
                  this.data.squares[n].color = "#ECF9FF"; //"#CEF6F5"; 
               else if(localRandom >= 0.00003)
                  this.data.squares[n].color = "#CCFFDD";//"#A9F5BC"; 
               else if (localRandom >= 0.000015)
                  this.data.squares[n].color = "#FEF2E0";
               else 
                  this.data.squares[n].color = "#FFEAEB";//"#F6CECE"; 
               this.data.squares[n].increase = Math.PI / 80 * (0.15 + 0.85 * multiplier2);
            }
         }
         n++;
      }
   }
   context.globalAlpha = 1.0;
}

function initRainbow(canvas)
{
   var bse = 175;
   initGridGeneral.bind(this)(canvas);
   this.data.squares = [];
   this.data.reds =   [ 256, 256, bse, bse, bse, 256 ];
   this.data.greens = [ bse, 256, 256, 256, bse, bse ];
   this.data.blues =  [ bse, bse, bse, 256, 256, 256 ];
   /*this.data.reds =   [ 250, 250, 243,   1, 129, 188 ];
   this.data.greens = [  88, 172, 226, 223, 218, 169 ];
   this.data.blues =  [  88,  88, 169, 116, 245, 245 ];*/
   this.data.offset = 0;

   for(var i = 0; i < 1000; i++)
   {
      this.data.squares[i] = 
      {
         offset: (i / 15)
      };
   }
}

function drawRainbow(context)
{
   var n = 0, i, j, red, green, blue, offset, offsetPart, lowCol, highCol;

   this.data.offset += 0.005;
   context.globalAlpha = 1.0;

   for(i = this.data.startY; i <= context.canvas.height; i += this.data.gridWidth)
   {
      for(j = this.data.startX; j <= context.canvas.width; j += this.data.gridWidth)
      {
         offset = this.data.offset + this.data.squares[n].offset;
         offsetPart = offset % 1;
         lowCol = Math.floor(offset) % this.data.reds.length;
         highCol = Math.ceil(offset) % this.data.reds.length;
         red = Math.floor(cosineInterpolate(this.data.reds[lowCol],
            this.data.reds[highCol], offsetPart));
         green = Math.floor(cosineInterpolate(this.data.greens[lowCol],
            this.data.greens[highCol], offsetPart));
         blue = Math.floor(cosineInterpolate(this.data.blues[lowCol],
            this.data.blues[highCol], offsetPart));
         context.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
         context.fillRect(j, i, this.data.gridWidth, this.data.gridWidth);
         n++;
      }
   }
}

function initCodeChallenge(canvas)
{
   var i = 0, j = 0;
   this.data.points = [];
   this.data.numPoints = 115;
   this.data.boxValues = 12;
   this.data.colors = [ "#222", "#333", "#444", "#555", "#666", 
      "#777", "#888", "#999", "#AAA", "#BBB", "#CCC", "#DDD" ];

   for(i = 0; i < this.data.numPoints; i++)
   {
      this.data.points.push([]);

      for(j = 0; j < this.data.boxValues; j++)
         this.data.points[i].push(intRandom(100));

      this.data.points[i][this.data.boxValues] = 0;

      for(j = 0; j < this.data.boxValues; j++)
         this.data.points[i][this.data.boxValues] += this.data.points[i][j];
   }

}

function drawCodeChallenge(context)
{
   var i = 0, j = 0, d = 0, h = 0;
   var boxWidth =  context.canvas.width / this.data.numPoints;

   for(i = 0; i < this.data.boxValues; i++)
   {

      for(j = 0; j < this.data.numPoints; j++)
      {
         d = intRandom(2, -1);
         this.data.points[j][i] += d;
         this.data.points[j][this.data.boxValues] += d;
      }
   }

   for(i = 0; i < this.data.numPoints; i++)
   {
      d = 0;
      h = context.canvas.height / this.data.points[i][this.data.boxValues];

      for(j = 0; j < this.data.boxValues; j++)
      {
         context.fillStyle = this.data.colors[j];
         context.fillRect(i * boxWidth, d * h, 
            boxWidth, this.data.points[i][j] * h);

         d += this.data.points[i][j];
      }
   }
}

function initFlow(canvas)
{
   this.data.engine = new My3DEngine();
   this.data.engine.initRandomPoints(500);
   this.data.zoomTheta = 0;

   for(var i = 0; i < this.data.engine.points.length; i++)
      this.data.engine.points[i].color = themeColors[intRandom(themeColors.length)];
}

function drawFlow(context)
{
   var n = 0; 

   this.data.engine.yTheta += Math.PI / 1600;
   this.data.engine.xTheta += Math.PI / 2900;
   this.data.engine.zTheta += Math.PI / 2000;
   this.data.zoomTheta += Math.PI / 800;
   this.data.engine.zoom = 11 + 4 * Math.sin(this.data.zoomTheta);

   //The two big calc heavies.
   this.data.engine.updateRotation();
   this.data.engine.convertPoints(context.canvas);

   //Now draw everything
   for(n = 0; n < this.data.engine.realPoints.length; n++)
   {
      context.globalAlpha = this.data.engine.realPoints[n].zScale;
      context.fillStyle = this.data.engine.outPoints[n].color;
      context.fillRect(this.data.engine.realPoints[n].x, 
         this.data.engine.realPoints[n].y, this.data.engine.realPoints[n].size,
         this.data.engine.realPoints[n].size);
   }
   
   context.globalAlpha = 1.0;
}

//A basic 3D grid
function init3DGrid(canvas)
{
   this.data.engine = new My3DEngine();
   this.data.engine.initEvenPoints(10);
   this.data.zoomTheta = 0;
   this.data.engine.pointSize = 0.24;

   for(var i = 0; i < this.data.engine.points.length; i++)
      this.data.engine.points[i].color = themeColors[intRandom(themeColors.length)];
}

function draw3DGrid(context, fog)
{
   var n = 0; 
   fog = getOrDefault(fog, true);

   this.data.engine.yTheta += Math.PI / 1600 * 4;
   this.data.engine.xTheta += Math.PI / 2900 * 4;
   this.data.engine.zTheta += Math.PI / 2000 * 4;
   this.data.zoomTheta += Math.PI / 800 * 4;
   this.data.engine.zoom = 55 + 36 * Math.sin(this.data.zoomTheta);

   //The two big calc heavies.
   this.data.engine.updateRotation();
   this.data.engine.convertPoints(context.canvas);

   //Now draw everything
   for(n = 0; n < this.data.engine.realPoints.length; n++)
   {
      if(fog)
         context.globalAlpha = this.data.engine.realPoints[n].zScale;

      context.fillStyle = this.data.engine.outPoints[n].color;
      context.fillRect(this.data.engine.realPoints[n].x, 
         this.data.engine.realPoints[n].y, this.data.engine.realPoints[n].size,
         this.data.engine.realPoints[n].size);
   }
   
   context.globalAlpha = 1.0;
}

function draw3DGridNoFog(context)
{
   draw3DGrid.bind(this)(context, false);
}

function easyIntro(context, text, fadeOut)
{
   fadeOut = getOrDefault(fadeOut, false);

   context.fillStyle = "black";
   context.fillRect(0, 0, context.canvas.width, context.canvas.height);

   context.font = "5vw Montserrat";
   context.fillStyle = "#F2F2F2";
   context.textAlign = "center";
   context.globalAlpha = Math.pow(Math.sin(Math.PI * this.framesRun / this.frameStop), 0.5);

   if(fadeOut)
      context.globalAlpha = 1 - context.globalAlpha;

   context.fillText(text, context.canvas.width / 2, context.canvas.height / 2);
   
   context.globalAlpha = 1.0;
}

function drawTitle(context)
{
   var textSize = 10;
   var margin = minUnit(context.canvas);
   var topMargin = context.canvas.height / 20;
   var boxSize = textSize * minUnit(context.canvas);
   var text = "SUDOKU";

   var titleWidth = text.length * (boxSize + margin) - margin;
   var begin = (context.canvas.width - titleWidth) / 2;
   context.fillStyle = gridColor;
   context.fillRect(begin - margin, topMargin - margin, 
      titleWidth + margin * 2, boxSize + margin * 2);

   for(var i = 0; i < text.length; i++)
   {
      context.fillStyle = themeColors[ i % themeColors.length ];
      context.fillRect(begin + i * (boxSize + margin), topMargin, boxSize, boxSize);
      context.font = boxSize + "px Montserrat";
      context.fillStyle = "#FEFEFE";
      context.textAlign = "center";
      context.fillText(text.charAt(i), begin + i * (boxSize + margin) +
         boxSize / 2, topMargin + boxSize * 0.84);
   }
}

var gridColor = "#DDD";

var themeColors = [ "#BCA9F5", "#81DAF5", "#F3E2A9", "#FAAC58", 
   "#FA5858", "#01DF74"];

