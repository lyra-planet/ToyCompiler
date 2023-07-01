import * as bootstrap from 'react-bootstrap'
import Lexer from './lexer'
import Evaluator from './evaluator'
import CompilerEditor from './compilerEditor'
import CompilerParser from './compilerParser'
import React from 'react'

let textAreaStyle = {
  height: 480
}

function Compiler() {
  let refInputInstance = React.useRef(null)
  let lexer = new Lexer('')
  let evaluator = new Evaluator()
  const onLexingClick = (e) => {
    console.log(refInputInstance.getContent())
    lexer = new Lexer(refInputInstance.getContent())
    let parser = new CompilerParser(lexer)
    parser.parseProgram()
    let program = parser.program
    evaluator.eval(program)
  }

  return (
    <div className="Compiler">
      <h3 className=' text-green-700 bg-green-200 p-2'>Compiler</h3>
      <div className='w-full p-2'>

        <CompilerEditor ref={(ref) => { refInputInstance = ref }} keywords={lexer.getKeywords()} style={textAreaStyle} />

        <bootstrap.Button className='mt-2' variant='danger' type="submit" onClick={onLexingClick}>
          Parsing
        </bootstrap.Button >
      </div>
    </div>
  );
}

export default Compiler;