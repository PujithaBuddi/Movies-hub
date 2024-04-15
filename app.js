const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDbObjectToResponseObject1 = dbObject1 => {
  return {
    directorId: dbObject1.director_id,
    directorName: dbObject1.director_name,
  }
}

//get Movie names
app.get('/movies/', async (request, response) => {
  const getMoviesArray = `
    select movie_name from movie;`

  const moviesArray = await db.all(getMoviesArray)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

//Add new movie
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails

  const addMovieQuery = `
  insert into movie (director_id, movie_name, lead_actor)
  values (
    ${directorId},
    '${movieName}',
    '${leadActor}'
  );`
  const movie = await db.run(addMovieQuery)
  //const bookId = dbResponse.lastID
  response.send('Movie Successfully Added')
})

//returns a movie based on ID
app.get('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const getMovieById = `
  select * from movie
  where movie_id = ${movieId};`

  const getMovie = await db.get(getMovieById)
  response.send(convertDbObjectToResponseObject(getMovie))
})

//update movie details
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails

  const updateMovieQuery = `
  update movie 
  set 
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  where movie_id = ${movieId};`

  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  delete from movie where movie_id = ${movieId};`

  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
  select * from director;`

  const getDirectorsArray = await db.all(getDirectorsQuery)
  response.send(convertDbObjectToResponseObject1(getDirectorsArray))
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const directorId = request.params
  const getMovieByDirectorQuery = `
  select movie.movie_name from movie Natural JOIN director where movie.director_id = director.director_id
  and director.director_id = '${directorId}';`

  const getMovieByDirectorArray = await db.get(getMovieByDirectorQuery)
  response.send(getMovieByDirectorArray)
})

module.exports = app
