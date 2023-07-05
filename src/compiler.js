import Lexer from './compiler/lexer'
import Evaluator from './compiler/evaluator'
import CompilerEditor from './compilerEditor'
import CompilerParser from './compiler/parser'
import { KeywordMap } from './compiler/lexer'
import React from 'react'


function Compiler() {
  let refInputInstance = React.useRef(null)
  const [astJson, setAstJson] = React.useState({})
  const [result, setResult] = React.useState([''])
  const onLexingClick = (e) => {
    try{
      // console.clear()
      const lexer = new Lexer(refInputInstance.getContent())
      const parser = new CompilerParser(lexer)
      const evaluator = new Evaluator()
      parser.parseProgram()
      const program = parser.program
      evaluator.eval(program)
      evaluator.toIr(program)
      setAstJson(JSON.stringify(program.statements,null, 4))
      setResult(merge(evaluator.getOutPut()))
      console.log(flat(Object.values(evaluator.irFuncArray).map(item=>item.ir)))
    }catch(e){
      console.log(e)
    }
  }
  const flat = (arr)=>{
    if(Object.prototype.toString.call(arr) != "[object Array]"){return false};
    let res = [];
    for(var i=0;i<arr.length;i++){
      if(arr[i] instanceof Array){
        res = res.concat(flat(arr[i]))
      }else{
        res.push(arr[i])
      }
    }
    return res;
  };
  const merge = (arr)=>{
    let newArr = []
    arr.forEach((item, index) => {
        if(item != arr[index-1]) {
            newArr.push(item)
        }
    });

    return newArr
}
  return (
    <div className="Compiler h-screen flex overflow-hidden">
      <div className='w-1/2 h-full'>
      <h3 className=' text-green-700 bg-green-200 p-2'>Compiler</h3>
      <div className='w-full p-2 h-full'>
        <CompilerEditor ref={(ref) => { refInputInstance = ref }} keywords={KeywordMap} 
        className="h-2/3"/>
        <button className='mt-2 bg-red-500 p-2 rounded-md text-white font-bold '  onClick={onLexingClick}>
          Parsing
        </button >
      </div>
      </div>
      <div className='w-1/2 h-full'>
          <div className='h-1/2 w-full'>
          <h3 className=' text-red-700 bg-red-200 p-2'>AST</h3>
          <div className='p-2 h-full w-full'>
            
          <textarea readOnly defaultValue={astJson}  className='resize-none h-5/6 w-full border-2 border-gray-400 rounded-md' 
          />
          </div>
          </div>
          <div className='h-1/2 w-full'>
          <h3 className=' text-yellow-700 bg-yellow-200 p-2'>Result</h3>
          <div className='p-2 h-full w-full'>
          <textarea readOnly defaultValue={result.join('')}  className='resize-none h-5/6 w-full border-2 border-gray-400 rounded-md' 
          />
          </div>
          </div>
      </div>
    </div>
  );
}

export default Compiler;
