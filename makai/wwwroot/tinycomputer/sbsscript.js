(function(){
   window.addEventListener("load", onLoad);

   //Get a variable or the given default value if it doesn't exist.
   function getOrDefault(variable, defaultValue)
   {
      return typeof variable === 'undefined' ? getOrDefault(defaultValue, false) : variable;
   }

   function getQueryString(url)
   {
      var queryPart = url.match(/(\?[^#]*)/);
      
      if(!queryPart)
         return "";

      return queryPart[1];
   }

   //Taken from Tarik on StackOverflow:
   //http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
   function getQueryVariable(variable, url) 
   {
      var query = window.location.search;

      if(getOrDefault(url, false) !== false)
         query = getQueryString(url);

      var vars = query.substring(1).split('&');

      for (var i = 0; i < vars.length; i++) 
      {
         var pair = vars[i].split('=');

         if (decodeURIComponent(pair[0]) == variable) 
            return decodeURIComponent(pair[1]);
      }

      console.log('Query variable %s not found', variable);
   }

   function saveName()
   {
      return document.querySelector('#saveform input[type="text"]').value + "_tcf";
   }

   function basicName(actualName)
   {
      actualName = getOrDefault(actualName, saveName());

      if(/_tcf$/.test(actualName))
         return actualName.replace(/_tcf$/, "");
      else
         return "";
   }

   function saveLoadAjax(data, success)
   {
      $.ajax({
         type: "POST",
         url: "/query/submit/varstore",
         data: data,
         success: success,
         dataType: "json"
      });
   }

   function saveLoadCheck(json, successMessage)
   {
      if(json.result === false)
      {
         alert("An error occurred: " + json.errors[0]);
      }
      else
      {
         alert(successMessage);
      }
   }

   function onLoad(e)
   {
      try
      {
         var luser = getQueryVariable("username");
         var lprogram = getQueryVariable("program");

         if(luser && lprogram)
         {
            $.ajax({
               type: "GET",
               url: "/query/tinycomputerprograms?username=" + luser + "&program=" + lprogram,
               success: function(result)
               {
                  //This is a hack to stop the page from overwriting your storage.
                  hasStorage = false;
                  myCodeMirror.setValue(result);
                  setPublicLink(luser, lprogram);
               },
               dataType: "text"
            });
         }

         var submitForm = document.createElement("form");
         submitForm.id = "saveform";

         var nameInput = document.createElement("input");
         nameInput.setAttribute("type", "text");
         nameInput.setAttribute("placeholder", "Name");
         nameInput.setAttribute("required", "");
         nameInput.id = "nameInput";

         var saveInput = document.createElement("input");
         saveInput.setAttribute("type", "submit");
         saveInput.setAttribute("value", "Save");

         var loadInput = document.createElement("input");
         loadInput.setAttribute("type", "submit");
         loadInput.setAttribute("value", "Load");

         var listInput = document.createElement("input");
         listInput.setAttribute("type", "button");
         listInput.setAttribute("value", "List");

         var clarify = document.createElement("span");
         clarify.innerHTML = "Server storage (64KB per file)";

         saveInput.addEventListener("click", saveFile);
         loadInput.addEventListener("click", loadFile);
         listInput.addEventListener("click", listFiles);

         submitForm.addEventListener("submit", function(ev) { ev.preventDefault(); });

         submitForm.appendChild(nameInput);
         submitForm.appendChild(saveInput);
         submitForm.appendChild(loadInput);
         submitForm.appendChild(listInput);
         submitForm.appendChild(clarify);

         //$.ajax({
         //   type: "GET",
         //   url: "/query/request/chatauth",
         //   success: function(json)
         //   {
         //      if(!json.result)
         //      {
                  //var nameInput = document.querySelector('#saveform input[type="text"]');
                  //console.log("Nameinput", nameInput);

                  if(nameInput)
                  {
                     nameInput.setAttribute("placeholder", "Saving/loading is disabled");
                     nameInput.disabled = true;
                  }
         //      }
         //   },
         //   dataType: "json"
         //});
         
         document.getElementById("editorblock").appendChild(submitForm);
      }
      catch(ex)
      {
         console.log("Something went wrong during onLoad: " + ex);
      }
   }

   function setPublicLink(username, program)
   {
      try
      {
         var newSpan = document.querySelector("#saveform span");
         var newLink = document.createElement("a");

         newLink.innerHTML = document.location.protocol + "//" + document.location.hostname + 
            "/tc/" + username + "/" + program;
         newSpan.innerHTML = "";
         newSpan.appendChild(newLink);
         newLink.href = newLink.innerHTML;

         var form = document.getElementById("saveform");
         form.insertBefore(newSpan, form.querySelector("span"));
      }
      catch(ex)
      {
         console.log("Couldn't create public link: " + ex);
      }
   }

   function saveFile(e)
   {
      if(!basicName())
         return;

      //First, we're seeing if there's already a file on the server named
      //this. If so, we should alert the user.
      saveLoadAjax({ "list" : 1 }, function(json)
      {
         var shouldSave = true;
         var fileExists = false;

         if(json.result)
         {
            $.each(json.result, function(index, value) 
            {
               if(value.toLowerCase() === saveName().toLowerCase())
                  fileExists = true;
            });
         }
         if(fileExists)
         {
            shouldSave = window.confirm("WARNING: There is already a file named " + basicName() +
               ". Are you OK with overwriting this file?");
         }

         if(shouldSave)
         {
            saveLoadAjax({ "name" : saveName(), "value" : myCodeMirror.getValue() }, function(json2)
            {
               saveLoadCheck(json2, "Saved as " + basicName()); 
               setPublicLink(json.requester.username, basicName());
            });
         }
      });
   }

   function loadFile(e)
   {
      if(!basicName())
         return;

      if(window.confirm("You'll lose your current code if you load. " +
         "Are you OK with losing your current code and loading " +
         basicName() + "?"))
      {
         saveLoadAjax( { "name" : saveName() }, function(json) 
         { 
            saveLoadCheck(json, "Loaded " + basicName()); 
            if(json.result)
            {
               myCodeMirror.setValue(json.result);
               setPublicLink(json.requester.username, basicName());
            }
         });
      }
   }

   function listFiles(e)
   {
      saveLoadAjax({ "list" : 1 }, function(json) 
      { 
         var output = "";
         try
         {
            if(json.result)
            {
               for(var i = 0; i < json.result.length; i++)
               {
                  var temp = basicName(json.result[i]);

                  if(temp)
                     output += temp + "\n";
               }
            }
         }
         catch(ex)
         {
            console.log("Error while compiling file list: " + ex);
         }
         saveLoadCheck(json, "Your saved code files: \n\n" + output); 
      });
   }

})();
