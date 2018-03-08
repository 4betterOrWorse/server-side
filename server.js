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
const API_KEY2 = process.env.YELP_API_KEY;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/api/v1/rests', (req, res) => {
  const url = 'https://data.kingcounty.gov/resource/gkhn-e8mn.json';

  superagent(url)
    .query({$where: 'inspection_score > 100 and inspection_date >= \'2017-01-01T00:00:00.000\''})
    .query({inspection_closed_business: 'false'})
    .query({$limit: '5000'})
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

app.get('/api/v1/rests/:id', (req, res) => {
  const url = 'https://data.kingcounty.gov/resource/gkhn-e8mn.json';
  superagent(url)
    .query({business_id: `${req.params.id}`})
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

app.get('/api/v1/yelp/:term', (req, res) => {
  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent(url)
    .query({term: `${req.params.term}`})
    .query({limit: 5})
    .query({categories: 'restaurants'})
    .query({location: 'Seattle'})
    .set({Authorization: `Bearer ${API_KEY2}`})
    .then(yelp => res.send(yelp.text))
    .catch(console.error);
});

app.get('/api/v1/yelp/businesses/:id', (req, res) => {
  const url = `https://api.yelp.com/v3/businesses/${req.params.id}`;
  superagent(url)
    .set({Authorization: `Bearer ${API_KEY2}`})
    .then(yelp => res.send(yelp.text))
    .catch(console.error);
});

app.get('/api/v1/yelp/health/:id', (req, res) => {
  console.log(req.params.address);
  const url = 'https://data.kingcounty.gov/resource/gkhn-e8mn.json';
  superagent(url)
    .query({$where: `starts_with(address, '${req.params.address}'`})
    .query({$$app_token: `${API_KEY}`})
    .then(rests => res.send(rests.text))
    .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));

app.post('/api/v1/users', bodyParser, (req, res) => {
  let{username, firstname, lastname, email, password} = req.body;
  client.query(`
  INSERT INTO users(username, firstname, lastname, email, password) VALUES($1, $2, $3, $4, $5)`,
    [username, firstname, lastname, email, password]
  )
    .then(() => res.sendStatus(201))
    .catch(console.error);
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

/* export PORT=3000
export CLIENT_URL=http://localhost:8080
export DATABASE_URL=postgres://localhost:5432/dontgo
*/

// Windows:
// DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/dontgo