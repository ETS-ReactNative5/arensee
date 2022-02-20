import React, {Component} from 'react';
import {View} from 'react-native';
import Constants from './Constants';
import Movement from './Movement';
import Sprite from './Sprite';
import Draggable from 'react-native-draggable';
import {styles} from './Styles'

export class Piece extends Component {
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
