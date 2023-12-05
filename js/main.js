mapboxgl.accessToken = "pk.eyJ1IjoicGh1ZHRoaW5oMTQxMiIsImEiOiJjbHByMGhwdzkwNnYyMmpxYzRnbDVzZXNpIn0.CNishyZLrpDsgWRmzhtE6Q";
let listNearestPlaces = [];


fetch('https://provinces.open-api.vn/api/?depth=3')
  .then(response => response.json())
  .then(data => {
    const citySelect = document.getElementById('city');
    data.forEach(city => {
      const option = document.createElement('option');
      option.value = city.code;
      option.textContent = city.name;
      citySelect.appendChild(option);
    });

    citySelect.addEventListener('change', function() {
      const selectedCityCode = this.value;
      const selectedCity = data.find(city => city.code == selectedCityCode);

      const districtSelect = document.getElementById('district');
      districtSelect.innerHTML = '<option value="0">Chọn quận/huyện</option>';

      if (selectedCity) {
        selectedCity.districts.forEach(district => {
          const option = document.createElement('option');
          option.value = district.code;
          option.textContent = district.name;
          districtSelect.appendChild(option);
        });
      }
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });



function currentPosition(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
        let cntr = [position.coords.longitude, position.coords.latitude];
        callback(cntr);
    });
}

function mapBox(center, zoom) {
    let map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: zoom,
    });

    new mapboxgl.Marker({ color: 'red' }).setLngLat(center).addTo(map);
    map.setCenter(center);
}

currentPosition(function(position) {
    mapBox(position, 14);
});

function performSearchWithDefaultKeyword(searchKeyword, keyCity, keyDistrict) {
  navigator.geolocation.getCurrentPosition(function(position) {
    let userPosition = [position.coords.longitude, position.coords.latitude];
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${keyCity}.json?access_token=${mapboxgl.accessToken}&types=place&country=VN`)
    .then(response => response.json())
    .then(data => {
      if (data.features && data.features.length > 0) {

        let bbox = [userPosition[0] - 0.3, userPosition[1] - 0.3, userPosition[0] + 0.3, userPosition[1] + 0.3].join(',');
        const cityCoordinates = data.features[0].bbox;
        if (keyCity != "Chọn tỉnh/thành phố") {
          bbox = [cityCoordinates[0] - 0.5, cityCoordinates[1] - 0.5, cityCoordinates[2] + 0.5, cityCoordinates[3] + 0.5].join(',');
        }

        const searchURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/Nhà thờ ${searchKeyword}.json?access_token=${mapboxgl.accessToken}&bbox=${bbox}&limit=100&country=VN`;
        console.log(searchURL);
        fetch(searchURL)
          .then(response => response.json())
          .then(data => {
            data.features.sort((a, b) => {
          let distanceA = calculateDistance(userPosition[1], userPosition[0], a.geometry.coordinates[1], a.geometry.coordinates[0]);
          let distanceB = calculateDistance(userPosition[1], userPosition[0], b.geometry.coordinates[1], b.geometry.coordinates[0]);
          return distanceA - distanceB;
        });
        nearestPlaces = data.features.slice(0, 10);

        let listView = document.querySelector('.listview__church');
        listView.innerHTML = '';
        listNearestPlaces = [];
        nearestPlaces.forEach(place => {
          let churchItem = document.createElement('li');
          churchItem.classList.add('item__church');

          let thumbnail = document.createElement('img');
          thumbnail.classList.add('item__church__thumbnail');
          thumbnail.src = './images/churchDefault.jpg';
          thumbnail.alt = 'Church Thumbnail';
          churchItem.appendChild(thumbnail);

          let churchInfo = document.createElement('span');
            churchInfo.classList.add('item__info');
          let title = document.createElement('h3');
          title.classList.add('item__church__title');
          title.textContent = place.text;
          churchInfo.appendChild(title);

          let address = document.createElement('p');
          address.classList.add('item__church__address');
          address.textContent = place.place_name;
          churchInfo.appendChild(address);

          churchItem.appendChild(churchInfo);

          let buttonGo = document.createElement('button');
          buttonGo.classList.add('item__church__go');
          buttonGo.textContent = 'Go';

          churchItem.appendChild(buttonGo);
          listView.appendChild(churchItem);

          listNearestPlaces.push(nearestPlaces);
        });
          })
          .catch(error => {
            console.error('Error fetching search data:', error);
          });
      } else {
        console.error('City not found');
      }
    })
    .catch(error => {
      console.error('Error fetching city data:', error);
    });
});
}


document.addEventListener('DOMContentLoaded', function() {
  performSearchWithDefaultKeyword("Nhà thờ", "Chọn tỉnh/thành phố", "Chọn quận/huyện");
});

document.getElementById('button__find').addEventListener('click', function() {
  let searchKeyword = document.querySelector('.find__search__box').value;
  let city = document.getElementById('city');
  let district = document.getElementById('district');

  let newCity = city.options[city.selectedIndex].text.replace(/(Thành phố |Tỉnh |)/g, '');
  let newDistrict = district.options[district.selectedIndex].text.replace(/(Quận |Huyện |Thị xã |Thành phố |Tỉnh )/g, '');
  
  performSearchWithDefaultKeyword(searchKeyword, newCity, newDistrict);
});


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

document.querySelector('.listview__church').addEventListener('click', function(event) {
  let clickedElement = event.target;
    
  if (clickedElement.classList.contains('item__church__go')) {
    let index = Array.from(clickedElement.parentNode.parentNode.children).indexOf(clickedElement.parentNode);
    let selectedPlace = listNearestPlaces[index][index];
    let placeCoordinates = selectedPlace.geometry.coordinates;
    let currentChurch = [placeCoordinates[0], placeCoordinates[1]];
    mapBox(currentChurch, 16);
  }
});