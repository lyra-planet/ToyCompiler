export const TokenTypes = {
	ILLEGAL: -2,
	EOF: -1,

	LET: 0,
	IDENTIFIER: 1,
	ASSIGN_SIGN: 2,
	PLUS_SIGN: 3,
	INTEGER: 4,
	SEMICOLON: 5,
	IF: 6,
	ELSE: 7,

	MINUS_SIGN: 8,
	BANG_SIGN: 9,
	ASTERISK: 10,
	SLASH: 11,
	LT: 12,
	GT: 13,
	COMMA: 14,

	FUNCTION: 15,
	TRUE: 16,
	FALSE: 17,
	RETURN: 18,

	LEFT_BRACE: 19,
	RIGHT_BRACE: 20,
	EQ: 21,
	NOT_EQ: 22,
	LEFT_PARENT: 23,
	RIGHT_PARENT: 24,

	STRING: 25
}

export const KeywordMap = {
	"let": TokenTypes.LET,
	"fn": TokenTypes.FUNCTION,
	"true": TokenTypes.TRUE,
	"false": TokenTypes.FALSE,
	"if": TokenTypes.IF,
	"else": TokenTypes.ELSE,
	"return": TokenTypes.RETURN
}

class Token {
	constructor(type, literal, lineNumber) {
		this.tokenType = type
		this.literal = literal
		this.lineNumber = lineNumber
	}
}

class Lexer {
	constructor(sourceCode) {
		this.sourceCode = sourceCode
		this.position = 0
		this.readPosition = 0
		this.lineCount = 0
		this.ch = ''
		this.observer = null
		this.observerContext = null
	}

	setLexingObserver(o, context) {
		if (o !== null && o !== undefined) {
			this.observer = o
			this.observerContext = context
		}
	}

	readChar() {
		if (this.readPosition >= this.sourceCode.length) {
			this.ch = -1
		} else {
			this.ch = this.sourceCode[this.readPosition]
		}
		this.readPosition++
	}

	peekChar() {
		if (this.readPosition >= this.sourceCode.length) {
			return 0
		} else {
			return this.sourceCode[this.readPosition]
		}
	}

	readString() {
		// 越过开始的双引号
		this.readChar()
		let str = ""
		while (this.ch !== '"' && this.ch !== TokenTypes.EOF) {
			str += this.ch
			this.readChar()
		}

		if (this.ch !== '"') {
			return undefined
		}

		return str
	}

	skipWhiteSpaceAndNewLine() {
		// 忽略空格
		while (this.ch === ' ' || this.ch === '\t'
			|| this.ch === '\u00a0'
			|| this.ch === '\n') {
			if (this.ch === '\n') {
				this.lineCount++;
			}
			this.readChar()
		}
	}

	nextToken() {
		let tok
		let needReadChar = true;
		this.skipWhiteSpaceAndNewLine()
		const lineCount = this.lineCount
		this.position = this.readPosition

		switch (this.ch) {
			case '"':
				const str = this.readString()
				if (str === undefined) {
					tok = new Token(TokenTypes.ILLEGAL, undefined, lineCount)
				} else {
					tok = new Token(TokenTypes.STRING, str, lineCount)
				}
				break
			case '=':
				if (this.peekChar() === '=') {
					this.readChar()
					tok = new Token(TokenTypes.EQ, "==", lineCount)
				} else {
					tok = new Token(TokenTypes.ASSIGN_SIGN, "=", lineCount)
				}
				break
			case ';':
				tok = new Token(TokenTypes.SEMICOLON, ";", lineCount)
				break;
			case '+':
				tok = new Token(TokenTypes.PLUS_SIGN, "+", lineCount)
				break;
			case -1:
				tok = new Token(TokenTypes.EOF, "", lineCount)
				break;

			case '-':
				tok = new Token(TokenTypes.MINUS_SIGN, "-", lineCount)
				break;
			case '!':
				if (this.peekChar() === '=') {
					this.readChar()
					tok = new Token(TokenTypes.NOT_EQ, "!=", lineCount)
				} else {
					tok = new Token(TokenTypes.BANG_SIGN, "!", lineCount)
				}
				break;
			case '*':
				tok = new Token(TokenTypes.ASTERISK, "*", lineCount)
				break;
			case '/':
				tok = new Token(TokenTypes.SLASH, "/", lineCount)
				break;
			case '<':
				tok = new Token(TokenTypes.LT, "<", lineCount)
				break;
			case '>':
				tok = new Token(TokenTypes.GT, ">", lineCount)
				break;
			case ',':
				tok = new Token(TokenTypes.COMMA, ",", lineCount)
				break;
			case '{':
				tok = new Token(TokenTypes.LEFT_BRACE, "{", lineCount)
				break;
			case '}':
				tok = new Token(TokenTypes.RIGHT_BRACE, "}", lineCount)
				break;
			case '(':
				tok = new Token(TokenTypes.LEFT_PARENT, "(", lineCount)
				break;
			case ')':
				tok = new Token(TokenTypes.RIGHT_PARENT, ")", lineCount)
				break;

			default:
				let res = this.readIdentifier()
				if (res !== false) {
					const maybeKeyword = KeywordMap[res]
					
					if (KeywordMap[res] !== undefined) {
						tok = new Token(maybeKeyword, res, lineCount)
					} else {
						tok = new Token(TokenTypes.IDENTIFIER, res, lineCount)
					}
				} else {
					res = this.readNumber()
					if (res !== false) {
						tok = new Token(TokenTypes.INTEGER, res, lineCount)
					}
				}

				if (res === false) {
					tok = undefined
				}
				needReadChar = false

		}

		if (needReadChar === true) {
			this.readChar()
		}

		if (tok !== undefined) {
			this.notifyObserver(tok)
		}
		return tok
	}

	notifyObserver(token) {
		if (this.observer !== null) {
			this.observer.notifyTokenCreation(token,
				this.observerContext, this.position - 1,
				this.readPosition)
		}

	}


	isLetter(ch) {
		return ('a' <= ch && ch <= 'z') ||
			('A' <= ch && ch <= 'Z') ||
			(ch === '_')
	}

	readIdentifier() {
		let identifier = ""
		while (this.isLetter(this.ch)) {
			identifier += this.ch
			this.readChar()
		}

		if (identifier.length > 0) {
			return identifier
		} else {
			return false
		}
	}

	isDigit(ch) {
		return '0' <= ch && ch <= '9'
	}

	readNumber() {
		let number = ""
		while (this.isDigit(this.ch)) {
			number += this.ch
			this.readChar()
		}

		if (number.length > 0) {
			return number
		} else {
			return false
		}
	}

	lexing() {
		this.readChar()

		this.tokens = []
		let token = this.nextToken()
		while (token !== undefined &&
			token.tokenType !== TokenTypes.EOF) {
				this.tokens.push(token)
				
				token = this.nextToken()
		}
		this.tokens.push(token)
	}
}

export function tokenTypeToString(type) {
	switch (type) {
		case TokenTypes.EOF:
			return "end of file"
		case TokenTypes.LET:
			return "let"
		case TokenTypes.IDENTIFIER:
			return "identifier"
		case TokenTypes.ASSIGN_SIGN:
			return "assign sign"
		case TokenTypes.PLUS_SIGN:
			return "plus sign"
		case TokenTypes.INTEGER:
			return "integer"
		case TokenTypes.SEMICOLON:
			return "semicolon"
		case TokenTypes.IF:
			return "if"
		case TokenTypes.ELSE:
			return "else"
		case TokenTypes.MINUS_SIGN:
			return "minus sign"
		case TokenTypes.BANG_SIGN:
			return "!"
		case TokenTypes.ASTERISK:
			return "*"
		case TokenTypes.SLASH:
			return "slash"
		case TokenTypes.LT:
			return "<"
		case TokenTypes.GT:
			return ">"
		case TokenTypes.COMMA:
			return ","
		case TokenTypes.FUNCTION:
			return "fun"
		case TokenTypes.TRUE:
			return "true"
		case TokenTypes.FALSE:
			return "false"
		case TokenTypes.RETURN:
			return "return"
		case TokenTypes.LEFT_BRACE:
			return "{"
		case TokenTypes.RIGHT_BRACE:
			return "}"
		case TokenTypes.EQ:
			return "=="
		case TokenTypes.NOT_EQ:
			return "!="
		case TokenTypes.LEFT_PARENT:
			return "("
		case TokenTypes.RIGHT_PARENT:
			return ")"
		default:
			return "unknown token"
	}
}

export default Lexer
