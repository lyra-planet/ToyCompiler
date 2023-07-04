import { TokenTypes,tokenTypeToString } from "./lexer"
class Node {
    constructor(token) {
        this.token = token
    }
    describe() {
        return null
    }
}

class Statement extends Node {
    constructor(token) {
        super(token)
        this.token = token
        this.type = "Statement"
    }
}

class StringLiteral extends Node {
    constructor(token) {
        super(token)
        this.token = token
        this.type = "String"
    }
    describe(){
        return this.token.literal
    }
}

class Expression extends Node {
    constructor(token) {
        super(token)
        this.token = token
        this.type = "Expression"
    }
    expressionNode() {
        return this
    }
    describe(){
        return this.token.literal
    }
}

class Identifier extends Expression {
    constructor(token) {
        super(token)
        this.token = token
        this.value = ""

        this.type = "Identifier"
    }
    describe(){
        return this.token.literal
    }
}

class LetStatement extends Statement {
    constructor(token, identifier, expression) {
        super(token)
        this.token = token
        this.name = identifier
        this.value = expression



        this.type = "LetStatement"
    }
    describe(){
        let s = "This is a Let statement, left is an identifier: "
        s += this.name.describe()
        s += "\nRight size is value of \n"
        s += this.value.describe()
        s += "\n===================="
        return s
    }
}

class ReturnStatement extends Statement {
    constructor(token,expression) {
        super(token)
        this.token = token
        this.expression = expression

        this.type = "ReturnStatement"
    }
    describe(){
        let s = "return with " + this.expression.describe()
        return s
    }
}


class ExpressionStatement extends Statement {
    constructor(token,expression) {
        super(token)
        this.token = token
        this.expression = expression

        this.type = "ExpressionStatement"
    }
    describe(){
        let s = "expression: " + this.expression.describe()
        return s
    }
}

class PrefixExpression extends Expression {
    constructor(token, operator, expression) {
        super(token)
        this.token = token
        this.operator = operator
        this.right = expression

        this.type = "PrefixExpression"
    }
    describe(){
        let s = "(" + this.operator + this.right.describe() + " )"
        return s
    }
}

class InfixExpression extends Expression {
    constructor(token,leftExpression,operator,rightExpression) {
        super(token)
        this.token = token
        this.left = leftExpression
        this.operator = operator
        this.right = rightExpression

        this.type = "InfixExpression"
    }
    describe(){
        let s = "(" + this.left.describe() + " " + this.operator
            + this.right.describe() + ")"
        return s
    }
}

class IntegerLiteral extends Expression {
    constructor(token,value) {
        super(token)
        this.token = token
        this.value = value
        this.type = "Integer"
    }
    describe(){
        let s = "Integer value is: " + this.token.literal
        return s 
    }
}

class BooleanLiteral extends Expression {
    constructor(token,value) {
        super(token)
        this.token = token
        this.value = value

        this.type = "Boolean"
    }
    describe(){
        let s = "Boolean token with value of " + this.value
        return s
    }
}

class BlockStatement extends Statement {
    constructor(token,statements) {
        super(token)
        this.token = token
        this.statements = statements


        this.type = "BlockStatement"
    }
    describe(){
        let s = ""
        for (let i = 0; i < this.statements.length; i++) {
            s += this.statements[i].describe()
            s += "\n"
        }
       return s
    }
}

class IfExpression extends Expression {
    constructor(token,condition,consequence,alternative) {
        super(token)
        this.token = token
        this.condition = condition
        this.consequence = consequence
        this.alternative = alternative
        this.type = "IfExpression"
    }
    describe(){
        let s = "if expression width condition: " +
            this.condition.describe()
        s += "\n statements in if block are: "
        s += this.consequence.describe()
        if (this.alternative) {
            s += "\n statements in else block are: "
            s += this.alternative.describe()
        }
        return s
    }
}

class FunctionLiteral extends Expression {
    constructor(token,parameters,body) {
        super(token)
        this.token = token
        this.parameters = parameters
        this.body = body



        this.type = "FunctionLiteral"
    }
    describe(){
        let s = "It is a nameless function,"
        s += "input parameters are: ( "
        for (let i = 0; i < this.parameters.length; i++) {
            s += this.parameters[i].describe()
            s += i===this.parameters.length-1 ? "":", "
        }
        s += " )\n"
        s += "statements in function body are : {\n"
        s += this.body.describe()
        s += "}"
        return s
    }
}

class CallExpression extends Expression {
    constructor(token,func,args) {
        super(token)
        this.token = token
        this.function = func
        this.arguments = args
        this.type = "CallExpression"
    }   
    describe(){
        let s = "It is a function call : " +
            this.function.describe()
        s += "\nIt is input parameters are: ( "
        for (let i = 0; i < this.arguments.length; i++) {
            s += this.arguments[i].describe()
            s += i===this.arguments.length-1 ? "":", "
        }
        s += " )"
        return s
    }
}

class Program {
    constructor() {
        this.statements = []
        this.type = "Program"
    }
    describe(){
        let s = ""
        for (let i = 0; i < this.statements.length; i++) {
            s += this.statements[i].describe()
            s += "\n"
        }
        return s
    }
}
//运算符优先级
const precedencesMap={
    LOWEST:0,
    EQUALS:1,
    LESS_GREATER:2,
    SUM:3,
    PRODUCT:4,
    PREFIX:5,
    CALL:6,
}
class CompilerParser {
    constructor(lexer) {
        this.lexer = lexer
        this.lexer.lexing()
        this.tokenPos = 0
        this.curToken = null
        this.peekToken = null
        this.nextToken()
        this.nextToken()
        this.program = new Program()

        this.initPrecedencesMap()
        this.registerInfixMap()
        this.registerPrefixMap()
    }

    initPrecedencesMap() {
        this.precedencesMap = {}
        this.precedencesMap[TokenTypes.EQ] = precedencesMap.EQUALS
        this.precedencesMap[TokenTypes.NOT_EQ] = precedencesMap.EQUALS
        this.precedencesMap[TokenTypes.LT] = precedencesMap.LESS_GREATER
        this.precedencesMap[TokenTypes.GT] = precedencesMap.LESS_GREATER
        this.precedencesMap[TokenTypes.PLUS_SIGN] = precedencesMap.SUM
        this.precedencesMap[TokenTypes.MINUS_SIGN] = precedencesMap.SUM
        this.precedencesMap[TokenTypes.SLASH] = precedencesMap.PRODUCT
        this.precedencesMap[TokenTypes.ASTERISK] = precedencesMap.PRODUCT
        this.precedencesMap[TokenTypes.LEFT_PARENT] = precedencesMap.CALL
    }

    peekPrecedence() {
        let p = this.precedencesMap[this.peekToken.tokenType]
        
        if (p !== undefined) {
            return p
        }

        return precedencesMap.LOWEST
    }

    curPrecedence() {
        let p = this.precedencesMap[this.curToken.tokenType]
        if (p !== undefined) {
            return p
        }

        return precedencesMap.LOWEST
    }

    registerInfixMap() {
        this.infixParseFns = {}
        this.infixParseFns[TokenTypes.PLUS_SIGN] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.MINUS_SIGN] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.SLASH] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.ASTERISK] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.EQ] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.NOT_EQ] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.LT] =
            this.parseInfixExpression
        this.infixParseFns[TokenTypes.GT] =
            this.parseInfixExpression

        this.infixParseFns[TokenTypes.LEFT_PARENT] =
            this.parseCallExpression
    }
    registerPrefixMap() {
        this.prefixParseFns = {}
        this.prefixParseFns[TokenTypes.IDENTIFIER] =
            this.parseIdentifier
        this.prefixParseFns[TokenTypes.INTEGER] =
            this.parseIntegerLiteral
        this.prefixParseFns[TokenTypes.BANG_SIGN] =
            this.parsePrefixExpression
        this.prefixParseFns[TokenTypes.MINUS_SIGN] =
            this.parsePrefixExpression

        this.prefixParseFns[TokenTypes.TRUE] =
            this.parseBoolean
        this.prefixParseFns[TokenTypes.FALSE] =
            this.parseBoolean
        this.prefixParseFns[TokenTypes.LEFT_PARENT] =
            this.parseGroupedExpression
        this.prefixParseFns[TokenTypes.IF] =
            this.parseIfExpression
        this.prefixParseFns[TokenTypes.FUNCTION] =
            this.parseFunctionLiteral

        this.prefixParseFns[TokenTypes.STRING] =
            this.parseStringLiteral

    }
    parseProgram() {
        while (this.curToken.tokenType !== TokenTypes.EOF) {
            const stmt = this.parseStatement()
            if (stmt !== null) {
                this.program.statements.push(stmt)
            }
            this.nextToken()
        }
        return this.program
    }

    parseStatement() {
        switch (this.curToken.tokenType) {
            
            case TokenTypes.LET:
                return this.parseLetStatement()
            case TokenTypes.RETURN:
                return this.parseReturnStatement()
            default:
                return this.parseExpressionStatement()
        }
    }

    parseExpressionStatement() {
        const token = this.curToken
        const expression = this.parseExpression(precedencesMap.LOWEST)

        const stmt = new ExpressionStatement(token, expression)
        if (this.peekTokenIs(TokenTypes.SEMICOLON)) {
            this.nextToken()
        }

        return stmt
    }

    parseExpression(precedence) {
        
        const prefix = this.prefixParseFns[this.curToken.tokenType]
        if (!prefix) {
            throw new Error("no parsing function found for token " +
            this.curToken.literal)
        }
        
        let leftExp = prefix(this)
        while (this.peekTokenIs(TokenTypes.SEMICOLON) !== true && this.peekTokenIs(TokenTypes.EOF) !== true && precedence < this.peekPrecedence()) {
            
            const infix = this.infixParseFns[this.peekToken.tokenType]
            if (infix === null) {
                return leftExp
            }
            this.nextToken()
            leftExp = infix(this, leftExp)

        }
        return leftExp
    }

    parsePrefixExpression(caller) {
        const token = caller.curToken
        const operator = caller.curToken.literal
        caller.nextToken()
        const expression = caller.parseExpression(caller.PREFIX)

        return new PrefixExpression(token, operator, expression)
    }

    parseInfixExpression(caller, left) {
        const leftExpression = left
        const token = caller.curToken
        const operator = caller.curToken.literal

        const precedence = caller.curPrecedence()
        caller.nextToken()
        const rightExpression = caller.parseExpression(precedence)
        return new InfixExpression(token, leftExpression, operator, rightExpression)
    }

    parseLetStatement() {
        const token = this.curToken
        //expectPeek 会调用nextToken将curToken转换为下一个token
        if (!this.expectPeek(TokenTypes.IDENTIFIER)) {
            return null
        }

        const identifier = this.createIdentifier()
        if (!this.expectPeek(TokenTypes.ASSIGN_SIGN)) {
            return null
        }

        this.nextToken()
        
        const expression = this.parseExpression(precedencesMap.LOWEST)

        if (!this.expectPeek(TokenTypes.SEMICOLON)) {
            return null
        }
        const letStatement = new LetStatement(token, identifier, expression)
        return letStatement
    }

    parseReturnStatement() {
        const token = this.curToken
        this.nextToken()
        const expression = this.parseExpression(precedencesMap.LOWEST)

        if (!this.expectPeek(TokenTypes.SEMICOLON)) {
            return null
        }

        return new ReturnStatement(token, expression)
    }

    createIdentifier() {
        const token = this.curToken
        const value = this.curToken.literal
        return new Identifier(token,value)
    }

    parseIdentifier(caller) {
        return caller.createIdentifier()
    }

    parseIntegerLiteral(caller) {
        const token = caller.curToken
        const value = parseInt(caller.curToken.literal, 10)
        if (isNaN(value)) {
            throw new Error("could not parse token as integer")
        }

        return new IntegerLiteral(token, value)
    }

    parseStringLiteral(caller) {
        const token = caller.curToken
        return new StringLiteral(token)
    }

    parseBoolean(caller) {
        const token = caller.curToken
        const value = caller.curTokenIs(TokenTypes.TRUE)
        return new BooleanLiteral(token, value)
    }

    parseGroupedExpression(caller) {
        caller.nextToken()
        const exp = caller.parseExpression(precedencesMap.LOWEST)
        if (caller.expectPeek(TokenTypes.RIGHT_PARENT)
            !== true) {
            return null
        }

        return exp
    }

    parseIfExpression(caller) {
        const token = caller.curToken
        if (caller.expectPeek(TokenTypes.LEFT_PARENT) !==
            true) {
            return null
        }

        caller.nextToken()
        const condition = caller.parseExpression(precedencesMap.LOWEST)

        if (caller.expectPeek(TokenTypes.RIGHT_PARENT) !==
            true) {
            return null
        }

        if (caller.expectPeek(TokenTypes.LEFT_BRACE) !==
            true) {
            return null
        }

        const consequence = caller.parseBlockStatement(caller)
        let alternative = undefined
        if (caller.peekTokenIs(TokenTypes.ELSE) === true) {
            caller.nextToken()
            if (caller.expectPeek(TokenTypes.LEFT_BRACE) !==
                true) {
                return null
            }
            alternative = caller.parseBlockStatement(caller)
        }
        return new IfExpression(token, condition, consequence,alternative)
    }

    parseBlockStatement(caller) {

        const token = caller.curToken
        const statements = []

        caller.nextToken()
        
        while (caller.curTokenIs(TokenTypes.RIGHT_BRACE) !== true) {
            const stmt = caller.parseStatement()
            if (stmt != null) {
                statements.push(stmt)
            }

            caller.nextToken()
        }
        
        return new BlockStatement(token, statements)
    }

    parseFunctionLiteral(caller) {
        const token = caller.curToken

        if (caller.expectPeek(TokenTypes.LEFT_PARENT) !== true) {
            return null
        }

        const parameters = caller.parseFunctionParameters(caller)

        if (caller.expectPeek(TokenTypes.LEFT_BRACE) !== true) {
            return null
        }

        const body = caller.parseBlockStatement(caller)
        return new FunctionLiteral(token, parameters, body)
    }

    parseFunctionParameters(caller) {
        const parameters = []
        if (caller.peekTokenIs(TokenTypes.RIGHT_PARENT)) {
            caller.nextToken()
            return parameters
        }

        caller.nextToken()
        const pToken = caller.curToken
        parameters.push(new Identifier(pToken))

        while (caller.peekTokenIs(TokenTypes.COMMA)) {
            caller.nextToken()
            caller.nextToken()
            const token = caller.curToken
            parameters.push(new Identifier(token))
        }

        if (caller.expectPeek(TokenTypes.RIGHT_PARENT) !==
            true) {
            return null
        }

        return parameters
    }

    parseCallExpression(caller, func) {
        const token = caller.curToken
        const args = caller.parseCallArguments(caller)

        return new CallExpression(token, func, args)
    }

    parseCallArguments(caller) {
        const args = []
        if (caller.peekTokenIs(TokenTypes.RIGHT_PARENT)) {
            caller.nextToken()
            return args
        }

        caller.nextToken()
        args.push(caller.parseExpression(precedencesMap.LOWEST))

        while (caller.peekTokenIs(TokenTypes.COMMA)) {
            caller.nextToken()
            caller.nextToken()
            args.push(caller.parseExpression(precedencesMap.LOWEST))
        }

        if (caller.expectPeek(TokenTypes.RIGHT_PARENT)
            !== true) {
            return null
        }

        return args
    }

    nextToken() {
        /* 读取token 了解意图 */
        this.curToken = this.peekToken
        this.peekToken = this.lexer.tokens[this.tokenPos]
        this.tokenPos++
    }

    curTokenIs(tokenType) {
        return this.curToken.tokenType === tokenType
    }

    peekTokenIs(tokenType) {
        return this.peekToken.tokenType === tokenType
    }

    expectPeek(tokenType) {
        if (this.peekTokenIs(tokenType)) {
            this.nextToken()
            return true
        } else {
            throw new Error(this.peekError(tokenType))
        }
    }

    peekError(type) {
        const s = "expected next token to be " + tokenTypeToString(type)
        return s
    }
}

export default CompilerParser