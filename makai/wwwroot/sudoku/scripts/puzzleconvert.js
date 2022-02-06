(function(){
   window.addEventListener("load", onLoad);

   function onLoad(e)
   {
      var convertForm = document.getElementById("convert");
      var submitForm = document.getElementById("submit");

      if(convertForm)
         convertForm.addEventListener("submit", convertPuzzles);
      if(submitForm)
         submitForm.addEventListener("submit", submitPuzzles);
   }

})();

function convertPuzzles(e)
{
   var state = 0;
   var ostate = 0;
   var PSTATE = 1;
   var SSTATE = 2;

   var text = e.target.convertText.value;
   var outputBox = document.getElementById("submitText");
   var puzzles = [];
   var output = [];
   var puzzle = "";
   var solution = "";
   var i;

   var lines = text.match(/[^\r\n]+/g);

   e.preventDefault();

   //Prune the garbage lines.
   for(i = lines.length - 1; i >= 0; i--)
   {
      lines[i] = lines[i].trim();
      lines[i] = lines[i].replace(/[^0-9]/g,"0");

      if(lines[i].length !== 81)
         lines.splice(i, 1);
   }

   //Build up the puzzle output array
   for(i = 0; i < lines.length; i++)
   {
      ostate = state;

      //This is a solution
      if(lines[i].indexOf("0") < 0)
      {
         state = SSTATE;
         solution = lines[i];
      }
      else
      {
         state = PSTATE;
         puzzle = lines[i];
      }

      //Oops, we're not formatted correctly
      if(ostate === state)
      {
         outputBox.value = "It looks like these are all " + 
            (state === SSTATE ? "solutions" : "unsolved");
         return;
      }
      else if (state !== 0 && ostate !== 0)
      {
         output.push(new puzzleObject(puzzle, solution));
         state = 0;
      }
   }

   outputBox.value = JSON.stringify(output);
}

//Create a "new" one of these to hold a puzzle. IDK may have fancy stuff later
function puzzleObject(puzzle, solution)
{
   this.puzzle = puzzle;
   this.solution = solution;
}

function submitPuzzles(e)
{
   var data = new FormData(e.target);
   e.preventDefault();
   fullGenericXHR(rootURL + "puzzlesubmit", data, e.target.querySelector("button"), reloadSuccess);
}
