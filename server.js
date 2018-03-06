'user strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const bodyParser = require('body-parser').urlencoded({extended: true});
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
// const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const API_KEY = process.env.KC_API_KEY;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/api/v1/rests', (req, res) => {
  const url = 'https://data.kingcounty.gov/resource/gkhn-e8mn.json';

  superagent(url)
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));

app.post('/api/v1/users', bodyParser, (req, res) => {
  let{username, firstname, lastname, email, password} = req.body;
  client.query(`INSERT INTO users(username, firstname, lastname, email, password) VALUES($1, $2, $3, $4, $5)`,
    [username, firstname, lastname, email, password]
  )
    .then(() => res.sendStatus(201))
    .catch(console.error);
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// PORT=3000
// CLIENT_URL=http://localhost:8080

// Mac:
// DATABASE_URL=postgres://localhost:5432/dontgo

// Windows:
// DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/dontgo