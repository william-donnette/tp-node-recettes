const axios = require('axios')
const { json } = require('express/lib/response')
const variables = require('./variables')

/**
 * Fonction qui retourne une recette fillable
 * C'est à dire une recette sans paramètres inapropriés qui ne doivent pas être visibles par l'utilisateur
 */
const fill = function (resp) {
  try {
    const recette = resp.data
    delete recette.user[0].password
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
    const response = await axios.get(
      variables.dbUrl + 'recettes/' + req.params.id,
      variables.options,
    )
    const recette = response.data
    if (recette.length == 0) {
      res.status(400)
      return res.json({ message: 'Recipe not found' })
    } else {
      if (recette.user[0]._id == user._id) next()
      else {
        res.status(403)
        return res.json({ message: 'Unauthorized' })
      }
    }
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
  }
}

/**
 * Function qui retourne la liste de toutes les recettes créées
 * @return JSON
 */
const getAll = async function (req, res) {
  try {
    const response = await axios.get(
      variables.dbUrl + 'recettes',
      variables.options,
    )
    const recettes = response.data
    recettes.forEach((recette) => {
      delete recette.user[0].password
    })
    return res.json({ total: recettes.length, recipes: recettes })
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
  }
}

/**
 * Function qui retourne une recette spécifique
 * @params String id : Identifiant de la recette
 * @return JSON
 */
const get = async function (req, res) {
  try {
    const response = await axios.get(
      variables.dbUrl + 'recettes/' + req.params.id,
      variables.options,
    )
    const recette = fill(response)

    if (!recette) {
      res.status(400)
      return res.json({ message: 'Recipe not found' })
    }
    return res.json(recette)
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)

    return res.json({ message: 'Une erreur est survenue' })
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
    const date = new Date()
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
    const response = await axios.post(
      variables.dbUrl + 'recettes',
      params,
      variables.options,
    )
    const recette = fill(response)
    if (recette)
      return res.json({ message: 'Recipes saved !', recette: recette })
    res.status(400)
    return res.json({ message: 'An error occured' })
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
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
    let params = {}
    for (const [key, val] of Object.entries(req.body)) {
      if (
        ['title', 'description', 'ingredients', 'minutes'].find(
          (value) => key == value,
        )
      )
        params[key] = val
    }
    params.updated_at = new Date()
    const response = await axios.patch(
      variables.dbUrl + 'recettes/' + req.params.id,
      params,
      variables.options,
    )
    const recette = fill(response)

    if (recette)
      return res.json({ message: 'Recipes updated !', recette: recette })
    res.status(400)
    return res.json({ message: 'An error occured' })
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
  }
}

const put = async function (req, res) {
  try {
    const date = new Date()
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
    const params = {
      title: req.body.title,
      description: req.body.description,
      ingredients: req.body.ingredients,
      personnes: req.body.personnes,
      minutes: req.body.minutes,
      updated_at: date,
    }
    const response = await axios.put(
      variables.dbUrl + 'recettes/' + req.params.id,
      params,
      variables.options,
    )
    const recette = fill(response)

    if (recette)
      return res.json({ message: 'Recipes updated !', recette: recette })
    res.status(400)
    return res.json({ message: 'An error occured' })
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
  }
}

const remove = async function (req, res) {
  try {
    await axios.delete(
      variables.dbUrl + 'recettes/' + req.params.id,
      variables.options,
    )
    return res.json({ message: 'Recipe deleted' })
  } catch (error) {
    res.status(400)
    if (error.response) return res.json(error.response.data)
    return res.json({ message: 'Une erreur est survenue' })
  }
}

/**
 * Module Export
 */
module.exports = {
  verify: verify,
  getAll: getAll,
  get: get,
  create: create,
  patch: patch,
  put: put,
  remove: remove,
}
