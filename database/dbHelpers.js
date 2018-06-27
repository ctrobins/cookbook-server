const db = require('./database').knex;
  //====================================================
//Creates tables if they don't exist yet
const createTables = () => {
  const query = `CREATE TABLE IF NOT EXISTS users(
    email TEXT NOT NULL PRIMARY KEY,
    password TEXT,
    name TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS pantries(
    pantryId SERIAL PRIMARY KEY,
    name TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS usersPantries(
    email TEXT NOT NULL REFERENCES users(email),
    pantryId INT NOT NULL REFERENCES pantries(pantryId),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(email, pantryId)
  );
  CREATE TABLE IF NOT EXISTS ingredients(
    ingredient TEXT NOT NULL,
    email TEXT NOT NULL REFERENCES users(email),
    pantryId INT REFERENCES pantries(pantryId),
    quantity INT,
    unit TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(ingredient, email)
  );
  CREATE TABLE IF NOT EXISTS recipes(
    recipeId TEXT NOT NULL PRIMARY KEY,
    title TEXT,
    imageUrl TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS usersRecipes(
    email TEXT NOT NULL REFERENCES users(email),
    recipeId TEXT NOT NULL REFERENCES recipes(recipeId),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(email, recipeId));`
  return new Promise ((resolve, reject) => {
    db.raw(query).then((results) => {
      resolve(results);
    }).catch((err) => {
      reject(err);
    })
  })
};

createTables().then((results) => {
  console.log('SUCCESS connecting to DB');
}).catch((err) => {
  console.error('ERROR connecting to DB:', err);
});
  //====================================================
// Takes in object with email
const selectUser = ({email}) => {
  return new Promise((resolve, reject) => {
    db.select('email', 'name', 'password').from('users').where('email', email).then((results) => {
      resolve(results);
    }).catch((err) => {
      reject(err);
    })
  });
};

// Takes in object with email
const selectIngredients = ({email}) => {
  return new Promise((resolve, reject) => {
    db.select('ingredient', 'quantity', 'unit').from('ingredients').where('email', email).then((results) => {
      resolve(results);
    }).catch((err) => {
      reject(err);
    })
  });
};
  //====================================================
// Takes in object with email, password, and name
const insertUser = ({email, password, name}) => {
  return new Promise((resolve, reject) => {
    db('users').insert({email: email, password: password, name: name}).then((results) => {
      resolve(results);
    }).catch((err) => {
      reject(err);
    })
  });
};

// Takes in object with email and either ingredients array or ingredients object
// Inserts row if ingredient for email exists else updates that row with new quantity and unit
const insertIngredients = ({email, ingredients, shouldReplace}) => {
  console.log('increment', shouldReplace);
  let params = []
  if (Array.isArray(ingredients)) {
    ingredients.forEach(({ingredient, quantity, unit}) => {
      params.push({email: email, ingredient: ingredient, quantity: quantity, unit: unit});
    })
  } else {
    params.push({email: email, ingredient: ingredients.ingredient, quantity: ingredients.quantity, unit: ingredients.unit});
  }

  let query = '';
  if (shouldReplace) {
    query = `INSERT INTO 
      ingredients (email, ingredient, quantity, unit) 
      VALUES(:email, :ingredient, :quantity, :unit) 
      ON CONFLICT(email, ingredient) 
      DO UPDATE
      SET quantity = :quantity, unit = :unit`;
  } else {
    query = `INSERT INTO 
      ingredients (email, ingredient, quantity, unit) 
      VALUES(:email, :ingredient, :quantity, :unit) 
      ON CONFLICT(email, ingredient) 
      DO UPDATE
      SET quantity = ingredients.quantity + :quantity, unit = :unit`;
  }
  
  let promises = [];
  params.forEach((param) => {    
    promises.push(new Promise((resolve, reject) => {
      db.raw(query, param).then((results) => {
        resolve(results);
      }).catch((err) => {
        reject(err);
      });
    }));
  });
  return promises;
};

const insertRecipe = ({recipeId, title, imageUrl}) => {
  return new Promise((resolve, reject) => {
    db('recipes').insert({recipeId: recipeId, title: title, imageUrl: imageUrl}).then((results) => {
      resolve(results);
    }).catch((err) => {
      reject(err);
    })
  });
};
  //====================================================
module.exports = {
  selectUser,
  selectIngredients,
  insertUser,
  insertIngredients
};