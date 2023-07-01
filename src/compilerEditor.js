import React, { Component } from 'react'
import rangy from 'rangy';
import Lexer from './lexer';

let textAreaStyle = {
	height: 480,
	border: "1px solid black"
};

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
		let f = n.childNodes;
		for (let c in f) {
			this.changeNode(f[c]);
		}
		if (n.data) {
			this.lastBegin = 0
			n.keywordCount = 0;
			let lexer = new Lexer(n.data)
			lexer.setLexingObserver(this, n)
			lexer.lexing()
		}
	}
	notifyTokenCreation(token, elementNode, begin, end) {
		if (this.keywords[token.getLiteral()] !== undefined) {
			let e = {}
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

		let textNode = document.createTextNode(strBefore)
		let parentNode = elementNode.parentNode
		parentNode.insertBefore(textNode, elementNode)


		let span = document.createElement('span')
		span.style.color = 'green'
		span.classList.add(this.keywordClass)
		span.appendChild(document.createTextNode(token.getLiteral()))
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
			let e = this.keywordElementArray[i]
			this.currentElement = e.node
			this.hightLightKeyword(e.token, e.node, e.begin, e.end)

			if (this.currentElement.keywordCount === 0) {
				let end = this.currentElement.data.length
				let lastText = this.currentElement.data.substr(this.lastBegin,
					end)
				lastText = this.changeSpaceToNBSP(lastText)
				let parent = this.currentElement.parentNode
				let lastNode = document.createTextNode(lastText)
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
		let spans = document.getElementsByClassName(this.keywordClass);
		while (spans.length) {
			let p = spans[0].parentNode;
			let t = document.createTextNode(spans[0].innerText)
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
			<div style={textAreaStyle}
				onKeyUp={this.onDivContentChange.bind(this)}
				ref={(ref) => { this.divInstance = ref }}
				contentEditable>
			</div>
		)
	}
}

export default CompilerEditor