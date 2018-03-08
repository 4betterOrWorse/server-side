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
    .query({$where: `inspection_score > 100 and inspection_date >= '2017-01-01T00:00:00.000'`})
    .query({inspection_closed_business: 'false'})
    .query({$limit: '5000'})
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

app.get('/api/v1/rests/:id', (req, res) => {
  const url = 'https://data.kingcounty.gov/resource/gkhn-e8mn.json';
  console.log(req.params);
  superagent(url)
    .query({business_id: `${req.params.id}`})
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

//postgres get request for new review
app.post('/api/v1/reviews/create', bodyParser, (req, res) => {
  console.log('datebase entry create');
  console.log(req);
  let{username, review} = req.body;
  client.query(`INSERT INTO reviews(username, review) VALUES($1, $2)
  ON CONFLICT DO NOTHING;`,
    [username, review]
  )
    .then(() => res.sendStatus(201))
    .catch(console.error);
});

app.put('/api/v1/reviews/update/:review_id', bodyParser, (req, res) => {
  client.query(`
    UPDATE reviews
    SET review=$1 WHERE username=$2;`,
    [
      req.body.review,
      req.body.username,
    ]
  )
    .then(() => res.sendStatus(201))
    .catch(console.error);
});


app.get('/api/v1/reviews', (req, res) => {
  client.query(`SELECT * FROM reviews;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/reviews/:review_id', (req, res) => {
  client.query(`SELECT * FROM reviews WHERE review_id=${req.params.review_id}`)
    .then(results => res.send(results.rows))
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