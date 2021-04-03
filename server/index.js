const WebSocket = require("ws");
const { decode, encode } = require("@msgpack/msgpack");
const _ = require("lodash");

const Game = class {
	constructor() {
		this.wss = new WebSocket.Server({
			port: 8080,
			perMessageDeflate: {
				zlibDeflateOptions: {
					chunkSize: 1024,
					memLevel: 7,
					level: 3
				},
				zlibInflateOptions: {
					chunkSize: 10 * 1024
				},
				clientNoContextTakeover: true,
				serverNoContextTakeover: true,
				serverMaxWindowBits: 10,
				concurrencyLimit: 10,
				threshold: 1024
			}
		});

		this.wss.on("connection", ws => {
			ws.on("close", () => {});
		});
	}
	send(ws, type, data) {
		ws.send(
			encode({
				type,
				data
			})
		);
	}

	broadcast(type, data) {
		this.wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				this.send(client, type, data);
			}
		});
	}

	serialize() {
		var i = _.cloneDeep(this);
		delete i.wss;
		return JSON.parse(JSON.stringify(i));
	}
};

const game = new Game();
console.log(game.serialize());