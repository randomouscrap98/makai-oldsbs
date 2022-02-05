//Carlos Sanchez - 2015
//randomouscrap98@aol.com

//var debugMode;

window.addEventListener("load", function()
{
   debuglog.log = document.querySelector("body").getAttribute("data-debug");
   //debuglog.log = debugMode;

   //Faster option retrieval
   getAllOptions.optionCache = getAllOptions();
});

function getOption(key)
{
   var options = getAllOptions();

   if(options.hasOwnProperty(key))
      return options[key].value;

   return null;
}

function getAllOptions()
{
   if(this.optionCache)
   {
      return this.optionCache;
   }
   else
   {
      var body = document.querySelector("body");

      if(body)
      {
         var dataSettings = body.getAttribute("data-settings");

         if(dataSettings)
         {
            return JSON.parse(dataSettings);
         }
      }

      return {};
   }
}

/*function debuglog(message)
{
   if(debugMode)
      console.log(message);
}*/
