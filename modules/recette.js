const axios = require('axios')
const env = require('../config/env')
const userModule = require('./user')
const response = require('./response');

/**
 * Fonction qui retourne une recette fillable
 * C'est à dire une recette sans paramètres inapropriés qui ne doivent pas être visibles par l'utilisateur
 */
const fill = function (recette) {
  try {
    recette.user = userModule.fill(recette.user[0])
    delete recette._createdby
    delete recette._changedby
    delete recette._created
    delete recette._changed
    delete recette._keywords
    delete recette._tags
    delete recette._version
    return recette
  } catch (error) {
    return null
  }
}

/**
 * Middleware qui vérifie qu'une recette appartient bien à la personne connectée
 */
const verify = async function (req, res, next) {
  const user = req.user
  try {
    // Connexion à la BD
    const response = await axios.get(
      env.database.url + 'recettes/' + req.params.id,
      env.database.options,
    )
    const recette = fill(response.data)

    // Aucune recette trouvée
    if (recette.length == 0) {
      res.status(400)
      return res.json({ message: 'Recipe not found' })
    } 
    // La recette n'appartient pas à la personne connectée 
    else if (recette.user[0]._id != user._id) {
      res.status(403)
      return res.json({ message: 'Unauthorized' })
    }

    else {
      next()
    }

  } catch (error) {
    return response.sendError(res, error);
  }
}

/**
 * Function qui retourne la liste de toutes les recettes créées
 * @return JSON
 */
const getAll = async function (req, res) {
  try {
    // Connexion à la BD
    const response = await axios.get(
      env.database.url + 'recettes',
      env.database.options,
    )
    const recettes = response.data

    // Fillable recettes
    recettes.forEach((recette) => {
      recette = fill(recette);
    })
    return res.json({ total: recettes.length, recipes: recettes })
  } catch (error) {
    return response.sendError(res, error);
  }
}

/**
 * Function qui retourne une recette spécifique
 * @params String id : Identifiant de la recette
 * @return JSON
 */
const get = async function (req, res) {
  try {
    // Connexion à la BD
    const response = await axios.get(
      env.database.url + 'recettes/' + req.params.id,
      env.database.options,
    )

    // Fillable recette
    const recette = fill(response)

    // Aucune recette trouvée
    if (!recette) {
      res.status(400)
      return res.json({ message: 'Recipe not found' })
    }

    return res.json(recette)
  } catch (error) {
    return response.sendError(res, error);
  }
}

/**
 * Function qui crée une recette
 * @params Object user : Objet représentant l'utilisateur qui crée la recette
 * @params String title : Titre de la recette
 * @params String description : Description de la recette
 * @params Array ingredients : Tableau d'objets représentant les ingrédients de la recette
 * @params int minutes : Temps de préparation de la recette
 * @return JSON
 */
const create = async function (req, res) {
  try {
    // Vérification des paramètres
    if (
      req.body.title === '' ||
      req.body.description === '' ||
      req.body.ingredients.length <= 0 ||
      req.body.personnes <= 0 ||
      req.body.minutes <= 0
    ) {
      res.status(400)
      return res.json({ message: 'An error occured' })
    }

    // Récupération des paramètres
    const date = new Date()
    const params = {
      title: req.body.title,
      description: req.body.description,
      ingredients: req.body.ingredients,
      personnes: req.body.personnes,
      minutes: req.body.minutes,
      user: req.user,
      created_at: date,
      updated_at: date,
    }

    // Connexion à la BD
    const response = await axios.post(
      env.database.url + 'recettes',
      params,
      env.database.options,
    )
    // Fillable recette
    const recette = fill(response.data)
    // Aucune recette trouvée
    if (!recette) {
      res.status(400)
      return res.json({ message: 'An error occured' })
    }

    return res.json(recette)
  } catch (error) {
    return response.sendError(res, error);
  }
}

/**
 * Function qui modifie un ou plusieurs paramètres d'une recette spécifiée
 * @params Object allParams : Tableau comprenant la liste des paramètres à modifier
 * @params id : Identifiant de la recette à modifier
 * @return JSON
 */
const patch = async function (req, res) {
  try {
    // Récupération des paramètres
    let params = {}
    for (const [key, val] of Object.entries(req.body)) {
      if (
        ['title', 'description', 'ingredients', 'minutes'].find(
          (value) => key == value,
        )
      ){
        // Vérification des paramètres
        if ((key == "title" || key == "description") && value != ""){
          params[key] = val
        }
        else if ((key == "ingredients" || key == "minutes") && value > 0){
          params[key] = val
        }
      }
    }

    // Modification de la date de changement
    params.updated_at = new Date()

    // Connexion à la BD
    const response = await axios.patch(
      env.database.url + 'recettes/' + req.params.id,
      params,
      env.database.options,
    )

    // Fillable recette
    const recette = fill(response)

    // Aucune recette trouvée
    if (!recette) {
      res.status(400)
      return res.json({ message: 'An error occured' })
    }

    return res.json(recette)
  } catch (error) {
    return response.sendError(res, error);
  }
}

const put = async function (req, res) {
  try {
    // Vérification des paramètres
    if (
      req.body.title === '' ||
      req.body.description === '' ||
      req.body.ingredients.length === 0 ||
      req.body.personnes == 0 ||
      req.body.minutes == 0
    ) {
      res.status(400)
      return res.json({ message: 'An error occured' })
    }

    // Récupération des paramètres
    const date = new Date()
    const params = {
      title: req.body.title,
      description: req.body.description,
      ingredients: req.body.ingredients,
      personnes: req.body.personnes,
      minutes: req.body.minutes,
      updated_at: date,
    }

    // Connexion à la BD
    const response = await axios.put(
      env.database.url + 'recettes/' + req.params.id,
      params,
      env.database.options,
    )
    const recette = fill(response)

    // Aucune recette trouvée
    if (!recette) {
      res.status(400)
      return res.json({ message: 'An error occured' })
    }

    return res.json(recette)
  } catch (error) {
    return response.sendError(res, error);
  }
}

const remove = async function (req, res) {
  try {
    // Connexion à la BD
    await axios.delete(
      env.database.url + 'recettes/' + req.params.id,
      env.database.options,
    )
    return res.json({ message: 'Recipe deleted' })
  } catch (error) {
    return response.sendError(res, error);
  }
}

/**
 * Module Export
 */
module.exports = {
  verify,
  getAll,
  get,
  create,
  patch,
  put,
  remove,
}
