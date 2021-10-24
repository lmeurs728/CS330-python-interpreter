function verifySymbol(testWord) {
	if (!(/^\w+.*$/.test(testWord))) {
		return false;
	}
	if (/^[0-9]+.*$/.test(testWord)) {
		return false;
	}
	return true;
}

function verifyInteger(testWord) {
	return /^[0-9]+.*$/.test(testWord);
}

function verifyString(testWord) {
	return /^".*".*$/.test(testWord);
}

function verifyFalse(testWord) {
	return /^#f.*$/.test(testWord);
}

function getAtom(input, i) {
	const word = input.slice(i);
	if (verifySymbol(word)) {
		const strWord = word + "";
		const displacement = /[\s)\]]/.test(strWord) ? strWord.search(/[\s)\]]/) : strWord.length;
		return {obj: {type: "symbol", content: strWord.slice(0, displacement)}, displacement};
	}
	if (verifyInteger(word)) {
		const strWord = word + "";
		const displacement = /[\s)\]]/.test(strWord) ? strWord.search(/[\s)\]]/) : strWord.length;
		return {obj: {type: "integer", content: strWord.slice(0, displacement)}, displacement};
	}
	if (verifyString(word)) {
		const displacement = word.slice(1).indexOf('"') + 2;
		return {obj: {type: "string", content: word.slice(0, displacement)}, displacement};
	}
	if (verifyFalse(word)) {
		return {obj: {type: "false", content:  word.slice(0, 2)}, displacement: 2};
	}
	throw "unexpected atom";
}

// Given input, i, and previous array
// Return s-exp
function getListHelper(input, i, previousList, isBracket) {
	// First check if at end of list
	if (input[i] === ')') {
		if (isBracket) {
			throw "Syntax Error, wrong bracket";
		}
		return {list: previousList, pos: i + 1};
	}
	if (input[i] === ']') {
		if (!isBracket) {
			throw "Syntax Error, wrong parenthesis";
		}
		return {list: previousList, pos: i + 1};
	}
	// Check if space
	const nextStringDisplacement = input[i] === ' ' ? 1 : 0;
	
	if (i + nextStringDisplacement >= input.length) {
		return {list: previousList, pos: i + 1};
	}

	const result = getSExp(input, i + nextStringDisplacement);
	const result2 = getListHelper(input, i + result.displacement + nextStringDisplacement, previousList, isBracket);
	return {list: [result.obj, ...result2.list], pos: result2.pos};
}

function getList(input, i, isBracket) {
	const result = getListHelper(input, i + 1, [], isBracket)
	return {obj: {type: "list", content: result.list}, pos: result.pos};
}

function getSExp(input, i) {
	if (i >= input.length) {
		throw "Index out of bounds";
	}
	const nextStringDisplacement = input[i] === ' ' ? 1 : 0;
	if (input[i] === '[') {
		const result = getList(input, i, true);
		return {obj: result.obj, displacement: result.pos - i};
	}
	if (input[i] === '(') {
		const result = getList(input, i, false);
		return {obj: result.obj, displacement: result.pos - i};
	}
	const result = getAtom(input, i + nextStringDisplacement);
	return {obj: result.obj, displacement: result.displacement};
}

function parse(input) {
	return getSExp(input, 0).obj;
}

function sExpStr(input) {
	return JSON.stringify(parse(input));
}

let hasDuplicate = (arr) => {
	var valueArr = arr.map(item => item.arg.content);
	return valueArr.some((item, idx) => valueArr.indexOf(item) != idx);
}

function handleTokens(t) {
	const tokens = t.content;
	const token = tokens[0];
	if (token.type === "symbol") {
		if (token.content === "Module") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "body" && tokens[1].content[1].content)) {
				throw "body syntax error";
			}
			const listLen =  tokens[1].content[1].content.length;
			if (!(tokens[1].content[1].content[0].content && tokens[1].content[1].content[listLen - 1].content)) {
				throw "fundef syntax error";
			}
			if (!(tokens[2].type === "list" && tokens[2].content[0].content === "type_ignores" && tokens[2].content[1].content.length === 0)) {
				throw "type_ignores syntax error";
			}
			const fundefs = tokens[1].content[1].content.map(func => {
				return handleTokens(func);
			});
			const hasDuplicate = fundefs.some((val, i) => fundefs.map(fundef => fundef.name).indexOf(val.name) !== i);
			if (hasDuplicate) {
				throw `(error static "duplicate function name")`;
			}
			return {
				variant: "mod",
				fundefs: fundefs.slice(0, listLen - 1),
				expr_stmt: fundefs[listLen - 1],
			}
		}
		if (token.content === "FunctionDef") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "name" && tokens[1].content[1])) {
				throw "name syntax error";
			}
			if (!(tokens[2].type === "list" && tokens[2].content[0].content === "args" && tokens[2].content[1])) {
				throw "args syntax error";
			}
			if (!(tokens[3].type === "list" && tokens[3].content[0].content === "body" && tokens[3].content[1])) {
				throw "body syntax error";
			}
			if (!(tokens[4].type === "list" && tokens[4].content[0].content === "decorator_list" && tokens[4].content[1])) {
				throw "decorator_list syntax error";
			}
			if (!(tokens[5].type === "list" && tokens[5].content[0].content === "returns" && tokens[5].content[1].content === "#f")) {
				throw "returns syntax error";
			}
			if (!(tokens[6].type === "list" && tokens[6].content[0].content === "type_comment" && tokens[6].content[1].content === "#f")) {
				throw "type_comment syntax error";
			}
			return {
				variant: "fundef",
				name: tokens[1].content[1].content,
				args: handleTokens(tokens[2].content[1]),
				body: handleTokens(tokens[3].content[1].content[0])
			}
		}
		if (token.content === "arguments") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "posonlyargs" && tokens[1].content[1])) {
				throw "posonlyargs syntax error";
			}
			if (!(tokens[2].type === "list" && tokens[2].content[0].content === "args" && tokens[2].content[1])) {
				throw "args syntax error";
			}
			if (!(tokens[3].type === "list" && tokens[3].content[0].content === "vararg" && tokens[3].content[1].content === "#f")) {
				throw "vararg syntax error";
			}
			if (!(tokens[4].type === "list" && tokens[4].content[0].content === "kwonlyargs" && tokens[4].content[1])) {
				throw "kwonlyargs syntax error";
			}
			if (!(tokens[5].type === "list" && tokens[5].content[0].content === "kw_defaults" && tokens[5].content[1])) {
				throw "kw_defaults syntax error";
			}
			if (!(tokens[6].type === "list" && tokens[6].content[0].content === "kwarg" && tokens[6].content[1].content === "#f")) {
				throw "kwarg syntax error";
			}
			if (!(tokens[7].type === "list" && tokens[7].content[0].content === "defaults" && tokens[7].content[1])) {
				throw "defaults syntax error";
			}
			const args = tokens[2].content[1].content.map(arg => {
				return handleTokens(arg);
			});
			if (hasDuplicate(args)) {
				throw '(error static "duplicate parameter")';
			}
			return {
				variant: "_arguments",
				args: args,
			}
		}
		if (token.content === "arg") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "arg" && tokens[1].content[1])) {
				throw "arg syntax error";
			}
			if (!(tokens[2].type === "list" && tokens[2].content[0].content === "annotation" && tokens[2].content[1].content === "#f")) {
				throw "annotation syntax error";
			}
			if (!(tokens[3].type === "list" && tokens[3].content[0].content === "type_comment" && tokens[3].content[1].content === "#f")) {
				throw "type_comment syntax error";
			}
			return {
				variant: "_arg",
				arg: tokens[1].content[1],
			}
		}
		if (token.content === "Return") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "value" && tokens[1].content[1])) {
				throw "value syntax error";
			}
			return {
				variant: "return_stmt",
				value: handleTokens(tokens[1].content[1]),
			}
		}
		if (token.content === "Expr") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "value" && tokens[1].content[1])) {
				throw "value syntax error";
			}
			return {
				variant: "expr",
				value: handleTokens(tokens[1].content[1])
			}
		}
		if (token.content === "BinOp") {
			if (!(tokens[1].content[0].content === "left" && tokens[1].content[1])) {
				throw "left syntax error";
			}
			if (!(tokens[2].content[0].content === "op" && tokens[2].content[1])) {
				throw "op syntax error";
			}
			if (!(tokens[3].content[0].content === "right" && tokens[3].content[1])) {
				throw "right syntax error";
			}
			return {
				variant: "expr",
				type: token.content,
				left: handleTokens(tokens[1].content[1]),
				op: handleTokens(tokens[2].content[1]),
				right: handleTokens(tokens[3].content[1])
			}
		}
		if (token.content === "UnaryOp") {
			if (!(tokens[1].content[0].content === "op" && tokens[1].content[1])) {
				throw "op syntax error";
			}
			if (!(tokens[2].content[0].content === "operand" && tokens[2].content[1])) {
				throw "operand syntax error";
			}
			return {
				variant: "expr",
				type: token.content,
				op: handleTokens(tokens[1].content[1]),
				operand: handleTokens(tokens[2].content[1]),
			}
		}
		if (token.content === "Call") {
			if (!(tokens[1].content[0].content === "func" && tokens[1].content[1])) {
				throw "func syntax error";
			}
			if (!(tokens[2].content[0].content === "args" && tokens[2].content[1])) {
				throw "args syntax error";
			}
			if (!(tokens[3].content[0].content === "keywords" && tokens[3].content[1])) {
				throw "keywords syntax error";
			}
			const args = tokens[2].content[1].content.map(arg => {
				return handleTokens(arg);
			});
			return {
				variant: "expr",
				type: token.content,
				func: handleTokens(tokens[1].content[1]),
				args: args, 
			}
		}
		if (token.content === "Constant") {
			if (!(tokens[1].content[0].content === "value" && tokens[1].content[1])) {
				throw "value syntax error";
			}
			if (!(tokens[2].content[0].content === "kind" && tokens[2].content[1].content === "#f")) {
				throw "kind syntax error";
			}
			return {
				variant: "expr",
				type: token.content,
				value: tokens[1].content[1]
			}
		}
		if (token.content === "Name") {
			if (!(tokens[1].content[0].content === "id" && tokens[1].content[1])) {
				throw "id syntax error";
			}
			if (!(tokens[2].content[0].content === "ctx" && tokens[2].content[1])) {
				throw "ctx syntax error";
			}
			return {
				variant: "name_expr",
				type: token.content,
				id: tokens[1].content[1].content,
			}
		}
		return token.content;
	}
	return {}
	
}

function interp(input) {
	const parsed = parse(input, 0);
	if (parsed.type === "list") {
		return JSON.stringify(handleTokens(parsed));
	}
	throw "Cannot interpret non-list module";
}

function getTokens(input) {
	const parsed = parse(input, 0)
	return handleTokens(parsed)
}

// Surface functions
// Binary operations
function sub(left, right) {
	return left - right;
}
// Unary operations
function uSub(operand) {
	return -operand;
}

// Core functions
// Binary operations
function add(left, right) {
	return left + right;
}
function mult(left, right) {
	return left * right;
}
// Unary operations
function uAdd(operand) {
	return +operand;
}

function createFunc(def) {
	return {
		ret: () => def.body.value, // value is an expression
		argNames: def.args.args.map(arg => arg.arg.content),
	}
}

// TODO: Add functionality for 0 - infinite functions

// Actual interpreter
function interpretTokens(tokens, scope) {
	if (tokens.variant === "mod") {
		newScope = {
			variables: scope.variables,
			functions: tokens.fundefs.reduce((o, fundef) => ({
				...o,
				[fundef.name]: createFunc(fundef)
			}),
			{...scope.functions})
		}
		return interpretTokens(tokens.expr_stmt, newScope);
	}
	if (tokens.variant === "expr") {
		if (tokens.type === "BinOp") {
			const left = interpretTokens(tokens.left, scope);
			const right = interpretTokens(tokens.right, scope);
			if (tokens.op === "Add") {
				return add(left, right);
			}
			if (tokens.op === "Sub") {
				return sub(left, right);
			}
			if (tokens.op === "Mult") {
				return mult(left, right);
			}
		}
		if (tokens.type === "UnaryOp") {
			const operand = interpretTokens(tokens.operand, scope);
			if (tokens.op === "UAdd") {
				return uAdd(operand);
			}
			if (tokens.op === "USub") {
				return uSub(operand);
			}
		}
		if (tokens.type === "Call") {
			const funcName = tokens.func.id;
			if (!scope.functions[funcName]) {
				throw '(error dynamic "unknown function")';
			}
			// Loop through our function's arguments and 
			// assign each one to the expression in order
			// We need to make a variables object

			newScope = {
				variables: scope.functions[funcName].argNames.reduce((o, argName, i) => {
					if (!tokens.args[i]) {
						throw '(error dynamic "arity mismatch")'
					}
					return {
						...o,
						[argName]: interpretTokens(tokens.args[i], scope)
					}
				}, scope.variables),
				functions: scope.functions
			}
			return interpretTokens(scope.functions[funcName].ret(), newScope);
		}
		if (tokens.type === "Constant") {
			return Number(tokens.value.content);
		}
	}
	if (tokens.variant === "name_expr") {
		if (!scope.variables[tokens.id]) {
			throw '(error dynamic "unbound variable")';
		}
		return scope.variables[tokens.id]; // Return whatever value we have for that id in the lookup table
	}
}

function interp2(input) {
	return `(value ${interpretTokens(getTokens(input))})`;
}

// Translates between surface syntax AST and core syntax AST
function desugar(tokens) {
	if (tokens.variant === "mod") {
		return {
			variant: "mod",
			fundefs: tokens.fundefs.map(fundef => desugar(fundef)),
			expr_stmt: desugar(tokens.expr_stmt.value),
		}
	}
	if (tokens.variant === "fundef") {
		return {
			variant: "fundef",
			name: tokens.name,
			args: tokens.args,
			body: desugar(tokens.body)
		}
	}
	if (tokens.variant === "_arguments") {
		return tokens;
	}
	if (tokens.variant === "_arg") {
		return tokens;
	}
	if (tokens.variant === "return_stmt") {
		return {
			variant: "return_stmt",
			value: desugar(tokens.value),
		}
	}
	if (tokens.variant === "expr") {
		const expr = {variant:"expr"};
		if (tokens.type === "BinOp") {
			const binOp = {type: "BinOp", left: tokens.left};
			if (tokens.op === "Add") {
				return tokens;
			}
			if (tokens.op === "Sub") { // Negates the second one and then adds them
				return {...expr, ...binOp, op: "Add", right: {...expr, type: "BinOp", left: {...expr, type: "Constant", value: {type: "integer", content: "-1"}}, right: tokens.right, op: "Mult"}};
			}
			if (tokens.op === "Mult") {
				return tokens;
			}
		}
		if (tokens.type === "UnaryOp") {
			if (tokens.op === "UAdd") {
				return tokens;
			}
			if (tokens.op === "USub") {
				return {...expr, type: "BinOp", left: {...expr, type: "Constant", value: {type: "integer", content: "-1"}}, right: tokens.operand, op: "Mult"};
			}
		}
		if (tokens.type === "Call") {
			return {
				variant: "expr",
				type: "Call",
				func: tokens.func,
				args: tokens.args.map(arg => desugar(arg))
			}
		}
		if (tokens.type === "Constant") {
			return tokens;
		}
	}
	if (tokens.variant === "name_expr") {
		return tokens;
	}
	throw "Cannot desugar unrecognized token variant";
}

function interp3(input) {
	try {
		const desugaredTokens = desugar(getTokens(input));
		const initialEnv = {
			functions: {},
			variables: {},
		};
		return `(value ${interpretTokens(desugaredTokens, initialEnv)})`;
	}
	catch(e) {
		return e;
	}
}

// console.assert(sExpStr('a') === '{"type":"symbol","content":"a"}');
// console.assert(sExpStr('"a"') === '{"type":"string","content":"\\"a\\""}');
// console.assert(sExpStr('lance_meurs') === '{"type":"symbol","content":"lance_meurs"}');
// console.assert(sExpStr('"my man"') === '{"type":"string","content":"\\"my man\\""}');
// console.assert(sExpStr('1') === '{"type":"integer","content":"1"}');
// console.assert(sExpStr('12345') === '{"type":"integer","content":"12345"}');
// console.assert(sExpStr('(a b c)') === '{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"symbol","content":"c"}]}');
// console.assert(sExpStr('((a b) c)') === '{"type":"list","content":[{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"}]},{"type":"symbol","content":"c"}]}');
// console.assert(sExpStr('(c (a b))') === '{"type":"list","content":[{"type":"symbol","content":"c"},{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"}]}]}');
// console.assert(sExpStr('((1) (2) 3)') === '{"type":"list","content":[{"type":"list","content":[{"type":"integer","content":"1"}]},{"type":"list","content":[{"type":"integer","content":"2"}]},{"type":"integer","content":"3"}]}');
// console.assert(sExpStr('(c (a b e) d)') === '{"type":"list","content":[{"type":"symbol","content":"c"},{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"symbol","content":"e"}]},{"type":"symbol","content":"d"}]}'); // This test case doesn't work
// console.assert(sExpStr('((a b (d)) (c))') === '{"type":"list","content":[{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"list","content":[{"type":"symbol","content":"d"}]}]},{"type":"list","content":[{"type":"symbol","content":"c"}]}]}');

// const expected = '{"variant":"mod","body":{"variant":"expr_stmt","value":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"}}}}';
// console.assert(interp("(Module [body ((Expr [value (Constant [value 5] [kind #f])]))] [type_ignores ()])") === expected);
// const expected2 = '{"variant":"expr","type":"BinOp","left":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"}},"op":"Add","right":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"}}}';
// console.assert(interp("(BinOp [left (Constant [value 5] [kind #f])] [op (Add)] [right (Constant [value 5] [kind #f])])") === expected2);
const basicUnary = "(UnaryOp [op (USub)] [operand (Constant [value 0] [kind #f])])";
// console.assert(interp(basicUnary) === '{"variant":"expr","type":"UnaryOp","op":"USub","operand":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"0"}}}');

// // console.log(interp(typeof process.argv[2] === "string" ? process.argv[2] : basicUnary)); // Project 1

// // Constant
// console.assert(interp2("(Module [body ((Expr [value (Constant [value 5] [kind #f])]))] [type_ignores ()])") === "(value 5)");
// // Binaries
// console.assert(interp2("(BinOp [left (Constant [value 21] [kind #f])] [op (Add)] [right (Constant [value 47] [kind #f])])") === "(value 68)");
// console.assert(interp2("(BinOp [left (Constant [value 723] [kind #f])] [op (Sub)] [right (Constant [value 42] [kind #f])])") === "(value 681)");
// console.assert(interp2("(BinOp [left (Constant [value 12] [kind #f])] [op (Mult)] [right (Constant [value 4] [kind #f])])") === "(value 48)");
// // Combo
// console.assert(interp2("(BinOp [left (UnaryOp [op (USub)] [operand (Constant [value 4] [kind #f])])] [op (Mult)] [right (Constant [value 4] [kind #f])])") === "(value -16)");
// // Unaries
// console.assert(interp2("(UnaryOp [op (USub)] [operand (Constant [value 4] [kind #f])])") === "(value -4)");
// console.assert(interp2(basicUnary) === "(value 0)");

// // console.log(interp2(typeof process.argv[2] === "string" ? process.argv[2] : basicUnary)); // Project 2

// // Constant
// console.assert(interp3("(Module [body ((Expr [value (Constant [value 5] [kind #f])]))] [type_ignores ()])") === "(value 5)");
// // Binaries
// console.assert(interp3("(BinOp [left (Constant [value 21] [kind #f])] [op (Add)] [right (Constant [value 47] [kind #f])])") === "(value 68)");
// console.assert(interp3("(BinOp [left (Constant [value 723] [kind #f])] [op (Sub)] [right (Constant [value 42] [kind #f])])") === "(value 681)");
//console.assert(interp3("(BinOp [left (Constant [value 12] [kind #f])] [op (Mult)] [right (Constant [value 4] [kind #f])])") === "(value 48)");
// // Combo
// console.assert(interp3("(BinOp [left (UnaryOp [op (USub)] [operand (Constant [value 4] [kind #f])])] [op (Mult)] [right (Constant [value 4] [kind #f])])") === "(value -16)");
// // Unaries
// console.assert(interp3("(UnaryOp [op (USub)] [operand (Constant [value 4] [kind #f])])") === "(value -4)");
// console.assert(interp3(basicUnary) === "(value 0)");

const readline  = require("readline")
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});
rl.on('line', function(line){
    console.log(interp3(typeof line === "string" ? line : basicUnary)); // Project 3
})



// const expected = '{"variant":"mod","body":{"variant":"expr_stmt","value":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"}}}}'; 

// Zero functions
console.assert(interp3('(Module [body ((Expr [value (Constant [value 7] [kind #f])]))] [type_ignores ()])') === '(value 7)');

// One function
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Constant [value 4] [kind #f]))] [keywords ()])]))] [type_ignores ()])')
	=== '(value 4)'
);

// Unknown Function
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Yolo] [ctx (Load)])] [args ((Constant [value 4] [kind #f]))] [keywords ()])]))] [type_ignores ()])')
	=== '(error dynamic "unknown function")'
);

// Unbound Variable
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id yolo] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Constant [value 4] [kind #f]))] [keywords ()])]))] [type_ignores ()])')
	=== '(error dynamic "unbound variable")'
);

// Duplicate Function Name
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Constant [value 4] [kind #f]))] [keywords ()])]))] [type_ignores ()])') 
	=== '(error static "duplicate function name")'
);

// Two Functions
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (FunctionDef [name Meurs] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Name [id myArg] [ctx (Load)]))] [keywords ()])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Constant [value 5] [kind #f]))] [keywords ()])]))] [type_ignores ()])') 
	=== '(value 5)'
);

// Two args
console.assert(interp3('(Module [body ((FunctionDef [name Lance] [args (arguments [posonlyargs ()] [args ((arg [arg myArg]' +
	' [annotation #f] [type_comment #f]) (arg [arg myArg2] [annotation #f] [type_comment #f]))] [vararg #f] [kwonlyargs ()] [kw_defaults ()] [kwarg #f] [defaults ()])]' + 
	' [body ((Return [value (Name [id myArg] [ctx (Load)])]))] [decorator_list ()] [returns #f] [type_comment #f])' +
	' (Expr [value (Call [func (Name [id Lance] [ctx (Load)])] [args ((Constant [value 4] [kind #f]) (Constant [value 6] [kind #f]))] [keywords ()])]))] [type_ignores ()])')
	=== '(value 4)'
);