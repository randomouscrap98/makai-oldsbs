//Carlos Sanchez - 2015
//randomouscrap98@aol.com
//*Extra functions that can help any page.

var quietExtras = !getOrDefault(getQueryVariable("debug"), false);

function now()
{
   if(window.performance)
      return window.performance.now();

   return new Date().getTime();
}

function quietlog(message)
{
   if(!quietExtras)
      console.log(message);
}

function normalize(min, max, mu)
{
   return (mu - min) / (max - min); 
}

function cosineInterpolate(y1, y2, mu)
{
   var mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
   return (y1* (1 - mu2) + y2 * mu2);
}

function swap(i1, i2, list)
{
   if(!list.hasOwnProperty(i1) || !list.hasOwnProperty(i2))
      return false;

   var temp = list[i1];
   list[i1] = list[i2];
   list[i2] = temp;

   return true;
}

function hasSpecial(specialField)
{
   //Assume the FIRST data-special in the document is the one we want.
   var specialElement = document.querySelector("[data-special]");

   if(specialElement && specialElement.dataset.special)
      return specialElement.dataset.special.split(/[\s,]+/).indexOf(specialField) >= 0;
   else
      return false;
}

function intRandom(max, min)
{
   min = getOrDefault(min, 0);

   if(min > max)
   {
      var temp = min;
      min = max;
      max = temp;
   }

   return Math.floor((Math.random() * (max - min)) + min);
}

function reanchor()
{
   var old = window.location;

   if(window.location.hash)
   {
      window.location.hash = window.location.hash;
      history.replaceState(null,null,old);
   }
   //window.location = (""+window.location).replace(/#[A-Za-z0-9_]*$/,'')+"#myAnchor";
   //window.location = window.location;
}

function replaceNode(original, newNode)
{
   insertAfter(original.parentNode, newNode, original);
   original.parentNode.removeChild(original);
}

function isSupportedBrowser()
{
   return typeof InstallTrigger !== 'undefined' || (!!window.chrome && !!window.chrome.webstore);
   //return /Edge\/\d./i.test(navigator.userAgent);
}

function isPropertySupported(property)
{
   return property in document.documentElement.style;
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

   quietlog('Query variable ' + variable + ' not found');
}

function b64EncodeUnicode(str) 
{
   return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function(match, p1) {
         return String.fromCharCode('0x' + p1);
      }));
}

//Returns a function that calls the associated function with any extra
//given arguments. It fixes loop closure issues. Altered from 
//www.cosmocode.de/en/blog/gohr/2009-10/15-javascript-fixing-the-closure-scope-in-loops
//Example: You want x.addEventListener("click", myfunc(i)) in a loop.
//Do this: x.addEventListener("click", myfunc.callBind(i))
Function.prototype.callBind = function()
{
   var fnc = this;
   var args = arguments;
   return function() 
   {
      return fnc.apply(this, args);
   };
};

//get the index of a regex.
String.prototype.regexIndexOf = function(regex, startpos) 
{
   var indexOf = this.substring(startpos || 0).search(regex);
   return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

//Adapted from:
//http://osric.com/chris/accidental-developer/2009/08/javascript-insertafter/
/*Object.prototype.insertAfter = function (newNode, afterElement) 
{
   if(this.lastChild === afterElement)
      this.appendChild(newNode);
   else
      this.insertBefore(newNode, afterElement.nextSibling);
}; */
insertAfter = function (parentNode, newNode, afterElement) 
{
   if(parentNode.lastChild === afterElement)
      parentNode.appendChild(newNode);
   else
      parentNode.insertBefore(newNode, afterElement.nextSibling);
}; 

//Taken from
//http://stackoverflow.com/questions/4770457/insert-text-before-and-after-the-selected-text-in-javascript
//Fiddle: http://jsfiddle.net/timdown/UWExN/64/
/*function insertHtmlAtSelectionEnd(html, isBefore) 
{
   quietlog("Trying to insert into selected text: " + html);

   var sel, range, node, lastNode;
   if (window.getSelection) 
   {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) 
      {
         range = window.getSelection().getRangeAt(0);
         range.collapse(isBefore);

         var el = document.createElement("div");
         el.innerHTML = html;
         var frag = document.createDocumentFragment();

         while ((node = el.firstChild))
            lastNode = frag.appendChild(node);

         range.insertNode(frag);
         quietlog("Did insert text");
      }
   }
   else if (document.selection && document.selection.createRange)
   {
      range = document.selection.createRange();
      range.collapse(isBefore);
      range.pasteHTML(html);
   }
}*/

//This ONLY works for an array of numerical values!
function countValues(values)
{
   var i;
   var counts = [];

   for(i = 0; i < values.length; i++)
   {
      if(typeof counts[values[i]] === 'undefined')
         counts[values[i]] = 1;
      else
         counts[values[i]]++;
   }

   return counts;
}

function launchIntoFullscreen(element) 
{
   if(element.requestFullscreen)
      element.requestFullscreen();
   else if(element.mozRequestFullScreen)
      element.mozRequestFullScreen();
   else if(element.webkitRequestFullscreen)
      element.webkitRequestFullscreen();
   else if(element.msRequestFullscreen)
      element.msRequestFullscreen();
}

function exitFullscreen() 
{
   if(document.exitFullscreen)
      document.exitFullscreen();
   else if(document.mozCancelFullScreen)
      document.mozCancelFullScreen();
   else if(document.webkitExitFullscreen)
      document.webkitExitFullscreen();
}

function isFullscreen()
{
   if(document.fullscreenElement || document.mozFullScreenElement ||
      document.webkitFullscreenElement)
      return true;

   return false;
   /*return document.fullscreenEnabled || 
      document.mozFullScreenEnabled || document.webkitFullscreenEnabled;*/
}

function appendSiteStatus(newStatus)
{
   var siteStatus = document.getElementsByTagName("site-status")[0];

   if(!siteStatus)
   {
      siteStatus = document.createElement("site-status");
      var main = document.getElementsByTagName("main")[0];

      if(main.firstChild)
         main.insertBefore(siteStatus, main.firstChild);
      else
         main.appendChild(siteStatus);
   }

   if(siteStatus.innerHTML)
      siteStatus.innerHTML += "<br>" + newStatus;
   else
      siteStatus.innerHTML = newStatus;
}

function escapeRegExp(string)
{
   return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//Uhhhhh idk
function isNullOrWhitespace(string)
{
   return string === null || string.match(/^\s*$/) !== null;
}

//Clear out the given stylesheet so there's nothing. NOTHING!
function clearStyle(theStyle)
{
   theStyle.innerHTML = "";
   theStyle.appendChild(document.createTextNode("")); // WebKit hack :(
}

//Something I found online in case insertrule or addrule isn't available
function addCSSRule(sheet, selector, rules, index) 
{
   if("insertRule" in sheet) 
      sheet.insertRule(selector + "{" + rules + "}", index);
   else if("addRule" in sheet) 
      sheet.addRule(selector, rules, index);
}

//Loads the given JS into the DOM.
function loadJS(url)
{
   var script = document.createElement("script");
   script.type = "text/javascript";
   script.src = url;
   document.body.appendChild(script);
}

//Pads time with 0 so it's not stupid
function padTime(value)
{
   return ("00" + value).slice(-2);
}

//Get a variable or the given default value if it doesn't exist.
function getOrDefault(variable, defaultValue)
{
   return typeof variable === 'undefined' ? getOrDefault(defaultValue, false) : variable;
}

inputStatus = {
   NONE : 1,
   ERROR : 2,
   RUNNING : 3,
   SUCCESS : 4,
};

//A generic function that should be called whenever the status should be set.
function setInputStatus(element, theStatus, message)
{
   //Oops, this shouldn't happen
   if(!(element && element.nodeType))
      return false;

   //Defaultio made me do this!
   if(theStatus === inputStatus.RUNNING)
      element.disabled = true;
   else
      element.disabled = false;

   message = getOrDefault(message, "");

   element.setAttribute("title", message);

   //Set some garbage based on the status of the input
   if(theStatus === inputStatus.ERROR)
   {
     element.setAttribute("data-status", "ERROR"); 
     //element.innerHTML = "ERR";
   }
   else if (theStatus === inputStatus.RUNNING)
   {
      element.setAttribute("data-status", "RUNNING");
      //element.innerHTML = "RUN";
   }
   else if (theStatus === inputStatus.SUCCESS)
   {
      element.setAttribute("data-status", "SUCCESS");
      //element.innerHTML = "OK!";
   }
   else
   {
      element.setAttribute("data-status", "");
      //element.innerHTML = "";
   }

   return true;
}

//This literally does everything for you.
function fullGenericXHR(page, formData, statusElement, successCallback, forcefull)
{
   setInputStatus(statusElement, inputStatus.RUNNING, "Submitting...");
   genericXHR(page, formData, statusElement, successCallback, forcefull);
}

function genericXHRSimple(page, callback)
{
   var xhr = new XMLHttpRequest();
   xhr.open("POST", page);

   //Use generic completion function with given success callback
   xhr.addEventListener("load", function(event) 
   {
      try
      {
         callback(event.target.response);
         //eval(event.target.response);
      }
      catch(e)
      {
         console.log("Oops, XHR callback didn't work. Dumping exception");
         console.log(e);
      }
   });
   xhr.send();
}

//OK, let's be real. Almost ALL the XHR requests look like this. The only
//difference is what we do on success really. This function will handle nearly
//ALL the dynamic request stuff for you; just supply the formdata and whatever.
function genericXHR(page, formData, statusElement, successCallback, forcefull, errorHandler)
{
   quietlog("Entered genericXHR for request: " + page);

   forcefull = getOrDefault(forcefull, false);

   //Oh, no XML stuff? OK, we'll use an iframe
   if(!canXHR())
   {
      alert("Your browser doesn't seem to support our submission process.");
      console.log("Browser doesn't support XHR?");
      return false;
      /*var iframe = document.createElement("iframe");
      iframe.src = page;*/
   }
   else
   {
      //First, update page to be small IF we're not doing debug
      if(!getQueryVariable("debug") && !forcefull)
      {
         //If we have a query string, append & instead of ?
         if(page.indexOf("?") >= 0)
            page += "&small=1";
         else
            page += "?small=1";
      }
      //if(page.indexOf("?") >=0)
      //page += "&session=" + document.cookie

      var xhr = new XMLHttpRequest();
      xhr.open("POST", page);

      quietlog("Initialized and opened the XHR");

      //Use generic completion function with given success callback
      xhr.addEventListener("load", function(event) 
      {
         genericComplete(event, statusElement, successCallback, errorHandler);
      });

      if(formData)
      {
         //TODO: THIS MAY BE EXTREMELY UNSAFE! IDK??!?!??!
         if(!formData.get("psession"))
            formData.append("psession", StorageUtilities.GetPHPSession());
         xhr.send(formData);
      }
      else
      {
         xhr.send();
      }

      quietlog("XHR send success?");
   }
}

//Almost all query completion code will look like this, so use this 
//generic callback where possible. It takes more parameters than the 
//normal "load" callback, so you have to wrap it 
function genericComplete(event, statusElement, successCallback, errorHandler)
{
   quietlog("XHR got a response!");

   var json;

   //If user didn't give us a successCallback, use the generic one
   successCallback = getOrDefault(successCallback, genericSuccess);

   try
   {
      json = JSON.parse(event.target.response);
   }
   catch(e)
   {
      setInputStatus(statusElement, inputStatus.ERROR, 
         "Internal error: Couldn't parse JSON! Response dumped to console");
      console.log("Couldn't parse JSON! Exception: " + e + ".Dumping response:");
      console.log(event.target.response);
      return;
   }

   if (json.result !== false) 
   {
      //quietlog("Dumping whole response: " + event.target.response);
      //success
      if(successCallback)
         successCallback(json, statusElement);

      quietlog("XHR finished successfully!");
   } 
   else 
   {
      if(json.errors)
      {
         //Just display first error (probably most important)
         setInputStatus(statusElement, inputStatus.ERROR, json.errors.join("\n"));
         console.log(json);

         //This should change in the future!
         json.errors.forEach(function(v, i, a) 
         {
            if(errorHandler)
               errorHandler(v);
            else if(i === 0)
               alert(v);

            console.log(v);
         });
      }
      else
      {
         console.log("No errors found in the returned JSON, but the result was false!");
      }
   }

   if(json.warnings)
   {
      json.warnings.forEach(function(v, i, a) { console.log("Warning: " + v); });
   }
}

//The generic action for a successful submit
function genericSuccess(json, statusElement)
{
   setInputStatus(statusElement, inputStatus.SUCCESS, "Complete!"); 
}

//Success that reloads a page
function reloadSuccess(json, statusElement)
{
   location.reload();
}

//Success that redirects to the result of the json
function redirectSuccess(json, statusElement)
{
   var newQuery = getQueryString(json.result);

   if(json.result.indexOf(window.location.pathname + 
      window.location.search) === 0 && newQuery ===
      window.location.search)
   {
      quietlog("page is the same, so reloading");
      location.reload();
   }
   else
   {
      quietlog("redirecting to: " + json.result);
      window.location.href = json.result;
   }
}

//----------------------------------------------------------------
//These functions suck.... I'll probably remove them at some point
//----------------------------------------------------------------

//Taken from stack overflow:
//http://stackoverflow.com/questions/4229043/load-page-content-to-variable
function loadXMLDoc(theURL, callback, post)
{
   post = typeof post !== 'undefined' ? post : false;
   var xmlhttp;

   if (window.XMLHttpRequest)
   {// code for IE7+, Firefox, Chrome, Opera, Safari, SeaMonkey
      xmlhttp=new XMLHttpRequest();
   }
   else
   {// code for IE6, IE5
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
   }
   xmlhttp.onreadystatechange=function()
   {
      if (xmlhttp.readyState==4 && xmlhttp.status==200)
      {
         callback(xmlhttp.responseText);
      }
   };

   if(post)
   {
      //First, make sure the URL is even post worthy. If it's not,
      //simply call our function again as get.
      var parts = theURL.split("?");
      if (parts.length != 2)
         return loadXMLDoc(theURL, callback);

      var params = parts[1];
      xmlhttp.open("POST", parts[0], true);

      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      xmlhttp.send(params);
   }
   else
   {
      xmlhttp.open("GET", theURL, true);
      xmlhttp.send();
   }
}

//Taken from stackoverflow: 
//http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function post(path, params, method) 
{
   method = method || "post"; // Set method to post by default if not specified.

   // The rest of this code assumes you are not using a library.
   // It can be made less wordy if you use one.
   var form = document.createElement("form");
   form.setAttribute("method", method);
   form.setAttribute("action", path);

   for(var key in params) 
   {
      if(params.hasOwnProperty(key)) 
      {
         var hiddenField = document.createElement("input");
         hiddenField.setAttribute("type", "hidden");
         hiddenField.setAttribute("name", key);
         hiddenField.setAttribute("value", params[key]);

         form.appendChild(hiddenField);
      }
   }

   document.body.appendChild(form);
   form.submit();
}

/*function writeStorage(name, value)
{
   localStorage.setItem(name, JSON.stringify(value));
}

function readStorage(name)
{
   try
   {
      return JSON.parse(localStorage.getItem(name));
   }
   catch(error)
   {
      console.log("Failed to retrieve " + name + " from local storage");
      return false;
   }
}*/

function writePersistent(name, value, callback)
{
   var data = new FormData();
   data.append("name", name);
   data.append("value", JSON.stringify(value));
   genericXHR("/query/submit/varstore?session=" + StorageUtilities.GetPHPSession(), 
      data, null, function(json, element)
      {
         genericSuccess(json, element); 
         if(callback) callback(name);
      });
}

function readPersistent(name, onComplete)
{
   var data = new FormData();
   data.append("name", name);
   RequestUtilities.XHRSimple("/query/submit/varstore?session=" + StorageUtilities.GetPHPSession(),
      function(response)
      {
         var json = JSON.parse(response);
         try
         {
            var result = json.result;
            if(!result)
            {
               console.log("Variable " + name + " does not exist!");
               onComplete(undefined);
            }
            else
            {
               onComplete(JSON.parse(result));
            }
         }
         catch(error)
         {
            console.log("Couldn't parse variable from varstore: " + json.result);
            console.log(error);
         }
      }, data);
   /*genericXHR("/query/submit/varstore?session=" + StorageUtilities.GetPHPSession(), 
      data, null, function(json, status)
      {
         try
         {
            onComplete(JSON.parse(json.result));
         }
         catch(error)
         {
            console.log("Couldn't parse variable from varstore: " + json.result);
         }
      });*/
}

function setUIScale(settingKey)
{
   var htmlElement = document.documentElement;
   var UIPercent = 100;

   //console.log("Doing scale. Setting: " + settingKey + ", value: " + readStorage(settingKey));
   switch(readStorage(settingKey))
   {
      case "extra small":
         UIPercent = 70; break;
      case "small":
         UIPercent = 85; break;
      case "normal":
         UIPercent = 100; break;
      case "large":
         UIPercent = 115; break;
      case "extra large":
         UIPercent = 130; break;
   }

   //console.log("Setting UI to " + UIPercent);

   //if(UIPercent !== 100)
   htmlElement.style.fontSize = UIPercent + "%";
}

//Taken from http://jsfiddle.net/Znarkus/Z99mK/
function insertAtCursor(myField, replaceText, startText, endText) 
{
   startText = getOrDefault(startText, "");
   endText = getOrDefault(endText, "");
   replaceText = getOrDefault(replaceText, "");

   //IE support
   if (document.selection) 
   {
      myField.focus();
      sel = document.selection.createRange();

      if(!replaceText)
         replaceText = sel.text;

      sel.text = startText + replaceText + endText;
   }
   //MOZILLA and others
   else if (myField.selectionStart || myField.selectionStart == '0')
   {
      var startPos = myField.selectionStart;
      var endPos = myField.selectionEnd;
      var selectedText = myField.value.substring(startPos, endPos);

      if(!replaceText)
         replaceText = selectedText;

      myField.value = myField.value.substring(0, startPos) + 
         startText + replaceText + endText +
         myField.value.substring(endPos, myField.value.length);

      if(startText)
         myField.selectionStart = startPos + startText.length; 
      else
         myField.selectionStart = startPos + replaceText.length;

      myField.selectionEnd = myField.selectionStart;
   }
   else
   {
      if(!replaceText)
         replaceText = "";

      myField.value += startText + replaceText + endText;
   }
}

//These manage a (hopefully stylized) form for deletion events.
function buildDeleteForm(title, idtype, idvalue, page)
{
   var oldForm = document.getElementById("deleteForm");

   if(oldForm)
      oldForm.parentNode.removeChild(oldForm);

   var form = document.createElement("form");
   form.setAttribute("id", "deleteForm");
   form.setAttribute("data-page", page);
   form.addEventListener("submit", submitDelete);
   
   var header = document.createElement("h3");
   header.innerHTML = title;

   var deleteIdentifier = document.createElement("input");
   deleteIdentifier.setAttribute("type", "hidden");
   deleteIdentifier.setAttribute("name", "delete");
   deleteIdentifier.setAttribute("value", 1);

   var fpid = document.createElement("input");
   fpid.setAttribute("type", "hidden");
   fpid.setAttribute("name", idtype);
   fpid.setAttribute("value", idvalue);

   var reason = document.createElement("input");
   reason.setAttribute("type", "text");
   reason.setAttribute("name", "reason");
   reason.setAttribute("maxlength", 90);
   reason.setAttribute("placeholder", "Give a short reason for the deletion");
   reason.required = true;

   var cancel = document.createElement("button");
   cancel.setAttribute("type", "button");
   cancel.innerHTML = "Cancel";
   cancel.addEventListener("click", cancelDelete);

   var submit = document.createElement("button");
   submit.setAttribute("type", "submit");
   submit.setAttribute("id", "deletePostSubmit");
   submit.innerHTML = "Delete";

   form.appendChild(header);
   form.appendChild(deleteIdentifier);
   form.appendChild(fpid);
   form.appendChild(reason);
   form.appendChild(cancel);
   form.appendChild(submit);

   //document.getElementsByTagName("section")[0].appendChild(form);
   document.querySelector("main > section:not(.headerad)").appendChild(form);
   console.log("Delete form appended to page");
}

function cancelDelete(event)
{
   var result = false;

   if(event.target.parentNode)
   {
      if(event.target.parentNode.parentNode)
      {
         event.target.parentNode.parentNode.removeChild(event.target.parentNode);
         result = true;
      }
   }

   if(!result)
      console.log("Couldn't remove delete dialog!");
   else
      console.log("Delete form removed");
}

function submitDelete(event)
{
   event.preventDefault();

   var deleteButton = document.getElementById("deletePostSubmit");
   var form = event.target;
	var data = new FormData(form);
   var page = event.target.getAttribute("data-page");

   //Tell the user we're submitting (so they know it's doing something)
   setInputStatus(deleteButton, inputStatus.RUNNING, "Deleting...");
	
   //Perform the delete, redirecting to the result.
   genericXHR(page, data, deleteButton, redirectSuccess);
}

function canXHR()
{
   return (typeof window.XMLHttpRequest !== "undefined" && 
      typeof window.FormData !== "undefined");
}

var MyKeyCodes =
{
   "Left" : 37,
   "Up" : 38,
   "Right" : 39,
   "Down" : 40
};

var BBCodeToolSets =
{
   "general" : 1,
   "headers" : 2,
   "anchors" : 3
};

//Insert given bbcode around selected text. 
////NOTE: THIS IS DEPRECATED!
/*function bbcodeInsert(code, element)
{
   insertAtCursor(element, false, "[" + code + "]", "[/" + code + "]");
   element.focus();
}*/

//A small object to easily hold a quick bbcode button.
function bbcodeButton(innerHTML, bbcode, toolSet)
{
   this.inner = innerHTML;
   this.bbcode = bbcode;
   this.toolSet = toolSet;
}

//Retrieve the bbcode as an opening tag
bbcodeButton.prototype.openTag = function()
{
   return "[" + this.bbcode + "]";
};

//Retrieve the bbcode as a closing tag
bbcodeButton.prototype.closeTag = function()
{
   return "[/" + this.bbcode + "]";
};

//Get a new button which does not cause a form to submit.
function makeUnsubmittableButton()
{
   var button = document.createElement('button');
   button.setAttribute("type", "button");
   return button;
}

function createBBCodeTool(innerHTML, openTag, closeTag, element)
{
   var tool = makeUnsubmittableButton();
   tool.innerHTML = innerHTML;
   tool.addEventListener("click", function()
   {
      insertAtCursor(element, false, openTag, closeTag);
      element.focus();
   });
   return tool;
}

function attachBBCodeTools(element, textArea, toolSets)
{
   toolSets = getOrDefault(toolSets, [ BBCodeToolSets.general ]);

   if(!textArea)
      return;

   var toolBox = document.createElement("bbcode-tools");
   var quickButtons = [ 
      new bbcodeButton("<strong>B</strong>", "b", BBCodeToolSets.general),
      new bbcodeButton("<em>It</em>", "i", BBCodeToolSets.general),
      new bbcodeButton("<u>U</u>", "u", BBCodeToolSets.general),
      new bbcodeButton("<del>S</del>", "s", BBCodeToolSets.general),
      new bbcodeButton("<span>T<sup>s</sup></span>", "sup", BBCodeToolSets.general),
      new bbcodeButton("<span>T<sub>s</sub></span>", "sub", BBCodeToolSets.general),
      new bbcodeButton("<a href=\"\" onclick=\"return false;\">URL</a>", 
         "url", BBCodeToolSets.general),
      //new bbcodeButton("📷", "img", BBCodeToolSets.general),
      new bbcodeButton("►", "youtube", BBCodeToolSets.general),
      new bbcodeButton("<code>CODE</code>", "code", BBCodeToolSets.general),
      new bbcodeButton("<inline-code>ICODE</inline-code>", "icode", BBCodeToolSets.general),
      new bbcodeButton("H1", "h1", BBCodeToolSets.headers),
      new bbcodeButton("H2", "h2", BBCodeToolSets.headers),
      new bbcodeButton("H3", "h3", BBCodeToolSets.headers),
      new bbcodeButton("Anchor", "anchor", BBCodeToolSets.anchors),
      new bbcodeButton("Spoiler", "spoiler", BBCodeToolSets.general)
   ];

   for(var i = 0; i < quickButtons.length; i++)
   {
      if(toolSets.indexOf(quickButtons[i].toolSet) >= 0)
      {
         toolBox.appendChild(createBBCodeTool(quickButtons[i].inner,
            quickButtons[i].openTag(), quickButtons[i].closeTag(), textArea));
      }
   }

   //Insert the custom general bbcode thing.
   if(toolSets.indexOf(BBCodeToolSets.general) >= 0)
   {
      toolBox.appendChild(createBBCodeTool("●List", 
         "[list]\n", "[*]Item 1\n[*]Item 2\n[/list]", textArea));

      var pollTool = makeUnsubmittableButton();
      pollTool.innerHTML = '✓Poll';
      pollTool.addEventListener("click", showPollTool.callBind(pollTool, textArea));
      toolBox.appendChild(pollTool);

      var imageTool = makeUnsubmittableButton();
      imageTool.innerHTML = '📷';
      imageTool.addEventListener("click", showImageTool.callBind(imageTool, textArea));
      toolBox.appendChild(imageTool);
   }

   //The entire next section is all about the preview button. Pressing it will
   //create a view of what your post might look like.
   var preview = makeUnsubmittableButton();
   preview.innerHTML = "Preview";
   preview.addEventListener("click", function()
   {
      var data = new FormData();
      data.append("content", htmlEscape(textArea.value));

      if(toolSets.indexOf(BBCodeToolSets.headers))
         data.append("extended", 1);

      fullGenericXHR("/query/request/genbbcode", data, preview, function(json, element)
      {
         setInputStatus(element, inputStatus.NONE, "");

         var oldPreviews = toolBox.querySelectorAll("bbcode-preview");

         for(var i = 0; i < oldPreviews.length; i++)
            oldPreviews[i].parentNode.removeChild(oldPreviews[i]);

         var output = document.createElement("bbcode-preview");
         var outputClear = makeUnsubmittableButton();
         output.className = "bbcode";
         output.innerHTML = json.result;
         outputClear.innerHTML = "Clear Preview";
         outputClear.setAttribute("class", "clear");
         outputClear.addEventListener("click", function()
         {
            output.parentNode.removeChild(output);
         });
         applyGeneratedContent(output);
         output.appendChild(outputClear);
         toolBox.appendChild(output);
      });

   });
   toolBox.appendChild(preview);

   element.insertBefore(toolBox, textArea);
}

function pollToolID() { return "bbcodePollTool"; }
function imageToolID() { return "bbcodeImageTool"; }

function showImageTool(imageButton, textArea)
{
   //if the user clicked the imag tool when there's already an image tool, stop executing.
   if(hideBBCodeTool(document.getElementById(imageToolID())))
      return;

   var imageTool = document.createElement("image-tool");
   var urlForm = document.createElement("form");
   var urlSelector = document.createElement("input");
   var urlSubmit = document.createElement("button");
   var imageForm = document.createElement("form");
   var imageSelector = document.createElement("input");
   var imageSubmit = document.createElement("button");
   var cancelButton = makeUnsubmittableButton();

   imageTool.id = imageToolID();
   cancelButton.innerHTML = "Cancel";
   cancelButton.className = "cancel";
   urlSelector.setAttribute("placeholder", "Image URL");
   imageSelector.setAttribute("type", "file");
   imageSelector.setAttribute("name", "image");
   imageSelector.setAttribute("accept", "image/*");
   urlSubmit.innerHTML = "Add URL image";
   imageSubmit.innerHTML = "Add file image";

   imageForm.addEventListener("submit", function(e)
   {
      e.preventDefault();
      var data = new FormData(e.target);
      var request = new XMLHttpRequest();
      request.open("POST", window.location.protocol + "//kland.smilebasicsource.com/uploadimage", true);
      request.addEventListener("load", function(e)
      {
         if(request.status === 200)
            completeImageTool(e.target.response, textArea, imageTool);
         else
            setInputStatus(imageSubmit, inputStatus.ERROR);
      });
      setInputStatus(imageSubmit, inputStatus.RUNNING);
      request.send(data);
   });
   urlForm.addEventListener("submit", function(e)
   {
      e.preventDefault();
      completeImageTool(urlSelector.value, textArea, imageTool);
   });
   cancelButton.addEventListener("click", hideBBCodeTool.callBind(imageTool));

   urlForm.appendChild(urlSelector);
   urlForm.appendChild(urlSubmit);
   imageForm.appendChild(imageSelector);
   imageForm.appendChild(imageSubmit);
   imageTool.appendChild(urlForm);
   imageTool.appendChild(imageForm);
   //imageTool.appendChild(cancelButton);

   insertAfter(imageButton.parentNode, imageTool, imageButton.parentNode.querySelector("button:last-of-type"));
}

function completeImageTool(url, textArea, imageTool)
{
   insertAtCursor(textArea, url, "[img]", "[/img]");
   textArea.focus();
   hideBBCodeTool(imageTool);
}

function showPollTool(pollButton, textArea)
{
   //if the user clicked the poll tool when there's already a poll tool, stop executing.
   if(hideBBCodeTool(document.getElementById(pollToolID())))
      return;

   var pollTool = document.createElement("poll-tool");
   var pollTitle = document.createElement("input");
   var pollOptions = document.createElement("textarea");
   var pollHidden = document.createElement("input");
   var pollHiddenLabel = document.createElement("label");
   var pollMultivote = document.createElement("input");
   var pollMultivoteLabel = document.createElement("label");
   var submitPoll = document.createElement("button");
   var cancelTool = document.createElement("button");
   var pollNotes = document.createElement("p");

   //Poll inputs
   pollTool.id = pollToolID();
   pollTitle.setAttribute("name", "title");
   pollTitle.setAttribute("placeholder", "Poll title");
   pollTitle.setAttribute("required", "true");
   pollOptions.setAttribute("name", "options");
   pollOptions.setAttribute("placeholder", "Poll options (one per line)");
   pollOptions.setAttribute("required", "true");
   pollHidden.setAttribute("type", "checkbox");
   pollHidden.setAttribute("name", "hiddenresults");
   pollHiddenLabel.appendChild(pollHidden);
   pollHiddenLabel.innerHTML += "Hide results until closed";
   pollMultivote.setAttribute("type", "checkbox");
   pollMultivote.setAttribute("name", "multivote");
   pollMultivoteLabel.appendChild(pollMultivote);
   pollMultivoteLabel.innerHTML += "Allow users to select multiple options";

   //Poll controls
   cancelTool.innerHTML = "Cancel";
   cancelTool.setAttribute("type", "button");
   cancelTool.addEventListener("click", hideBBCodeTool.callBind(pollTool));
   submitPoll.innerHTML = "Generate";
   submitPoll.setAttribute("type", "button");
   submitPoll.setAttribute("data-generate", "true");
   submitPoll.addEventListener("click", generatePoll.callBind(pollTool,textArea));
   pollNotes.innerHTML = "After poll is generated, a poll code will be inserted into " +
      "your post. Use this code anywhere you want to display the poll";

   pollTool.appendChild(pollTitle);
   pollTool.appendChild(pollOptions);
   pollTool.appendChild(pollHiddenLabel);
   pollTool.appendChild(pollMultivoteLabel);
   pollTool.appendChild(cancelTool);
   pollTool.appendChild(submitPoll);
   pollTool.appendChild(pollNotes);

   insertAfter(pollButton.parentNode, pollTool, pollButton.parentNode.querySelector("button:last-of-type"));
}

function hideBBCodeTool(tool)
{
   if(tool)
   {
      tool.parentNode.removeChild(tool);
      console.log("Hid the bbcode tool");
      return true;
   }
   else
   {
      console.log("Yo, there wasn't a bbcode tool to hide");
      return false;
   }
}

function generatePoll(pollTool, textArea)
{
   if(pollTool)
   {
      var formData = new FormData();
      var pollTitle = pollTool.querySelector('[name="title"]');
      var pollOptions = pollTool.querySelector('[name="options"]');
      var pollHidden = pollTool.querySelector('[name="hiddenresults"]');
      var pollMultivote = pollTool.querySelector('[name="multivote"]');

      if(pollTitle && pollOptions && pollHidden)
      {
         var optionArray = pollOptions.value.split("\n");

         formData.append("title", pollTitle.value);

         if(pollHidden.checked)
            formData.append("hiddenresults", 1);
         if(pollMultivote.checked)
            formData.append("multivote", 1);

         formData.append("options", JSON.stringify(optionArray));

         console.log(formData);
         console.log(pollTitle.value);

         fullGenericXHR("/query/submit/poll", formData, pollTool.querySelector('button[data-generate]'), 
            function(json, element)
            {
               genericSuccess(json, element);

               insertAtCursor(textArea, false, "[poll=p" + json.result + "]", "[/poll]");
               textArea.focus();

               hideBBCodeTool(pollTool);
            });
      }
      else
      {
         console.log("Couldn't find the poll title or options!");
      }
   }
   else
   {
      console.log("Yo, there wasn't a poll tool to generate data from!");
   }
}

function fixUnsupportedFeatures(element)
{
   element = getOrDefault(element, document.documentElement);

   //ONLY browsers with badness AND users with
   if(!isPropertySupported("image-rendering"))
   {
      var images = element.querySelectorAll("img[data-pixelart]");
      var i, j;

      quietlog(images.length + " images are labelled as pixel art and are " +
         "being converted due to unsupported features");

      for(i = 0; i < images.length; i++)
      {
         //var imageStyle = getComputedStyle(images[i]);
         if(images[i].clientWidth === 0 || images[i].clientHeight === 0)
            continue;

         var canvas = document.createElement("canvas");
         var context = canvas.getContext("2d");
         canvas.width = images[i].clientWidth;
         canvas.height = images[i].clientHeight;
         for(j = 0; j < images[i].attributes.length; j++)
         {
            canvas.setAttribute(images[i].attributes[j].nodeName, 
               images[i].attributes[j].nodeValue);
         }
         context.imageSmoothingEnabled = false;
         context.webkitImageSmoothingEnabled = false;
         context.mozImageSmoothingEnabled = false;
         context.msImageSmoothingEnabled = false;
         context.drawImage(images[i], 0, 0, images[i].clientWidth, images[i].clientHeight);
         replaceNode(images[i], canvas);
      }
   }
}

function applyGeneratedContent(element)
{
   var i;

   //VERY first, convert links to async images (if that's what they want)
   var asyncImages = element.querySelectorAll("[data-asyncimage]");
   
   for(i = 0; i < asyncImages.length; i++)
      asyncImages[i].src = asyncImages[i].dataset.src;

   //Second, fix up the polls
   var polls = element.querySelectorAll("generate-poll");

   for(i = 0; i < polls.length; i++)
   {
      if(!polls[i].dataset.id)
         continue;

      var pollID = polls[i].dataset.id.slice(1);

      if(Number(pollID) > 0)
      {
         var encodedLink = Base64.encode(window.location.pathname + window.location.search + window.location.hash);

         fullGenericXHR("/query/submit/poll?pid=" + pollID + "&link=" + encodedLink,
            null, polls[i], generatePollElement);
      }
   }

   //Next, fix up the youtube videos
   var youtubes = element.querySelectorAll("youtube-player");

   for(i = 0; i < youtubes.length; i++)
      generateYoutube(youtubes[i]);

   //Now collapse deep quotes
   var deepQuotes = element.querySelectorAll(".bbcode > q > q > q > q > q");
   var quoteCollapseElement = element.querySelector("[data-quotecollapse]");

   if(quoteCollapseElement && quoteCollapseElement.getAttribute("data-quotecollapse"))
   {
      for(i = 0; i < deepQuotes.length; i++)
      {
         //Only wrap top level quotes (if they have something in them).
         /*if()
            {*/
            var container = deepQuotes[i].parentNode;
         var section = document.createElement("spoiler-section");
         var button = document.createElement("button");
         var content = document.createElement("spoiler-content");
         button.setAttribute("data-spoiler", "");
         button.innerHTML = "Show Quotes";
         content.appendChild(deepQuotes[i]);
         section.appendChild(button);
         section.appendChild(content);
         container.appendChild(section);
         //}
      }
   }

   //Fix spoilers
   var unfixedSpoilers = element.querySelectorAll("spoiler-content");

   for(i = 0; i < unfixedSpoilers.length; i++)
   {
      if(unfixedSpoilers[i].parentNode.tagName !== "SPOILER-SECTION")
      {
         var spoilerSection = document.createElement("spoiler-section");
         var spoilerButton = document.createElement("button");
         var possibleText = unfixedSpoilers[i].getAttribute('data-text');

         if(!possibleText)
            possibleText = "spoiler";

         unfixedSpoilers[i].parentNode.insertBefore(spoilerSection, unfixedSpoilers[i]);

         spoilerButton.setAttribute("data-spoiler", "");
         spoilerButton.innerHTML = "Show " + possibleText;

         spoilerSection.appendChild(spoilerButton);
         spoilerSection.appendChild(unfixedSpoilers[i]);
      }
   }

   var spoilerButtons = element.querySelectorAll("spoiler-section [data-spoiler]");

   for(i = 0; i < spoilerButtons.length; i++)
      spoilerButtons[i].addEventListener("click", spoilerToggle, true);

   //Now remove transparency for things marked for that.
   var opaqueThings = element.querySelectorAll("[data-fullopaque]");

   for(i = 0; i < opaqueThings.length; i++)
   {
      var color = getComputedStyle(opaqueThings[i]).backgroundColor;
      var matches = color.match(/rgba.*,\s*([\.0-9]+\s*\))/);

      if(matches)
         opaqueThings[i].style.backgroundColor = color.replace(matches[1], "1.0)");
   }

   //Code block syntax highlighting
   var codeBlocks = element.querySelectorAll(".bbcode code");
   for(i = 0; i < codeBlocks.length; i++)
   {
      applySyntaxHighlighting(codeBlocks[i]);      
   }
}

function generatePollElement(json, element)
{
   setInputStatus(element, inputStatus.NONE);   

   var i;
   var poll = document.createElement("user-poll");
   var pollTitle = document.createElement("poll-title");
   var pollOptions= document.createElement("poll-options");
   var pollCreator = document.createElement("poll-creator");
   var pollCreatorLink = document.createElement("a");
   var pollTime = document.createElement("time");
   var pollClose = document.createElement("button");
   var pollStatus = document.createElement("poll-status");
   var pollVotes = document.createElement("poll-votes");
   var pollRestrictions = document.createElement("poll-restrictions");

   pollTitle.setAttribute("data-originaltitle", json.result.title);

   if(json.result.link)
   {
      var pollLink = document.createElement("a");
      pollLink.href = json.result.link;
      pollLink.innerHTML = json.result.title;
      pollTitle.appendChild(pollLink);
   }
   else
   {
      pollTitle.innerHTML = json.result.title;
   }

   poll.setAttribute("data-pid", json.result.pid);
   pollOptions.setAttribute("tabindex", "-1");
   pollCreatorLink.innerHTML = json.result.creator.username;
   pollCreatorLink.href = "/user?uid=" + json.result.creator.uid;
   pollCreatorLink.className = "userhover";
   pollCreator.innerHTML = "Poll #" + json.result.pid + " by ";
   pollCreator.appendChild(pollCreatorLink);
   /*pollID.innerHTML = "#" + json.result.pid;*/
   pollTime.innerHTML = json.result.createdago + " ago";
   pollTime.setAttribute("datetime", json.result.createdon);
   pollVotes.innerHTML = json.result.totalvotes + " votes";
   pollClose.className = "pollClose";
   pollClose.innerHTML = json.result.closed ? "Reopen Poll" : "Close Poll";
   pollClose.addEventListener("click", 
      closePoll.callBind(json.result.closed ? 0 : 1, json.result.pid, poll));

   if(json.result.closed)
   {
      pollRestrictions.innerHTML = "Closed";
      pollRestrictions.setAttribute("data-alert", "");
   }
   else if (json.result.hiddenresults)
   {
      pollRestrictions.innerHTML = "Results hidden";
   }

   if(json.result.multivote && json.result.canvote)
   {
      var voteButton = document.createElement("button");
      voteButton.innerHTML = "Vote"; //TODO : LANGUAGE
      voteButton.addEventListener("click", submitPollVotes);
      pollStatus.appendChild(voteButton);
   }

   if(pollRestrictions.innerHTML)
      pollStatus.appendChild(pollRestrictions);

   pollStatus.appendChild(pollVotes);

   if(json.result.multivote)
   {
      var pollUsers = document.createElement("poll-users");
      pollUsers.innerHTML = json.result.totalusers + " user" +
         (json.result.totalusers > 1 ? "s" : "");
      pollStatus.appendChild(pollUsers);
   }

   poll.appendChild(pollTitle);

   if(json.result.closed && json.result.canopen ||
      !json.result.closed && json.result.canclose)
   {
      poll.appendChild(pollClose);
   }
   /*poll.appendChild(pollID);*/

   /*var maxVoteCount = 0;
   for(i = 0; i < json.result.options.length; i++)
      if(json.result.options[i].votes > maxVoteCount)
         maxVoteCount = json.result.options[i].votes;*/

   for(i = 0; i < json.result.options.length; i++)
   {
      var pollOption = document.createElement("poll-option");
      var pollOptionControl = document.createElement("option-control");
      var pollVote = document.createElement("a");
      var pollVoted = document.createElement("user-voted");
      var optionVotes = document.createElement("option-votes");
      var optionInfo = document.createElement("option-info");
      var optionContent = document.createElement("option-content");
      var optionVisual = document.createElement("option-visual");

      pollVote.innerHTML = "✓";
      pollVote.setAttribute("data-poid", json.result.options[i].poid);
      pollOption.setAttribute("data-poid", json.result.options[i].poid);
      if(json.result.multivote)
         pollVote.addEventListener("click", selectPollVote);
      else
         pollVote.addEventListener("click", submitPollVote);
      pollVoted.innerHTML = "✓";
      optionVotes.innerHTML = json.result.options[i].votes;
      optionContent.innerHTML = json.result.options[i].content;

      //I KNOW there's a field called "hiddenresults", but that's actually just
      //telling you if the results are hidden IN GENERAL. Whether or not
      //they're hidden now may be due to various factors, so we check the
      //actual vote count for hiddenness instead.
      if(json.result.options[i].votes >= 0 && json.result.totalvotes > 0)
      {
         optionVisual.style.width = Math.floor(100 * json.result.options[i].votes / json.result.totalusers) + "%";
         optionInfo.appendChild(optionVisual);
         optionInfo.appendChild(optionVotes);
      }

      optionInfo.appendChild(optionContent);

      if(json.result.canvote)
      {
         pollOptionControl.appendChild(pollVote);
      }
      else if (json.result.options[i].uservoted)
      {
         pollOptionControl.appendChild(pollVoted);
         optionVisual.setAttribute("data-voted", "");
      }

      pollOption.appendChild(pollOptionControl);
      pollOption.appendChild(optionInfo);

      pollOptions.appendChild(pollOption);
   }

   poll.appendChild(pollOptions);
   poll.appendChild(pollStatus);


   poll.appendChild(pollCreator);
   poll.appendChild(pollTime);

   replaceNode(element, poll);
   reanchor();
}

function closePoll(close, pid, element)
{
   var data = new FormData();
   data.append("close", close);

   fullGenericXHR("/query/submit/poll?pid=" + pid, data, element, function(json, element) 
   {
      fullGenericXHR("/query/submit/poll?pid=" + pid, null, element, generatePollElement);
   });
}

function selectPollVote(event)
{
   var option = findParentWithTag("poll-option", event.target);

   if(option.dataset.selected)
      option.removeAttribute("data-selected");
   else
      option.setAttribute("data-selected", "true");
}

function submitPollVotes(event)
{
   var i;
   var poll = findParentWithTag("user-poll", event.target);
   var pollTitle = poll.querySelector("poll-title");
   var selectedOptions = poll.querySelectorAll("poll-option[data-selected]");
   var selectedOptionsNames = poll.querySelectorAll("poll-option[data-selected] option-info option-content a");

   if(selectedOptions.length === 0)
   {
      alert("You must select at least one option!");
      return;
   }
   else if (selectedOptionsNames.length === 0)
   {
      selectedOptionsNames = poll.querySelectorAll("poll-option[data-selected] option-info option-content");
   }

   var output = "You are about to vote for the following options on poll \"" +
      pollTitle.dataset.originaltitle + "\":\n\n";

   for(i = 0; i < selectedOptionsNames.length; i++)
      output += selectedOptionsNames[i].innerHTML + "\n";

   output += "\nYou can only vote once. Is this what you want?";

   if(confirm(output))
   {
      var formData = new FormData();
      var votes = "";

      for(i = 0; i < selectedOptions.length; i++)
         votes += ((i !== 0) ? "," : "") + selectedOptions[i].dataset.poid;

      formData.append("poids", votes);

      fullGenericXHR("/query/submit/poll", formData, event.target, function(json, element)
      {
         fullGenericXHR("/query/submit/poll?pid=" + poll.dataset.pid, null, poll, generatePollElement);
      });
   }
}

function submitPollVote(event)
{
   var pollSearch = event.target;
   var poid = event.target.dataset.poid;
   var pollOption = false;

   //Look for the real main title thing
   while(pollSearch.tagName !== "USER-POLL" && pollSearch.tagName !== "BODY")
   {
      if(pollSearch.tagName === "POLL-OPTION")
         pollOption = pollSearch.querySelector("option-content");

      pollSearch = pollSearch.parentNode;
   }

   var pollTitle = pollSearch.querySelector("poll-title");

   if(pollSearch.tagName !== "USER-POLL" || !pollTitle || !pollOption)
   {
      console.log("Couldn't find the poll or title for voting!");
      return;
   }

   var pollOptionText = pollOption.innerHTML;

   //A VERY bad hack for auto generated contest polls
   if(pollOption.children.length >= 2 && pollOption.children[1].innerHTML)
      pollOptionText = pollOption.children[1].innerHTML;

   if(confirm("You're about to vote '" + pollOptionText + 
      "' on the poll: \n\n" + pollTitle.dataset.originaltitle + "\n\n" + 
      "Is this what you want?"))
   {
      var formData = new FormData();
      formData.append("poids", poid);

      fullGenericXHR("/query/submit/poll", formData, pollSearch, function(json, element)
      {
         fullGenericXHR("/query/submit/poll?pid=" + pollSearch.dataset.pid, null, pollSearch, generatePollElement);
      });
      console.log("User voted for option " + poid); 
   }
   else
   {
      console.log("User decided against voting");
   }
}

function generateYoutube(youtube)
{
   var iframe = document.createElement("iframe");
   var src = youtube.innerHTML.replace(/\[[^\]]+\]([^\[]+)\[[^\]]+\]/, "$1");
   src = src.replace(/.+\/(.+)$/, "$1");
   src = src.replace(/.+=(.+)$/, "$1");
   iframe.setAttribute("src","https://www.youtube-nocookie.com/embed/" + src);
   iframe.setAttribute("width","480");
   iframe.setAttribute("height","270");
   iframe.setAttribute("allowfullscreen", "");
   iframe.setAttribute("frameborder", "0");

   replaceNode(youtube, iframe);
   reanchor();
}

function HTMLunescape(string) 
{
	var elem = document.createElement("textarea");
	elem.innerHTML = string;
	return elem.value;
}

function htmlEscape(string)
{
   var wrapper = document.createElement("pre");
   var element = document.createTextNode(string); 
   wrapper.appendChild(element);
   return wrapper.innerHTML;
}

function spoilerToggle(e)
{
   e.preventDefault();
   var toggler = e.target;
   
   //Look for the real toggler!
   while(!toggler.hasAttribute("data-spoiler") && toggler.tagName !== "BODY")
      toggler = toggler.parentNode;

   var section = toggler;

   while(section.tagName !== "SPOILER-SECTION" && section.tagName !== "BODY")
      section = section.parentNode;

   if(!section || section.tagName === "BODY")
   {
      console.log("Bad spoiler section!");
      return;
   }

   setSpoilerState(section, !toggler.hasAttribute("data-show"));
}

//Set the actual spoiler state for the given overarching spoiler. 
//"spoiler" should be the "spoiler-section" element.
function setSpoilerState(spoiler, show)
{
   var i, filler;
   var content = spoiler.querySelector("spoiler-content");
   var toggler = spoiler.querySelector("[data-spoiler]");
   var ignoreOverflow = spoiler.hasAttribute("data-ignoreoverflow");

   if(!content)
   {
      console.log("No spoiler content!");
      return;
   }
   else if(!toggler)
   {
      console.log("No toggler element!");
      return;
   }

   //Show or hide the spoiler
   if(show) 
   {
      //Before you do ANYTHING else, hide all the other sibling spoilers within
      //the same spoiler group.
      if(spoiler.hasAttribute("data-togglegroup"))
      {
         var toggleGroupSpoilers = spoiler.parentNode.querySelectorAll(
         '[data-togglegroup="' + spoiler.dataset.togglegroup + '"]');

         //Now for each spoiler in the group, force it to hide!
         for(i = 0; i < toggleGroupSpoilers.length; i++)
            setSpoilerState(toggleGroupSpoilers[i], false);
      }

      if(ignoreOverflow)
      {
         quietlog("Ignore overflow. Set style");
         var matchID = "filler_" + Date.now();
         filler = createFillerForElement(spoiler);
         filler.id = matchID;
         spoiler.setAttribute("data-filler", matchID);
         spoiler.style.position = "absolute";
         insertAfter(spoiler.parentNode, filler, spoiler);

         if(!isSupportedBrowser() || spoiler.offsetLeft !== filler.offsetLeft || 
            spoiler.offsetTop !== filler.offsetTop)
         {
            console.log("Fixing weird shifting error");
            spoiler.style.left = filler.offsetLeft + "px";
            spoiler.style.top = filler.offsetTop + "px";
         }
      }

      if(toggler.innerHTML.indexOf("Show") === 0)
         toggler.innerHTML = toggler.innerHTML.replace(/\bShow\b/g, "Hide");
      toggler.setAttribute("data-show", "");
      content.setAttribute("data-show", "");
   }
   else
   {
      if(toggler.innerHTML.indexOf("Hide") === 0)
         toggler.innerHTML = toggler.innerHTML.replace(/\bHide\b/g, "Show");
      toggler.removeAttribute("data-show");
      content.removeAttribute("data-show");

      if(ignoreOverflow)
      {
         quietlog("Ignore overflow. Remove style");
         spoiler.removeAttribute("style");
         filler = document.getElementById(spoiler.getAttribute("data-filler"));

         if(filler)
            removeSelf(filler);
      }
   }
}

function createFillerForElement(element)
{
   var elementStyle = getComputedStyle(element);
   filler = document.createElement("div");
   filler.style.display = elementStyle.display;
   filler.style.width = element.offsetWidth + "px";
   filler.style.height = element.offsetHeight + "px";

   return filler;
}

//Original code created by Fusselwurm:
//https://gist.github.com/Fusselwurm/4673695
//Adapted to work on any system which does not support querySelectorelector
(function () {
   var styleElement = document.createElement("style");
   clearStyle(styleElement);
   document.head.appendChild(styleElement);
   var style = styleElement.sheet;
   var select = function (selector, maxCount) 
   {
      var all = document.all,
      l = all.length, 
      i,
      resultSet = [];

      style.addRule(selector, "foo:bar");
      for (i = 0; i < l; i += 1)
      {
         if (all[i].currentStyle.foo === "bar")
         {
            resultSet.push(all[i]);
            if (resultSet.length > maxCount)
            {
               break;
            }
         }
      }
      style.removeRule(0);
      return resultSet;
   };

   if (document.querySelectorAll || document.querySelector) 
   {
      quietlog("Browser supports querySelector?");
      return;
   }

   document.querySelectorAll = function (selector) {
      return select(selector, Infinity);
   };
   document.querySelector = function (selector) {
      return select(selector, 1)[0] || null;
   };
   console.log("Set custom querySelector functions");
})();

if(!FormData.prototype.get)
{
   FormData.appendOld=FormData.prototype.append;
   FormData.prototype._fd={};
   FormData.prototype.append=function(k,v)
   {
      this._fd[k]=v;
      FormData.appendOld.apply(this,[k,v]);
   };
   FormData.prototype.get=function(k){return this._fd[k];};
}
