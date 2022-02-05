//Carlos Sanchez - 2015
//randomouscrap98@aol.com

function getScreen()
{
   return document.getElementById("gameScreen");
}

var sudokuGame;
var animations;
var currentAnimation = 0;

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

      animations = [];
      animations.push(new Animation(drawCodeChallenge, 9, 0, initCodeChallenge));
      animations.push(new Animation(drawFlow, 9, 0, initFlow));
      animations.push(new Animation(draw3DGrid, 9, 0, init3DGrid));
      animations.push(new Animation(draw3DGridNoFog, 9, 0, init3DGrid));

      sudokuGame.addAnimation(animations[0]);

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

   function changeAnimation(animation)
   {
      animation = Number(animation);

      if(animation < 0)
         animation = animations.length - 1;
      else if (animation > animations.length - 1)
         animation = 0;

      if(animation != currentAnimation)
      {
         debuglog("Changing animation!");
         sudokuGame.removeAnimationByFunction(animations[currentAnimation].main);
         sudokuGame.addAnimation(animations[animation]);
         currentAnimation = animation;
      }
   }

   window.addEventListener("load", onLoad);
   window.addEventListener("resize", onResize);
   document.addEventListener("keydown", function(e)
   {
      debuglog("bgtest keydown");

      if(e.keyCode === MyKeyCodes.Left)
         changeAnimation(currentAnimation - 1);
      else if(e.keyCode === MyKeyCodes.Right)
         changeAnimation(currentAnimation + 1);
   });
   document.addEventListener("touchend", function(e)
   {
      changeAnimation(currentAnimation + 1);
   });
})();

