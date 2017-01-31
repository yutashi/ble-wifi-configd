const bleno = require('bleno');

const name = 'NanoPi';
const serviceUuids = ['DB438497-5D68-43BF-85B7-DA61077C23AA'];

const hasConfigValues = function (characteristics) {
  let count = 0;
  characteristics.forEach(function (characteristic) {
    if (characteristic.value) {
      count += 1;
    };
  });

  if (characteristics.length === count) {
    return true;
  } else {
    return false;
  };
};

const clearConfigValues = function (characteristics) {
  characteristics.forEach(function (characteristic) {
    characteristic.value = null;
  });
};

const ssidCharacteristic = new bleno.Characteristic({
  value: null,
  uuid: 'fff1',
  properties: ['write'],
  onWriteRequest: function(data, offset, withoutResponse, callback) {
    console.log(pskCharacteristic.value);
    this.value = data;
    console.log('ssid: ' + this.value.toString('utf-8'));

    if (hasConfigValues(configChars)) {
      console.log('OK! Lets set up wifi.');
      clearConfigValues(configChars);
    };
    callback(this.RESULT_SUCCESS);
  }	 
});

const pskCharacteristic = new bleno.Characteristic({
  value: null,
  uuid: 'fff2',
  properties: ['write'],
  onWriteRequest: function(data, offset, withoutResponse, callback) {
    this.value = data;
    console.log('psk: ' + this.value.toString('utf-8'));

    if (hasConfigValues(configChars)) {
      console.log('OK! Lets set up wifi.');
      clearConfigValues(configChars);
    };
    callback(this.RESULT_SUCCESS);
  }
});

const configChars = [ssidCharacteristic, pskCharacteristic];

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
        characteristics: configChars
      })
    ]);
  };
});

