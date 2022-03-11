require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  database: {
    url: process.env.DB_URL,
    options : {
        headers: {
            'cache-control': 'no-cache',
            'x-apikey': process.env.DB_APIKEY,
            'content-type': 'application/json'
        }
    }
  },
  jwt: {
      token: process.env.JWT_TOKEN,
  }
}