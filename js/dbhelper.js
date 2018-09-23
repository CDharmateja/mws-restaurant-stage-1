if (typeof idb === 'undefined') {
  self.importScripts('idb.js');
}

/**
 * Common database helper functions.
*/
class DBHelper {

  constructor() {
    // Creates indexedDB
    this.dbPromise = this.createDB();

    // Adds restaurants json to indexedDB
    this.restaurants = new Promise((resolve, reject) => {
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
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
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
            keyPath: 'id'
          });
      }
    });
    /* eslint-enable */
  }

  /**
   * Fetch restaurants
   */
  fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL)
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
        return restaurants[id];
      })
      .catch(error => console.log(error));
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
    const marker = new google.maps.Marker({ // eslint-disable-line
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP // eslint-disable-line
    });
    return marker;
  }

}

const dbhelper = new DBHelper(); // eslint-disable-line