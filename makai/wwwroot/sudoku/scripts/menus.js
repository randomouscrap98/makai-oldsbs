//Menu is a list of button values and button callbacks.
function createMenu(menu, menuContainer)
{
   debuglog("Creating menu: " + JSON.stringify(menu));

   var buttonContainer = getOrDefault(menuContainer, document.getElementById("buttons"));

   //Oops, there was no button container. Get outta town
   if(!buttonContainer)
      return;

   //First, clear out the old buttons.
   buttonContainer.innerHTML = "";

   //Next, create each button and append it to the container
   for(var i = 0; i < menu.length; i++)
   {
      buttonContainer.appendChild(menu[i].asElement());
   }
}

function resetMenu(menuContainer)
{
   debuglog("Resetting menu");

   var buttonContainer = getOrDefault(menuContainer, document.getElementById("buttons"));

   //Oops, there was no button container. Get outta town
   if(!buttonContainer)
      return;

   buttonContainer.innerHTML = "";
}

function makeMainMenu()
{
   createMenu([
      new buttonObject("Play", makePlayMenu),
      new buttonObject("Options", makeOptionsMenu),
      new buttonObject("Leaderboards", notImplemented),
      new buttonObject("Statistics", notImplemented),
      new buttonObject(isFullscreen() ? "Window" : "Fullscreen", toggleFullscreen)
   ]);
}

function toggleFullscreen()
{
   if(isFullscreen())
      exitFullscreen();
   else
      launchIntoFullscreen(document.querySelector("cover-box"));

   makeMainMenu();
}

function makeOptionsMenu()
{
   var options = getAllOptions(); 
   var list = [];
   var i;

   for(var key in options)
   {
      var element = false;
      var text = document.createElement("option-name");
      text.innerHTML = options[key].title;

      if(typeof options[key].default === "boolean")
      {
         element = document.createElement("bool-option");
         var checkbox = document.createElement("input");
         checkbox.setAttribute("type", "checkbox");
         checkbox.setAttribute("name", key);
         checkbox.checked = options[key].value;
         element.appendChild(checkbox);
      }
      else if(typeof options[key].default === "string")
      {
         element = document.createElement("string-option");

         if(options[key].possibles.length > 0)
         {
            var selectBox = document.createElement("select");
            selectBox.setAttribute("name", key);
            for(i = 0; i < options[key].possibles.length; i++)
            {
               var option = document.createElement("option");
               option.value = options[key].possibles[i];
               option.innerHTML = options[key].possibles[i];
               selectBox.appendChild(option);
            }
            selectBox.value = options[key].value;
            element.appendChild(selectBox);
         }
      }

      if(element)
      {
         element.setAttribute("data-option", "");
         element.insertBefore(text, element.firstElementChild);
         list.push(element);
      }
   }

   createMenu([
      new listObject(list),
      new buttonObject("Save", saveOptions),
      new buttonObject("Back", makeMainMenu)
   ]);
}

function saveOptions(e)
{
   var i;
   var data = new FormData();
   var inputs = document.querySelectorAll("[data-option] input");
   var selects = document.querySelectorAll("[data-option] select");

   for(i = 0; i < inputs.length; i++)
   {
      var value = inputs[i].value;

      if(inputs[i].getAttribute("type") === "checkbox")
         value = inputs[i].checked;

      data.append(inputs[i].getAttribute("name"), JSON.stringify(value));
   }

   for(i = 0; i < selects.length; i++)
      data.append(selects[i].getAttribute("name"), JSON.stringify(selects[i].value));

   fullGenericXHR(rootURL + "settingsave", data, e.target, reloadSuccess);
}

function makePlayMenu()
{
   var dataElement = document.querySelector("[data-puzzlesets]");
   var list = [];
   var i, j;

   if(dataElement)
   {
      var sets = JSON.parse(dataElement.getAttribute("data-puzzlesets"));

      for(i = 0; i < sets.length; i++)
      {
         var link = document.createElement("a");
         link.addEventListener("click", makePuzzleMenu.callBind(sets[i].puzzleset));

         var puzzleSet = document.createElement("puzzle-set");
         puzzleSet.innerHTML = sets[i].puzzleset;
         var puzzleCount = document.createElement("puzzle-count");
         puzzleCount.innerHTML = sets[i].count + " puzzles";
         var setType = document.createElement("set-type");
         setType.innerHTML = (sets[i].public ? "Public" : "Private");

         link.appendChild(puzzleSet);
         link.appendChild(puzzleCount);
         link.appendChild(setType);

         list.push(link);
      }
   }

   createMenu([
      new listObject(list),
      new buttonObject("Back", makeMainMenu)
   ]);
}

function makePuzzleMenu(puzzleSet)
{
   var data = new FormData();
   data.append("puzzleset", puzzleSet);

   fullGenericXHR(rootURL + "sudokuquery", data, null, function(json, statusElement)
   {
      var puzzles = JSON.parse(json.result);
      var list = [];

      for(var i = 0; i < puzzles.length; i++)
      {
         var li = document.createElement("li");
         var link = document.createElement("a"); 

         li.setAttribute("data-pid", puzzles[i].pid);

         if(puzzles[i].paused)
         {
            li.setAttribute("data-paused", true);
            link.addEventListener("click", 
               ensureContinue.callBind(puzzles[i].pid, puzzles[i].number));
         }
         else if(puzzles[i].completed)
         {
            li.setAttribute("data-complete", true);
            link.addEventListener("click", 
               ensureComplete.callBind(puzzles[i].pid, puzzles[i].number));
         }
         else
         {
            link.addEventListener("click", 
               makePuzzleScreen.callBind(puzzles[i].pid, puzzles[i].number));
         }

         var number = document.createElement("puzzle-number");
         number.innerHTML = puzzles[i].number;

         link.appendChild(number);
         li.appendChild(link);

         list.push(li);
      }

      createMenu([
         new textObject(puzzleSet),
         new listObject(list, true),
         new buttonObject("Back", makePlayMenu)
      ]);
   });
}

function firstMenu()
{
   var uid = Number(document.body.getAttribute("data-uid"));

   //Selectively show login form or first menu depending on login status
   if(uid <= 0)
   {
      var loginArea = document.getElementsByTagName("login-area")[0];
      loginArea.style.zIndex = 2000;
   }
   else
   {
      makeMainMenu();
   }
}

function createDialog(text, buttons, autoHide)
{
   var dialog = document.getElementById("dialog");
   var shade = document.querySelector("shade-box");
   var textDialog = dialog.querySelector("text-area");
   var buttonContainer = dialog.querySelector("button-area");
   autoHide = getOrDefault(autoHide, true);
   buttons = getOrDefault(buttons, [ new buttonObject("OK", null) ]);

   var i;

   //Autohide appends the hidedialog function call to each button callback so
   //the dialog box is always hidden.
   if(autoHide)
   {
      for(i = 0; i < buttons.length; i++)
         buttons[i].callbacks.unshift(hideDialog); 
   }

   shade.style.zIndex = 101;
   dialog.style.zIndex = 102;
   textDialog.innerHTML = text;
   createMenu(buttons, buttonContainer); 
}

function hideDialog()
{
   var dialog = document.getElementById("dialog");
   var shade = document.querySelector("shade-box");
   dialog.style.zIndex = 1;
   shade.style.zIndex = 1;
}

function notImplemented()
{
   createDialog("This feature is not implemented yet!");
}

function ensureComplete(pid, number)
{
   createDialog("You've already completed this puzzle. Do you really want " +
      "to do it again?", [ 
         new buttonObject("Cancel", null),
         new buttonObject("Yes", makePuzzleScreen.callBind(pid, number))
       ]);
}

function ensureContinue(pid, number)
{
   var boundCreate = makePuzzleScreen.callBind(pid, number);
   createDialog("You were working on this puzzle. Continue where you left off?", 
   [ 
      new buttonObject("Start New", createDialog.callBind(
         "WOAH wait a second! If you start this puzzle over, your original " +
         "progress will be PERMANENTLY DELETED. Are you sure you want to start over?",
         [
            new buttonObject("Cancel", null),
            new buttonObject("Start Over", function()
            {
               var formData = new FormData();
               formData.append("delete", true);
               formData.append("pid", pid);
               fullGenericXHR(rootURL + "puzzlesave", formData, null, boundCreate);
            })
         ]
      )),
      new buttonObject("Cancel", null),
      new buttonObject("Continue", boundCreate)
   ]);
}

//Use these to construct buttons. They're nice dawg
function buttonObject(text, callback)
{
   this.text = text;
   this.callbacks = [ callback ];
}

buttonObject.prototype.asElement = function()
{
   var newButton = document.createElement("button");

   for(var i = 0; i < this.callbacks.length; i++)
      newButton.addEventListener("click", this.callbacks[i]);

   newButton.innerHTML = this.text;
   return newButton;
};

function textObject(text)
{
   this.text = text;
}

textObject.prototype.asElement = function()
{
   var textBlock = document.createElement("puzzle-set");
   textBlock.className = "likeDialog";
   textBlock.innerHTML = this.text;
   return textBlock;
};

//Use this to construct a list. The listItems should already be an array of
//elements which are preconstructed. They will become the list elements.
function listObject(listItems, compact)
{
   this.items = [];
   this.compact = getOrDefault(compact, false);

   for(var i = 0; i < listItems.length; i++)
   {
      if(listItems[i].constructor === Array)
         this.items.push(listItems[i]);
      else
         this.items.push([listItems[i]]);
   }
}

listObject.prototype.asElement = function()
{
   var i, j;
   var list = document.createElement("ul");

   if(this.compact)
      list.setAttribute("data-compact", true);

   //Append all LI elements to the list
   for(i = 0; i < this.items.length; i++)
   {
      var item; 

      //If the list item is simply an LI, we don't need to wrap it. Otherwise,
      //wrap it up.
      if(this.items[i].length === 1 && this.items[i][0].tagName === "LI")
      {
         item = this.items[i][0];
      }
      else
      {
         item = document.createElement("li");

         for(j = 0; j < this.items[i].length; j++)
            item.appendChild(this.items[i][j]);
      }

      list.appendChild(item);
   }

   return list;
};
