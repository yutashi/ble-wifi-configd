const exec = require('child_process').exec;
const fs = require('fs');

const ssid = process.argv[2];
const psk = process.argv[3];

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
    writePassphrase(ssid, psk, stream);
  });
};

const writePassphrase = function (ssid, psk, stream) {
  let child = exec(`wpa_passphrase ${ssid} ${psk}`);
  child.stdout.pipe(stream);  
  child.on('exit', function() {
    stream.end();
    getIface();
  });
};

const getIface = function () {
  let iface = '';
  let child = exec('ifconfig -a | grep -o "wl[^ ]*"');
  child.stdout.on('data', function(chunk) {
    iface += chunk;
  });

  child.stdout.on('end', function() {
    restartIface(iface.trim('\n'));
  });
};

const restartIface = function (iface) {
  console.log('Restart wireless interface...');
  // Set timeout with milliseconds.
  let child = exec(`ifdown ${iface} && ifup ${iface}`, { timeout: 1000 * 30 });
  child.on('exit', function(code) {
    console.log('Done with status code: ', code);
  }); 
};

if (psk.length < 8) {
  console.error('Passphrase must be 8~63 characters');
  process.exit();
} else {
  createWpaconf('/etc/wpa_supplicant/wpa_supplicant.conf');
};
