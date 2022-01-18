const axios = require('axios');
const variables = require('./variables');
const jsonwt = require('jsonwebtoken');

/**
 * Fonction de création d'utilisateur
 * @params String email (Adresse Email de l'utilisateur)
 * @params String password (Mot de Passe de l'utilisateur)
 * @return JSON
 */
const create = async function (req, res){
    try {
        await axios.post(variables.dbUrl + 'users', {
            'email': req.body.email,
            'password': req.body.password,
            'active': true
        }, variables.options);
       return res.json({ "message": "User saved !" });
    } catch (error) {
        res.status(400);

        if (error.response)
           return res.json(error.response.data);  
        return res.json({"message" : "Email already used"});
    }
}

const login = async function(req, res){
    try {
        const response = await axios.get(variables.dbUrl + `users?q={"email" : "${req.body.email}", "password" : "${req.body.password}"}`, variables.options)
        const user = response.data[0];
        if (!user){
            res.status(400);
            return res.json({ 'message': 'User not found' });

        }

        const jwt = jsonwt.sign({ id: user._id, email: user.email }, variables.secretToken);
        return res.json({ jwt });
    } catch (error) {
        res.status(400);

        if (error.response)
            return res.json(error.response.data);
        return res.json({"message" : "Une erreur est survenue"});
    }
}

/**
 * Module Export
 */
module.exports = {
    create : create,
    login : login
}

