var Graphics = require("./graphics");
var Backend = require("./multiplayer");

window.game = {
	gfx: new Graphics(),
	multi: new Backend()
};

//when the server opens
game.multi.on("open", () => {
    console.log("openned")
});

//update mouse position
/*window.addEventListener("mousemove", e => {
	var orientation = Math.round(Math.atan2(
		e.clientY - window.innerHeight / 2,
		e.clientX - window.innerWidth / 2
	)*180/Math.PI);
});*/