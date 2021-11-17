//This file contains the code which "transcodes" the user written
//code into something that's easier for the simulator to use.
//If I were doing a full simulation, I'd store it into something
//resembling instruction memory, but since this is just a functional
//simulator, it breaks the instructions into objects

//These regex patterns are all used to recognize code and 
//capture various elements of instructions (such as the operands)
var comment = /#.*\n?/g;
var labelOnly = "([a-zA-Z_0-9]+)";
var operand = "(\\*?[mvb\\-+]?\\d+)";
var operandExtra = "(\\*?)([mvb\\-+]?)(\\d+)";
var operandExp = new RegExp(operandExtra);
var label = new RegExp("^" + labelOnly + ":$");
var triop = new RegExp("^(add|sub|mul|div|mod|and|or|xor|rs|ls)\\s+"+operand+"\\s+"+operand+"\\s+"+operand+"$");
var duop = new RegExp("^(not)\\s+"+operand+"\\s+"+operand+"$");
var branch = new RegExp("^(beq|bne|bgt)\\s+"+operand+"\\s+"+operand+"\\s+"+labelOnly+"$");
var jump = new RegExp("^(jmp|jrt)\\s+"+labelOnly+"$");
var vsync = /^vsync$/;
var ret = /^ret$/;
var macromulti = /\s*!(@[a-zA-Z_0-9]+)\s*([^!]+)!\s*\n/;
var macro = /(@[a-zA-Z_0-9]+)/;

//DO NOT CHANGE THESE! This allows the simulator to perform a switch
//statement on the opcodes instead of a large if-elseif structure.
var opcodes =
{
	add: 1,
	sub: 2,
	mul: 3,
	div: 4,
	mod: 5,
	and: 6,
	or:  7,
	xor: 8,
	rs:  9,
	ls:  10,
	not: 11,
	beq: 12,
	jmp: 13,
	vsync: 14,
	jrt: 15,
	ret: 16,
	bgt: 17,
	bne: 18,
	end: 255
};

//DO NOT CHANGE THESE! These aren't really necessary, but it's
//easier to compare numbers than strings for me
var accessTypes =
{
	m: 0,
	v: 1,
	b: 2,
	"-": 3,
	"+": 3
};

//Found somewhere on stackoverflow (sorry, I don't remember exactly where).
//This removes all of a given value from an array. Used to remove empty
//lines from the output.
Array.prototype.clean = function(deleteValue) 
{
  for (var i = 0; i < this.length; i++) 
  {
    if (this[i] == deleteValue) 
	{         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

//Performs the trim operation on all array elements. A generic function
//would have been better, but I was lazy
Array.prototype.trimAll = function()
{
  for (var i = 0; i < this.length; i++) 
  {
	this[i] = this[i].trim();
  }
  return this;
};

//This is it: the main function which transcodes text code into
//objects! If the function runs all the way through, that means
//the simulator is loaded
function loadCode()
{
	//Completely halt any previous simulation and clear everything
	//from the system.
	clearHaltSystem();
	
	//Get rid of comments while pulling the code from the editor
	var allCode = myCodeMirror.getValue().replace(comment, '\n');
	
	//Oops, there wasn't any code!
	if(!allCode || allCode.trim() == "")
	{
		alert("Error: No code found!");
		return;
	}
	
	//First, find all the defined macros
	var macros = {};
	var foundReplacement = false;
	do	//This repeats for every macro found
	{
		foundReplacement = false;
		
		//Found a macro definition
		if(macromulti.test(allCode))
		{
			//Grab all the important parts of the macro definition
			var match = macromulti.exec(allCode);
			
			//We already have a macro by this name, so fail
			if(macros.hasOwnProperty(match[1]))
			{
				highlightBadLine(match[1]);
				alert("Duplicate macro: \n\n" + match[1]);
				return;
			}
			
			//Add the macro name - definition pair to the macro list
			macros[match[1]] = match[2].trim();
			
			//Get rid of the macro definition from the code
			allCode = allCode.replace(macromulti, '\n');
			foundReplacement = true;
		}
	}while(foundReplacement);	//Repeat until we haven't found any more macros.
	
	//Now replace the macros with definitions
	var macrosReplaced = 0;
	var macroWasfound = false;
	do	//Once again, repeats for every macro use
	{
		macroWasFound = false;
		
		//Found a macro use
		if(macro.test(allCode))
		{
			//Pull important field (name) from macro
			var match = macro.exec(allCode);
			
			//Oops, couldn't find the macro in the list!
			if(!macros.hasOwnProperty(match[1]))
			{
				highlightBadLine(match[1]);
				alert("Cannot find macro:\n\n" + match[1]);
				return;
			}
			
			//Yadda yadda replace macro call with actual macro code
			allCode = allCode.replace(macro, macros[match[1]]);
			macrosReplaced++;
			macroWasFound = true;
		}
		
		//I don't want to spend too much time replacing macros, OR
		//there could be an infinite macro loop, so this will stop it.
		if(macrosReplaced > 100000)
		{
			alert("ERROR: Too many macros! Max macro replacements: 100000");
			return;
		}
		
	}while(macroWasFound);
	
	//Now try to split up the input into lines (for decoding)
	var codeLines = allCode.split("\n").trimAll().clean("");
	if(codeLines.length == 0)
	{
		alert("Error: No code found! (this shouldn't happen, this is a bug)");
		return;
	}
	
	//Next, create a label list
	var labels = {};
	for(var i = 0; i < codeLines.length; i++)
	{
		//Found a label
		if(label.test(codeLines[i]))
		{
			//Grab the name of the label
			var labelLink = codeLines[i].replace(/:/g,'');
			
			//Already have this label defined elsewhere
			if(labels.hasOwnProperty(labelLink))
			{
				highlightBadLine(codeLines[i]);
				alert("Duplicate label: \n\n" + labelLink);
				return;
			}
			
			//Store the label/PC pairing and remove the label.
			labels[labelLink] = i;
			codeLines.splice(i, 1);
			i--;
		}
	}
	
	//Now for the real fun! "Assemble" that code, yo!
	for(var i=0; i < codeLines.length; i++)
	{
		var match;
		
		if (triop.test(codeLines[i]))
		{
			match = triop.exec(codeLines[i]);
			
			system.instructions[i] = {};
			system.instructions[i].op = opcodes[match[1]];
			
			if(!decodeOperand(i, 1, 2, match) || !decodeOperand(i, 2, 3, match)
				|| !decodeOperand(i, 3, 4, match))
			{
				highlightBadLine(codeLines[i]);
				return;
			}
			
			if(system.instructions[i].opr3Type > 1)
			{
				highlightBadLine(codeLines[i]);
				alert("The last operand is not a storage type:\n\n" + codeLines[i]);
				return;
			}
		}
		else if (duop.test(codeLines[i]))
		{
			match = duop.exec(codeLines[i]);
			
			system.instructions[i] = {};
			system.instructions[i].op = opcodes[match[1]];
			
			if(!decodeOperand(i, 1, 2, match) || !decodeOperand(i, 2, 3, match))
			{
				highlightBadLine(codeLines[i]);
				return;
			}
			
			if(system.instructions[i].opr2Type > 1)
			{
				highlightBadLine(codeLines[i]);
				alert("The last operand is not a storage type:\n\n" + codeLines[i]);
				return;
			}
		}
		else if (branch.test(codeLines[i]))
		{
			match = branch.exec(codeLines[i]);
			
			if(!labels.hasOwnProperty(match[4]))
			{
				highlightBadLine(codeLines[i]);
				alert("Cannot find label in instruction:\n\n" + match[0]);
				return;
			}
			
			system.instructions[i] = {};
			system.instructions[i].op = opcodes[match[1]];
			system.instructions[i].label = labels[match[4]];
			
			if(!decodeOperand(i, 1, 2, match) || !decodeOperand(i, 2, 3, match))
			{
				highlightBadLine(codeLines[i]);
				return;
			}
		}
		else if (jump.test(codeLines[i]))
		{
			match = jump.exec(codeLines[i]);
			
			if(!labels.hasOwnProperty(match[2]))
			{
				highlightBadLine(codeLines[i]);
				alert("Cannot find label in instruction:\n\n" + match[0]);
				return;
			}
			system.instructions[i] = {};
			system.instructions[i].op = opcodes[match[1]];
			system.instructions[i].label = labels[match[2]];
		}
		else if (vsync.test(codeLines[i]))
		{
			system.instructions[i] = { op: opcodes["vsync"] };
		}
		else if (ret.test(codeLines[i]))
		{
			system.instructions[i] = { op: opcodes["ret"] };
		}
		else
		{
			highlightBadLine(codeLines[i]);
			alert("Cannot parse text:\n\n" + codeLines[i]);
			return;
		}
		
		system.instructions[i].original = codeLines[i];
	}
	
	system.instructions[codeLines.length] = {};
	system.instructions[codeLines.length].op = opcodes["end"];
	
	setLoaded(true);
}

//Eww, bad functions are bad! This function takes an instruction
//portion and looks through the editor to find the line it resides
//on. If an error occurs, it'll call this function so it'll highlight
//the bad line.
function highlightBadLine(badInstruction)
{
	var allLines = myCodeMirror.getValue().split("\n");
	for(var i=0; i < allLines.length; i++)
	{
		if(allLines[i].indexOf(badInstruction) > -1)
		{
			myCodeMirror.setCursor({line: i, ch : 1});
			return;
		}
	}
}

//This pulls the operands out and encodes them into objects. Note
//that for this function, "instruction" is basically the PC of the 
//current instruction for decoding.
function decodeOperand(instruction, operand, place, match)
{
	var match2 = operandExp.exec(match[place]);
	
	if(!match2[2])
		match2[2] = "+";
	
	var pointer = (match2[1] ? true : false);
	var optype = accessTypes[match2[2]];
	var opvalue = Number(match2[3]) * (match2[2] == "-" ? -1 : 1);
	
	//The next section is just a whole bunch of error checking. Maybe
	//the user entered something that the simulator won't like... in that
	//case, it's better to catch it now than during simulation.
	if(match2[2] == "v" && opvalue > vbuffersize - 1)
	{
		alert("Video memory does not extend beyond " + (vbuffersize - 1) + ":\n\n" + match[0]);
		return false;
	}
	if(match2[2] == "m" && opvalue > mbuffersize - 1)
	{
		alert("RAM does not extend beyond " + (mbuffersize - 1) + ":\n\n" + match[0]);
		return false;
	}
	if(match2[2] == "b" && opvalue > 0)
	{
		alert("Button memory only accessible from b0:\n\n" + match[0]);
		return false;
	}
	if(optype == 3 && (opvalue < -32768 || opvalue > 32767))
	{
		alert("Literal values have a limited range of -32768 to 32767:\n\n" + match[0]);
		return false;
	}
	if(pointer && opvalue < 0)
	{
		alert("Pointer value cannot be negative:\n\n" + match[0]);
		return false;
	}
	if(opvalue > 65535)
	{
		alert("Value too large:\n\n" + match[0]);
		return false;
	}
	
	//Save decoded fields in the instruction object
	system.instructions[instruction]["opr" + operand + "IsPointer"] = pointer;
	system.instructions[instruction]["opr" + operand + "Type"] = optype;
	system.instructions[instruction]["opr" + operand] = opvalue;
	
	return true;
}