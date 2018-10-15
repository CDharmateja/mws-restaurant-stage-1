/* eslint-disable */
let restaurant;
let newMap;
let reviews;
/* eslint-enable */

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL.then((restaurant) => {
    self.newMap = L.map('map', { // eslint-disable-line
      center: [restaurant.latlng.lat, restaurant.latlng.lng],
      zoom: 16,
      scrollWheelZoom: false
    });
    // eslint-disable-next-line
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1IjoiZGhhcm1hdGVqYSIsImEiOiJjam1lbm0xN2wwNXZ3M2twc3FjOHF3M3l5In0.GqzE6FS4MYlOXmaNxG3Wvw',
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(self.newMap);
    fillBreadcrumb();
    // eslint-disable-next-line
    dbhelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
  }).catch(error => console.log(error));
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = new Promise((resolve, reject) => {
  if (self.restaurant) {
    reject(null);
  }
  const id = getParameterByName('id');
  if (!id) {
    reject('No restaurant id in URL');
  } else {
    dbhelper.fetchRestaurantById(id) // eslint-disable-line
      .then((restaurant) => {
        self.restaurant = restaurant;
        if (!restaurant) {
          reject('Restaurant not found');
        }
        fillRestaurantHTML();
        resolve(restaurant);
      })
      .catch(error => console.log(error));
  }
});

/**
 * Get current restaurant from page URL.
 */
const fetchReviewsFromURL = new Promise((resolve, reject) => { // eslint-disable-line
  if (self.reviews) {
    reject(null);
  }
  const id = getParameterByName('id');
  if (!id) {
    reject('No restaurant id in URL');
  } else {
    dbhelper.fetchReviewsById(id) // eslint-disable-line
      .then((reviews) => {
        self.reviews = reviews;
        if (!reviews) {
          reject('Restaurant not found');
        }
        fillReviewsHTML();
        resolve(reviews);
      })
      .catch(error => console.log(error));
  }
});

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('favorite');
  favorite.setAttribute('aria-pressed', restaurant.is_favorite);
  if (restaurant.is_favorite === 'true' || restaurant.is_favorite === true) {
    favorite.style = 'color: #cc0000';
  } else {
    favorite.style = 'color: #757575';
  }

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const pictures = document.getElementsByTagName('picture');
  const picture = pictures[0];

  const imgName = dbhelper.imageUrlForRestaurant(restaurant).replace(/\.[^/.]+$/, ''); // eslint-disable-line

  const source1 = document.createElement('source');
  source1.media = '(min-width: 251px)';
  source1.srcset = `${imgName}-400medium.jpg 1x, ${imgName}-800large.jpg 2x`;

  const source2 = document.createElement('source');
  source2.media = '(max-width: 250px)';
  source2.srcset = `${imgName}-250small.jpg 1x, ${imgName}-550medium.jpg 2x`;

  const image = document.createElement('img');
  image.src = `${imgName}-800large.jpg`;
  image.alt = restaurant.name;
  image.id = 'restaurant-img';

  picture.append(source1);
  picture.append(source2);
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  const form = document.getElementById('post-review');
  container.insertBefore(title, form);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  const strong = document.createElement('strong');
  strong.innerHTML = review.name;
  name.appendChild(strong);
  li.appendChild(name);

  const date = document.createElement('p');
  const em = document.createElement('em');
  em.innerHTML = new Date(review.createdAt).toLocaleDateString();
  date.appendChild(em);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = 'rating';
  rating.innerHTML = `Rating: ${review.rating}★`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.innerHTML = restaurant.name;
  a.setAttribute('href', `restaurant.html?id=${restaurant.id}`);
  a.setAttribute('aria-current', 'page');
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

/**
 * Validate the review
 */
const validate_review = (name, rating, comment) => {
  if (name === '' || name == undefined) {
    // eslint-disable-next-line
    dbhelper.snackbar('Please enter your name');
    return false;
  }
  else if (rating < 1 || rating > 5) {
    // eslint-disable-next-line
    dbhelper.snackbar('Rating is required');
    return false;
  }
  else if (comment === '' || comment == undefined) {
    // eslint-disable-next-line
    dbhelper.snackbar('Plese type comment');
    return false;
  }
  return true;
};

/**
 * Handle submission of review
 */
document.getElementById('post-review').addEventListener('submit', event => {
  event.preventDefault();

  // Get the details filled in the form
  const restaurant_id = getParameterByName('id');
  const name = event.target.name.value;
  let rating = 0;
  const stars = event.target.star;
  for (let i in stars) {
    if (stars[i].checked) {
      rating = 5 - i;
      break;
    }
  }
  const comments = event.target.comment.value;

  // Reset form
  event.target.name.value = '';
  event.target.star[0].checked = false;
  event.target.comment.value = '';

  // Check if details are vaild and send them to server
  if (validate_review(name, rating, comments)) {
    // review object
    const review = {
      restaurant_id,
      name,
      rating,
      comments
    };

    const body = {
      restaurant_id,
      name,
      rating,
      comments
    };

    if (navigator.onLine) {
      // If user is online
      // send a post request to server and add it to indexedDB
      fetch('http://localhost:1337/reviews', {
        method: 'POST',
        body: JSON.stringify(body)
      }).then(resp => {
        resp.json().then(review => {
          addReviewToHTML(review);
        });
        console.log(`Post review succesful ${resp}`);
      }).catch(error => console.log(error));
      dbhelper.saveReview(review); // eslint-disable-line
    }
    else {
      // If user is not online
      // add review to indexedDB and wait for user to come online
      // eslint-disable-next-line
      dbhelper.snackbar('Review will be posted when online');
      dbhelper.saveReview(review); // eslint-disable-line
      window.addEventListener('online', () => {
        fetch('http://localhost:1337/reviews', {
          method: 'POST',
          body: JSON.stringify(body)
        }).then(resp => {
          console.log(`Post review succesful ${resp}`);
        }).catch(error => console.log(error));
      });
    }
  }
});

/**
 * Add review to DOM
 */
const addReviewToHTML = review => {
  const reviewsList = document.querySelector('#reviews-list');
  const html = createReviewHTML(review);
  reviewsList.appendChild(html);
  const li = reviewsList.getElementsByTagName('li');
  reviewsList.insertBefore(html, li[0]);
};

/**
 * Handle toggling of favourite
 */
document.getElementById('favorite').addEventListener('click', event => {
  const favorite = event.target;
  const is_favorite = favorite.getAttribute('aria-pressed') === 'true';
  if (!is_favorite) {
    favorite.setAttribute('aria-pressed', 'true');
    favorite.style = 'color: #cc0000';
  } else {
    favorite.setAttribute('aria-pressed', 'false');
    favorite.style = 'color: #757575';
  }
  if (navigator.onLine) {
    // eslint-disable-next-line
    dbhelper.updatefavorite(getParameterByName('id'), !is_favorite);
  } else {
    //eslint-disable-next-line
    dbhelper.snackbar('Favorite will be updated when you come online');
    document.addEventListener('online', () => {
      // eslint-disable-next-line
      dbhelper.updatefavorite(getParameterByName('id'), !is_favorite);
      console.log('Favorite updated!');
    });
  }
});