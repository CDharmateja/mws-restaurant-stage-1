/* eslint-disable */
let restaurants,
  neighborhoods,
  cuisines;
var newMap;
let markers = [];
/* eslint-enable */

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  dbhelper.fetchNeighborhoods() // eslint-disable-line
    .then((neighborhoods) => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => {
      // Got an error
      console.error(error);
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
  handlefavorites();
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  dbhelper.fetchCuisines() // eslint-disable-line
    .then((cuisines) => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', { // eslint-disable-line
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', { // eslint-disable-line
    mapboxToken: 'pk.eyJ1IjoiZGhhcm1hdGVqYSIsImEiOiJjam1lbm0xN2wwNXZ3M2twc3FjOHF3M3l5In0.GqzE6FS4MYlOXmaNxG3Wvw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  dbhelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) // eslint-disable-line
    .then((restaurants) => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  lazyLoad();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');

  const imgName = dbhelper.imageUrlForRestaurant(restaurant).replace(/\.[^/.]+$/, ''); // eslint-disable-line

  const source1 = document.createElement('source');
  source1.media = '(max-width: 300px)';
  source1.setAttribute('data-srcset', `${imgName}-300small.jpg`);

  const source2 = document.createElement('source');
  source2.media = '(min-width: 301px)';
  source2.setAttribute('data-srcset', `${imgName}-550medium.jpg`);

  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  image.setAttribute('data-src', `img/${restaurant.id}-550medium.jpg`);
  image.alt = '';

  picture.append(source1);
  picture.append(source2);
  picture.append(image);

  li.append(picture);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favorite = document.createElement('div');
  favorite.setAttribute('tabindex', '0');
  favorite.setAttribute('role', 'button');
  favorite.setAttribute('key', restaurant.id);
  favorite.setAttribute('aria-pressed', restaurant.is_favorite);
  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    favorite.style = 'color: #cc0000';
  } else {
    favorite.style = 'color: #757575';
  }
  favorite.className = 'favorite';
  favorite.innerHTML = '🖤';
  li.append(favorite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('button');
  more.setAttribute('id', restaurant.id);
  more.setAttribute('aria-label', `View Details of ${restaurant.name}`);
  more.innerHTML = 'View Details';
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = dbhelper.mapMarkerForRestaurant(restaurant, self.newMap); // eslint-disable-line
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

/**
 * Listen for button click to redirect to restaurant page.
 */
const buttonEventListener = () => {
  const restaurantsList = document.getElementById('restaurants-list');
  const buttons = restaurantsList.getElementsByTagName('button');
  Array.prototype.forEach.call(buttons, button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      location.href = `restaurant.html?id=${button.getAttribute('id')}`;
    });
  });
};

/**
 * Event listener to use as buttons.
 */
window.addEventListener('load', () => {
  buttonEventListener();
});

/**
 * Lazy load images.
 */
const lazyLoad = () => {
  var lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));

  if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
    // eslint-disable-next-line
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
};

/**
 * Handle favorite selction
 */
const handlefavorites = () => {
  const favorites = document.querySelectorAll('.favorite');

  Array.prototype.forEach.call(favorites, favorite => {
    favorite.addEventListener('click', event => {
      const is_favorite = event.target.getAttribute('aria-pressed') === 'true';
      if (!is_favorite) {
        favorite.setAttribute('aria-pressed', 'true');
        favorite.style = 'color: #cc0000';
      } else {
        favorite.setAttribute('aria-pressed', 'false');
        favorite.style = 'color: #757575';
      }
      if (navigator.onLine) {
        // eslint-disable-next-line
        dbhelper.updatefavorite(event.target.getAttribute('key'), !is_favorite);
      } else {
        /* eslint-disable */
        dbhelper.snackbar('Favourite will be updated when online');
        dbhelper.updatefavorite(event.target.getAttribute('key'), !is_favorite);
        /* eslint-enable */
      }
    });
  });
};