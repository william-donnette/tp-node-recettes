const axios = require('axios')
const env = require('../config/env')
const userModule = require('./user')

/**
 * Fonction qui retourne une Erreur du système
 */
const sendError = function(res, error, message = "An error Occured"){
    console.log(error)
    res.status(400);
    if (error.response) return res.json(error.response.data);
    return res.json({"message" : message});
}

/**
 * Module Export
 */
module.exports = {
  sendError
}
