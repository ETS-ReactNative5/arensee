export default Rook = {

    CanMove:  (blackness,x,y,toX,toY,pieces)=> (x==toX || y==toY)
				   && (!(x==toX && y==toY)) //It is helpful for game logic to exclude the identity TODO refactor
				   && !pieces.some((t)=>
				       t.x==toX && t.y==toY && t.blackness==blackness && !t.deadness) //Can't move atop same color piece
				   && noInterveningPiece(x,y,toX,toY),

    



};
