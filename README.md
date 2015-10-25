# Tizen-App-Dotdot
### 概述
DOTDOT是一款考验灵活的益智小游戏。游戏的全部内容就是移动蓝色小球，躲避红色小球，时间越长，得分越多。游戏中主要有红色小球，黄色小球，灰色小球、绿色小球等几种颜色的小球。不同颜色的小球有着不同的功能。碰到红色的小球游戏就会结束，碰到绿色的小球会让蓝色小球变得无敌，碰到黄色的小球会让蓝色小球变小，碰到灰色小球会让蓝色小球变大不利于蓝色小球躲避障碍。
### 核心算法
* Main.js

Main.js为游戏的入口，负责监听事件。
<pre>
var deviceWidth = window.screen.width;
var deviceHeight = window.screen.height-20;
	
var container = d3.select("svg#container").attr("width", deviceWidth).attr("height", deviceHeight);

d3.select("#replay").attr("x",deviceWidth/2).attr("y",(deviceHeight)/2).attr("text-anchor","middle").style("display","none");
	
game = new Game(container, deviceWidth, deviceHeight);
	
game.isEnd = setInterval(function(){
  game.update();
},15);
</pre>
通过window.screen.width和window.screen.height获得屏幕的宽度和高度，实现游戏全屏。
<pre>
game.isEnd = setInterval(function(){
	game.update();
},15);
</pre>
使用定时器，每15毫秒更新游戏。

添加touch事件，在touchmove事件的监听中加入对英雄小球的移动处理。
<pre>
window.addEventListener("touchstart", function(event) {
	event.preventDefault();
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
	
	if(pos.x <= 0) pos.x = 0;
	if(pos.x >= window.screen.width) pos.x = window.screen.width;
	if(pos.y <= 0) pos.y = 0;
	if(pos.y >= window.screen.height-50) pos.y = window.screen.height-50;
	
	game.hero.touchMove(pos);
}, false);
</pre>
加入对手机回退键的事件监听。
<pre>
window.addEventListener('tizenhwkey', function(e) {
	if(e.keyName == "back") {
		try {
			tizen.application.getCurrentApplication().exit();
		} catch (error) {
			console.error("getCurrentApplication(): " + error.message);
		}
	}
},false);
</pre>
* Game.js

Game.js主要负责对游戏主流程的控制，定义了更新游戏状态，添加新的小球，删除小球，小球对英雄施放技能等方法。

<pre>
function Game(container,width,height){
	this.container = container;
    this.width = width;
    this.height = height;
    this.score = 0;
	
    this.birthTime = 25;//出球时间间隔
    this.ballLife = 1500;//每个小球的生命

    this.ticks = 0;//计时器
    this.hero = new Hero(this.width/2,this.height/2);
    this.balls = new Array();
    
    this.isEnd = 0;
    //定义了游戏更新的方法
    this.update = function(){
        if(this.hero.life <= 0)
            return this.endGame();
        this.deleteBalls();
        if(this.ticks % this.birthTime == 0)
            this.addBalls();
        this.reflect();
        this.castMagic();

        this.hero.update();
        for(var i in this.balls)
        	this.balls[i].base.update();

        this.ticks ++;
        this.score ++;
        this.display();
    }
    //定义了绘制游戏画面的方法
    this.display = function(){
    	this.container.selectAll("circle").remove();
    	this.container.select("#score").text(Math.round(this.score/1000*15));
        this.hero.display(this.container);
        for(var i in this.balls)
        	this.balls[i].base.display(this.container);
    }
    //定义了游戏结束的方法
    this.endGame = function(){
    	d3.select("#replay").style("display","block");
    }
    //定义了删除小球的方法
    this.deleteBalls = function(){
    	if(this.balls.length <= 0) 
    		return;
    	
        var first = this.balls[0];
        if(first.base.life <= 0)
        	this.balls.shift();
    }
    //定义了增加小球的方法
    this.addBalls = function(){
        var x = Math.random()*this.width;
        var y = Math.random()*this.height;
        var r = Math.random();
        if(r < 0.7)
            this.balls.push(new KillBall(x,y,this.ballLife));
        else if(r < 0.8)
            this.balls.push(new ExpandBall(x,y,this.ballLife));
        else if(r < 0.9)
            this.balls.push(new ShinkBall(x,y,this.ballLife));
        else
            this.balls.push(new SuperBall(x,y,this.ballLife));
    }
    //定义了当小球运动到界面边界时反弹的方法
    this.reflect = function(){
        for(var i in this.balls)
        	this.balls[i].base.reflect(this.width,this.height);
    }
    //定义了小球施法的方法
    this.castMagic = function(){
        for(var i = 0;i < this.balls.length;i ++){
        	if(this.balls[i].base.collide(this.hero)){
        		if(this.balls[i].castMagic(this.hero)){
        			this.balls.splice(i,1);
        		    i--;
        		}
        	}
        }
    }
}
</pre>
* Hero.js

Hero.js定义了英雄小球的属性，以及一些相关方法。
<pre>
function Hero(x,y){
	this.HREO_MIN_R = 5;
    this.x = x;
    this.y = y;
    this.life = 1;
    this.r = 10;
    this.magics = new Array();
    this.noEnemy = false;
    this.color = "blue";
    this.touch = true;
    
    //定义了绘制小球的方法
    this.display = function(container){
    	var heroCircle = container.append("circle").attr("class","hero").attr("cx", this.x).attr("cy", this.y).attr(
    			"r", this.r).attr("fill", this.color);
    	if(this.noEnemy){
    		heroCircle.attr("stroke-width","2").attr("stroke","#99CC66");
    	}
    }
    
    //定义了当其他小球对英雄小球施法后的效果
    this.addMagic = function(ball){
    	this.magics.push(ball);
    }
    
    //更新小球状态
    this.update = function(){
    	if(this.magics.length <= 0)
    		return;
    	var hasMagic = false;
        for(var i = 0;i < this.magics.length;i ++){
            this.magics[i].life --;
            if(this.magics[i].life > 0){
            	hasMagic = true;
            }
        }
        if(!hasMagic){
	        var first = this.magics[0];
	        if(first.life <= 0){
	        	var ball = this.magics.shift();
	        	ball.noMagic(this);
	        }
        }
    }
    //定义了计算手指触碰小球的计算方法
    this.touchStart = function(position){
    	var distance = Math.sqrt(Math.pow(position.x - this.x,2) + Math.pow(position.y - this.y,2));
    	this.touch = distance <= 5;
    }
    //定义了手指触碰小球，小球的位置改变方法
    this.touchMove = function(position){
    	if(this.touch){
    		this.x = position.x;
    		this.y = position.y;
    	}
    }

}
</pre>

* Ball.js

Ball.js定义了四种小球的属性和方法

1. 抽象出Ball的父类
<pre>
function Ball(x,y,life,color){
    this.x = x;
    this.y = y;
    this.life = life;
    this.vx = (Math.random()-0.5)*5;
    this.vy = (Math.random()-0.5)*5;
    this.r = 5;
    this.color = color;

    this.reflect = function(width,height){
        if(this.x - this.r <= 0 || this.x + this.r >= width)
            this.vx = -this.vx;
        if(this.y - this.r <= 0 || this.y + this.r >= height)
            this.vy = -this.vy;
    }

    this.update = function(){
        this.x += this.vx;
        this.y += this.vy;
        this.life --;
    }

    this.display = function(container){
    	container.append("circle").attr("class","ball").attr("cx", this.x).attr("cy", this.y).attr(
    			"r", this.r).attr("fill", this.color);
    }
    
    this.collide = function(hero){
    	var distance = Math.sqrt(Math.pow(hero.x - this.x,2) + Math.pow(hero.y - this.y,2));
    	return distance <= hero.r + this.r;
    }
}
</pre>

2. 定义了具有杀死英雄的小球。
<pre>
function KillBall(x,y,life){
    this.base = new Ball(x,y,life,"#FF6666");

    this.castMagic = function(hero){
        if(hero.noEnemy)
            return false;
        hero.life -= 1;
        return false;
    }
}
</pre>
3. 定义了具有放大英雄的小球
<pre>
function ExpandBall(x,y,life){
    this.base = new Ball(x,y,life,"#CCCCCC");

    this.castMagic = function(hero){
        hero.r += 1;
        return true;
    }

    this.noMagic = function(hero){
        hero.r -= 1;
    }
}
</pre>
4. 定义了具有缩小英雄的小球
<pre>
function ShinkBall(x,y,life){
    this.base = new Ball(x,y,life,"#FFFF66");
    this.cast = false;
    this.castMagic = function(hero){
    	if(hero.r > 2){
    		hero.r -= 1;
    		this.cast = true;
    	}
        return true;
    }

    this.noMagic = function(hero){
    	if(this.cast)
    		hero.r += 1;
    }
}
</pre>
5. 定义了具有使英雄无敌的小球
<pre>
function SuperBall(x,y,life){
	this.SUPERTIME = 200;
    this.base = new Ball(x,y,life,"#99CC66");
    this.life = this.SUPERTIME;
    
    this.castMagic = function(hero){
        hero.noEnemy = true;
        hero.addMagic(this);
        return true;
    }

    this.noMagic = function(hero){
        hero.noEnemy = false;
    }
}
</pre>
