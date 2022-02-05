//Carlos Sanchez - 2015
//randomouscrap98@aol.com

function getScreen()
{
   return document.getElementById("gameScreen");
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

      var setAnimate = function() { sudokuGame.animate = !getOption("lowperformance"); };
      setInterval(setAnimate, 1000);
      setAnimate();

      var introSequence = [];
      var introText = intros[Math.floor(Math.random()*intros.length)];
      var lowPerformance = getOption("lowperformance");

      introSequence.push(new Animation(function(context)
      {
         easyIntro.bind(this)(context, "Randomouscrap98 - 2015", lowPerformance); 
      }, 1000, 120));
      introSequence.push(new Animation(function(context)
      {
         easyIntro.bind(this)(context, introText, lowPerformance);
      }, 1000, 120));
      introSequence.push(new Animation(function(context)
      {
         easyIntro.bind(this)(context, "", lowPerformance);
      }, 1000, 20));

      introSequence[introSequence.length - 1].end = function()
      {
         sudokuGame.refresh();
         firstMenu();
      };
      sudokuGame.addAnimationChain(introSequence);

      //Only play intro if we haven't already for this session
      if(sessionStorage.getItem("playedIntro"))
      {
         for(i = 0; i < introSequence.length; i++)
            introSequence[i].stop();
      }
      else
      {
         sessionStorage.setItem("playedIntro", true);
      }

      var bgstyle = getOption("backgroundstyle");
      var bgGrid = new Animation(drawGrid, 15);
      bgGrid.begin = initGrid;
      bgGrid.color = gridColor;
      bgGrid.lineWidth = 0.35;

      if(bgstyle === "rainbow")
      {
         bgGrid.color = "white";
         sudokuGame.addAnimation(bgGrid);

         animation = new Animation(drawRainbow, 9);
         animation.begin = initRainbow;
         sudokuGame.addAnimation(animation);
      }
      else if(bgstyle === "flow")
      {
         animation = new Animation(drawFlow, 9);
         animation.begin = initFlow;
         sudokuGame.addAnimation(animation);
      }
      else //if(bgstyle === "default")
      {
         //Background grid
         sudokuGame.addAnimation(bgGrid);

         //Background pulsing squares
         animation = new Animation(drawSquares, 9);
         animation.begin = initSquares;
         sudokuGame.addAnimation(animation);
      }

      //The title itself
      animation = new Animation(drawTitle, 20);
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
      if(sudokuGame)
         sudokuGame.resize();
   }

   window.addEventListener("load", onLoad);
   window.addEventListener("resize", onResize);
})();

var themeColors = [ "#BCA9F5", "#81DAF5", "#F3E2A9", "#FAAC58", 
   "#FA5858", "#01DF74"];
var intros = [ "Gimme Sudoku plz!", "Have fun today!", "Not actually an ancient puzzle",
   "Use the X-Wing technique", "Find those naked doubles", "Go play a REAL game!",
   "Only puzzles from here...", "Is Sudoku still popular?", "It's just numbers, man",
   "Don't get discouraged!", "Low quality puzzles since 2015!", "Too much intro!",
   "Just get to game already!", "- Placeholder Text -", "Probably unfinished",
   "ku must be run as root", "Not enough intro", "Nobody reads these", 
   "Get ready for low framerates!", "Not programmed well", "Probably not from Japan",
   "There are Sudoku competitions?", "Math not required", "These puzzles are bad",
   "Sudokidoki", "Don't play too long", "Finish at least one puzzle",
   "The new Solitaire", "Top percentage puzzle", "No bad jokes, I swear!",
   "( ͡° ͜ʖ ͡°)", "New puzzles! Oh wait... no", "Mistakes were made ಠ_ಠ", 
   "Very puzzle. Much amazing", "Spoiler alert: Not actually fun",
   "Time well spent (• ε •)", "(╯°□°）╯︵ ┻━┻", "(ノಠ益ಠ)ノ彡┻━┻",
   "Better puzzles than Undertale!"];
