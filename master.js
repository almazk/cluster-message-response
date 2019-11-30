const Cluster = require('cluster');

const Options = {
   key: 'cluster.messaging'
};

const Events = {};

function Init($Options = {}) {
   if (Cluster.isMaster) {
      const {key} = $Options;
      if (key) {
         Options.key = key;
      }
      for (let WorkerIndex in Cluster.workers) {
         let worker = Cluster.workers[WorkerIndex];
         worker.on('message', OnMessageFromWorker);
      }

      Cluster.on('exit', ($Worker) => {
         $Worker.on('message', OnMessageFromWorker);
      });
   }
}

const onMasterEvent = ($EventName, $Callback) => {                         //подписка на события
   if ($Callback) {
      if (Events[$EventName] === undefined) {
         Events[$EventName] = [];
      }
      if ($Callback && typeof $Callback === 'function') {
         Events[$EventName].push($Callback);
      }
   }
};

const OnMessageFromWorker = ($WorkerMessage) => {                            //Сообщения от Worker
   if ($WorkerMessage && typeof $WorkerMessage === 'object') {
      const {data, key, event, pid, counter} = $WorkerMessage;
      if (key === Options.key) {
         onEventSubscribed(event, data, pid, counter);
      }
   }
};

const onEventSubscribed = ($EventName, $Data, $PID, $Counter) => {      //
   if (Events[$EventName]) {
      for (let Callback of Events[$EventName]) {
         let data = Callback($Data);
         if(data !== undefined) {
            MasterToWorker($PID, $EventName, data, $Counter);
         }
      }
   }
};

function MasterToWorker($PID, $Event, $Data, $Counter) {
   for (let WorkerIndex in Cluster.workers) {
      let worker = Cluster.workers[WorkerIndex];
      const {process: {pid}} = worker;
      if ($PID === pid) {
         worker.send({
            key: Options.key,
            data: $Data,
            counter: $Counter
         });
      }
   }
}

module.exports = {
   init: Init,
   onMessageFromWorker: OnMessageFromWorker,
   onEventFromWorker: onMasterEvent
};
