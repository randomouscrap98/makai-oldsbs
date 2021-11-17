// Global variables
var myCodeMirror;
var canvases = [];
var contexts = [];
var opacities = [ 0.7, 0.7, 0.235, 0.235 ]; //, 0.05 ];
var memorylocbox;
var memoryvalbox;
var cwidth = 32;
var cheight = 32;
var vbuffersize = 32;
var mbuffersize = 65536;

//Image objects
var statusImages = [];
var preImage = new Image();
preImage.src=statusOnSrc;

//Window and file writer
var w = window;
var fileWriter = 0;
var hasStorage = (typeof(Storage) !== "undefined");

//Audio stuff
var audio = window.AudioContext || window.webkitAudioContext || false;
var noiseBuffer = false;
var channels = 4;
var audioBufferEnd = 65529;
var endingSounds = [];
var rampDownGain = false;

//The full running system
var system =
{
	running: false,
	loaded: false,
	pc: 0,
	instructions: [],
	callstack: [],
	mbuffer: [],
   channels: [],
	bbuffer: 0,
	bbuffertemp: 0,
	calltop: 0
};

var buttonMapping = [];

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) 
{
	keysDown[e.keyCode] = true;
	
	if(buttonMapping[e.keyCode] != -1)
		system.bbuffertemp |= buttonMapping[e.keyCode];
	
	if(statusImages[e.keyCode] && statusImages[e.keyCode].src.indexOf(statusOnSrc) == -1)
		statusImages[e.keyCode].src = statusOnSrc;
	
}, false);

addEventListener("keyup", function (e) 
{
	delete keysDown[e.keyCode];
	
	if(buttonMapping[e.keyCode] != -1)
		system.bbuffertemp = (system.bbuffertemp & ~buttonMapping[e.keyCode]);
	
	if(statusImages[e.keyCode] && statusImages[e.keyCode].src.indexOf(statusOffSrc) == -1) 
		statusImages[e.keyCode].src = statusOffSrc;
	
}, false);

function saveCode()
{
	if(hasStorage)
		localStorage.code = myCodeMirror.getValue();
}

//Completely halt the system and clear out everything
function clearHaltSystem()
{
	system.instructions = [];
	system.pc = 0;
	setRunning(false);
	setLoaded(false);
	resetRuntime();
}

function setRunning(isRunning)
{
	system.running = isRunning;
	document.getElementById("runimg").src = isRunning ? statusOnSrc : statusOffSrc;
	
	if(!system.running)
	{
		if(!fileWriter)
			fileWriter = setInterval(function () { saveCode(); }, 3000);
	}
	else
	{
		clearInterval(fileWriter);
		fileWriter = 0;
	}
}

function setLoaded(isLoaded)
{
	system.loaded = isLoaded;
	document.getElementById("loadimg").src = isLoaded ? statusOnSrc : statusOffSrc;
}

//Called at the end of html page load to initialize stuff that 
//can only be done in javascript
function initialize()
{
   var i;

	//Set up image array
	for(i = 0; i < 256; i++)
	{
		buttonMapping[i] = -1;
		statusImages[i] = 0;
	}
	
	statusImages[37] = document.getElementById("leftimg");
	statusImages[38] = document.getElementById("upimg");
	statusImages[39] = document.getElementById("rightimg");
	statusImages[40] = document.getElementById("downimg");
	statusImages[65] = document.getElementById("aimg");
	statusImages[68] = document.getElementById("dimg");
	statusImages[83] = document.getElementById("simg");
	statusImages[87] = document.getElementById("wimg");
	buttonMapping[87] = 1;
	buttonMapping[65] = 2;
	buttonMapping[83] = 4;
	buttonMapping[68] = 8;
	buttonMapping[38] = 16;
	buttonMapping[37] = 32;
	buttonMapping[40] = 64;
	buttonMapping[39] = 128;
	
	//Canvas stuff
   var canvasNode = document.getElementById("screencontainer");

   for(i = 0; i < opacities.length; i++)
   {
      var canvas = document.createElement("canvas");

      canvas.width = cwidth;
      canvas.height = cheight;
      canvas.style.opacity = opacities[i]; 
      canvas.style.zIndex = 100 - i;
      canvases.push(canvas);

      contexts.push(canvas.getContext("2d"));
      contexts[i].fillStyle = "#1f211f";

      canvasNode.appendChild(canvas);
   }

   setOpacities();

	//texbox stuff
	memorylocbox = document.getElementById("memoryloc");
	memoryvalbox = document.getElementById("memoryval");
	
	//Code editor stuff
	myCodeMirror = CodeMirror.fromTextArea(
		document.getElementById("editor"),
		{
			mode: "simplemode",
			indentUnit: 2,
			tabSize: 2,
			indentWithTabs: true,
			lineNumbers: true,
			styleActiveLine: true
		});
		
	if(hasStorage)
		if(localStorage.code)
			myCodeMirror.setValue(localStorage.code);
	
	// Cross-browser support for requestAnimationFrame
	requestAnimationFrame = w.requestAnimationFrame || 
      w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;
	
   //Audio setup
   if(audio)
   {
      audio = new audio();

      var bufferSize = 2 * audio.sampleRate;
      noiseBuffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
      var output = noiseBuffer.getChannelData(0);

      for(i = 0; i < bufferSize; i++)
         output[i] = Math.random() * 2 - 1;
   }

	clearHaltSystem();
}

function setOpacities()
{
   try
   {
      var i;
      var contrast = document.getElementById("contrastSetting").value;
      var canvasNodes = document.querySelectorAll("#screencontainer canvas");

      for(i = 0; i < canvasNodes.length; i++)
         canvasNodes[i].style.opacity = opacities[i] * contrast / 100;
   }
   catch(ex)
   {
      console.log("Cannot set contrast: " + ex);
   }
}

//Only reset runtime variables, such as memory and program counter
function resetRuntime()
{
	system.pc = 0;

   var i;
	
	for(i = 0; i < mbuffersize; i++)
		system.mbuffer[i] = 0;

   //Attempt to stop all channels if they're currently playing
   try
   {
      stopChannels();
      clearEndingSounds();
   }
   catch (ex)
   {
      console.log("Initializing sound channels for the first time. If you see " +
         "this more than once, there's probably an error");
   }

   for(i = 0; i < channels; i++)
   {
      /*system.channels[i] = { gain : audio.createGain() };
      system.channels[i].gain.connect(audio.destination);
      system.channels[i].gain.gain.setValueAtTime(0, audio.currentTime);*/

      //Set all players to 0 frequency.
      startChannel(i);
   }

	system.bbuffer = 0;
	system.bbuffertemp = 0;
	
   finalRender();
}

function startChannel(channel)
{
   system.channels[channel] = false;
   system.channels[channel] = { gain : audio.createGain(), oscillator : audio.createOscillator(), lastVolume : 0 };
   system.channels[channel].gain.connect(audio.destination);
   system.channels[channel].gain.gain.setValueAtTime(0, audio.currentTime);

   switch(channel)
   {
      case 0:
         system.channels[channel].oscillator.type = "square";
         break;
      case 1:
         system.channels[channel].oscillator.type = "triangle";
         break;
      case 2:
         system.channels[channel].oscillator.type = "sawtooth";
         break;
      case 3:
         //OK so ACTUALLY our last two types will be noise generators.
         system.channels[channel].oscillator = audio.createBufferSource();
         system.channels[channel].oscillator.buffer = noiseBuffer;
         system.channels[channel].oscillator.loop = true;
   }

   system.channels[channel].oscillator.connect(system.channels[channel].gain);
   system.channels[channel].oscillator.start(0);
}

function stopChannels()
{
   for (var i = 0; i < channels; i++)
      system.channels[i].oscillator.stop(0);
}

function clearEndingSounds()
{
   for(i = 0; i < endingSounds.length; i++)
   {
      //console.log("Ending volume: " + endingSounds[i].gain.gain.value);
      endingSounds[i].oscillator.stop(0);
   }

   if(endingSounds.length)
      endingSounds = [];
}

//Draw the video buffer to the screen
//Also change audio jingles
function render()
{
   var i, j, pixWidth, pixHeight, frequency, volume, time, fdiff;

   time = performance.now();
   pixWidth = cwidth / vbuffersize;
   pixHeight = cheight / vbuffersize;

   //Push ghosting back
   for (i = contexts.length - 1; i >= 0; i--)
   {
      contexts[i].clearRect(0,0,cwidth,cheight); 

      if(i > 0)
         contexts[i].drawImage(canvases[i - 1], 0, 0);
   }
   
   //Set pixels
   for(i = 0; i < vbuffersize; i++)
   {
      for(j = 0; j < vbuffersize; j++)
      {
         if((system.mbuffer[i] >> j) & 1)
            contexts[0].fillRect(j * pixWidth, i * pixHeight, pixWidth, pixHeight);
      }
   }
   time = performance.now() - time;
   if(time > 4)
      console.log("Long render: " + time.toFixed(4) + "ms");

   if(audio)
   {
      //time = performance.now();

      clearEndingSounds();

      for(i = 0; i < channels; i++)
      {
         frequency = system.mbuffer[audioBufferEnd + 1 - channels + i] / 100;
         volume = system.mbuffer[audioBufferEnd + 1 - channels * 2 + i] / 100;

         if(Math.abs(volume - system.channels[i].lastVolume) > 0.009)
         {
            //console.log("changing volume to " + volume + "," + system.channels[i].lastVolume);
            system.channels[i].gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 1/60);
            system.channels[i].lastVolume = volume;
         }

         if(system.channels[i].oscillator.frequency && (fdiff = 
            Math.abs(frequency - system.channels[i].oscillator.frequency.value)) > 0.009)
         {
            //If they're trying to slide, don't cut off the notes.
            if(fdiff > 15)
            {
               //Push the current oscillator onto the "kill" stack after quieting it slowly
               system.channels[i].gain.gain.linearRampToValueAtTime(0, audio.currentTime + 1/80);
               endingSounds.push(system.channels[i]);

               //Now restart the channel.
               startChannel(i);
            }
            system.channels[i].oscillator.frequency.value = frequency;
         }
      }
      //time = performance.now() - time;
      //console.log("Sound: " + time.toFixed(4) + "ms");
   }
}

function finalRender()
{
   //Render enough to remove ghosting.
   for(var i = 0; i < canvases.length; i++)
      render();
}

//Attempt to restart the program while it is still running
function restart()
{
	if(!system.loaded)
	{
		alert("Load some code into the system first.");
		return;
	}
	
	if(!system.running)
	{
		alert("You can't restart what isn't running.");
		return;
	}
	
	resetRuntime();
}

//Perform a resume, pause, or start running the machine based 
//on whether we're currently paused, running, or completed
function runPause()
{
	if(!system.loaded)
	{
		alert("Load something first before running.");
		return;
	}
	
	if(system.pc === 0)
		resetRuntime();
	
	setRunning(!system.running);
	while(system.running && simulating);
	
	if(system.running)
		simulate();
}

//This actually tries to pull a value from memory and place
//it in the on-screen debug textbox
function tryGetMemory()
{
	if(memorylocbox.value === "")
		return;
	
	var memloc = Number(memorylocbox.value);
	
	if(memloc >= 0 && memloc < mbuffersize)
		memoryvalbox.value = system.mbuffer[memloc];
	else if (memloc == -1)
		memoryvalbox.value = system.bbuffer;
}

//Get a value from memory based on the given operand number and instruction
function getValue(cinst, operand)
{
	var base = cinst["opr" + operand];
	var otype = cinst["opr" + operand + "Type"];
	
	if(otype <= 1)
		base = system.mbuffer[base];
	else if (otype == accessTypes.b)
		base = system.bbuffer;
	
	if(cinst["opr" + operand + "IsPointer"])
	{
		if(base < 0 || base >= mbuffersize)
		{
			alert("Error: invalid pointer detected at PC: " + system.pc + "\n\n" + system.instructions[system.pc].original);
			setRunning(false);
			return 0;
		}
		base = system.mbuffer[base];
	}
	
	return base;
}

//Set a value in memory based on the given operand and instruction pc
function setValue(cinst, operand, value)
{
	var base = cinst["opr" + operand];
	
	if(cinst["opr" + operand + "IsPointer"])
	{
		base = system.mbuffer[base];
		
		if(base < 0 || base >= mbuffersize)
		{
			alert("Error: invalid pointer detected at PC: " + system.pc + "\n\n" + cinst.original);
			setRunning(false);
			return 0;
		}
	}
	
	//Ensure it is always 32 bits
	system.mbuffer[base] = value & 0xFFFFFFFF;
}

//Perform a simulation of instructions until vsync is met or it stops running
function run()
{
	var start = new Date().getTime();
	var jumped = false;
	var cinst;
	var totalIterations = 0;
	while(system.instructions[system.pc].op != opcodes.vsync && system.running)
	{	
		totalIterations++;
		jumped = false;
		cinst = system.instructions[system.pc];
		switch(cinst.op)
		{
			case opcodes.add:
				setValue(cinst, 3, getValue(cinst, 1) + getValue(cinst, 2));
				break;
			case opcodes.sub:
				setValue(cinst, 3, getValue(cinst, 1) - getValue(cinst, 2));
				break;
			case opcodes.mul:
				setValue(cinst, 3, getValue(cinst, 1) * getValue(cinst, 2));
				break;
			case opcodes.div:
				setValue(cinst, 3, ~~(getValue(cinst, 1) / getValue(cinst, 2)));
				break;
			case opcodes.mod:
				setValue(cinst, 3, getValue(cinst, 1) % getValue(cinst, 2));
				break;
			case opcodes.and:
				setValue(cinst, 3, getValue(cinst, 1) & getValue(cinst, 2));
				break;
			case opcodes.or:
				setValue(cinst, 3, getValue(cinst, 1) | getValue(cinst, 2));
				break;
			case opcodes.xor:
				setValue(cinst, 3, getValue(cinst, 1) ^ getValue(cinst, 2));
				break;
			case opcodes.rs:
				setValue(cinst, 3, getValue(cinst, 1) >>> getValue(cinst, 2));
				break;
			case opcodes.ls:
				setValue(cinst, 3, getValue(cinst, 1) << getValue(cinst, 2));
				break;
			case opcodes.beq:
				if(getValue(cinst, 1) == getValue(cinst, 2))
				{
					system.pc = cinst.label;
					jumped = true;
				}
				break;
			case opcodes.bne:
				if(getValue(cinst, 1) != getValue(cinst, 2))
				{
					system.pc = cinst.label;
					jumped = true;
				}
				break;
			case opcodes.bgt:
				if(getValue(cinst, 1) > getValue(cinst, 2))
				{
					system.pc = cinst.label;
					jumped = true;
				}
				break;
			case opcodes.not:
				setValue(cinst, 2, ~getValue(cinst, 1));
				break;
			case opcodes.jmp:
				system.pc = cinst.label;
				jumped = true;
				break;
			case opcodes.jrt:
				system.callstack[system.calltop++] = system.pc + 1;
				system.pc = cinst.label;
				jumped = true;
				break;
			case opcodes.ret:
				if(system.calltop === 0)
				{
					alert("A return was encountered without a linked jrt.");
					setRunning(false);
					return;
				}
				system.pc = system.callstack[--system.calltop];
				jumped = true;
				break;
			case opcodes.vsync:
				break;
			case opcodes.end:
				setRunning(false);
				system.pc = 0;
				return;
			default:
				alert("An invalid opcode was found while running. This is a bug");
				setRunning(false);
				return;
		}
		
		if(!jumped)
      {
			system.pc++;
      }
		else if (totalIterations & 0x800)
      {
			if(new Date().getTime() - start > 5000)
			{
				setRunning(false);
				alert("The program has run for 5 seconds without a vsync. To keep it from crashing, the program has been aborted");
				return;
			}
      }
	}
	
	if(system.instructions[system.pc].op == opcodes.vsync)
		system.pc++;
}

//The computer simulation loop (tied to animation of screen)
var simulating = false;
function simulate()
{
	simulating = true;
	if(!system.running)
	{
		simulating = false;
      stopChannels();
      clearEndingSounds();
      finalRender();
		return;
	}

	system.mbuffer[mbuffersize - 1] = new Date().getTime();
	system.bbuffer = system.bbuffertemp & 0xFF;
	run();		//Run until the program reaches a vsync
	render();
	tryGetMemory();	//This may impact performance
	
	// Request to do this again ASAP
	requestAnimationFrame(simulate);
}
