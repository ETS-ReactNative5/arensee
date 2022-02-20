// If you have just cloned the repo, you need to run (from repo root "arensee"):
//
// npm install
// npx patch-package
// rm ./node_modules/react-native-draggable/Draggable.js
//
// That "npx patch-package" fixes react-native-draggable's broken
//  "shouldReverse" feature. As things stand in the repo, the promised
//  "onReverse" callback doesn't ever run. The patch also removes the
//  gimmicky snap-back animation.
//
// You may also need something like:
//
//  echo sdk.dir=$ANDROID_SDK_ROOT > ./android/local.properties
//
import React, {useState, useEffect, Component } from 'react';
import {Pressable, StyleSheet, Text,  View, NativeModules, Modal} from 'react-native';
import Draggable from 'react-native-draggable';
import Sprite from './Sprite';
import Rook from './Rook';
import Pawn from './Pawn';
import Bishop from './Bishop';
import Knight from './Knight';
import King from './King';
import Queen from './Queen';
import Engine from './Engine';
import Constants from './Constants';
import Movement from './Movement';
import * as Art from './Art';

const { RNPlayNative } = NativeModules;

class Piece extends Component {
    constructor(props){super(props);}
    
    render(){
	if(this.props.deadness) return null;
	return (
	    <Draggable shouldReverse={true /*We'll handle the positioning*/ }
	     renderSize={Constants.SquareSize } x={ this.props.x * Constants.SquareSize + (Constants.SpriteWidth / 2.0)}
	     y={this.props.y * Constants.SquareSize + Constants.BoardTop} onDragRelease={(event)=>{Movement.Release(event,this)}}>
	    
	     {/*This view immediately inside draggable seems to be required to establish the rectangle in which your finger will grab it.*/}
	     <View>
	      <View style={styles.pieceWrapper}>
  	       <Sprite sprite={this.props.sprite} pixelSize={Constants.SpritePixelSize} />
	      </View>
	     </View>

	    </Draggable>
	);
    }
}

function Board(props){
    return(<>
	{props.boardState.map((t)=>(
	    <Piece n={t.n} key={t.n} deadness={t.deadness} x={t.x} y={t.y} sprite={t.sprite}
	     causesCheck={props.causesCheck} movePiece={props.movePiece}  
	     moveCount={props.moveCount} board={props.boardState}
	    />))}
	</>
    )
}

function Game(props){
    const players=1;

    // Computer movement
    if(!props.modalVisible) {
	if(players==1) {
	    useEffect(() => {
		if(props.moveCount%2==1) {
		    let pm = Engine.PossibleMoves(true,props.causesCheck,10,props.boardState)
		    let move = pm[Math.floor(Math.random()*pm.length)];
		    props.movePiece(move.n, move.x, move.y, true);
		    RNPlayNative.runMethod();		
		}
	    },[props.moveCount]);

	}else if(players==2){
	    //We don't need to do any computer-driven moving if 2 players

	}else{
	    useEffect(() => {
		setTimeout(()=>{
		    if(props.moveCount%2==1) {
			let pm = Engine.PossibleMoves(true,props.causesCheck,10,props.boardState)
			let move = pm[Math.floor(Math.random()*pm.length)];
			props.movePiece(move.n, move.x, move.y, true);
		    }else{
			let pm = Engine.PossibleMoves(false,props.causesCheck,10,props.board)
			let move = pm[Math.floor(Math.random()*pm.length)];
			props.movePiece(move.n, move.x, move.y, true);  
		    }
		},250);
	    },[props.moveCount]);
	}
    }
    
    return(
	<View style={styles.gameWrapper}><View style={styles.boardWrapper}/>

	 {/*The chessboard*/}
 	 <View>
	  <Sprite pixelSize={Constants.SquareSize} sprite={Art.board} ></Sprite>	     
	 </View>

	 {/*The pieces*/}
	 <Board boardState={props.boardState} movePiece={props.movePiece} causesCheck={props.causesCheck} moveCount={props.moveCount} />

	 {/*Text banner beneath board (move count)*/}
	 <View style={styles.textBanner} ><Text>{"MOVE " + (props.moveCount+1) + (props.moveCount%2>0?' BLACK':' WHITE')}</Text></View>

	 {/*Modal, to announce mate &c.*/}
	 <View style={styles.centeredView}>
	  <Modal animationType="slide" transparent={true} visible={props.modalVisible?true:false} 
           onRequestClose={() => { setModalVisible(undefined);}} >
           <View style={styles.centeredView} >
            <Text style={styles.modalText}>{props.modalVisible}</Text>
            <Pressable style={styles.modalButton} onPress={() => {props.setModalVisible(undefined); props.ResetBoard();}} >
             <Text>OK</Text>
            </Pressable>
           </View>
	  </Modal>
	 </View>
	</View>);
}

const App = ()=>{
    const [boardState, setBoardState] = useState(Constants.StartingBoard())
    const [moveCount, setMoveCount] = useState(0)
    const [modalVisible,setModalVisible]=useState(undefined);

    const isChecked = (blackness)=> {
	//King of the color that might be checked. We assume this exists.
	const k=boardState.filter((t,i)=>t.blackness==blackness && t.kingness && !t.deadness)[0];
	let returnable = false;
	if(k) {
            returnable=
		boardState.filter((t)=>!t.deadness).some(
		    (t,i)=>t.blackness!=blackness && t.canMove(t.blackness,t.x,t.y,k.x,k.y,boardState));
	}
	return returnable;
    }

    const causesCheck = (n, x, y)=> {
	let prime=[...boardState]

	const movingPiece = boardState.filter(t=>t.n==n)[0]
	
	//Capture anything there 
	const enemy=prime.filter((t)=>t.x==x && t.y==y && t.blackness != movingPiece.blackness && !t.deadness)
	if(enemy.length==1) { enemy[0].deadness=true; }

	//enpassant
	const {enpassant,capturedX,capturedY} = Pawn.EnPassant(movingPiece.blackness,movingPiece.pawnness,movingPiece.x,movingPiece.y,x,y,boardState) 
	if(enpassant) { prime.filter((t)=>t.x==capturedX && t.y==capturedY )[0].deadness=true; }
	
	let savex=movingPiece.x; let savey=movingPiece.y;
	movingPiece.x=x; movingPiece.y=y;
	let returnable = isChecked(movingPiece.blackness);
	movingPiece.x=savex;
	movingPiece.y=savey;
	if(enemy.length==1) { enemy[0].deadness=false; }
	if(enpassant) { prime.filter((t)=>t.x==capturedX && t.y==capturedY )[0].deadness=false; }

	setBoardState(prime)
	return returnable
    }

    const ResetBoard = ()=>{
	setBoardState(Constants.StartingBoard())
	setMoveCount(0)
    }
    
    const movePiece = (n, x, y, prechecked)=> {

	let prime=[...boardState]
	const movingPiece = boardState.filter(t=>t.n==n)[0]
	//Capture anything there
	const enemy=prime.filter((t)=>t.x==x && t.y==y && t.blackness != movingPiece.blackness && !t.deadness)
	if(enemy.length==1) { enemy[0].deadness=true; }

	//enpassant
	const {enpassant,capturedX,capturedY} = Pawn.EnPassant(movingPiece.blackness,movingPiece.pawnness,movingPiece.x,movingPiece.y,x,y,boardState) 
	if(enpassant) { prime.filter((t)=>t.x==capturedX && t.y==capturedY )[0].deadness=true; }
	
	let savex=movingPiece.x;
	let savey=movingPiece.y;
	movingPiece.x=x;
	movingPiece.y=y;

	if(!prechecked && isChecked(movingPiece.blackness)){
	    //Uh-oh! Revert illegal check-causing move. (This is for moves attempted by
	    //  humans. The computer has already considered this possibility.)
	    movingPiece.x=savex;
	    movingPiece.y=savey;
	    if(enemy.length==1) { enemy[0].deadness=false; }
	    if(enpassant) { prime.filter((t)=>t.x==capturedX && t.y==capturedY )[0].deadness=false; }
	    setBoardState(prime)
	}else{
	    // Successful move
	    //

	    // Mark piece dirty
	    movingPiece.dirtiness=true;
	    
	    // Maintain "just advanced two" flag for enpassant logic
	    prime.forEach((t)=>t.justAdvancedTwo=false);	   
	    movingPiece.justAdvancedTwo=Math.abs(movingPiece.y-savey)==2;

	    // Mutate state
	    setBoardState(prime)

	    //Pawn Promotion
	    if(movingPiece.pawnness && ((movingPiece.blackness && movingPiece.y==7)||(!movingPiece.blackness && movingPiece.y==0))){
		movingPiece.sprite=movingPiece.blackness?Queen.Black:Queen.White;
		movingPiece.canMove=Queen.CanMove;
	    }

	    // Check for mate
	    if(!Movement.CanMakeAMove(!movingPiece.blackness, causesCheck, boardState)){
		if(isChecked(!movingPiece.blackness)){
		    setModalVisible(('CHECKMATE! WINNER: ' + (movingPiece.blackness?'BLACK':'WHITE') ))
		}else{
		    setModalVisible('STALEMATE')		    
		}		
	    }else{
		setMoveCount(moveCount+1);
	    }
	}
    } 
    
    return(<Game boardState={boardState} movePiece={movePiece} causesCheck={causesCheck}   
	moveCount={moveCount} setMoveCount={setMoveCount} setBoardState={setBoardState}
	modalVisible={modalVisible} setModalVisible={setModalVisible} ResetBoard={ResetBoard} />);    
}    

const styles = StyleSheet.create({
    centeredView: {
	flex: 1,
	justifyContent: "center",
	alignItems: "center",
	marginTop: 22
    },
    button:{backgroundColor:"rgba(192,192,192,0.8)", borderRadius:4},
    pieceWrapper: {width:35, height:45},
    gameWrapper: {width: 1000, height:1000},
    boardWrapper: {flex:0.315},
    modalButton: {padding:10, backgroundColor:"rgba(32,32,32,0.2)", color:"black"},
    textBanner: {flex:0.2},
    modalText: {color:"black"},
});

export default App;
