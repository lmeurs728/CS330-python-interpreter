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

function handleTokens(t) {
	const tokens = t.content;
	const token = tokens[0];
	if (token.type === "symbol") {
		if (token.content === "Module") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "body" && tokens[1].content[1].content)) {
				throw "body syntax error";
			}
			if (!(tokens[2].type === "list" && tokens[2].content[0].content === "type_ignores" && tokens[2].content[1].content.length === 0)) {
				throw "type_ignores syntax error";
			}
			return {
				variant: "mod",
				body: handleTokens(tokens[1].content[1].content[0]),
			}
		}
		if (token.content === "Expr") {
			if (!(tokens[1].type === "list" && tokens[1].content[0].content === "value" && tokens[1].content[1])) {
				throw "value syntax error";
			}
			return {
				variant: "expr_stmt",
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
				value: tokens[1].content[1],
				kind: tokens[2].content[1].content,
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

console.assert(sExpStr('a') === '{"type":"symbol","content":"a"}');
console.assert(sExpStr('"a"') === '{"type":"string","content":"\\"a\\""}');
console.assert(sExpStr('lance_meurs') === '{"type":"symbol","content":"lance_meurs"}');
console.assert(sExpStr('"my man"') === '{"type":"string","content":"\\"my man\\""}');
console.assert(sExpStr('1') === '{"type":"integer","content":"1"}');
console.assert(sExpStr('12345') === '{"type":"integer","content":"12345"}');
console.assert(sExpStr('(a b c)') === '{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"symbol","content":"c"}]}');
console.assert(sExpStr('((a b) c)') === '{"type":"list","content":[{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"}]},{"type":"symbol","content":"c"}]}');
console.assert(sExpStr('(c (a b))') === '{"type":"list","content":[{"type":"symbol","content":"c"},{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"}]}]}');
console.assert(sExpStr('((1) (2) 3)') === '{"type":"list","content":[{"type":"list","content":[{"type":"integer","content":"1"}]},{"type":"list","content":[{"type":"integer","content":"2"}]},{"type":"integer","content":"3"}]}');
console.assert(sExpStr('(c (a b e) d)') === '{"type":"list","content":[{"type":"symbol","content":"c"},{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"symbol","content":"e"}]},{"type":"symbol","content":"d"}]}'); // This test case doesn't work
console.assert(sExpStr('((a b (d)) (c))') === '{"type":"list","content":[{"type":"list","content":[{"type":"symbol","content":"a"},{"type":"symbol","content":"b"},{"type":"list","content":[{"type":"symbol","content":"d"}]}]},{"type":"list","content":[{"type":"symbol","content":"c"}]}]}');

const expected = '{"variant":"mod","body":{"variant":"expr_stmt","value":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"},"kind":"#f"}}}';
console.assert(interp("(Module [body ((Expr [value (Constant [value 5] [kind #f])]))] [type_ignores ()])") === expected);
const expected2 = '{"variant":"expr","type":"BinOp","left":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"},"kind":"#f"},"op":"Add","right":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"5"},"kind":"#f"}}';
console.assert(interp("(BinOp [left (Constant [value 5] [kind #f])] [op (Add)] [right (Constant [value 5] [kind #f])])") === expected2);
const basicUnary = "(UnaryOp [op (USub)] [operand (Constant [value 4] [kind #f])])";
console.assert(interp(basicUnary) === '{"variant":"expr","type":"UnaryOp","op":"USub","operand":{"variant":"expr","type":"Constant","value":{"type":"integer","content":"4"},"kind":"#f"}}');

console.log(interp(typeof process.argv[2] === "string" ? process.argv[2] : basicUnary));