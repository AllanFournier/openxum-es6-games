"use strict"

import Piece from './piece.mjs'

class File{
  constructor() {
    this._array = [];
  }

  add(piece){
    this._array.push(piece);
  }

  remove(){
    return this._array.pop();
  }

}

export default File;