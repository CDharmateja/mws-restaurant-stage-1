/* eslint-disable */
let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
/* eslint-enable */

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), { // eslint-disable-line
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
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
  self.markers.forEach(m => m.setMap(null));
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
  source1.srcset =  `${imgName}-300small.jpg`;

  const source2 = document.createElement('source');
  source2.media = '(min-width: 301px)';
  source2.srcset = `${imgName}-550medium.jpg`;

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = `img/${restaurant.id}-550medium.jpg`;
  image.alt = '';

  picture.append(source1);
  picture.append(source2);
  picture.append(image);

  li.append(picture);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

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
    const marker = dbhelper.mapMarkerForRestaurant(restaurant, self.map); // eslint-disable-line
    // marker.setAttribute('tabindex', '0');
    google.maps.event.addListener(marker, 'click', () => { // eslint-disable-line
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

/**
 * Listen for button click to redirect to restaurant page.
 */
const buttonEventListener = () => {
  const restaurantsList = document.getElementById('restaurants-list');
  const buttons = restaurantsList.getElementsByTagName('button');
  Array.prototype.forEach.call(buttons, (button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      location.href = `restaurant.html?id=${button.getAttribute('id')}`;
    });
  });
};

/**
 * Making some part of google maps accessiblie
 */
const accessibleMaps = () => {
  const iframe = document.querySelector('#map iframe');
  iframe.setAttribute('title', 'map');
};

/**
 * Make Event listener and accessibility changes after window loads.
 */
window.addEventListener('load', () => {
  buttonEventListener();
  accessibleMaps();
});