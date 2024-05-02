<!DOCTYPE html>
<html>
<style>
#container {
  width: 400px;
  height: 400px;
  position: relative;
  background: yellow;
}
#animate {
  width: 50px;
  height: 50px;
  position: absolute;
  background-color: red;
}
</style>
<body>

<p><button onclick="myMove()">Click Me</button></p> 

<div id ="container">
  <div id ="animate"></div>
</div>

<script>
function myMove() {
  let id = null;
  const elem = document.getElementById("animate");   
  
  	
  let pos = 0;
  let angel = 90;
  let r = 200;
  clearInterval(id);
  id = setInterval(frame, 1);
  function frame() {
  	if (pos <= 175){
    	pos++;
    	elem.style.top = "0px";
    	elem.style.left = pos + "px";
    }
    else {
        if (angel == -270){
            angel = 90;
            r -= 25;
        }
        if (r == 25) {
      		clearInterval(id);
    	}
        else{
            let radian = angel * Math.PI / 180;
            elem.style.top = 225 - r * Math.sin(radian) + "px"; // 225 - 25 = 175
            elem.style.left = 175 + r * Math.cos(radian) + "px"; // 175 - 0 = 175
            angel--;
        }
        
    }
    
  }
}
</script>

</body>
</html>