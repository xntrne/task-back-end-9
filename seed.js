import { connectDB } from "./db/index.js";
import { Actor } from "./models/Actor.js";
import { Movie } from "./models/Movie.js";
import { Review } from "./models/Review.js";
import { User } from "./models/User.js";

try {
  process.loadEnvFile();
} catch {

}

async function seed() {
  await connectDB();

  if ((await User.countDocuments()) > 0) {
    console.log("database already contains data, seed skipped");
    process.exit(0);
  }

  const eyad = await User.create({
    username: "eyad",
    email: "eyad@test.com",
    password: "Password1!",
  });

  const sarah = await User.create({
    username: "sarah",
    email: "sarah@test.com",
    password: "Password1!",
  });

  const [leo, cillian, florence] = await Actor.create([
    { name: "Leonardo DiCaprio", birthdate: "1974-11-11", createdBy: eyad._id },
    { name: "Cillian Murphy", birthdate: "1976-05-25", createdBy: eyad._id },
    { name: "Florence Pugh", birthdate: "1996-01-03", createdBy: sarah._id },
  ]);

  const [inception, oppenheimer, dune] = await Movie.create([
    {
      title: "Inception",
      year: 2010,
      genres: ["Action", "Sci-Fi", "Thriller"],
      description: "A thief who steals corporate secrets through dream-sharing technology.",
      trailerLink: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      director: "Christopher Nolan",
      actors: [leo._id, cillian._id],
      createdBy: eyad._id,
    },
    {
      title: "Oppenheimer",
      year: 2023,
      genres: ["Biography", "Drama", "History"],
      description: "The story of J. Robert Oppenheimer and the creation of the atomic bomb.",
      trailerLink: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      director: "Christopher Nolan",
      actors: [cillian._id, florence._id],
      createdBy: eyad._id,
    },
    {
      title: "Dune: Part Two",
      year: 2024,
      genres: ["Adventure", "Drama", "Sci-Fi"],
      description: "Paul Atreides unites with the Fremen to seek revenge against the conspirators.",
      trailerLink: "https://www.youtube.com/watch?v=Way9Dexny3w",
      director: "Denis Villeneuve",
      actors: [florence._id],
      createdBy: sarah._id,
    },
  ]);

  await Review.create([
    { number: 9, comment: "One of the best sci-fi movies of the decade.", movie: inception._id, user: sarah._id },
    { number: 10, comment: "Masterpiece of sound and tension.", movie: oppenheimer._id, user: eyad._id },
    { number: 8, comment: "Great acting and pacing.", movie: dune._id, user: sarah._id },
  ]);

  console.log("seed completed");
  console.log("login with eyad@test.com / Password1! or sarah@test.com / Password1!");

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
