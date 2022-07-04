import { EventEmitter } from 'events'
import { readFile } from 'fs'

/*
    3.1 A simple event: Modify the asynchronous FindRegex class so
    that it emits an event when the find process starts, passing the
    input files list as an argument. Hint: beware of Zalgo!
*/
class FindRegex extends EventEmitter {
    constructor(regex) {
        super()
        this.regex = regex
        this.files = []
    }
    addFile(file) {
        this.files.push(file)
        return this
    }
    find() {
        this.emit('started', this.files)

        for (const file of this.files) {
            readFile(file, 'utf8', (err, content) => {
                if (err) {
                    return this.emit('error', err)
                }
                this.emit('fileread', file)
                const match = content.match(this.regex)
                if (match) {
                    match.forEach(elem => this.emit('found', file, elem))
                }
            })
        }
        return this
    }
}

const findRegexInstance = new FindRegex(/hello \w+/);

findRegexInstance
  .addFile('fileA.txt')
  .addFile('fileB.json')
  .on('started', (files) => console.log(`Starting search: ${files}`))
  .find()
  .on('found', (file, match) => console.log(`Matched "${match}" in file ${file}`))
  .on('error', err => console.error(`Error emitted ${err.message}`));

/*
    3.2 Ticker: Write a function that accepts a number and a callback
    as the arguments. The function will return an EventEmitter that
    emits an event called tick every 50 milliseconds until the number
    of milliseconds is passed from the invocation of the function.
    The function will also call the callback when the number of milliseconds
    has passed, providing, as the result, the total count of tick events
    emitted. Hint: you can use setTimeout() to schedule another
    setTimeout() recursively.
*/
class MyEE extends EventEmitter {
    constructor() {
        super();

        this.count = 0;
        this.clear = null;
        this.error = null;

        this.startTick();
    }

    emitTick(log) {
        this.count = this.count + 1;

        if (log) {
            console.log(`Tick #${this.count}`);
        }

        /*
            3.4 Playing with errors: Modify the function created in exercise 3.3 so
            that it produces an error if the timestamp at the moment of a tick
            (including the initial one that we added as part of exercise 3.3) is
            divisible by 5. Propagate the error using both the callback and the
            event emitter. Hint: use Date.now() to get the timestamp and the
            remainder (%) operator to check whether the timestamp is divisible by 5.
        */
        if (Date.now() % 5 === 0) {
            this.error = new Error('Error during a tick.');
            this.emit('error', this.error);
        } else {
            this.emit('tick', this.count);
        }
    }

    startTick() {
        this.clear = setInterval(() => {
            this.emitTick(false);
        }, 50);
    }

    stopTick(number, cb) {
        clearInterval(this.clear);
        setTimeout(() => cb(this.error, this.count), number);
    }
}

const myEventEmitter = new MyEE();

const ticker = (number, callback) => {
    /*
        3.3 A simple modification: Modify the function created in exercise 3.2
        so that it emits a tick event immediately after the function is invoked.
    */
    myEventEmitter.emitTick(true);

    setTimeout(() => {
        if (number) {
            myEventEmitter.stopTick(number, callback);
        }
    }, number);

    return myEventEmitter;
};

ticker(200, (err, count) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log(`Total count of tick: ${count}`);
})
.on('tick', (num) => console.log(`Tick #${num}`))
.on('error', (err) => console.log(err));
