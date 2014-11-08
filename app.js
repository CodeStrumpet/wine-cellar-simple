var _ = require('lodash');

var SENSOR_IDS = {
    "1660": "outside1",
    "2411": "room1",
    "2923": "cellar1"
};

var arduinoSerialPort = "/dev/ttyS1";
//var arduinoSerialPort = '/dev/cu.usbmodem1411';

var celciusConvMultiplier = 9.0/5.0;
var celciusConvConstant = 32.0;

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
    m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

function convertCelciusToFahrenheit(celcius) {
    var converted = (celcius * celciusConvMultiplier) + celciusConvConstant;
    return converted.toFixed(1);
}


var app = require('http').createServer(handler), 
fs = require('fs'),
os = require('os'),
sp = require('serialport'),
request = require('request'),
nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: './.ENV' });


sp.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
  
//init for SerialPort connected to Arduino
var SerialPort = sp.SerialPort
var serialPort = new SerialPort(arduinoSerialPort,
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
    try {
        var parsedData = JSON.parse(data);
    } catch(e) {
        console.log(e);
        console.log(data);
    }

    if (parsedData) {
        if (parsedData.message) {
            console.log("FYI: " + parsedData.message);
        } else if (parsedData.data) {
            //console.log(JSON.stringify(parsedData.data));

            var postObj = {};

	    _.forEach(_.values(SENSOR_IDS), function(item) {
		postObj[item] = 0.0;
	    });
	    
            for (var i = 0; i < Object.keys(parsedData.data).length; i++) {
                var numericSensorId = Object.keys(parsedData.data)[i];
                if (SENSOR_IDS[numericSensorId]) {
		    var convertedTemp = convertCelciusToFahrenheit(parsedData.data[numericSensorId]);
		    postObj[SENSOR_IDS[numericSensorId]] = convertedTemp;
                }
            }

            console.log(JSON.stringify(postObj));

            request.post('http://data.sparkfun.com/input/1nnZl2NVJqILvXoY8dax?private_key=0mmlD4dGEZS1RYBeWow9', 
                {form:postObj}, function(error, response, body) {
                    if (error) {
                        console.log(JSON.stringify(error));
                    } else {
			//console.log(response.body);
		    }

                });
        }
    }

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