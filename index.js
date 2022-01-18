const express = require('express');
const cors = require('cors');
const app = express();
const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy, extractJwt = require('passport-jwt').ExtractJwt;
const { response } = require('express');
const { use } = require('passport');
const userModule = require('./user');
const axios = require('axios');
const recetteModule = require('./recette');
const PORT = process.env.PORT || 5000
const variables = require('./variables');

// MIDDLEWARES
app.use(express.json());
app.use(passport.initialize());
app.use(cors());
// Passport Auth
let opts = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: variables.secretToken
}
passport.use(new jwtStrategy(opts, async function (jwtPayload, done) {
    try {
        const response = await axios.get(variables.dbUrl + 'users/' + jwtPayload.id, variables.options);
        const user = response.data;
        if (!user)
            return done({ "message": "User not found !" }, false);
        return done(null, user);
    } catch (e) {
        return done(e.response, false);
    }
}))

/**
 * @api {get} /recettes Recipe List
 * @apiName ListRecipes
 * @apiGroup Recipe
 *
 * @apiSuccess {Array} recipes Recipe list
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "total": 2,
            "recipes": [
                {
                    "_id": "61dbebe5d4fd1466000a0090",
                    "title": "Title 3",
                    "description": "Desc",
                    "created_at": "2022-01-10T08:18:43.183Z",
                    "updated_at": "2022-01-10T08:18:43.183Z",
                    "minutes": 30,
                    "user": [
                        {
                            "_id": "61dbe61bd4fd1466000a0001",
                            "email": "william@gmail.com",
                            "active": true,
                            "_created": "2022-01-10T07:54:03.538Z",
                            "_changed": "2022-01-10T07:54:03.538Z"
                        }
                    ],
                    "ingredients": [
                        {
                            "name": "Tomates",
                            "quantity": 15
                        }
                    ]
                },
                {
                    "_id": "61bb19d9d4fd146600067221",
                    "title": "La recette du turfu",
                    "description": "description",
                    "created_at": "2021-12-16T10:49:59.000Z",
                    "updated_at": "2021-12-16T10:49:59.000Z",
                    "ingredients": [],
                    "minutes": 2,
                    "user": [
                        {
                            "_id": "61bb13bbd4fd146600067199",
                            "email": "test@test.com",
                            "active": true,
                            "_created": "2021-12-16T10:23:55.132Z",
                            "_changed": "2021-12-16T10:23:55.132Z"
                        }
                    ]
                }
            ]
        }
 *      
 *
 */
app.get('/recettes',
    recetteModule.getAll
);

/**
 * @api {get} /recette/:id Recipe Details
 * @apiName DetailsRecipe
 * @apiGroup Recipe
 *
 * @apiParam {String} id Recipe Unique ID.
 *
 * @apiSuccess {Object} recipe Recipe details
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "_id": "61dc2b78d4fd1466000a084e",
            "title": "La vraie recette 5",
            "description": "La vraie description",
            "created_at": "2022-01-10T12:49:58.073Z",
            "updated_at": "2022-01-10T12:49:58.073Z",
            "minutes": 42,
            "user": [
                {
                    "_id": "61dc0ac7d4fd1466000a0537",
                    "email": "loa@gmail.com",
                    "active": true,
                    "_created": "2022-01-10T10:30:31.136Z",
                    "_changed": "2022-01-10T10:30:31.136Z"
                }
            ],
            "ingredients": [
                {
                    "name": "Tomates",
                    "quantity": 20
                },
                {
                    "name": "Oignons",
                    "quantity": 5
                }
            ]
        }
 *
 * @apiError NotFound Recipe with the given ID has not been found.
 *
 * @apiErrorExample NotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Recipe not found"
        }     
 *
 */
app.get('/recette/:id',
    recetteModule.get
);

/**
 * @api {post} /recette Create Recipe
 * @apiName CreateRecipe
 * @apiGroup Recipe
 *
 * @apiParam {String} title Recipe Title.
 * @apiParam {String} description Recipe description.
 * @apiParam {Array}  ingredients Array of Object for recipe products.
 * @apiParam {Number} minutes Recipe time.
 *
 * @apiSuccess {Object} recipe CreatedRecipe
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "message": "Recipes saved !",
            "recette": {
                "_id": "61dc2b78d4fd1466000a084e",
                "title": "La vraie recette 5",
                "description": "La vraie description",
                "created_at": "2022-01-10T12:49:58.073Z",
                "updated_at": "2022-01-10T12:49:58.073Z",
                "minutes": 42,
                "user": [
                    {
                        "_id": "61dc0ac7d4fd1466000a0537",
                        "email": "loa@gmail.com",
                        "active": true,
                        "_created": "2022-01-10T10:30:31.136Z",
                        "_changed": "2022-01-10T10:30:31.136Z"
                    }
                ],
                "ingredients": [
                    {
                        "name": "Tomates",
                        "quantity": 20
                    },
                    {
                        "name": "Oignons",
                        "quantity": 5
                    }
                ]
            }
        }
 *    
 * @apiError Unauthorized User not connected.
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
            "message": "Unauthorized"
        }
 *
 * @apiError ValidationError Missing required field.
 *
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Unable to save record (validation)",
            "name": "ValidationError",
            "list": [
                {
                    "field": "description",
                    "message": [
                        "Missing required field",
                        "REQUIRED"
                    ]
                }
            ],
            "status": 400
        }
 *
 */
app.post('/recette',
    passport.authenticate('jwt', { session: false }),
    recetteModule.create
);

/**
 * @api {patch} /recette/:id Update Recipe
 * @apiName UpdateRecipe
 * @apiGroup Recipe
 *
 * @apiParam {String} id Recipe Unique ID.
 * @apiParam {String} title Recipe Title NOT REQUIRED.
 * @apiParam {String} description Recipe description NOT REQUIRED.
 * @apiParam {Array}  ingredients Array of Object for recipe products NOT REQUIRED.
 * @apiParam {Number} minutes Recipe time NOT REQUIRED.
 *
 * @apiSuccess {Object} recipe UpdatedRecipe
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "message": "Recipes updated !",
            "recette": {
                "_id": "61dc2828d4fd1466000a07e8",
                "title": "La vraie recette 3",
                "description": "Desc 2",
                "created_at": "2022-01-10T12:35:49.753Z",
                "updated_at": "2022-01-10T12:36:03.131Z",
                "minutes": 2,
                "user": [
                    {
                        "_id": "61dc0ac7d4fd1466000a0537",
                        "email": "loa@gmail.com",
                        "active": true,
                        "_created": "2022-01-10T10:30:31.136Z",
                        "_changed": "2022-01-10T10:30:31.136Z"
                    }
                ],
                "ingredients": [
                    {
                        "name": "Tomates",
                        "quantity": 15
                    }
                ]
            }
        }
 *
 * @apiError NotFound Recipe with the given ID has not been found.
 *
 * @apiErrorExample NotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Recipe not found"
        }
        
 *
 * @apiError Unauthorized User not connected.
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
            "message": "Unauthorized"
        }
 *
 * @apiError Forbidden Connected User doesn't have the rights to modify the given recipe.
 *
 * @apiErrorExample Forbidden:
 *     HTTP/1.1 403 Forbidden
 *     {
            "message": "Unauthorized"
        }
 *
 */
app.patch('/recette/:id',
    passport.authenticate('jwt', { session: false }),
    recetteModule.verify,
    recetteModule.patch
);

/**
 * @api {put} /recette/:id Update Entire Recipe
 * @apiName UpdateEntireRecipe
 * @apiGroup Recipe
 *
 * @apiParam {String} id Recipe Unique ID.
 * @apiParam {String} title Recipe Title.
 * @apiParam {String} description Recipe description.
 * @apiParam {Array} ingredients Array of Object for recipe products.
 * @apiParam {Number} minutes Recipe time.
 *
 * @apiSuccess {Object} recipe UpdatedRecipe
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "message": "Recipes updated !",
            "recette": {
                "_id": "61dc2828d4fd1466000a07e8",
                "title": "La vraie recette 3",
                "description": "Desc 2",
                "created_at": "2022-01-10T12:35:49.753Z",
                "updated_at": "2022-01-10T12:36:03.131Z",
                "minutes": 2,
                "user": [
                    {
                        "_id": "61dc0ac7d4fd1466000a0537",
                        "email": "loa@gmail.com",
                        "active": true,
                        "_created": "2022-01-10T10:30:31.136Z",
                        "_changed": "2022-01-10T10:30:31.136Z"
                    }
                ],
                "ingredients": [
                    {
                        "name": "Tomates",
                        "quantity": 15
                    }
                ]
            }
        }
 *
 * @apiError NotFound Recipe with the given ID has not been found.
 *
 * @apiErrorExample NotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Recipe not found"
        }
        
 *
 * @apiError Unauthorized User not connected.
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
            "message": "Unauthorized"
        }
 *
 * @apiError ValidationError Missing required field.
 *
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Unable to save record (validation)",
            "name": "ValidationError",
            "list": [
                {
                    "field": "title",
                    "message": [
                        "Missing required field",
                        "REQUIRED"
                    ]
                }
            ],
            "status": 400
        }
 *
 * @apiError Forbidden Connected User doesn't have the rights to modify the given recipe.
 *
 * @apiErrorExample Forbidden:
 *     HTTP/1.1 403 Forbidden
 *     {
            "message": "Unauthorized"
        }
 *
 */
app.put('/recette/:id',
    passport.authenticate('jwt', { session: false }),
    recetteModule.verify,
    recetteModule.put
);

/**
 * @api {delete} /recette/:id Delete Recipe
 * @apiName DeleteRecipe
 * @apiGroup Recipe
 *
 * @apiParam {String} id Recipe Unique ID.
 *
 * @apiSuccess {String} message MessageSucceed
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "message": "Recipe deleted"
        }
 *
 * @apiError NotFound Recipe with the given ID has not been found.
 *
 * @apiErrorExample NotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Recipe not found"
        }
        
 *
 * @apiError Unauthorized User not connected.
 *
 * @apiErrorExample Unauthorized:
 *     HTTP/1.1 401 Unauthorized
 *     {
            "message": "Unauthorized"
        }
 *
 * @apiError Forbidden Connected User doesn't have the rights to modify the given recipe.
 *
 * @apiErrorExample Forbidden:
 *     HTTP/1.1 403 Forbidden
 *     {
            "message": "Unauthorized"
        }
 *
 */
app.delete('/recette/:id',
    passport.authenticate('jwt', { session: false }),
    recetteModule.verify,
    recetteModule.remove
);

/**
 * @api {post} /login Connect User
 * @apiName ConnectUser
 * @apiGroup User
 *
 * @apiParam {String} email Users Email.
 * @apiParam {String} password Users secret Password.
 *
 * @apiSuccess {String} jwt Token JWT Passport
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
            "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZGMwYWM3ZDRmZDE0NjYwMDBhMDUzNyIsImVtYWlsIjoibG9hQGdtYWlsLmNvbSIsImlhdCI6MTY0MTgxMzk1NX0.fg938WXzYr7s64G___95itdE-ujMsv2p_ImHK-9S4eU"
        }
 *
 * @apiError NotFound User with this email has not been found.
 *
 * @apiErrorExample NotFound:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "User not found"
        }
 * 
 * @apiError FailedLogin Bad Password.
 *
 * @apiErrorExample FailedLogin:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "User not found"
        }
 */
app.post('/login',
    userModule.login
);

/**
 * @api {post} /register Create User
 * @apiName CreateUser
 * @apiGroup User
 *
 * @apiParam {String} email Users unique Email.
 * @apiParam {String} password Users secret Password.
 *
 * @apiSuccess {String} message MessageSucceed
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     { 
 *       "message": "User saved !" 
 *     }
 *
 * @apiError ValidationError Missing Required Field.
 *
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Unable to save record (validation)",
            "name": "ValidationError",
            "list": [
                {
                    "field": "email",
                    "message": [
                        "Missing required field",
                        "REQUIRED"
                    ]
                }
            ],
            "status": 400
        }
 * @apiError ValidationError Email Already Exist.
 *
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 Bad Request
 *     {
            "message": "Unable to save record (validation)",
            "name": "ValidationError",
            "list": [
                {
                    "field": "email",
                    "message": [
                        "Already exists",
                        "UNIQUE"
                    ]
                }
            ],
            "status": 400
        }
 */
app.post('/register',
    userModule.create
);

app.listen(PORT, function () {
    console.log("Server oppened on " + PORT);
})