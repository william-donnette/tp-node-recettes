const axios = require('axios');
const env = require('../config/env');
const jsonwt = require('jsonwebtoken');
const response = require('./response');

const fill = function (user) {
    try {
      delete user.password
      return user
    } catch (error) {
      return null
    }
  }

/**
 * Fonction de création d'utilisateur
 * @params String email (Adresse Email de l'utilisateur)
 * @params String password (Mot de Passe de l'utilisateur)
 * @return JSON
 */
const create = async function (req, res){
    try {
        // Connexion à la BD
        await axios.post(env.database.url + 'users', 
        {
            'email': req.body.email,
            'password': req.body.password,
            'active': true
        }, 
        env.database.options);
       return res.json({ "message": "User saved !" });
    } catch (error) {
        return response.sendError(res, error, "Email already used");
    }
}

const login = async function(req, res){
    try {
        // Connexion à la BD
        const response = await axios.get(
            env.database.url + `users?q={"email" : "${req.body.email}", "password" : "${req.body.password}"}`, 
            env.database.options)

        // Fillable user
        const user = fill(response.data[0]);

        // Aucun utilisateur trouvé
        if (!user){
            res.status(400);
            return res.json({ 'message': 'User not found' });
        }

        // Création du JWT Token
        const jwt = jsonwt.sign({ 
            id: user._id, 
            email: user.email 
        }, 
        env.jwt.token);

        return res.json({ jwt });
    } catch (error) {
        return response.sendError(res, error);
    }
}

/**
 * Module Export
 */
module.exports = {
    create,
    login,
    fill
}

