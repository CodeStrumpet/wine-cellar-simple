var app = require('http').createServer(handler), 
fs = require('fs'),
os = require('os'),
sp = require("serialport");



sp.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
  
//init for SerialPort connected to Arduino
var SerialPort = sp.SerialPort
var serialPort = new SerialPort('/dev/cu.usbmodem1411', 
				{   baudrate: 9600,
				    dataBits: 8,
				    parity: 'none',
				    stopBits: 1,
				    flowControl: false,
                    parser: sp.parsers.readline("\n")
				});
    
serialPort.on("open", function () {
    console.log('serialPort open');    
});

serialPort.on("data", function (data) {
  console.log('serial data: ' + data);
});
    
//Display my IP
var networkInterfaces=os.networkInterfaces();

for (var interface in networkInterfaces) {
    
    networkInterfaces[interface].forEach(
        function(details){
            
            if (details.family=='IPv4' 
                && details.internal==false) {
                console.log(interface, details.address);  
            }
	});
}

//All clients have a common status
var commonStatus = 'ON';

app.listen(8080);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
		function (err, data) {
		    if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		    }

		    res.writeHead(200);
		    res.end(data);
		});
}

// io.sockets.on('connection', function (socket) {
    
//     //Send client with his socket id
//     socket.emit('your id', 
// 		{ id: socket.id});
    
//     //Info all clients a new client caaonnected
//     io.sockets.emit('on connection', 
// 		    { client: socket.id,
// 		      clientCount: io.sockets.clients().length,
// 		    });
        
//     //Set the current common status to the new client
//     socket.emit('ack button status', { status: commonStatus });
    
//     socket.on('button update event', function (data) {
//         console.log(data.status);
        
//         //acknowledge with inverted status, 
//         //to toggle button text in client
//         if(data.status == 'ON'){
//             console.log("ON->OFF");
//             commonStatus = 'OFF';
//             serialPort.write("LEDON\n");
//         }else{
//             console.log("OFF->ON");
//             commonStatus = 'ON';
//             serialPort.write("LEDOFF\n");
//         }
//         io.sockets.emit('ack button status', 
// 			{ status: commonStatus,
// 			  by: socket.id
// 			});
//     });
    
//     //Info all clients if this client disconnect
//     socket.on('disconnect', function () {
//         io.sockets.emit('on disconnect', 
// 			{ client: socket.id,
// 			  clientCount: io.sockets.clients().length-1,
// 			});
//     });
// });