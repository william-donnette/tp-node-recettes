/**
 * Package Needed
 */
const express = require('express');
const app = express();
const axios = require('axios');
const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy, extractJwt = require('passport-jwt').ExtractJwt;
const jsonwt = require('jsonwebtoken');
const { response } = require('express');
const PORT = process.env.PORT || 5000 // this is very important

/**
 * Global Constances
 */
const dbUrl = "https://tpnoderecettes-11ec.restdb.io/rest/";
const apiKey = "f2bf8e06bc4007fc8f21e72fbd79afa928001";
const secretToken = "my_awesome_token";
const options = {
    headers: {
        'cache-control': 'no-cache',
        'x-apikey': apiKey,
        'content-type': 'application/json'
    }
}

/**
 * Middlewares
 */
app.use(express.json());
app.use(passport.initialize());

const verifyRecipeUser = async function (req, res, next) {
    const user = req.user;

    try {
        const response = await axios.get(dbUrl + "recettes/" + req.params.id, options);
        const recette = response.data;
        if (recette.length == 0) {
            res.json({ "message": "Recipe not found" })
        } else {
            if (recette.user[0]._id == user._id)
                next();
            else
                res.json({ "message": "Unauthorized" })
        }

    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
}

const getRecette = function (resp) {
    try {
        const recette = resp.data;
        delete recette.user[0].password;
        delete recette._createdby;
        delete recette._changedby;
        delete recette._created;
        delete recette._changed;
        delete recette._keywords;
        delete recette._tags;
        delete recette._version;
        return recette;
    } catch (error) {
        console.log(error);
    }
    return null;
}
/**
 * Passport Authentification
 */
let opts = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretToken
}
passport.use(new jwtStrategy(opts, async function (jwtPayload, done) {
    try {
        const response = await axios.get(dbUrl + 'users/' + jwtPayload.id, options);
        const user = response.data;
        if (!user)
            return done({ "message": "User not found !" }, false);
        return done(null, user);
    } catch (e) {
        return done(e.response, false);
    }
}))

/**
 * Routes
 */

/**
 * Routes Recipes
 */

/**
 * Route getAll
 * Return a list of recipes
 */
app.get('/recettes', async function (req, res) {
    try {
        const response = await axios.get(dbUrl + "recettes", options);
        const recettes = response.data;
        recettes.forEach(recette => {
            delete recette.user[0].password;
        })
        res.json({ 'total': recettes.length, 'recipes': recettes })
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route get
 * Return a simple recipe
 */
app.get('/recette/:id', async function (req, res) {
    try {
        const response = await axios.get(dbUrl + "recettes/" + req.params.id, options);
        const recette = getRecette(response);
        if (!recette)
            res.json({ "message": "Recipe not found" });

        res.json(recette);
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route create
 * Create a new recipe
 * Return the recipe
 * Need Authentification
 */
app.post('/recette', passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const user = req.user;
        const date = new Date();
        const params = {
            title: req.body.title,
            description: req.body.description,
            ingredients: req.body.ingredients,
            minutes: req.body.minutes,
            user: user,
            created_at: date,
            updated_at: date,
        }
        const response = await axios.post(dbUrl + 'recettes', params, options);
        const recette = getRecette(response);
        if (recette)
            res.json({ "message": "Recipes saved !", "recette": recette });
        else
            res.json({ "message": "Une erreur est survenue" })
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route update
 * Update an already created recipe
 * Return the recipe actualised
 * Need Authentification
 * Need to be the creator
 */
app.patch('/recette/:id', passport.authenticate('jwt', { session: false }), verifyRecipeUser, async function (req, res) {
    try {
        let params = {};
        for (const [key, val] of Object.entries(req.body)) {
            if (["title", "description", "ingredients", "minutes"].find(value => key == value))
                params[key] = val
        }
        params.updated_at = new Date();
        const response = await axios.patch(dbUrl + "recettes/" + req.params.id, params, options)
        const recette = getRecette(response);

        if (recette)
            res.json({ "message": "Recipes updated !", "recette": recette });
        else
            res.json({ "message": "Une erreur est survenue" })
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route update
 * Update an already created recipe entirely
 * Return the recipe actualised
 * Need Authentification
 * Need to be the creator
 */
app.put('/recette/:id', passport.authenticate('jwt', { session: false }), verifyRecipeUser, async function (req, res) {
    try {
        const date = new Date();
        const params = {
            title: req.body.title,
            description: req.body.description,
            ingredients: req.body.ingredients,
            minutes: req.body.minutes,
            updated_at: date,
        }
        const response = await axios.put(dbUrl + "recettes/" + req.params.id, params, options)
        const recette = getRecette(response);

        if (recette)
            res.json({ "message": "Recipes updated !", "recette": recette });
        else
            res.json({ "message": "Une erreur est survenue" })
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route delete
 * Delete a recipe
 * Return the id of the deleted recipe
 * Need Authentification
 * Need to be the creator
 */
app.delete('/recette/:id', passport.authenticate('jwt', { session: false }), verifyRecipeUser, async function (req, res) {
    try {
        await axios.delete(dbUrl + "recettes/" + req.params.id, options)
        res.json({ "message": "Recipe deleted" });
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route sign in
 * Need to be not Authenticate
 */
app.post('/login', async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const response = await axios.get(dbUrl + `users?q={"email" : "${email}", "password" : "${password}"}`, options)
        const user = response.data[0];
        if (!user)
            res.json({ 'message': 'User not found' });

        const jwt = jsonwt.sign({ id: user._id, email: user.email }, secretToken);
        res.json({ jwt });
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

/**
 * Route sign up
 * Create a new user
 * Need to be not Authenticate
 */
app.post('/register', async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    try {
        await axios.post(dbUrl + 'users', {
            'email': email,
            'password': password,
            'active': true
        }, options);
        res.json({ "message": "User saved !" });
    } catch (error) {
        if (error.response)
            res.json(error.response.data);
        console.log(error);
    }
});

app.listen(PORT, function () {
    console.log("Server oppened on " + PORT);
})