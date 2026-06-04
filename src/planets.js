// Planet data, click popup, and hover effects
// Usage in HTML: <a-sphere class="clickable" planet-info="planet: earth" ...>

const PLANET_DATA = {
  mercury: {
    name: 'Mercury',
    color: '#9e9e9e',
    type: 'Terrestrial Planet',
    distanceFromSun: '57.9 million km',
    diameter: '4,879 km',
    moons: '0',
    orbitalPeriod: '88 Earth days',
    surfaceTemp: '-180°C to 430°C',
    gravity: '3.7 m/s²',
    description: 'The smallest planet and the closest to the Sun. With no atmosphere to trap heat, temperatures swing wildly between day and night. A single day on Mercury lasts 59 Earth days.'
  },
  venus: {
    name: 'Venus',
    color: '#e8c97a',
    type: 'Terrestrial Planet',
    distanceFromSun: '108.2 million km',
    diameter: '12,104 km',
    moons: '0',
    orbitalPeriod: '225 Earth days',
    surfaceTemp: '465°C (average)',
    gravity: '8.87 m/s²',
    description: 'The hottest planet despite not being the closest to the Sun. A thick CO₂ atmosphere creates a runaway greenhouse effect. Venus also spins backwards — the Sun rises in the west there.'
  },
  earth: {
    name: 'Earth',
    color: '#2e7bd4',
    type: 'Terrestrial Planet',
    distanceFromSun: '149.6 million km',
    diameter: '12,742 km',
    moons: '1 (The Moon)',
    orbitalPeriod: '365.25 days',
    surfaceTemp: '-89°C to 58°C',
    gravity: '9.81 m/s²',
    description: 'Our home — the only known world to harbour life. 71% of its surface is water, giving it the "Blue Marble" appearance. Its magnetic field shields life from harmful solar radiation.'
  },
  mars: {
    name: 'Mars',
    color: '#c1440e',
    type: 'Terrestrial Planet',
    distanceFromSun: '227.9 million km',
    diameter: '6,779 km',
    moons: '2 (Phobos & Deimos)',
    orbitalPeriod: '687 Earth days',
    surfaceTemp: '-125°C to 20°C',
    gravity: '3.72 m/s²',
    description: 'The Red Planet, coloured by iron oxide dust. Home to Olympus Mons — the tallest volcano in the solar system at 21.9 km — and Valles Marineris, a canyon system as wide as the United States.'
  },
  jupiter: {
    name: 'Jupiter',
    color: '#c88b3a',
    type: 'Gas Giant',
    distanceFromSun: '778.5 million km',
    diameter: '139,820 km',
    moons: '95 known',
    orbitalPeriod: '11.86 Earth years',
    surfaceTemp: '-110°C (cloud tops)',
    gravity: '24.79 m/s²',
    description: 'The largest planet — over 1,300 Earths could fit inside it. Its Great Red Spot is a centuries-old storm larger than Earth itself. Jupiter acts as a cosmic shield, deflecting many asteroid impacts away from the inner solar system.'
  },
  saturn: {
    name: 'Saturn',
    color: '#e8d5a3',
    type: 'Gas Giant',
    distanceFromSun: '1.43 billion km',
    diameter: '116,460 km',
    moons: '146 known',
    orbitalPeriod: '29.46 Earth years',
    surfaceTemp: '-140°C (cloud tops)',
    gravity: '10.44 m/s²',
    description: 'Famous for its stunning ring system made of billions of ice chunks and rocky debris. Saturn is so light it could float on water. Its moon Titan has a thick nitrogen atmosphere and lakes of liquid methane.'
  },
  uranus: {
    name: 'Uranus',
    color: '#7de8e8',
    type: 'Ice Giant',
    distanceFromSun: '2.87 billion km',
    diameter: '50,724 km',
    moons: '28 known',
    orbitalPeriod: '84 Earth years',
    surfaceTemp: '-195°C (average)',
    gravity: '8.69 m/s²',
    description: 'Rotates on its side with a 98° axial tilt — likely caused by a colossal ancient collision. It has the coldest planetary atmosphere in the solar system despite not being the furthest from the Sun.'
  },
  neptune: {
    name: 'Neptune',
    color: '#3f54ba',
    type: 'Ice Giant',
    distanceFromSun: '4.5 billion km',
    diameter: '49,244 km',
    moons: '16 known',
    orbitalPeriod: '164.8 Earth years',
    surfaceTemp: '-200°C (average)',
    gravity: '11.15 m/s²',
    description: 'The windiest planet — storms rage at 2,100 km/h. Its largest moon Triton orbits in reverse and is slowly spiralling inward, doomed to be torn apart by gravity in around 3.6 billion years.'
  }
};

function showPopup(planetKey) {
  const d = PLANET_DATA[planetKey];
  if (!d) return;

  document.getElementById('popup-name').textContent = d.name;
  document.getElementById('popup-type').textContent = d.type;
  document.getElementById('popup-distance').textContent = d.distanceFromSun;
  document.getElementById('popup-diameter').textContent = d.diameter;
  document.getElementById('popup-moons').textContent = d.moons;
  document.getElementById('popup-period').textContent = d.orbitalPeriod;
  document.getElementById('popup-temp').textContent = d.surfaceTemp;
  document.getElementById('popup-gravity').textContent = d.gravity;
  document.getElementById('popup-description').textContent = d.description;
  document.getElementById('popup-color-dot').style.background = d.color;

  document.getElementById('popup-overlay').classList.remove('hidden');
  document.getElementById('planet-popup').classList.remove('hidden');
}

function closePopup() {
  document.getElementById('popup-overlay').classList.add('hidden');
  document.getElementById('planet-popup').classList.add('hidden');
}

AFRAME.registerComponent('planet-info', {
  schema: { planet: { type: 'string' } },
  init() {
    this.el.addEventListener('click', () => showPopup(this.data.planet));
    this.el.addEventListener('mouseenter', () => {
      this.el.setAttribute('scale', '1.12 1.12 1.12');
      document.body.style.cursor = 'pointer';
    });
    this.el.addEventListener('mouseleave', () => {
      this.el.setAttribute('scale', '1 1 1');
      document.body.style.cursor = 'default';
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('popup-close').addEventListener('click', closePopup);
  document.getElementById('popup-overlay').addEventListener('click', closePopup);
});
