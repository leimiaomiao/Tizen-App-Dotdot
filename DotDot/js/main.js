var game;
$(function() {
	var deviceWidth = document.body.clientWidth;
	var deviceHeight = document.body.clientHeight;
	
	var container = d3.select("svg#container").attr("width", deviceWidth).attr(
			"height", deviceHeight*0.9);
	d3.select("#replay").attr("x",deviceWidth/2).attr("y",deviceHeight/2).attr("text-anchor","middle").style("display","none");
	
	game = new Game(container, deviceWidth, deviceHeight);
	
	game.isEnd = setInterval(function(){
		game.update();
	},15);
	
	$("#replay").on("tap",function(){
		
		d3.select("#replay").style("display","none");
		
		clearInterval(game.isEnd);
		game = new Game(container, deviceWidth, deviceHeight);
		
		game.isEnd = setInterval(function(){
			game.update();
		},15);
	});
	
});

window.addEventListener("touchstart", function(event) {
	//event.preventDefault();
}, false);

window.addEventListener("touchmove", function(event) {
	if (event.targetTouches.length > 1 || (event.scale && event.scale !== 1)){
		return;
	}
	var touch = event.targetTouches[0];
	var pos = {
		x : touch.pageX,
		y : touch.pageY
	};
	game.hero.touchMove(pos);
}, false);

window.addEventListener("mousemove", function(event){
	var pos = {
			x:event.screenX,
			y:event.screenY
	};
	game.hero.touchMove(pos);
}, false);

window.addEventListener('tizenhwkey', function onTizenHwKey(e) {
    if (e.keyName === 'back') {
        try {
            tizen.application.getCurrentApplication().exit();
        } catch (err) {
            console.log('Error: ', err);
        }
    }
});
