// Script.js

const fetchTopFilms = async () => {
  try {
    // Call Node.js API
    const res = await fetch("http://localhost:3000/api/films/top-rented");
    const films = await res.json();

    // Select the container
    const container = document.getElementById("films-container");
    container.innerHTML = "";

    // Looping through the JSON res array
    films.forEach((film) => {
      const card = document.createElement("div");
      card.className = "film-card";

      card.dataset.id = film.film_id; // set this to film_id so the click listener works

      // add data to the card
      card.innerHTML = `
            <h3>${film.title}</h3>
            <p>Film id: ${film.film_id}</p>
            <p>Category: ${film.category}</p>
            <p>Rental Count: ${film.rental_count}</p>
        `;
      card.addEventListener("click", () => {
        const filmId = card.getAttribute("data-id");
        window.location.href = `film.html?id=${filmId}`;
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.log(err);
  }
};
const fetchActors = async () => {
  // Call API
  const res = await fetch("http://localhost:3000/api/top-actors");
  const actors = await res.json();

  // Select the container
  const actorContainer = document.getElementById("actors-container");
  actorContainer.innerHTML = "";

  // Looping through the JSON res array
  actors.forEach((actor) => {
    const card = document.createElement("div");
    card.className = "actors-card";
    card.dataset.id = actor.actor_id;

    card.innerHTML = `
            <h3>${actor.actor_id}</h3>
            <h4>${actor.first_name} ${actor.last_name}</h4>
            <p>Rental Count: ${actor.rental_count}</p>
        
    `;
    card.addEventListener("click", () => {
      const actorId = card.getAttribute("data-id");
      window.location.href = `actor.html?id=${actorId}`;
    });

    actorContainer.appendChild(card);
  });
};

fetchTopFilms();
fetchActors();
