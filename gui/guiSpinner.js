

function guiSpinner( name )
{
  this.name = name;   

  this.cursorColor = "rgba(10,10,10,0.3)";

  this.pos_start;
  this.cursorShort = 11;
  this.cursorLong = 21;
  this.offset = 30;

  this.value = 0.0;
}
guiSpinner.inherits( guiRegion );

guiSpinner.prototype.setSize = function( x, y, w, h ) {
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  this.move ( x, y );
}

// virtual mouse functions 
//  (overridden by specific gui behavior)
guiSpinner.prototype.OnMouseDown = function( button, x, y )
{
  var cx = Math.floor( this.width/2 );
  var cy = Math.floor( this.height/2 );

  this.value = Math.atan2(cy-y,cx-x);

  var e = createEvent( this, "spinner", "mdown", "", null );
  e.attach( this.value );
  sendEvent( e );

  return true;
}

guiSpinner.prototype.OnMouseUp = function( button, x, y )
{
  return true;
}

guiSpinner.prototype.OnMouseDrag = function( button, x, y ) {
  var cx = Math.floor( this.width/2 );
  var cy = Math.floor( this.height/2 );


  this.value = Math.atan2(cy-y,cx-x);

  var e = createEvent( this, "spinner", "mdrag", "", null );
  e.attach( this.value );
  sendEvent( e );

  return true;
}

guiSpinner.prototype.draw = function() {

  var cx = Math.floor( this.width/2 );
  var cy = Math.floor( this.height/2 );

  var dy = Math.floor( this.cursorShort/2 );
  var dx = Math.floor( this.cursorLong/2 );

  g_painter.translate(cx,cy); 
  g_painter.rotate( this.value );
  g_painter.drawFill( -dx - this.offset, -dy, this.cursorLong, this.cursorShort, this.cursorColor );
  g_painter.drawFill( -3,-3, 6,6, this.cursorColor );
  g_painter.rotate( -this.value );
  g_painter.translate(-cx,-cy); 


}


