const exec = require('child_process').exec;
const fs = require('fs');
const bleno = require('bleno');

const name = 'WifiConfigService';
const serviceUuids = ['fff0'];
const netConf = {
  ssid: null,
  psk: null
};

const connectWifi = function () {
  if (netConf.psk.length < 8) {
    console.error('Passphrase must be 8~63 characters');
  } else {
    console.log('Starting to set up wifi...');
    createWpaconf('/etc/wpa_supplicant/wpa_supplicant.conf');
  };
};

const createWpaconf = function (wpaPath) {
  let stream = fs.createWriteStream(wpaPath, { flags: 'w' });
  writeBaseconf('./base.conf', stream);
};

const writeBaseconf = function (basePath, stream) {
  fs.readFile(basePath, function(err, data) {
    if (err) {
      throw err;
    };

    stream.write(data);
    writePassphrase(netConf.ssid, netConf.psk, stream);
  });
};

const writePassphrase = function (ssid, psk, stream) {
  let child = exec(`wpa_passphrase ${ssid} ${psk}`);
  child.stdout.pipe(stream);  
  child.on('exit', function() {
    stream.end();
    reconfigWpa();
  });
};

const reconfigWpa = function () {
  let child = exec('wpa_cli reconfigure');
  child.on('exit', function (code) {
    console.log('Done with status code: ', code);
    return code;
  });
};

const hasConfigValues = function (netConf) {
  if (netConf.ssid && netConf.psk) {
    return true;
  } else {
    return false;
  }
};

const clearConfigValues = function (netConf) {
  console.log('Clean up config values.');
  netConf.ssid = null;
  netConf.psk = null;
};

const ssidCharacteristic = new bleno.Characteristic({
  value: null,
  uuid: 'fff1',
  properties: ['write'],
  onWriteRequest: function(data, offset, withoutResponse, callback) {
    netConf.ssid = data.toString('utf-8');
    console.log('ssid: ' + netConf.ssid.toString('utf-8'));

    if (hasConfigValues(netConf)) {
      if (connectWifi() === 0) {
        clearConfigValues(netConf);
      };
    };
    callback(this.RESULT_SUCCESS);
  }	 
});

const pskCharacteristic = new bleno.Characteristic({
  value: null,
  uuid: 'fff2',
  properties: ['write'],
  onWriteRequest: function(data, offset, withoutResponse, callback) {
    netConf.psk = data.toString('utf-8');
    console.log('psk: ' + netConf.psk.toString('utf-8'));

    if (hasConfigValues(netConf)) {
      if (connectWifi() === 0) {
        clearConfigValues(netConf);
      };
    };
    callback(this.RESULT_SUCCESS);
  }
});

bleno.on('stateChange', function(state) {
  console.log('State change: ' + state);
  if (state === 'poweredOn') {
    bleno.startAdvertising(name, serviceUuids);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('accept', function(clientAddr) {
  console.log('Accepted connection from address: ' + clientAddr);
});

bleno.on('disconnect', function(clientAddr) {
  console.log('Disconnected from address: ' + clientAddr);
});

bleno.on('advertisingStart', function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('Advertising start success');

    bleno.setServices ([
      // Define a new service.
      new bleno.PrimaryService({
        uuid: serviceUuids[0],
        characteristics: [
	  ssidCharacteristic,
	  pskCharacteristic
        ]
      })
    ]);
  };
});

