const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const router = express.Router();

// Initialize a caching instance with a 30-minute expiration time - we can increase quite more as country information doesn't update frequently
const cache = new NodeCache({ stdTTL: 1800 });
const URL = process.env.COUNTRY_API_URL;

function retreive_data_from_json(json, list_keys_fetch, is_obj = false) {
  if (!json) return "";
  let keys = Object.keys(json);
  let new_array = [];
  for (let i = 0; i < keys.length; i++) {
    let temp = {};

    if (is_obj){
      for (let j = 0; j < list_keys_fetch.length; j++) {
        temp[list_keys_fetch[j]] = json[keys[i]][list_keys_fetch[j]];
      
      }
    } else {
      temp = json[keys[i]]
    }

    new_array.push(temp);
  }

  return new_array;
}

function modify_country_json(inp) {
  let new_json = {
    "name": inp.name.common,
    "official_name": inp.name.official,
    "tld": inp.tld,
    "currency": "",
    "capital": inp.capital,
    "continent": inp.continents,
    "languages": "",
    "area": inp.area, 
    "population": inp.population,
    "gini": "",
    "car_drive": inp.car.side,
    "flags": inp.flags.png,
    "flags_alt": inp.flags.alt,
    "timezones": inp.timezones

  }
  new_json.currency = retreive_data_from_json(inp.currencies, ["name", "symbol"], true)
  new_json.languages = retreive_data_from_json(inp.languages, ["name", "symbol"])
  new_json.gini = retreive_data_from_json(inp.gini, ["name", "symbol"])

  return new_json
  

}


router.get('/', async (req, res, next) => {
  const { typeahead } = req.query;

  if (!typeahead || typeahead.length < 3) {
    return res.status(400).json({ message: 'Typeahead parameter should be at least 3 characters long' });
  }

  // Check if the result is cached
  const cachedResult = cache.get(typeahead);

  if (cachedResult) {
    // If cached, return the cached result
    return res.json(cachedResult);
  }

  try {
    const response = await axios.get(`${URL}/${typeahead}`);

    // Check if the typeahead exactly matches the official name of a country
    const exactMatch = response.data.find(country => country.name.official.toLowerCase() === typeahead.toLowerCase());

    if (exactMatch) {
      // If there's an exact match, cache and return the full API response for that country
      let country_json = modify_country_json(exactMatch)
      cache.set(typeahead, country_json);
      res.json(country_json);
    } else {
      // If no exact match, cache and return a list of country names and official names
      const countryList = response.data.isArray && response.data.length > 0 ? [] : response.data.map(country => ({
        name: country.name.common,
        officialName: country.name.official,
      })) ;

      cache.set(typeahead, countryList);
      res.json(countryList);
    }
  } catch (error) {
    console.error(error.name, error.message, error.data, error);
    res.status(500).json({ message: 'Error Processing request' });
  }
});

module.exports = router;
