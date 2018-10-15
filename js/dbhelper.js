if (typeof idb === 'undefined') {
  self.importScripts('idb.js');
}

/**
 * Common database helper functions.
*/
class DBHelper {

  constructor() {
    // Server port
    this.port = 1337;

    // Creates indexedDB
    this.dbPromise = this.createDB();

    // Adds restaurants json to indexedDB
    this.restaurants = this.restaurantsPromise();
  }

  /**
   * Database URL for reviews.
   */
  REVIEWS_DATABASE_URL() {
    return `http://localhost:${this.port}/reviews`;
  }

  /**
   * Database URL for restaurants.
   */
  DATABASE_URL() {
    return `http://localhost:${this.port}/restaurants`;
  }

  REVIEWS_BY_ID_DATABASE_URL(id) {
    return `http://localhost:${this.port}/reviews/${id}`;
  }

  /**
   * Create indexedDB database
   */
  createDB() {
    /* eslint-disable */
    return idb.open('restaurants', 1, upgradeDB => {
      switch (upgradeDB.oldVersion) {
        case 0:
          // a placeholder case so that the switch block will
          // executer when the database is first created
          // (oldVersion is 0)
        case 1:
          console.log('Creating restaurants object store');
          upgradeDB.createObjectStore('restaurants', {
            keyPath: 'id',
            autoIncrement: true
          });
          upgradeDB.createObjectStore('reviews', {
            keyPath: 'id',
            autoIncrement: true
          });
      }
    });
    /* eslint-enable */
  }

  // Returns promise containing restaurants json
  restaurantsPromise() {
    return new Promise((resolve, reject) => {
      // Open indexeDB and see if it has restaurants in it
      this.dbPromise.then('restaurants', 1).then(db => {
        const tx = db.transaction(['restaurants'], 'readonly');
        const store = tx.objectStore('restaurants');
        const restaurants = store.getAll();
        tx.complete;
        return restaurants;
      }).then((restaurants) => {
        if (restaurants.length == 0) {
          // If there is no restaurant info in indexedDB then add it
          this.fetchRestaurants().then(restaurants => {
            this.dbPromise.then((db) => {
              const tx = db.transaction(['restaurants'], 'readwrite');
              const store = tx.objectStore('restaurants');
              return Promise.all(restaurants.map((restaurant) => {
                return store.add(restaurant);
              })).catch(e => {
                tx.abort();
                console.log(e);
                reject('Couldn\'t add restaurants');
              }).then(() => {
                console.log('All restaurnats added successfully');
                resolve(restaurants);
              });
            });
          });
        } else {
          // If there is restaurant info then return it
          resolve(restaurants);
        }
      }).catch(e => console.log(e));
    });
  }

  /**
   * Fetch restaurants
   */
  fetchRestaurants() {
    return fetch(this.DATABASE_URL())
      .then((response) => {
        return response.json()
          .then(data => {
            return data;
          })
          .catch(error => console.log(error));
      })
      .catch(error => console.error(error));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return this.restaurants
      .then((restaurants) => {
        return restaurants[id - 1];
      })
      .catch(error => console.log(error));
  }

  /**
   * Fetch reviews of a restaurant by id.
   */
  fetchReviewsById(id) {
    // Get all cached reviews
    return this.dbPromise.then('reviews', 1).then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      return store.getAll().then(reviews => {
        const reviewsById = reviews.filter(review => review.restaurant_id === id).reverse();
        // Return reviews if available
        if (reviewsById.length > 0) {
          return reviewsById;
        } else {
          // Cache reviews if they are not in cache
          return new Promise((resolve, reject) => {
            fetch(`http://localhost:${this.port}/reviews/?restaurant_id=${parseInt(id)}`).then(resp => {
              return resp.json().then(reviews => {
                this.dbPromise.then('reviews', 1).then(db => {
                  const tx = db.transaction('reviews', 'readwrite');
                  const store = tx.objectStore('reviews');
                  return Promise.all(reviews.map(review => store.add(review)));
                });
                return reviews;
              });
            }).then(data => {
              data = data.reverse();
              resolve(data);
            }).catch(err => reject(err));
          });
        }
      }).catch(error => console.log(error));
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return this.restaurants
      .then((restaurants) => {
        // Filter restaurants to have only given cuising type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        return results;
      })
      .catch(error => console.error(error));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return this.restaurants
      .then((restaurants) => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        return results;
      })
      .catch(error => console.error(error));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return this.restaurants
      .then((restaurants) => {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        return results;
      })
      .catch(error => console.error(error));
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods() {
    // Fetch all restaurants
    return this.restaurants
      .then((restaurants) => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        return uniqueNeighborhoods;
      })
      .catch(error => console.log(error));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines() {
    // Fetch all restaurants
    return this.restaurants
      .then((restaurants) => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        return uniqueCuisines;
      })
      .catch(error => console.log(error));
  }

  /**
   * Toggle favourite
   */
  updatefavorite(id, is_favorite) {
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${is_favorite}`, {
      method: 'PUT'
    }).then(resp => {
      resp.json().then(json => {
        this.dbPromise.then('restaurants', 1).then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          store.put(json);
          return tx.complete;
        }).then(() => {
          console.log('restaurant updated!');
        }).catch(error => console.log(error));
        return json;
      });
    });
  }

  /**
   * Restaurant page URL.
   */
  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    // eslint-disable-next-line
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: this.urlForRestaurant(restaurant)
      });
    marker.addTo(map);
    return marker;
  }

  /**
   * Toast view message to notify user
   */
  snackbar(message) {
    var x = document.getElementById('snackbar');
    x.className = 'show';
    x.innerText = message;
    setTimeout(() => {
      x.className = x.className.replace('show', '');
      x.innerText = '';
    }, 3000);
  }

  /**
   * Save review in indexedDB
   */
  saveReview(review) {
    this.dbPromise.then('reviews', 1).then(db => {
      const tx = db.transaction(['reviews'], 'readwrite');
      const store = tx.objectStore('reviews');
      store.add(review);
    }).catch(err => console.log(err));
  }

}

// eslint-disable-next-line
const dbhelper = new DBHelper();