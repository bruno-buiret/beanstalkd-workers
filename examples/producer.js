const Jackd = require('jackd');

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

Array.prototype.random = function() {
    return this[Math.floor((Math.random() * this.length))];
};

const producer = new Jackd();

producer
    .connect({host: '127.0.0.1', port: 11300})
    .then(async() => {
        const isbns = ['0007375069', '9780007375066', '9791028101510', '9791028107789'];
        const tubes = ['test_1', 'test_2', 'test_3'];

        await producer.use(tubes.random());

        do {

            const id = await producer.put({
                type: 'book',
                payload: {
                    isbn: isbns.random()
                }
            });
            await wait(1000);
        }
        while(true);
    })
;
