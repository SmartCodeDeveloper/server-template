const app = require('./app');
const config = require('./config');

// const PORT = process.env.PORT || config.port;
const PORT = 3000;

const server = app.listen(PORT, () => {
  console.log('server is running on port', server.address().port);
});
