import React, { useState } from "react";

const TMDB_API_KEY = "b074e99c9069a27abe3e3110b0573f85";
const OMDB_API_KEY = "983eb611";

export default function App() {
  const [actor1, setActor1] = useState("");
  const [actor2, setActor2] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActorId = async (name) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    throw new Error(`Actor "${name}" not found.`);
  };

  const fetchMoviesByActor = async (actorId) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`
    );
    const data = await res.json();
    return data.cast || [];
  };

  const fetchImdbId = async (title, year) => {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(
      title
    )}&y=${year || ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === "True") {
      return data.imdbID;
    }
    return null;
  };

  const findCommonMovies = async () => {
    setLoading(true);
    setError(null);
    setMovies([]);

    try {
      const actor1Id = await fetchActorId(actor1);
      const actor2Id = await fetchActorId(actor2);

      const [movies1, movies2] = await Promise.all([
        fetchMoviesByActor(actor1Id),
        fetchMoviesByActor(actor2Id),
      ]);

      const movieIds = new Set(movies1.map((m) => m.id));
      const common = movies2.filter((m) => movieIds.has(m.id));

      const commonWithImdb = await Promise.all(
        common.map(async (movie) => {
          const imdbID = await fetchImdbId(
            movie.title,
            movie.release_date?.slice(0, 4)
          );
          return { ...movie, imdbID };
        })
      );

      setMovies(commonWithImdb);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-center">🎬 Actor Movie Matcher</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full p-3 rounded-md bg-gray-800 text-white placeholder-gray-400"
            placeholder="First Actor"
            value={actor1}
            onChange={(e) => setActor1(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-md bg-gray-800 text-white placeholder-gray-400"
            placeholder="Second Actor"
            value={actor2}
            onChange={(e) => setActor2(e.target.value)}
          />
        </div>

        <div className="text-center">
          <button
            onClick={findCommonMovies}
            disabled={loading || !actor1 || !actor2}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md w-full md:w-auto"
          >
            {loading ? "Searching..." : "Find Common Movies"}
          </button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {movies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-gray-800 rounded-xl p-4">
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "https://via.placeholder.com/500x750?text=No+Image"
                  }
                  alt={movie.title}
                  className="rounded-lg w-full h-72 object-cover mb-4"
                />
                <h2 className="text-lg font-semibold">{movie.title}</h2>
                <p className="text-sm text-gray-400 mb-2">
                  {movie.release_date?.slice(0, 4) || "Unknown Year"}
                </p>
                {movie.imdbID ? (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdbID}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm block"
                  >
                    View on IMDb
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">IMDb link not found</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && movies.length === 0 && !error && (
          <p className="text-gray-400 text-center">No common movies found.</p>
        )}
      </div>
    </main>
  );
}
