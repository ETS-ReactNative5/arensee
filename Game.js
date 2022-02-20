import React, {Component, useEffect} from 'react';
import {View, Text, Modal, Pressable, NativeModules} from 'react-native';
import Constants from './Constants';
import Sprite from './Sprite';
import {Board} from './Board'
import {styles} from './Styles'
import Engine from './Engine';

const { RNPlayNative } = NativeModules;

export function Game(props){
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
	<Sprite pixelSize={Constants.SquareSize} sprite={Constants.Chessboard} ></Sprite>	     
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