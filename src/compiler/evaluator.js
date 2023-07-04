
const ObjTypes = {
	INTEGER_OBJ: "INTEGER",
	BOOLEAN_OBJ: "BOOLEAN",
	NULL_OBJ: "NULL",
	ERROR_OBJ: "Error",
	RETURN_VALUE_OBJECT: "Return",
	FUNCTION_LITERAL: "FunctionLiteral",
	FUNCTION_CALL: "FunctionCall",
	STRING_OBJ: "String",
}

class BaseObject {
	constructor(props) {
		this.value = props.value
	}

	inspect() { return null }
}

class String extends BaseObject {
	constructor(props) {
		super(props)
		this.type = ObjTypes.STRING_OBJ
	}

	inspect() {
		return "content of string is: " + this.value+' '
	}
}

class Integer extends BaseObject {
	constructor(props) {
		super(props)
		this.type = ObjTypes.INTEGER_OBJ
	}

	inspect() {
		return "integer with value: " + this.value+' '
	}
}

class Boolean extends BaseObject {
	constructor(props) {
		super(props)
		this.type = ObjTypes.BOOLEAN_OBJ
	}
	inspect() {
		return "boolean with value: " + this.value+' '
	}
}

class Null extends BaseObject {
	constructor(props) {
		super(props)
		this.type = ObjTypes.NULL_OBJ
	}

	inspect() {
		return "null"
	}
}

class ReturnValue extends BaseObject {
	constructor(props) {
		super(props)
		this.valueObject = props.value
		this.type = ObjTypes.RETURN_VALUE_OBJECT
	}

	inspect() {
		this.message = "return with value: " + this.valueObject.inspect()+' '
		return this.message
	}
}


class FunctionCall extends BaseObject {
	constructor(props) {
		super(props)
		this.identifiers = props.identifiers
		this.blockStatement = props.blockStatement
		this.environment = undefined
		this.token = props.token
	}
}

class Environment {
	constructor() {
		this.map = {}
		this.outer = undefined
	}
	get(name) {
		let obj = this.map[name]
		if (obj) {
			return obj
		}

		if (this.outer) {
			obj = this.outer.get(name)
		}

		return obj
	}
	set(name, obj) {
		this.map[name] = obj
	}
}

class Evaluator {
	constructor(props) {
		this.environment = new Environment()
		this.IRenvironment = new Environment()
		//是否在函数体内
		this.inFunction = false
		this.ir = []; // 存储IR指令的数组
		this.irIndex = 0; // 用于跟踪当前IR指令的索引
		//储存IR临时变量的数组
		this.irTempVar = [];
		this.irTempVarIndex = 0;
		//储存IR全局变量的数组
		this.irGlobalVar = [];
		this.irGlobalVarIndex = 0;
		this.outPut = []
	}

	addVarMap(name, value) {
		this.IRenvironment.set(name, value);
	}

	getVarMap(name) {
		let value = this.IRenvironment.get(name);
		if (!value && this.IRenvironment.outer) {
			value = this.IRenvironment.outer.get(name);
		}
		return value;
	}
	getIR() {
		return this.ir;
	}
	addIR(instruction) {
		this.ir.push(instruction);
		this.irIndex++;
	}
	getOutPut() {
		return this.outPut;
	}
	addOutPut(outPut) {
		this.outPut.push(outPut);
	}
	addTempVar() {
		let tempVar = `%${this.irTempVarIndex}`;
		this.irTempVar.push(tempVar);
		this.irTempVarIndex++;
		return tempVar;
	}
	addGlobalVar() {
		let globalVar = `@${this.irGlobalVarIndex}`;
		this.irGlobalVar.push(globalVar);
		this.irGlobalVarIndex++;
		return globalVar;
	}
	addVar() {
		if (this.inFunction) {
			return this.addTempVar();
		} else {
			return this.addGlobalVar();
		}
	}
	getVar() {
		if (this.inFunction) {
			return this.irTempVar[this.irTempVarIndex - 1];
		} else {
			return this.irGlobalVar[this.irGlobalVarIndex - 1];
		}
	}
	newEnclosedEnvironment(outerEnv) {
		let env = new Environment()
		env.outer = outerEnv
		return env
	}
	newIrEnvironment(outerEnv) {
		let env = new Environment()
		env.outer = outerEnv
		return env
	}
	toIr(node) {
		switch (node.type) {
			case "Program":
				this.addIR("PROGRAM_START");
				this.toIrProgram(node);
				this.addIR("PROGRAM_END");
				break;
			case "String":
				break;
			case "LetStatement":
				this.toIrLetStatement(node);
				break;
			case "Identifier":
				this.toIrIdentifier(node);
				break;
			case "FunctionLiteral":
				this.toIrFunctionLiteral(node);
				break;
			case "CallExpression":
				this.toIrCallExpression(node);
				break;
			case "Integer":
				break;
			case "Boolean":
				break;
			case "ExpressionStatement":
				this.toIr(node.expression)
				break;
			case "PrefixExpression":
				this.toIrPrefixExpression(node);
				break;
			case "InfixExpression":
				this.toIrInfixExpression(node);
				break;
			case "IfExpression":
				this.toIrIfExpression(node);
				break;
			case "BlockStatement":
				this.toIrBlockStatement(node);
				break;
			case "ReturnStatement":
				this.toIrReturnStatement(node);
				break;
			default:
				this.addIR(`PUSH_NULL`);
				break;
		}
	}
	toIrProgram(program) {
		let result = null
		for (let i = 0; i < program.statements.length; i++) {
			result = this.toIr(program.statements[i])
		}
		return result
	}
	toIrLetStatement(node,) {
		if (node.value.type === "FunctionLiteral") {
			this.inFunction = true
			let oidEnv = this.IRenvironment
			this.IRenvironment = this.newIrEnvironment(this.IRenvironment)
			const params = node.value.parameters.map(p => {
				return ('i32 %' + p.token.literal)
			}).join(', ')
			node.value.parameters.forEach(p => {
				this.addVarMap(p.token.literal, '%' + p.token.literal)
			})
			this.addIR(`define @${node.name.token.literal}(` + params + `){`)
			this.addIR(`entry:`)
			this.toIr(node.value)
			this.addIR(`}`)
			this.inFunction = false
			this.IRenvironment = oidEnv
		} else if (node.value.type === "Identifier") {
			console.log(node)
			this.createVariable(node)
			this.addIR(`store ${this.getVarMap(node.value.token.literal)}, %${node.name.token.literal}`);
			this.createNumVariable(node)
		}
		else if (node.value.type === 'Integer') {
			this.createVariable(node)
				this.addIR(`store ${node.value.token.literal}, %${node.name.token.literal}`);
				this.createNumVariable(node)
		} else if (node.value.type === 'InfixExpression') {
			this.toIrInfixExpression(node.value)
			this.createVariable(node)
			this.addIR(`store ${this.getVar()}, %${node.name.token.literal}`)
		} else if (node.value.type === 'PrefixExpression') {
			this.toIrPrefixExpression(node.value)
			this.createVariable(node)
			this.addIR(`store ${this.getVar()}, %${node.name.token.literal}`)
		} else if (node.value.type === 'CallExpression') {
			this.toIrCallExpression(node.value)
			this.createVariable(node)
			this.addIR(`store ${this.getVar()}, %${node.name.token.literal}`)
		}

	}
	createVariable(node) {
			this.addIR(`%${node.name.token.literal} = alloca`)
	}
	createNumVariable(node) {
		this.addIR(`${this.addVar()} = load %${node.name.token.literal}`)
		this.addVarMap(node.name.token.literal, this.getVar())
	}
	toIrFunctionLiteral(node) {
		for (let i = 0; i < node.body.statements.length; i++) {
			this.toIr(node.body.statements[i])
		}
	}
	toIrReturnStatement(node) {
		if (node.expression.type === 'InfixExpression') {
			this.toIr(node.expression)
			this.addIR(`ret ${this.getVar()}`)
		}
		else if (node.expression.type === 'PrefixExpression') {
			this.toIr(node.expression)
			this.addIR(`ret ${this.getVar()}`)
		}
		else if (node.expression.type === 'Integer') {
			this.addIR(`ret ${node.expression.token.literal}`)
		}
		this.inFunction = false
	}
	toIrCallExpression(node) {
		let args = []
		for (let i = 0; i < node.arguments.length; i++) {

			if (node.arguments[i].type === 'Identifier') {
				args.push('i32 ' + this.getVarMap(node.arguments[i].token.literal))
			} else if (node.arguments[i].type === 'Integer') {
				args.push('i32 ' + node.arguments[i].value)
			}
		}
		this.addIR(`${this.addVar()} = call @${node.function.token.literal}(${args.join(', ')})`)
	}
	toIrPrefixExpression(node) {
		switch (node.operator) {
			case "!":
				return this.toIrBangOperatorExpression(node.right)
			case "-":
				return this.toIrMinusPrefixOperatorExpression(node.right)
			default:
				throw new Error("unknown operator:"+node.operator+" : "+node.right.type)
		}
	}
	toIrBangOperatorExpression(right) {
		let props = {}
		if (right.type === ObjTypes.BOOLEAN_OBJ) {
			if (right.value === true) {
				props.value = false
			}

			if (right.value === false) {
				props.value = true
			}
		}

		if (right.type === ObjTypes.INTEGER_OBJ) {
			if (right.value === 0) {
				props.value = true
			} else {
				props.value = false
			}
		}

		if (right.type === ObjTypes.NULL_OBJ) {
			props.value = true
		}

	}
	toIrMinusPrefixOperatorExpression(right) {
		let props = {}
		props.value = -right.value

		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		}
		else {
			this.toIr(right)
			let beforeVar = this.getVar()
			this.addIR(`${this.addVar()} = load ${beforeVar}`)
		}
		let beforeVar = this.getVar()
		this.addIR(`${this.addVar()} = sub 0, ${beforeVar}`)
	}
	toIrInfixExpression(node) {
		switch (node.operator) {
			case "+":
				return this.toIrPlusOperatorExpression(node.left, node.right)
			case "-":
				return this.toIrMinusOperatorExpression(node.left, node.right)
			case "*":
				return this.toIrMultiplyOperatorExpression(node.left, node.right)
			case "/":
				return this.toIrDivideOperatorExpression(node.left, node.right)
			case "==":
				return this.toIrEqualsOperatorExpression(node.left, node.right)
			// case "!=":
			// 	return this.toIrNotEqualsOperatorExpression(node.left, node.right)
			// case ">":
			// 	return this.toIrGreaterThanOperatorExpression(node.left, node.right)
			// case "<":
			// 	return this.toIrLessThanOperatorExpression(node.left, node.right)
			default:
				throw new Error("unknown operator:"+node.operator+" : "+node.right.type)
		}
	}
	toIrPlusOperatorExpression(left, right) {
		if (left.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${left.value}`)
		} else if (left.type === "Identifier") {
			this.addIR(`${this.addVar()} = load  ${this.getVarMap(left.token.literal)}`)
		} else {
			this.toIr(left)
		}
		let leftBeforeVar = this.getVar()
		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		} else {
			this.toIr(right)
		}
		let rightBeforeVar = this.getVar()
		this.addIR(`${this.addVar()} = add ${leftBeforeVar}, ${rightBeforeVar}`)
	}
	toIrMinusOperatorExpression(left, right) {
		if (left.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${left.value}`)
		} else if (left.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(left.token.literal)}`)
		} else {
			this.toIr(left)
		}
		let leftBeforeVar = this.getVar()
		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		} else {
			this.toIr(right)
		}
		let rightBeforeVar = this.getVar()
		this.addIR(`${this.addVar()} = sub ${leftBeforeVar}, ${rightBeforeVar}`)
	}
	toIrMultiplyOperatorExpression(left, right) {
		if (left.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${left.value}`)
		} else if (left.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(left.token.literal)}`)
		} else {
			this.toIr(left)
		}
		let leftBeforeVar = this.getVar()
		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		} else {
			this.toIr(right)
		}
		let rightBeforeVar = this.getVar()
		this.addIR(`${this.addVar()} = mul ${leftBeforeVar}, ${rightBeforeVar}`)
	}
	toIrDivideOperatorExpression(left, right) {
		if (left.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${left.value}`)
		} else if (left.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(left.token.literal)}`)
		} else {
			this.toIr(left)
		}
		let leftBeforeVar = this.getVar()
		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		} else {
			this.toIr(right)
		}
		let rightBeforeVar = this.getVar()
		this.addIR(`${this.addVar()} = sdiv ${leftBeforeVar}, ${rightBeforeVar}`)
	}
	toIrEqualsOperatorExpression(left, right) {
		if (left.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${left.value}`)
		} else if (left.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(left.token.literal)}`)
		} else {
			this.toIr(left)
		}
		let leftBeforeVar = this.getVar()
		if (right.type === "Integer") {
			this.addIR(`${this.addVar()} = load ${right.value}`)
		} else if (right.type === "Identifier") {
			this.addIR(`${this.addVar()} = load ${this.getVarMap(right.token.literal)}`)
		} else {
			this.toIr(right)
		}
		let rightBeforeVar = this.getVar()
		this.addIR(`${this.addVar()} = icmp eq ${leftBeforeVar}, ${rightBeforeVar}`)
		this.addIR(`${this.addVar()} = zext %${this.getVar()} to i32`)
	}
	toIrIdentifier(node) {
		console.log("ident")
	}
	toIrIfExpression(node) {
		let condition = this.toIr(node.condition)
		this.addIR(`br i1 ${this.getVar()}, label %if, label %else`)
		if (this.isError(condition)) {
			throw new Error("ERROR")
		}
		this.addIR(`if:`)
		this.toIr(node.consequence)
		this.addIR(`br label %end`)
		if (node.alternative != null) {
			this.addIR(`else:`)
			this.toIr(node.alternative)
			this.addIR(`br label %end`)
		}
	}
	toIrBlockStatement(node) {
		for (let i = 0; i < node.statements.length; i++) {
			this.toIr(node.statements[i])
		}
	}
	eval(node) {
		let props = {}
		let result = null
		let obj = null
		let right = null
		console.log(node)
		switch (node.type) {
			case "Program":
				result = this.evalProgram(node);
				this.addOutPut('\n')
				return result;
			case "String":
				this.addIR(`PUSH_STRING ${node.token.literal}`);
				props.value = node.token.literal
				this.addOutPut('\n')
				return new String(props)
			case "LetStatement":
				this.addOutPut("identifier name is: " + node.name.token.literal+' ')
				this.addOutPut("it is binding value is ")
				let val = this.eval(node.value)
				if (this.isError(val)) {
					return val
				}
				this.environment.set(node.name.token.literal, val)
				this.addOutPut('\n')
				return val
			case "Identifier":
				this.addOutPut("identifier name is:" + node.token.literal+' ')
				let value = this.evalIdentifier(node, this.environment)
				this.addOutPut("it is binding value is " + value.inspect())
				this.addOutPut('\n')
				return value
			case "FunctionLiteral":
				this.addOutPut("function ")
				props.token = node.token
				props.identifiers = node.parameters
				props.blockStatement = node.body
				let funObj = new FunctionCall(props)
				funObj.environment = this.newEnclosedEnvironment(this.environment)
				this.addOutPut('\n')
				return funObj
			case "CallExpression":
				this.addOutPut("execute a function with content:" +
					node.function.token.literal+' ')
				let functionCall = this.eval(node.function)
				if (this.isError(functionCall)) {
					return functionCall
				}
				this.addOutPut("evaluate function call params: ")
				let args = this.evalExpressions(node.arguments)
				if (args.length === 1 && this.isError(args[0])) {
					return args[0]
				}

				for (let i = 0; i < args.length; i++) {
					this.addOutPut("param " + i + " is " + args[i].inspect()+' ')
				}

				let oldEnvironment = this.environment
				//设置新的变量绑定环境
				this.environment = functionCall.environment
				//将输入参数名称与传入值在新环境中绑定
				for (let i = 0; i < functionCall.identifiers.length; i++) {
					let name = functionCall.identifiers[i].token.literal
					let val = args[i]
					this.environment.set(name, val)
				}
				//执行函数体内代码
				this.inFunction = true
				result = this.eval(functionCall.blockStatement)
				this.inFunction = false
				//执行完函数后，里面恢复原有绑定环境
				this.environment = oldEnvironment
				if (result.type === ObjTypes.RETURN_VALUE_OBJECT) {
					console.log(result.valueObject.value)
					this.addOutPut("function call return with : "+
						result.valueObject.inspect()+' ')
					return result.valueObject
				}
				this.addOutPut('\n')
				return result
			case "Integer":
				this.addOutPut("Integer with value: " + node.value+' ')
				props.value = node.value
				this.addOutPut('\n')
				return new Integer(props)
			case "Boolean":
				this.addOutPut("Boolean with value: " + node.value+' ')
				props.value = node.value
				this.addOutPut('\n')
				return new Boolean(props)
			case "ExpressionStatement":
				return this.eval(node.expression)
			case "PrefixExpression":
				right = this.eval(node.right)
				if (this.isError(right)) {
					return right
				}
				obj = this.evalPrefixExpression(node.operator, right)
				this.addOutPut("eval prefix expression: " + obj.inspect()+' ')
				this.addOutPut('\n')
				return obj
			case "InfixExpression":
				let left = this.eval(node.left)
				if (this.isError(left)) {
					return left
				}
				right = this.eval(node.right)
				if (this.isError(right)) {
					return right
				}
				result = this.evalInfixExpression(node.operator, left, right)
				this.addOutPut('\n')
				return result
			case "IfExpression":
				return this.evalIfExpression(node)
			case "BlockStatement":
				result = this.evalStatements(node)
				this.addOutPut('\n')
				return result
			case "ReturnStatement":
				props.value = this.eval(node.expression)
				if (this.isError(props.value)) {
					return props.value
				}
				obj = new ReturnValue(props)
				this.addOutPut(obj.inspect())
				this.addOutPut('\n')
				return obj
			default:
				return new Null({})
		}
	}
	evalExpressions(exps) {
		let result = []
		for (let i = 0; i < exps.length; i++) {
			let evaluated = this.eval(exps[i])
			if (this.isError(evaluated)) {
				return evaluated
			}
			result[i] = evaluated
		}

		return result
	}
	evalIdentifier(node, env) {
		let val = env.get(node.token.literal)
		if (!val) {
			throw new Error("identifier no found:" + node.name.token.literal)
		}

		return val
	}
	evalProgram(program) {
		let result = null
		for (let i = 0; i < program.statements.length; i++) {
			result = this.eval(program.statements[i])
			if (result.type === ObjTypes.RETURN_VALUE_OBJECT) {
				return result.valueObject
			}

			if (result.type === ObjTypes.NULL_OBJ) {
				return result
			}

			if (result.type === ObjTypes.ERROR_OBJ) {
				throw new Error(result.message)
			}
		}

		return result
	}
	evalIfExpression(ifNode) {
		this.addOutPut("eval if expression ")
		let condition = this.eval(ifNode.condition)

		if (this.isError(condition)) {
			throw new Error("error when eval if condition ")
		}

		if (this.isTruthy(condition)) {
			this.addOutPut("condition in if holds, exec statements in if block ")
			return this.eval(ifNode.consequence)
		} else if (ifNode.alternative != null) {
			this.addOutPut("condition in if no holds, exec statements in else block ")
			return this.eval(ifNode.alternative)
		} else {
			this.addOutPut("condition in if no holds, exec nothing! ")
			return null
		}
	}
	evalStatements(node) {
		let result = null
		for (let i = 0; i < node.statements.length; i++) {
			result = this.eval(node.statements[i])
			if (result.type === ObjTypes.RETURN_VALUE_OBJECT
				|| result.type === ObjTypes.ERROR_OBJ) {
				return result
			}
		}

		return result
	}
	evalInfixExpression(operator, left, right) {
		if (left.type !== right.type) {
			throw new Error("type mismatch: " +
				left.type + " and " + right.type)
		}

		if (left.type === ObjTypes.INTEGER_OBJ &&
			right.type === ObjTypes.INTEGER_OBJ) {
			return this.evalIntegerInfixExpression(
				operator, left, right)
		}

		if (left.type === ObjTypes.STRING_OBJ &&
			right.type === ObjTypes.STRING_OBJ) {
			return this.evalStringInfixExpression(operator,
				left, right)
		}

		let props = {}
		if (operator === '==') {
			props.value = (left.value === right.value)
			this.addOutPut("result on boolean operation of " + operator
				+ " is " + props.value+' ')
			return new Boolean(props)
		} else if (operator === '!=') {
			props.value = (left.value !== right.value)
			this.addOutPut("result on boolean operation of " + operator
				+ " is " + props.value+' ')
			return new Boolean(props)
		}

		throw new Error("unknown operator: " + operator)
	}
	evalStringInfixExpression(operator, left, right) {
		if (operator !== "+") {
			throw new Error("unknown operator for string operation")
		}

		let leftVal = left.value
		let rightVal = right.value
		let props = {}
		props.value = leftVal + rightVal
		this.addOutPut("result of string add is: " + props.value+' ')
		return new String(props)
	}
	evalIntegerInfixExpression(operator, left, right) {
		let leftVal = left.value
		let rightVal = right.value
		let props = {}
		let resultType = "integer"

		switch (operator) {
			case "+":
				props.value = leftVal + rightVal
				break;
			case "-":
				props.value = leftVal - rightVal
				break;
			case "*":
				props.value = leftVal * rightVal
				break;
			case "/":
				props.value = leftVal / rightVal
				break;
			case "==":
				resultType = "boolean"
				props.value = (leftVal === rightVal)
				break;
			case "!=":
				resultType = "boolean"
				props.value = (leftVal !== rightVal)
				break
			case ">":
				resultType = "boolean"
				props.value = (leftVal > rightVal)
				break
			case "<":
				resultType = "boolean"
				props.value = (leftVal < rightVal)
				break
			default:
				throw new Error("unknown operator for Integer")
		}
		this.addOutPut("result of integer operation is: " + props.value+' ')
		let result = null
		if (resultType === "integer") {
			result = new Integer(props)
		} else if (resultType === "boolean") {
			result = new Boolean(props)
		}

		return result
	}
	evalPrefixExpression(operator, right) {
		switch (operator) {
			case "!":
				return this.evalBangOperatorExpression(right)
			case "-":
				return this.evalMinusPrefixOperatorExpression(right)
			default:
				throw new Error("unknown operator: " + operator+" : "+right.type)
		}
	}
	evalBangOperatorExpression(right) {
		let props = {}
		if (right.type === ObjTypes.BOOLEAN_OBJ) {
			if (right.value === true) {
				props.value = false
			}

			if (right.value === false) {
				props.value = true
			}
		}

		if (right.type === ObjTypes.INTEGER_OBJ) {
			if (right.value === 0) {
				props.value = true
			} else {
				props.value = false
			}
		}

		if (right.type === ObjTypes.NULL_OBJ) {
			props.value = true
		}

		return new Boolean(props)
	}
	evalMinusPrefixOperatorExpression(right) {
		if (right.type !== ObjTypes.INTEGER_OBJ) {
			throw new Error("unknown operator: -" + right.type)
		}

		let props = {}
		props.value = -right.value
		return new Integer(props)
	}
	isError(obj) {
		if (obj) {
			return obj.type === ObjTypes.ERROR_OBJ
		}

		return false
	}
	isTruthy(condition) {
		if (condition.type === ObjTypes.INTEGER_OBJ) {
			if (condition.value !== 0) {
				return true
			}
			return false
		}

		if (condition.type === ObjTypes.BOOLEAN_OBJ) {
			return condition.value
		}

		if (condition.type === ObjTypes.NULL_OBJ) {
			return false
		}

		return true
	}
}

export default Evaluator