//Carlos Sanchez - 2015
//randomouscrap98@aol.com

//Global variables are evil right? Well whatever, I have a Master's degree and
//I don't care about that.
var gameMilliseconds = 0;
var lastUpdate = 0;
var lastSelect = 0;
var lastSelectCell = -1;
var lowPerformance;
var undoQueue = [];
var redoQueue = [];
var lastBoard = {};

//When making the puzzle screen, certain things have to be UNDONE, such as
//removing the game-box element.
function makePuzzleScreen(pid, number)
{
   var data = new FormData();
   data.append("pid", pid);
   lowPerformance = getOption("lowperformance");

   fullGenericXHR(rootURL + "sudokuquery", data, null, function(json, statusElement)
   {
      var puzzleData, i;

      try
      {
         puzzleData = JSON.parse(json.result);

         if(!json.result || !puzzleData || !puzzleData.pid)
            throw "Bad result";
      }
      catch(e)
      {
         createDialog("The puzzle couldn't be loaded!");
         return;
      }

      debuglog("Got puzzle data: " + json.result);
      sudokuGame.hideAnimationByFunction(drawTitle);
      resetMenu();

      var board = makeBoard();
      board.id = "sudokuBoard";
      board.setAttribute("data-pid", puzzleData.pid);
      board.setAttribute("data-puzzleset", puzzleData.puzzleset);

      //The bar under the puzzle which holds the junkdawg
      var infoContainer = document.createElement("puzzle-info");
      var infoLeft = document.createElement("info-left");
      var infoCenter = document.createElement("info-center");
      var infoRight = document.createElement("info-right");
      infoLeft.innerHTML = puzzleData.puzzleset;
      infoCenter.innerHTML = "Puzzle #" + number;
      infoRight.innerHTML = "--:--";
      infoRight.id = "puzzleTime";
      infoContainer.className = "likeButton";
      infoContainer.appendChild(infoLeft);
      infoContainer.appendChild(infoCenter);

      if(!lowPerformance) 
         infoContainer.appendChild(infoRight);

      infoContainer.addEventListener("click", createDialog.callBind(
         "Would you like to save and quit?", [ 
            new buttonObject("Cancel", hideDialog),
            new buttonObject("OK", quitGame)
         ]));

      //Now for all the buttons. Fun!
      var buttonContainer = document.createElement("puzzle-buttons");
      var functionButtons = document.createElement("function-buttons");
      var numPad = document.createElement("num-pad");
      var noteButton = document.createElement("button");
      var undoButton = document.createElement("button");
      var redoButton = document.createElement("button");

      noteButton.innerHTML = "Note";
      undoButton.innerHTML = "Undo";
      redoButton.innerHTML = "Redo";
      noteButton.id = "noteButton";
      undoButton.id = "undoButton";
      redoButton.id = "redoButton";
      undoButton.disabled = true;
      redoButton.disabled = true;
      noteButton.addEventListener("click", noteToggle);
      undoButton.addEventListener("click", undoMove);
      redoButton.addEventListener("click", redoMove);
      functionButtons.appendChild(noteButton);
      functionButtons.appendChild(undoButton);
      functionButtons.appendChild(redoButton);
      
      for(i = 0; i <= 9; i++)
      {
         var numButton = document.createElement("button");
         var numEvent = lowPerformance ? "mousedown" : "click";

         if(i === 9)
         {
            numButton.id = "numpad_0";
            numButton.innerHTML = "C";
            numButton.addEventListener(numEvent, numberPress.callBind(0));
         }
         else
         {
            numButton.id = "numpad_" + (i + 1);
            numButton.innerHTML = (i + 1);
            numButton.addEventListener(numEvent, numberPress.callBind(i + 1));
         }

         numPad.appendChild(numButton);
      }

      buttonContainer.appendChild(functionButtons);
      buttonContainer.appendChild(numPad);

      //Now add events for number presses!
      document.addEventListener("keydown", sudokuKeyDown, false);

      var gameContainer = document.createElement("game-box");
      var controlContainer = document.createElement("control-box");
      controlContainer.appendChild(infoContainer);
      controlContainer.appendChild(buttonContainer);
      gameContainer.appendChild(board);
      gameContainer.appendChild(controlContainer);

      document.querySelector("cover-box").appendChild(gameContainer);
      initializeBoard(board, puzzleData.puzzle);

      if(puzzleData.playersolution)
         fillBoard(board, JSON.parse(puzzleData.playersolution));

      if(puzzleData.seconds)
         gameMilliseconds = puzzleData.seconds * 1000;
      else
         gameMilliseconds = 0;

      undoQueue = [];
      redoQueue = [];

      lastUpdate = performance.now();
      quietExtras = true;
      lastBoard = getPuzzleData();

      if(!lowPerformance)
         setInterval(updateTime, 500);
   });
}

function quitGame(save)
{
   if(getOrDefault(save, true))
      savePuzzle();

   var gameContainer = document.querySelector("game-box");
   var puzzleSet = document.getElementById("sudokuBoard").getAttribute("data-puzzleset");
   gameContainer.parentNode.removeChild(gameContainer);
   sudokuGame.unhideAnimationByFunction(drawTitle);
   makePuzzleMenu(puzzleSet);   
   quietExtras = false;
}

function updateTime()
{
   var now = performance.now();
   gameMilliseconds += (now - lastUpdate);
   lastUpdate = now;

   var mps = 1000;
   var mpm = mps * 60;
   var mph = mpm * 60; 

   var hours = Math.floor(gameMilliseconds / mph);
   var minutes = Math.floor((gameMilliseconds % mph) / mpm);
   var seconds = Math.floor((gameMilliseconds % mpm) / mps);

   var timer = document.getElementById("puzzleTime");
   
   if(timer)
   {
      timer.innerHTML = (hours ? hours + ":" : "") + 
         padTime(minutes) + ":" + padTime(seconds);
   }
}

//Convert number key presses into board actions.
function sudokuKeyDown(e)
{
   var number = -1;
   var character = String.fromCharCode(e.keyCode).toLowerCase();

   if (e.keyCode >= 48 && e.keyCode <= 57)
      number = e.keyCode - 48; 
   else if(e.keyCode >= 96 && e.keyCode <= 105)
      number = e.keyCode - 96;

   if(number >= 0)
      clickButton("numpad_" + number);

   if(character === 'n')
      clickButton("noteButton");
}

//Click a button without errors.
function clickButton(id)
{
   var button = document.getElementById(id);

   if(button)
      button.click();
}

//A function which returns a fully constructed (but empty) sudoku board.
function makeBoard()
{
   var i, j, k, tempID;
   var board = makeTable();

   //The overall initial board. It will hold the 9 blocks.
   var blocks = board.querySelectorAll("td");

   //Swagizzle those blockizzles
   for(i = 0; i < 3; i++)
   {
      for(j = 0; j < 3; j++)
      {
         k = j + i * 3;

         //Each block needs a designation.
         //Each block also needs a TABLE, dawg.
         blocks[k].id = "block_" + j + "-" + i;
         blocks[k].setAttribute("data-block", j + "," + i);
         blocks[k].appendChild(makeTable());

         if(k % 2 === 0)
            blocks[k].className += " offcolor";
      }
   }

   var cells = board.querySelectorAll("td td");

   //Yo, now we gonna straight-up CELLIFY that shiz
   for(i = 0; i < 9; i++)
   {
      for(j = 0; j < 9; j++)
      {
         k = j + i * 9;
         var row = Math.floor(j / 3) + 3 * Math.floor(i / 3);
         var column = (j % 3) + 3 * (i % 3);

         cells[k].id = "cell_" + column + "-" + row;
         cells[k].setAttribute("data-cell", column + "," + row);
         cells[k].setAttribute("data-row", row);
         cells[k].setAttribute("data-column", column);
         cells[k].appendChild(document.createElement("cell-solution"));
         cells[k].appendChild(makeTable());
         cells[k].addEventListener("mousedown", selectCell.callBind(XYToCell(column, row)));
         cells[k].addEventListener("touchstart", selectCell.callBind(XYToCell(column, row), false));

         var notes = cells[k].querySelectorAll("td");
         for(var l = 0; l < notes.length; l++)
            notes[l].appendChild(document.createElement("cell-note"));
      }
   }

   return board;
}

//Create a simple 3 by 3 table (might be parameterized in future)
function makeTable()
{
   var table = document.createElement("table");

   for(var i = 0; i < 3; i++)
   {
      var tr = document.createElement("tr");

      for(var j = 0; j < 3; j++)
      {
         var td = document.createElement("td");
         tr.appendChild(td);
      }

      table.appendChild(tr);
   }

   return table;
}

//Fill an EMPTY table with the default puzzle values.
function initializeBoard(board, puzzleData)
{
   debuglog("Trying to initilize board with data: " + puzzleData);

   for(var i = 0; i < puzzleData.length; i++)
   {
      var num = Number(puzzleData.charAt(i));
      updateCell(i, num);

      if(num)
      {
         var cell = getCell(i);
         cell.setAttribute("data-permanent", true);
      }
   }
}

//Fill a board with the given puzzle data. Only works with USER puzzle data, do
//NOT call this with original puzzle data!
function fillBoard(board, data)
{
   debuglog("Trying to fill board with user data: " + JSON.stringify(data));

   var i, j, now = performance.now();
   var notesPerCell = Math.floor(data.notes.length / data.puzzle.length);

   debuglog("Notes per cell: " + notesPerCell);

   for(i = 0; i < data.puzzle.length; i++)
   {
      var solution = Number(data.puzzle.charAt(i));
      updateCell(i, 0);

      if(solution)
         updateCell(i, solution);

      for(j = 0; j < notesPerCell; j++)
      {
         var note = Number(data.notes.charAt(i * notesPerCell + j));

         if(note)
            updateCell(i, note, true);
      }
   }

   scanPuzzle();
   debuglog("Board fill took: " + (performance.now() - now) + "ms");
}

function XYToCell(x, y)
{
   return x + y * 9;
}

function cellToX(cell)
{
   return cell % 9;
}

function cellToY(cell)
{
   return Math.floor(cell / 9);
}

function cellToNum(cell)
{
   return XYToCell(Number(cell.getAttribute("data-column")),
      Number(cell.getAttribute("data-row")));
}

function cellToRow(cell)
{
   return cellToY(cell);
}

function cellToColumn(cell)
{
   return cellToX(cell);
}

function cellToBlock(cell)
{
   var x = cellToX(cell);
   var y = cellToY(cell);

   return Math.floor(x / 3) + "," + Math.floor(y / 3);
}

//Retrieve the <td> element for the given cell
function getCell(cellNum)
{
   var x = cellToX(cellNum);
   var y = cellToY(cellNum);

   var cell = document.getElementById("cell_" + x + "-" + y);

   if(!cell)
      debuglog("WARNING! BAD CELL REQUESTED: [" + x + "," + y + "]");

   return cell;
}

//Get the filled in or permanent cell value
function getCellValue(cellNum)
{
   var cell = getCell(cellNum);

   return Number(cell.querySelector("cell-solution").innerHTML);
}

//Pull values from a set of cell elements.
function getValues(elementSet)
{
   var values = [];

   for(var i = 0; i < elementSet.length; i++)
      values.push(elementSet[i].querySelector("cell-solution").innerHTML);

   return values;
}

//Get all row elements (cells)
function getRow(row)
{
   var rowCells = document.querySelectorAll("[data-row=\"" + row + "\"]");

   return rowCells;
}

//get all column elements (cells)
function getColumn(column)
{
   var columnCells = document.querySelectorAll("[data-column=\"" + column + "\"]");

   return columnCells;
}

//Get all cells from the block element
function getBlock(blockPoint)
{
   var blockCells = document.querySelectorAll("td[data-block=\"" + blockPoint + 
      "\"] td[data-cell]");

   return blockCells;
}

//Does the given cell have the given note? Find out next week!
function cellHasNote(cellNum, note)
{
   var cell = getCell(cellNum);
   var notes = cell.querySelectorAll("cell-note");

   for(var i = 0; i < notes.length; i++)
   {
      if(Number(notes[i].innerHTML) === Number(note))
         return true;
   }

   return false;
}

//Given a set of cells, remove the given note
function removeNotes(cells, note)
{
   for(var i = 0; i < cells.length; i++)
   {
      var notes = cells[i].querySelectorAll("cell-note");

      if(note > 0 && note <= notes.length)
         notes[note - 1].innerHTML = "";
   }
}

//Update a cell to reflect a new number, or perhaps a new note.
function updateCell(cell, number, note, save)
{
   var i;
   var start = performance.now();
   var td = getCell(cell); 
   note = getOrDefault(note, false);
   save = getOrDefault(save, false);

   if(!td)
   {
      debuglog("Can't set value on nonexistent cell!");
      return;
   }

   var cellSolution = td.querySelector("cell-solution"); 
   var noteCells = td.querySelectorAll("cell-note");
   var notes = td.querySelector("table");

   //Man, don't pull that garbage on us, foo! Given cells should never be
   //updated, and cells with solutions shouldn't have their notes updated
   if(td.hasAttribute("data-permanent") || 
      (Number(cellSolution.innerHTML) > 0 && note && Number(number) > 0))
   {
      //NOTE! That last check up there removes a "feature" where pressing Clear
      //while in note mode will only clear notes. However, this felt weird
      //during testing, so Clear will always clear the whole cell now. If the
      //feature is to be brought back, that check must be altered.
      return;
   } 

   //A number of 0 indicates a full clear. It doesn't matter 
   //if it's a note or not.
   if(Number(number) === 0)
   {
      cellSolution.innerHTML = "";

      for(i = 0; i < noteCells.length; i++)
         noteCells[i].innerHTML = "";
   }
   //Regular solution provided
   else if(!note)
   {
      cellSolution.innerHTML = number;
   }
   //User entered a valid note
   else if (number > 0 && number <= noteCells.length)
   {
      var noteCell = noteCells[number - 1];

      if(Number(noteCell.innerHTML))
         noteCell.innerHTML = "";
      else
         noteCell.innerHTML = number;
   }

   cellSolution.style.visibility = (note ? "hidden" : "visible");
   notes.style.visibility = (note ? "visible" : "hidden");

   //Now SAVE if the user wanted us to!
   if(save)
   {
      if(lowPerformance)
         setTimeout(cellUpdateSave.callBind(cell), 100);
      else
         cellUpdateSave(cell);
   }

   debuglog("UpdateCell took " + (performance.now() - start) + "ms");
}

//What needs to happen when a cell is updated and needs to save. Only useful as
//a function because of performance mode's toggled timeout
function cellUpdateSave(cell)
{
   var thisBoard = getPuzzleData();
   if(JSON.stringify(thisBoard) !== JSON.stringify(lastBoard))
   {
      undoQueue.push(lastBoard);
      undoQueue.slice(0, 100);
      redoQueue = [];
   }
   scanPuzzle(cell);
   savePuzzle(thisBoard);
   lastBoard = thisBoard;
}

//Set given cell as selected
function selectCell(cell, checkTime)
{
   checkTime = getOrDefault(checkTime, true);

   var i;
   var clickTime = performance.now() - lastSelect;
   var allCells = document.querySelectorAll("td[data-selected]");

   for(i = 0; i < allCells.length; i++)
      allCells[i].removeAttribute("data-selected");

   var selectedCell = getCell(cell);
   selectedCell.setAttribute("data-selected", "");

   //Double click note toggle feature.
   if(checkTime)
   {
      if(clickTime < 300 && cell === lastSelectCell && getOption("doubleclicknotes"))
         clickButton("noteButton");

      lastSelect = performance.now();
      lastSelectCell = cell;
   }
}

//Get the cell that is selected
function getSelectedCell()
{
   return document.querySelector("td[data-cell][data-selected]");
}

//Get whether or not the note button is toggled
function noteToggled()
{
   return document.getElementById("noteButton").hasAttribute("data-toggled");
}

//What happens when a number is pressed? PSSSH hell if I know.
function numberPress(number)
{
   debuglog("Numpad " + number);

   var cell = getSelectedCell();

   updateCell(cellToNum(cell), number, noteToggled(), true);
}

//Note button is pressed. Toggle note state.
function noteToggle(e)
{
   var button = e.target;

   if(button)
   {
      if(button.hasAttribute("data-toggled"))
         button.removeAttribute("data-toggled");
      else
         button.setAttribute("data-toggled", "");
   }
}

//Undo your last move (if possible)
function undoMove()
{
   debuglog("Undo");

   if(undoQueue.length === 0)
      return;

   var boardData = undoQueue.pop();
   redoQueue.push(getPuzzleData());
   fillBoard(document.getElementById("sudokuBoard"), boardData);
}

//Undo your last move (if possible)
function redoMove()
{
   debuglog("Redo");

   if(redoQueue.length === 0)
      return;

   var boardData = redoQueue.pop();
   undoQueue.push(getPuzzleData());
   fillBoard(document.getElementById("sudokuBoard"), boardData);
}

//Retrieve your current puzzle as a JSON object
function getPuzzleData()
{
   var now = performance.now();
   var puzzle = "";
   var notes = "";
   var i, j;

   //First, get the puzzle by retrieving all cells solutions
   var cellCount = document.querySelectorAll("#sudokuBoard td[data-cell] cell-solution").length;
   var noteCount = document.querySelectorAll("#sudokuBoard td[data-cell] cell-note").length;
   var notesPerCell = Math.floor(noteCount / cellCount);

   for(i = 0; i < cellCount; i++)
   {
      puzzle += String(getCellValue(i)); 

      for(j = 0; j < notesPerCell; j++)
         notes += String(cellHasNote(i, j + 1) ? (j + 1) : 0);
   }

   debuglog("Got puzzle data in " + (performance.now() - now) + "ms");
   return { "puzzle" : puzzle, "notes" : notes };
}

//Look over the puzzle and set up actions like disabling buttons when all
//numbers are found, etc.
function scanPuzzle(fromCell)
{
   fromCell = getOrDefault(fromCell, -1);

   var i, j;

   //First, get the puzzle by retrieving all cells solutions
   var cellCount = document.querySelectorAll("#sudokuBoard td[data-cell] cell-solution").length;
   var noteCount = document.querySelectorAll("#sudokuBoard td[data-cell] cell-note").length;
   var notesPerCell = Number(Math.floor(noteCount / cellCount));
   var counts = [];

   for(i = 0; i <= notesPerCell; i++)
      counts.push(0);

   //Gather information and fill cells with highlighting if necessary
   for(i = 0; i < cellCount; i++)
   {
      var num = getCellValue(i);
      var element = getCell(i);

      element.removeAttribute("data-error");
      element.removeAttribute("data-highlighted");

      if(num > 0)
         counts[num]++;
   }

   //This section is SPECIFIC to the 9x9 sudoku board! It scans all rows,
   //columns, and blocks.
   if(getOption("highlighterrors"))
   {
      var setErrors = function(cells, counts)
      {
         var values = getValues(cells);
         for(var j = 0; j < values.length; j++)
         {
            if(counts[values[j]] > 1 && values[j] > 0)
               cells[j].setAttribute("data-error", "");
         }
      };

      for(i = 0; i < notesPerCell; i++)
      {
         var rowCells = getRow(i);
         var columnCells = getColumn(i);
         var blockCells = getBlock((i % 3) + "," + Math.floor(i / 3));

         var rowCounts = countValues(getValues(rowCells));
         var columnCounts = countValues(getValues(columnCells));
         var blockCounts = countValues(getValues(blockCells));

         setErrors(rowCells, rowCounts);
         setErrors(columnCells, columnCounts);
         setErrors(blockCells, blockCounts);
      }
   }

   //If we're given a starting point, maybe we can do fancier stuff!
   if(fromCell >= 0)
   {
      var cellValue = getCellValue(fromCell);
      
      //Scan the column, row, and block for notes to remove.
      if(getOption("noteremove"))
      {
         removeNotes(getRow(cellToRow(fromCell)), cellValue);
         removeNotes(getColumn(cellToColumn(fromCell)), cellValue);
         removeNotes(getBlock(cellToBlock(fromCell)), cellValue);
      }
   }

   if(getOption("completed"))
   {
      var numButtons = document.querySelectorAll("num-pad button");

      for(i = 1; i < counts.length; i++)
      {
         numButtons[i - 1].disabled = (counts[i] === notesPerCell);
      }
   }

   document.getElementById("undoButton").disabled = undoQueue.length === 0;
   document.getElementById("redoButton").disabled = redoQueue.length === 0;
}

//Save an in-progress puzzle
function savePuzzle(saveCache)
{
   //ALWAYS call updateTime so that the time is correct!
   updateTime();

   var data = JSON.stringify(getOrDefault(saveCache, getPuzzleData()));
   var seconds = Math.floor(gameMilliseconds / 1000);
   var pid = document.getElementById("sudokuBoard").getAttribute("data-pid");

   var formData = new FormData();
   formData.append("data", data);
   formData.append("seconds", seconds);
   formData.append("pid", pid);

   fullGenericXHR(rootURL + "puzzlesave?small=1", formData, document.querySelector("puzzle-info"), 
      saveCompleted);
}

//What happens saving is completed
function saveCompleted(json)
{
   debuglog("Save result: " + json.result);

   if(json.result === "completed")
   {
      createDialog( "You've completed this puzzle!", 
         [ new buttonObject("Hooray!", quitGame.callBind(false)) ]);
   }
}

