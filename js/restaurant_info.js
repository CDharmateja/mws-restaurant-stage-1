let restaurant; // eslint-disable-line
let map; // eslint-disable-line

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL
    .then((restaurant) => {
      self.map = new google.maps.Map(document.getElementById('map'), { // eslint-disable-line
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      dbhelper.mapMarkerForRestaurant(self.restaurant, self.map); // eslint-disable-line
    })
    .catch((error) => {
      console.error(error);
    });
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
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
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

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
  // fill reviews
  fillReviewsHTML();
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
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

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
  em.innerHTML = review.date;
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
  // li.innerHTML = restaurant.name;
  a.setAttribute('aria-current', 'page');
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

/**
 * Make some accessibility changes to maps.
 */
const mapAccessibility = () => {
  const iframe = document.querySelector('#map iframe');
  if (iframe)
    iframe.setAttribute('title', 'map');
};

/**
 * Accessibility changes to maps after window loads.
 */
window.addEventListener('load', mapAccessibility);