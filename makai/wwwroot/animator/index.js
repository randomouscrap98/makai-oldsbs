
(function()
{
   function updateBucketLink()
   {
      seeBucket.href = "http://kland.smilebasicsource.com/image?bucket=" + bucket.value;
   }

   window.addEventListener("load", function(e)
   {
      ChatDrawUtilities.ExportBucket = function()
      {
         return bucket.value; //|| "chatDrawAnimations";
      };
      LocalChatDraw.setupInterface(animator, true);

      //Disable buttons that can't be used
      var sendButton = document.querySelector('[data-button="sendDrawing"]');
      if(sendButton) sendButton.disabled = true;
      sendButton = document.querySelector('[data-button="sendAnimation"]');
      if(sendButton) sendButton.disabled = true;

      var exportBucketKey = "chatdrawexportbucket";
      var exportBucket = StorageUtilities.ReadSafeCookie(exportBucketKey); 
      if(exportBucket) bucket.value = exportBucket;
      bucket.addEventListener("input", function(e)
      {
         StorageUtilities.WriteSafeCookie(exportBucketKey, bucket.value);
         updateBucketLink();
      });
      updateBucketLink();

      generateSave.addEventListener("click", function(e)
      {
         UXUtilities.Toast("Generating save... please wait");

         //Why do I have to do this first step? Ehhhh something about the
         //player not always having all the frames until you press "play"
         var player = LocalChatDraw.getAnimationPlayer();
         var frames = LocalChatDraw.getAnimateFrames();
         player.frames = frames.GetAllFrames();
         var object = player.ToStorageObject();

         //OK now do something with the object?
         try
         {
            var file = new Blob([JSON.stringify(object)], {type: "text/plain"});
            var link = document.createElement("a");
            var name = (saveName.value || "animation_" + Date.now()) + ".txt";
            link.innerHTML = name;
            link.download = name;
            link.href = URL.createObjectURL(file);
            saveLink.innerHTML = "";
            saveLink.appendChild(link);

            UXUtilities.Toast("Save generated! Click the link to download");
         }
         catch(ex)
         {
            UXUtilities.Alert("Could not create save!\n\nError: " + ex);
         }
      });

      loadAnimation.addEventListener("click", function(e)
      {
         if(!loadFile.value)
         {
            UXUtilities.Toast("No file specified! Not loading!");
            return;
         }
         
         UXUtilities.Confirm("Loading this file will overwrite your current " +
            "animation! Are you SURE you want to load?", 
            function(confirmed){ if(confirmed)
            {
               try
               {
                  var file = loadFile.files[0]; 
                  var reader = new FileReader();
                  reader.onload = function(ef)
                  {
                     try
                     {
                        var fileText = ef.target.result;
                        LocalChatDraw.loadAnimation(JSON.parse(fileText));
                        UXUtilities.Toast("Loaded animation!");
                     }
                     catch(ex)
                     {
                        UXUtilities.Alert("File is wrong format! Maybe...\n\nError: " + ex);
                     }
                  };
                  reader.readAsText(file);
               }
               catch(ex)
               {
                  UXUtilities.Alert("Could not load!\n\nError: " + ex);
               }
            }});
      });
   });
})();

function localModuleMessage(message)
{
   UXUtilities.Alert(message);
}
