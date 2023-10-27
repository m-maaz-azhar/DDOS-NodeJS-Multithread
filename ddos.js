const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const SERVER = 'http://localhost:5000/';
const CALLS_PER_THREAD = 10000;

if (isMainThread) {
  const numThreads = 4;

  const createWorker = (start, end) => {
    const worker = new Worker(__filename, {
      workerData: { start, end },
    });

    worker.on('message', (message) => {
      console.log(`Worker completed ${message} API calls.`);
    });

    worker.on('error', (error) => {
      console.error(`Worker error: ${error}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
      }
    });
  };

  let start = 0;
  for (let i = 0; i < numThreads; i++) {
    const end = start + CALLS_PER_THREAD;
    createWorker(start, end);
    start = end;
  }
} else {
  // This code runs in the worker threads
  const { start, end } = workerData;

  async function makeApiCalls() {
    for (let i = start; i < end; i++) {
      try {
        const response = await fetch(SERVER);
        console.log(`API call ${i} completed: ${response.data}`);
      } catch (error) {
        console.error(`API call ${i} failed: ${error.message}`);
      }
    }
  }

  makeApiCalls()
    .then(() => {
      parentPort.postMessage(end - start); // Send the number of API calls completed
    })
    .catch((error) => {
      console.error(`Worker error: ${error}`);
    });
}
