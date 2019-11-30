const Cluster = require('cluster');

const MASTER = require('./master');
const WORKER = require('./worker');


function Init($Options) {
   (Cluster.isMaster) ? MASTER.init($Options) : WORKER.init($Options);
}

module.exports = {
   init: Init,
   master: {
      onEventFromWorker: MASTER.onEventFromWorker,
   },
   worker: {
      emitToMaster: WORKER.emitToMaster
   },
};
