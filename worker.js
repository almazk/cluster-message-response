const Cluster = require('cluster');

const Options = {
   key: 'cluster.messaging'
};

const WorkerCallbacks = {};
let counter = 0;
const Counter = () => counter++;


function Init($Options = {}) {
   if (Cluster.isWorker) {
      const {key} = $Options;
      if (key) {
         Options.key = key;
      }
      process.on('message', OnMessageFromMaster);
   }
}

const OnMessageFromMaster = ($MasterMessage) => {
   if ($MasterMessage && typeof $MasterMessage === 'object') {
      const {key, counter, data} = $MasterMessage;
      if (key === Options.key) {
         if (counter !== undefined) {
            if (WorkerCallbacks[counter]) {
               WorkerCallbacks[counter](data);
               Reflect.deleteProperty(WorkerCallbacks, counter);        //удаляем
            }
         }
      }
   }
};

function EmitToMaster($Event, $Data, $Callback) {
   const counter = Counter();
   const $Message = {
      key: Options.key,
      pid: process.pid,
      event: $Event,
      data: $Data,
      counter: counter
   };
   if ($Callback && typeof $Callback === 'function') {
      WorkerCallbacks[counter] = $Callback;
   }
   process.send($Message);
}


module.exports = {
   init: Init,
   emitToMaster: EmitToMaster
};
