"use strict";

import OpenXum from '../../openxum/engine.mjs';
import Coordinates from './coordinates.mjs';
import Piece from './piece.mjs';
import Color from './color.mjs';
import Move from './move.mjs';
import File from './file.mjs';
//import les autres classes dont vous avez besoin

class Engine extends OpenXum.Engine {
  constructor(t, c) {
    super();
    // Déclaration de tous les attributs nécessaires
    this._type = t;
    this._color = c;
    this._current_round = 0;
    this._count_white_pawn = 20;
    this._count_black_pawn = 20;
    this._cpt_mark = 0;
    this._disconnect_white = false;
    this._disconnect_black = false;
    this._is_finished = false;
    this._winner_color = Color.NONE;
    this._initialize_board();
  }

  // public methods
  apply_moves(moves) {

  }

  clone() {
    let o = new Engine(this._type, this._color);
    let b = new Array(11);

    for (let i = 0; i < 10; i++) {
      b[i] = new Array(10);
    }

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 8; y++) {
        if (this._board[x][y] !== undefined) {
          b[x][y] = this._board[x][y].clone();
        }
      }
    }
    o._set(this._is_finished, this._winner_color, b);

    return o;
  }

  _set(isf, wc, b) {
    this._is_finished = isf;
    this._winner_color = wc;
    this._board = b;
  }

  current_color() {
    // Retourne le joueur en train de jouer.
    return this._color;
  }

  get_name() {
    // Retourne le nom du jeu.
    return 'Ordo';
  }

  get_type() {
    return this._type;
  }

  is_finished() {
    return this._is_finished;
  }

  move(list) {
    if (!Array.isArray(list)) {//si la liste ne contient qu'un move
      let move = list;
      //acces coordo de la piece
      let fromX = move.from().x();
      let fromY = move.from().y();
      //clonage de la piece
      let piece = move.piece().clone();
      //Le clone a les coordo du moveyto
      piece.set_coordinates(move.to());

      this._check_pawn_taken(move);

      this._board[move.to().x()][move.to().y()] = piece;
      this._board[fromX][fromY] = undefined;
      console.log("Couleur du joueur " + this._color);
      this._check_winner();

      if (this._count_black_pawn > 1 && this._count_white_pawn > 1) {
        let that = this.clone();
        if (this.current_color() === Color.BLACK && that._check_group_connection(move) !== this._count_black_pawn) {
          this._disconnect_black = true;
        }
        if (this.current_color() === Color.WHITE && that._check_group_connection(move) !== this._count_white_pawn) {
          this._disconnect_white = true;
        }
        console.log("deco black " + this._disconnect_black);
        console.log("deco white " + this._disconnect_white);
      }

      if (!this.is_finished()) {
        this._cpt_mark = 0;
        if (this._disconnect_black === true || this._disconnect_white === true) {
          console.log("L'un des Joueurs possède plus d'un groupe ! Attention vérifié à rester Connecté!!! ");
        }
        this._change_color();

      }
    } else {//si la liste contient plusieurs moves à faire
      for (let i = 0; i < list.length; i++) {
        let move = list[i];
        //acces coordo de la piece
        let fromX = move.from().x();
        let fromY = move.from().y();
        //clonage de la piece
        let piece = move.piece().clone();
        //Le clone a les coordo du moveyto
        piece.set_coordinates(move.to());
        this._check_pawn_taken(move);

        this._board[move.to().x()][move.to().y()] = piece;
        this._board[fromX][fromY] = undefined;

      }

      console.log("Couleur du joueur " + this._color);
      this._check_winner();

      if (this._count_black_pawn > 1 && this._count_white_pawn > 1) {
        let that = this.clone();
        if (this.current_color() === Color.BLACK && that._check_group_connection(list[0]) !== this._count_black_pawn) {
          this._disconnect_black = true;
        }
        if (this.current_color() === Color.WHITE && that._check_group_connection(list[0]) !== this._count_white_pawn) {
          this._disconnect_white = true;
        }
        console.log("deco black " + this._disconnect_black);
        console.log("deco white " + this._disconnect_white);
      }

      if (!this.is_finished()) {
        this._change_color();
      }
    }

  }


  _check_group_connection(move) {
    let move_coord = move.to();
    let piece = this._board[move_coord.x()][move_coord.y()];

    let file = new File();

    file.add(piece);
    piece._marked = true;
    this._cpt_mark++;
    piece = file.remove();

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (move.to().x() + i >= 0 && move.to().y() + j >= 0 && move.to().x() + i < 10 && move.to().y() + j < 8) {
          if (this._board[move.to().x() + i][move.to().y() + j] !== undefined && this._board[move.to().x() + i][move.to().y() + j].color() === this._color) {
            if (this._board[move.to().x() + i][move.to().y() + j]._marked === false) {
              piece = this._board[move.to().x() + i][move.to().y() + j];
              this._check_group_connection(new Move(piece, piece.coordinates()));
            }
          }
        }
      }
    }
    return this._cpt_mark;
  }

  _check_pawn_taken(move) {
    let pieceTaken = this._board[move.to().x()][move.to().y()];

    if (this._board[move.to().x()][move.to().y()] !== undefined) {
      if (pieceTaken.color() === Color.WHITE) {
        this._count_white_pawn--;
        console.log(this._count_white_pawn);
      }
      else {
        this._count_black_pawn--;
        console.log(this._count_black_pawn);
      }
    }
  }

  parse(str) {
    // TODO
  }

  to_string() {
    // TODO
  }

  //Retourne vrai si la piece peut se déplacer en x,y
  _verify_moving(list, x, y) {
    let val = false;
    let moves;
    if (list.length === 1) {
      moves = this._get_possible_move_list(list[0]);
    } else {
      moves = this._get_possible_ordo_moves(list);
    }
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].to().x() === x && moves[i].to().y() === y) {
        val = true;
      }
    }
    return val;
  }

  /*
   _verify_moving(piece, x, y) {
   //La liste des moves pour la piece
   let possible_moves = this._get_possible_move_list(piece);
   let val = false;

   //Verifie si x,y fait partie des moves possibles
   possible_moves.forEach(function (move) {
   if (move.to().x() === x && move.to().y() === y) {
   val = true;
   }
   });
   return val;
   }*/

  get_possible_move_list() {
    let moves = [];

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 8; y++) {
        if (this._board[x][y] !== undefined) {
          moves = moves.concat(this._get_possible_move_list(this._board[x][y]));
        }
      }
    }
    return moves;
  }

  _get_possible_ordo_moves(list) {
    let moves = [];
    let piece = list[0]; // 1er piece de l'ordo
    let piecetmp = [];
    if (list.length !== 1) {
      let pieces = list;
      let piece_moves; // ensemble des moves des pieces selectionnées
      let free_case = 0;
      let stop = false;

      if (list[0].coordinates().x() === list[1].coordinates().x()) {
        //LEFT
        for (let leftlimit = 1; leftlimit < list[0].coordinates().x() + 1; leftlimit++) {
          for (let i = 0; i < pieces.length; i++) {
            piecetmp.push(list[i]);
            if (this._board[list[i].coordinates().x() - leftlimit][list[i].coordinates().y()] === undefined && this._verify_moving(piecetmp, list[i].coordinates().x() - leftlimit, list[i].coordinates().y())) {
              //check la case à gauche de chaque piece de l'ordo si vide, on ajoute le move possible
              free_case++;
              moves.push(new Move(list[i], new Coordinates(list[i].coordinates().x() - leftlimit, list[i].coordinates().y())));
            }
            piecetmp.pop();
          }

          if (free_case !== list.length) {
            stop = true;
            while (free_case !== 0) {
              moves.pop();
              free_case--;
            }
          } else {
            free_case = 0;
          }
          if (stop) {
            break;
          }
        }

        //RIGHT
        free_case = 0;
        stop = false;
        for (let rightlimit = 1; rightlimit < 10 - list[0].coordinates().x(); rightlimit++) {
          for (let i = 0; i < pieces.length; i++) {
            piecetmp.push(list[i]);
            if (this._board[list[i].coordinates().x() + rightlimit][list[i].coordinates().y()] === undefined && this._verify_moving(piecetmp, list[i].coordinates().x() + rightlimit, list[i].coordinates().y())) {
              //check la case à droite de chaque piece de l'ordo si vide, on ajoute le move possible
              free_case++;
              moves.push(new Move(list[i], new Coordinates(list[i].coordinates().x() + rightlimit, list[i].coordinates().y())));
            }
            piecetmp.pop();
          }
          if (free_case !== list.length) {
            stop = true;
            while (free_case !== 0) {
              moves.pop();
              free_case--;
            }
          } else {
            free_case = 0;
          }
          if (stop) {
            break;
          }
        }
      } else {//ligne horizontale

        //UP
        free_case = 0;
        stop = false;
        for (let uplimit = 1; uplimit < list[0].coordinates().y() + 1; uplimit++) {
          for (let i = 0; i < pieces.length; i++) {
            piecetmp.push(list[i]);
            if (this._board[list[i].coordinates().x()][list[i].coordinates().y() - uplimit] === undefined && this._verify_moving(piecetmp, list[i].coordinates().x(), list[i].coordinates().y() - uplimit)) {
              free_case++;
              moves.push(new Move(list[i], new Coordinates(list[i].coordinates().x(), list[i].coordinates().y() - uplimit)));
            }
            piecetmp.pop();
          }
          if (free_case !== list.length) {
            stop = true;
            while (free_case !== 0) {
              moves.pop();
              free_case--;
            }
          } else {
            free_case = 0;
          }
          if (stop) {
            break;
          }
        }

        //DOWN
        free_case = 0;
        stop = false;
        for (let downlimit = 1; downlimit < 8 - list[0].coordinates().y(); downlimit++) {
          for (let i = 0; i < pieces.length; i++) {
            piecetmp.push(list[i]);
            if (this._board[list[i].coordinates().x()][list[i].coordinates().y() + downlimit] === undefined && this._verify_moving(piecetmp, list[i].coordinates().x(), list[i].coordinates().y() + downlimit)) {
              free_case++;
              moves.push(new Move(list[i], new Coordinates(list[i].coordinates().x(), list[i].coordinates().y() + downlimit)));
            }
            piecetmp.pop();
          }

          if (free_case !== list.length) {
            stop = true;
            while (free_case !== 0) {
              moves.pop();
              free_case--;
            }
          } else {
            free_case = 0;
          }
          if (stop) {
            break;
          }
        }
      }


      return moves;

    } else {
      return this._get_possible_move_list(piece);
    } //sinon retourne la liste des moves d'une seule piece

  }


  _get_possible_move_list(piece) {  //paramètre ==> unique
    let moves = [];
    //Singleton Moves List
    if ((this._count_white_pawn === 1 || this._count_black_pawn === 1) && piece._color === this._color) {
      let pc = piece.coordinates();
      //Up
      this._possible_moves_ortho_singleton(piece, pc.y() + 1, moves);
      //Down
      this._possible_moves_ortho_singleton(piece, 8 - pc.y(), moves);
      //Right
      this._possible_moves_ortho_singleton(piece, 10 - pc.x(), moves);
      //Left
      this._possible_moves_ortho_singleton(piece, pc.x() + 1, moves);

      this._possible_moves_diago_singleton(piece, 10 - pc.x(), 7 - pc.y(), moves);
      this._possible_moves_diago_singleton(piece, pc.x() + 1, 8 - pc.y(), moves);
      this._possible_moves_diago_singleton(piece, pc.x() + 1, pc.y() + 1, moves);
      this._possible_moves_diago_singleton(piece, 10 - pc.x(), pc.y() + 1, moves);

      return moves;
    }

    //Normal Game Moves List
    if (piece._color === this._color) {
      let pc = piece.coordinates();

      moves = this._possible_moves_ortho(piece, pc.y() + 1, moves);
      moves = this._possible_moves_ortho(piece, 8 - pc.y(), moves);
      moves = this._possible_moves_ortho(piece, 10 - pc.x(), moves);
      moves = this._possible_moves_ortho(piece, pc.x() + 1, moves);

      this._possible_moves_diago(piece, 10 - pc.x(), 7 - pc.y(), moves);
      this._possible_moves_diago(piece, pc.x() + 1, 8 - pc.y(), moves);
      this._possible_moves_diago(piece, pc.x() + 1, pc.y() + 1, moves);
      this._possible_moves_diago(piece, 10 - pc.x(), pc.y() + 1, moves);
    }

    return moves;
  }


  _possible_moves_function(piece, x, y, moves) {
    if (this._board[x][y] !== undefined && this._board[x][y].color() !== piece.color()) {
      if (this._is_connected(piece.clone(), x, y)) {
        moves.push(new Move(piece.clone(), new Coordinates(x, y)));
        return moves;
      }
    }
    if (this._board[x][y] !== undefined && this._board[x][y].color() === piece.color()) {

      moves.push(new Move(piece.clone(), new Coordinates(50, 50)));
      return moves;
    }
    if (this._board[x][y] === undefined && this._is_connected(piece.clone(), x, y) > 0) {
      moves.push(new Move(piece.clone(), new Coordinates(x, y)));
    }
    return moves;
  }

  _possible_moves_ortho_singleton(piece, condition_for, moves) {

    let pc = piece.coordinates();

    if (condition_for === pc.y() + 1) {
      for (let dy = 1; dy < pc.y() + 1; dy++) {
        moves = this._possible_moves_singleton(piece, pc.x(), pc.y() - dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for === 8 - pc.y()) {
      for (let dy = 1; dy < 8 - pc.y(); dy++) {
        moves = this._possible_moves_singleton(piece, pc.x(), pc.y() + dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for === 10 - pc.x()) {
      for (let dx = 1; dx < 10 - pc.x(); dx++) {
        moves = this._possible_moves_singleton(piece, pc.x() + dx, pc.y(), moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for === pc.x() + 1) {
      for (let dx = 1; dx < pc.x() + 1; dx++) {
        moves = this._possible_moves_singleton(piece, pc.x() - dx, pc.y(), moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

  }

  _possible_moves_diago_singleton(piece, condition_for_x, condition_for_y, moves) {

    let pc = piece.coordinates();
    //BR
    if (condition_for_x === 10 - pc.x() && condition_for_y === 7 - pc.y()) {
      for (let dx = 1, dy = 1; dx < 10 - pc.x() && dy < 7 - pc.y(); dx++, dy++) {
        moves = this._possible_moves_singleton(piece, pc.x() + dx, pc.y() + dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for_x === pc.x() + 1 && condition_for_y === 8 - pc.y()) {
      //BL
      for (let dx = 1, dy = 1; dx < pc.x() + 1 && dy < 8 - pc.y(); dx++, dy++) {
        moves = this._possible_moves_singleton(piece, pc.x() - dx, pc.y() + dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for_x === pc.x() + 1 && condition_for_y === pc.y() + 1) {
      //UL
      for (let dx = 1, dy = 1; dx < pc.x() + 1 && dy < pc.y() + 1; dx++, dy++) {
        moves = this._possible_moves_singleton(piece, pc.x() - dx, pc.y() - dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }

    if (condition_for_x === 10 - pc.x() && condition_for_y === pc.y() + 1) {
      //RU
      for (let dx = 1, dy = 1; dx < 10 - pc.x() && dy < pc.y() + 1; dx++, dy++) {
        moves = this._possible_moves_singleton(piece, pc.x() + dx, pc.y() - dy, moves);
        if (moves.length >= 1 && this._board[moves[moves.length - 1].to().x()][moves[moves.length - 1].to().y()] !== undefined) {
          break;
        }
      }
    }
  }

  _possible_moves_ortho(piece, condition_for, moves) {

    let pc = piece.coordinates();

    if (condition_for === pc.y() + 1) {
      if (this._disconnect_black === true && this._color === Color.BLACK) {
        for (let dy = 1; dy < condition_for; dy++) {
          moves = this._possible_moves_function(piece, pc.x(), pc.y() - dy, moves);
          if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
            moves.pop();
            break;
          }
        }
      }
    }

    if (condition_for === 8 - pc.y()) {
      for (let dy = 1; dy < condition_for; dy++) {
        moves = this._possible_moves_function(piece, pc.x(), pc.y() + dy, moves);
        if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
          moves.pop();
          break;
        }
      }
    }

    if (condition_for === 10 - pc.x()) {
      for (let dx = 1; dx < 10 - pc.x(); dx++) {
        moves = this._possible_moves_function(piece, pc.x() + dx, pc.y(), moves);
        if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
          moves.pop();
          break;
        }
      }
    }

    if (condition_for === pc.x() + 1) {
      for (let dx = 1; dx < condition_for; dx++) {
        moves = this._possible_moves_function(piece, pc.x() - dx, pc.y(), moves);
        if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
          moves.pop();
          break;
        }
      }
    }
    return moves;
  }

  _possible_moves_diago(piece, condition_for_x, condition_for_y, moves) {

    let pc = piece.coordinates();

    if (condition_for_x === 10 - pc.x() && condition_for_y === 7 - pc.y()) {
      for (let dx = 1, dy = 1; dx < condition_for_x && dy < condition_for_y; dx++, dy++) {
        moves = this._possible_moves_function(piece, pc.x() + dx, pc.y() + dy, moves);
        if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
          moves.pop();
          break;
        }
      }
    }

    if (condition_for_x === pc.x() + 1 && condition_for_y === 8 - pc.y()) {
      for (let dx = 1, dy = 1; dx < condition_for_x && dy < condition_for_y; dx++, dy++) {
        moves = this._possible_moves_function(piece, pc.x() - dx, pc.y() + dy, moves);
        if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
          moves.pop();
          break;
        }
      }
    }

    if (condition_for_x === pc.x() + 1 && condition_for_y === pc.y() + 1) {
      if (this._disconnect_black === true && this._color === Color.BLACK) {
        for (let dx = 1, dy = 1; dx < condition_for_x && dy < condition_for_y; dx++, dy++) {
          moves = this._possible_moves_function(piece, pc.x() - dx, pc.y() - dy, moves);
          if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
            moves.pop();
            break;
          }
        }
      }
    }

    if (condition_for_x === 10 - pc.x() && condition_for_y === pc.y() + 1) {
      if (this._disconnect_black === true && this._color === Color.BLACK) {
        for (let dx = 1, dy = 1; dx < condition_for_x && dy < condition_for_y; dx++, dy++) {
          moves = this._possible_moves_function(piece, pc.x() + dx, pc.y() - dy, moves);
          if (moves.length >= 1 && moves[moves.length - 1].to().x() === 50 && moves[moves.length - 1].to().y() === 50 && moves[moves.length - 1].piece().color() === this._color) {
            moves.pop();
            break;
          }
        }
      }
    }

  }

  _possible_moves_singleton(piece, x, y, moves) {
    if (this._board[x][y] !== undefined && this._board[x][y].color() !== piece.color()) {
      moves.push(new Move(piece.clone(), new Coordinates(x, y)));
      return moves;
    }
    if (this._board[x][y] === undefined) {
      moves.push(new Move(piece.clone(), new Coordinates(x, y)));
    }
    return moves;
  }

  _is_connected(piece, x, y) {
    let color = piece.color();
    let nbvoisin = 0;
    let coordOri = piece.coordinates();
    if (y - 1 >= 0 && this._board[x][y - 1] !== undefined && this._board[x][y - 1].color() === color && (coordOri.y() !== y - 1 || coordOri.x() !== x)) {
      nbvoisin++;
    }
    if (y + 1 <= 7 && this._board[x][y + 1] !== undefined && this._board[x][y + 1].color() === color && (coordOri.y() !== y + 1 || coordOri.x() !== x)) {
      nbvoisin++;
    }
    if (x - 1 >= 0 && this._board[x - 1][y] !== undefined && this._board[x - 1][y].color() === color && ( coordOri.x() !== x - 1 || coordOri.y() !== y)) {
      nbvoisin++;
    }
    if (x + 1 <= 9 && this._board[x + 1][y] !== undefined && this._board[x + 1][y].color() === color && ( coordOri.x() !== x + 1 || coordOri.y() !== y)) {
      nbvoisin++;
    }
    if (x - 1 >= 0 && y - 1 >= 0 && this._board[x - 1][y - 1] !== undefined && this._board[x - 1][y - 1].color() === color && ( coordOri.x() !== x - 1 || coordOri.y() !== y - 1 )) {
      nbvoisin++;
    }
    if (x + 1 <= 9 && y - 1 >= 0 && this._board[x + 1][y - 1] !== undefined && this._board[x + 1][y - 1].color() === color && ( coordOri.x() !== x + 1 || coordOri.y() !== y - 1 )) {
      nbvoisin++;
    }
    if (x - 1 >= 0 && y + 1 <= 7 && this._board[x - 1][y + 1] !== undefined && this._board[x - 1][y + 1].color() === color && ( coordOri.x() !== x - 1 || coordOri.y() !== y + 1 )) {
      nbvoisin++;
    }
    if (x + 1 <= 9 && y + 1 <= 7 && this._board[x + 1][y + 1] !== undefined && this._board[x + 1][y + 1].color() === color && ( coordOri.x() !== x + 1 || coordOri.y() !== y + 1 )) {
      nbvoisin++;
    }
    else {
      return nbvoisin;
    }
    return nbvoisin;
  }

  winner_is() {
    return this._winner_color;
  }

  get_count_black_pawn() {
    return this._count_black_pawn;
  }

  get_count_white_pawn() {
    return this._count_white_pawn;
  }

  get_distance_to(c1, c2) {
    return Math.abs(c1.x() - c2.x()) + Math.abs(c1.y() - c2.y());
  }

  show_board() {
    console.log(" ");
    for (let x = 0; x < 11; x++) {
      let text = "";
      for (let y = 0; y < 11; y++) {
        let piece = this._board[x][y];

        if (piece === undefined) text += "*";
        else if (piece.isKing()) text += "K";
        else if (piece.color() === Color.WHITE) text += "W";
        else if (piece.color() === Color.BLACK) text += "B";
      }
      console.log(text);
    }
  }

  _change_color() {
    this._color = (this._color === Color.WHITE) ? Color.BLACK : Color.WHITE;
  }

  _check_winner() {
    if (this._color === Color.WHITE) {
      if (this._count_black_pawn === 0) {
        this._winner_color = Color.WHITE;
        this._is_finished = true;
      }
      for (let i = 0; i < 10; i++) {
        if (this._board[i][0] !== undefined && this._board[i][0]._color === Color.WHITE) {
          this._winner_color = Color.WHITE;
          this._is_finished = true;
        }
      }
      if (this._disconnect_black === true) {
        this._winner_color = Color.WHITE;
        this._is_finished = true;
      }
    }
    if (this._color === Color.BLACK) {
      if (this._count_white_pawn === 0) {
        this._winner_color = Color.BLACK;
        this._is_finished = true;
      }
      for (let j = 0; j < 10; j++) {
        if (this._board[j][7] !== undefined && this._board[j][7]._color === Color.BLACK) {
          this._is_finished = true;
        }
      }
      if (this._disconnect_white === true) {
        this._winner_color = Color.BLACK;
        this._is_finished = true;
      }
    }
    return false;
  }

  _initialize_board() {
    this._board = new Array(10);
    for (let i = 0; i < 10; i++) {
      this._board[i] = new Array(8);
    }

    let alt = 0;
    let up = false;
    let yy;
    let color = Color.BLACK;
    for (let y = 1; y < 8; y = y + 5) {
      for (let x = 0; x < 10; x++) {
        this._board[x][y] = new Piece(color, new Coordinates(x, y));
        if (alt === 2) {
          alt = 0;
          up = !up;
        }
        if (!up) {
          yy = y + 1;
        }
        else {
          yy = y - 1;
        }
        this._board[x][yy] = new Piece(color, new Coordinates(x, yy));
        alt++;
      }
      color = Color.WHITE;
    }


    /*  for (let i = 0; i < 2; i++) {
     this._board[2 + i * 4][0] = new Piece(Color.BLACK, new Coordinates(2 + i * 4, 0));
     this._board[3 + i * 4][0] = new Piece(Color.BLACK, new Coordinates(3 + i * 4, 0));
     this._board[2 + i * 4][1] = new Piece(Color.BLACK, new Coordinates(2 + i * 4, 1));
     this._board[3 + i * 4][1] = new Piece(Color.BLACK, new Coordinates(3 + i * 4, 1));
     }

     this._board[5][1] = new Piece(Color.BLACK, new Coordinates(5, 1));

     for (let i = 0; i < 2; i++) {
     this._board[2 + i * 4][6] = new Piece(Color.WHITE, new Coordinates(2 + i * 4, 6));
     //this._board[3 + i * 4][6] = new Piece(Color.WHITE, new Coordinates(3 + i * 4, 6));
     //this._board[2 + i * 4][7] = new Piece(Color.WHITE, new Coordinates(2 + i * 4, 7));
     this._board[3 + i * 4][7] = new Piece(Color.WHITE, new Coordinates(3 + i * 4, 7));
     }
     this._board[0][6] = new Piece(Color.BLACK, new Coordinates(0, 6));
     this._board[1][6] = new Piece(Color.BLACK, new Coordinates(1, 6));

     */
  }


}

export default Engine;

