import React, { Component } from 'react'
import rangy from 'rangy';
import Lexer from './compiler/lexer';

class CompilerEditor extends Component {
	constructor(props) {
		super(props)
		rangy.init()
		this.keywords = props.keywords
		this.keywordClass = 'keyword'
		this.keywordElementArray = []
		this.discardedElementsArray = []
	}
	getContent() {
		return this.divInstance.innerText
	}
	// 抽出嵌套的元素
	changeNode(n) {
		const f = n.childNodes;
		for (let c in f) {
			this.changeNode(f[c]);
		}
		if (n.data) {
			this.lastBegin = 0
			n.keywordCount = 0;
			const lexer = new Lexer(n.data)
			lexer.setLexingObserver(this, n)
			lexer.lexing()
		}
	}
	notifyTokenCreation(token, elementNode, begin, end) {
		if (this.keywords[token.literal]!==undefined) {
			
			const e = {}
			e.node = elementNode
			e.begin = begin
			e.end = end
			e.token = token
			elementNode.keywordCount++;
			this.keywordElementArray.push(e)
		}
	}
	hightLightKeyword(token, elementNode, begin, end) {
		let strBefore = elementNode.data.substr(this.lastBegin,
			begin - this.lastBegin)
		strBefore = this.changeSpaceToNBSP(strBefore)

		const textNode = document.createTextNode(strBefore)
		const parentNode = elementNode.parentNode
		parentNode.insertBefore(textNode, elementNode)


		const span = document.createElement('span')
		span.style.color = 'green'
		span.classList.add(this.keywordClass)
		span.appendChild(document.createTextNode(token.literal))
		parentNode.insertBefore(span, elementNode)
		this.lastBegin = end - 1
		elementNode.keywordCount--
	}
	changeSpaceToNBSP(str) {
		let s = ""
		for (let i = 0; i < str.length; i++) {
			if (str[i] === ' ') {
				s += '\u00a0'
			}
			else {
				s += str[i]
			}
		}

		return s;
	}
	hightLightSyntax() {
		let i
		for (i = 0; i < this.keywordElementArray.length; i++) {
			const e = this.keywordElementArray[i]
			this.currentElement = e.node
			this.hightLightKeyword(e.token, e.node, e.begin, e.end)

			if (this.currentElement.keywordCount === 0) {
				const end = this.currentElement.data.length
				let lastText = this.currentElement.data.substr(this.lastBegin,
					end)
				lastText = this.changeSpaceToNBSP(lastText)
				const parent = this.currentElement.parentNode
				const lastNode = document.createTextNode(lastText)
				parent.insertBefore(lastNode, this.currentElement)
				parent.removeChild(this.currentElement)
			}
		}
		this.keywordElementArray = []
	}
	onDivContentChange(event) {
		if (event.key === 'Enter' || event.key === " ") {
			return
		}

		//rangy防止光标跳到最前
		let bookmark = undefined
		//记录位置
		if (event.key !== 'Enter') {
			bookmark = rangy.getSelection().getBookmark(this.divInstance)
		}

		//把原来的span标签keyword去掉,防止多个span标签嵌套
		const spans = document.getElementsByClassName(this.keywordClass);
		while (spans.length) {
			const p = spans[0].parentNode;
			const t = document.createTextNode(spans[0].innerText)
			p.insertBefore(t, spans[0])
			p.removeChild(spans[0])
		}

		//把所有相邻的textNode合并成一个
		this.divInstance.normalize();
		this.changeNode(this.divInstance)
		this.hightLightSyntax()
		//恢复位置
		if (event.key !== 'Enter') {
			rangy.getSelection().moveToBookmark(bookmark)
		}

	}

	render() {
		return (
			<div className='h-2/3 border-2 border-gray-400 rounded-md'
				onKeyUp={this.onDivContentChange.bind(this)}
				ref={(ref) => { this.divInstance = ref }}
				contentEditable>
			</div>
		)
	}
}

export default CompilerEditor