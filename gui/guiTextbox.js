

function guiTextbox( name )
{
  this.constructor(name);

  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  //this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";
  //this.bgColor = "rgba(0,0," + this.uniq +",0.7)";
  this.bgColor = "rgba(" + this.uniq +",0,0,0.2)";

  this.drawShape = null;

  this.borderTop = 5;
  this.borderBottom = 15;
  this.borderSize = 5;

  this.text = "";
  this.textSize = 10 ;
  this.textMaxLength = 64;

  this.textHeight = this.textSize;
  this.textWidth = this.textHeight * 0.6;

  this.button = new guiIcon( name + ":button" );
  this.button.init( 5, this.textSize + 5, 10, 10 );
  this.addChild( this.button );

  this.width = this.textWidth * 20 + 2*this.borderSize ;
  this.height = this.textHeight + this.button.height + this.borderTop + this.borderBottom;

  //console.log("uniq: " + this.uniq);
}
guiTextbox.inherits( guiRegion );

guiTextbox.prototype.init = function(x, y, w, h )
{
  this.width = w;
  this.height = h;
  this.move(x,y);

  this.button.init( 5, this.textSize + 5, 10, 10 );
}

guiTextbox.prototype.keyDown = function(keycode, ch, ev)
{
  console.log("guiTextbox.keyDown: got ch: " + ch);
}

guiTextbox.prototype.handleEevent = function(ev)
{
  console.log("guiTextbox.keyDown: got event: ");
  console.log(ev);
}


guiTextbox.prototype.mouseDown = function(button, x, y)
{
  console.log("guiTextbox.mouseDown(" + this.name + "): " + button + " " + x + " " + y);

  var ev = { type: "mouseDown", owner: this.name, ref: this, button : button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

guiTextbox.prototype.doubleClick = function(ev, x, y)
{
  //console.log("guiTextbox.doubleClick(" + this.name + ")");
  //console.log(ev);

  var ev = { type: "doubleClick", owner: this.name, button : ev.button, x : x, y : y };

  this.parent.handleEvent(ev);

  return true;
}

guiTextbox.prototype.draw = function()
{

   g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );

  if (this.drawShape)
    this.drawShape();
}

