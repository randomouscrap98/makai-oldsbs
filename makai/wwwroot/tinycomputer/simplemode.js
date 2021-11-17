CodeMirror.defineSimpleMode("simplemode", {
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    {regex: /\b(?:add|sub|mul|div|mod|and|or|xor|rs|ls|not|beq|bne|bgt|jmp|jrt|ret)\b/,
     token: "keyword"},
    {regex: /[-+]?(?:\d+)/i,
     token: "number"},
    {regex: /#.*/, 
	 token: "comment"},
    {regex: /v\d+/, 
	 token: "atom"},
	{regex: /m\d+/, 
	 token: "variable-2"},
	{regex: /b0|mp0|vp0/, 
	 token: "variable-3"},
	{regex: /[a-zA-Z_0-9]+:/,
	 token: "string"},
	{regex: /!?@[a-zA-Z_0-9]*/,
	 token: "atom"},
	{regex: /!/,
	 token: "atom"}
  ]
});