import gotQuestions          from './questions/got.js'
import lotrQuestions         from './questions/lotr.js'
import lotrAgesQuestions     from './questions/lotrages.js'
import hobbitQuestions       from './questions/hobbit.js'
import friendsQuestions      from './questions/friends.js'
import breakingbadQuestions  from './questions/breakingbad.js'
import strangerthingsQuestions from './questions/strangerthings.js'
import simpsonsQuestions     from './questions/simpsons.js'
import bigbangtheoryQuestions from './questions/bigbangtheory.js'
import marioQuestions        from './questions/mario.js'
import starwarsQuestions     from './questions/starwars.js'
import harrypotterQuestions  from './questions/harrypotter.js'
import marvelQuestions       from './questions/marvel.js'
import theofficequestions    from './questions/theoffice.js'
import pokemonQuestions      from './questions/pokemon.js'
import dcQuestions           from './questions/dc.js'
import witcherQuestions      from './questions/witcher.js'
import blizzardQuestions     from './questions/blizzard.js'
import zeldaQuestions        from './questions/zelda.js'
import minecraftQuestions    from './questions/minecraft.js'
import retrogamingQuestions  from './questions/retrogaming.js'
import startrekQuestions     from './questions/startrek.js'
import bttfQuestions         from './questions/bttf.js'
import disneyQuestions       from './questions/disney.js'
import rickmortyQuestions    from './questions/rickmorty.js'
import xmenQuestions         from './questions/xmen.js'
import invincibleQuestions   from './questions/invincible.js'
import warhammerQuestions    from './questions/warhammer.js'
import dragonballQuestions   from './questions/dragonball.js'
import narutoQuestions       from './questions/naruto.js'
import onepieceQuestions     from './questions/onepiece.js'
import avatarQuestions       from './questions/avatar.js'
import futbolQuestions       from './questions/futbol.js'
import formula1Questions     from './questions/formula1.js'
import nbaQuestions          from './questions/nba.js'
import jurassicQuestions     from './questions/jurassic.js'
import madmenQuestions       from './questions/madmen.js'
import batmanQuestions       from './questions/batman.js'
import supermanQuestions     from './questions/superman.js'
import wonderwomanQuestions  from './questions/wonderwoman.js'
import spidermanQuestions    from './questions/spiderman.js'
import deadpoolQuestions     from './questions/deadpool.js'
import hellboyQuestions      from './questions/hellboy.js'
import spawnQuestions        from './questions/spawn.js'
import motuQuestions         from './questions/motu.js'
import sonicQuestions        from './questions/sonic.js'

const QUESTION_DB = {
  got:            gotQuestions,
  lotr:           lotrQuestions,
  lotrages:       lotrAgesQuestions,
  hobbit:         hobbitQuestions,
  friends:        friendsQuestions,
  breakingbad:    breakingbadQuestions,
  strangerthings: strangerthingsQuestions,
  simpsons:       simpsonsQuestions,
  bigbangtheory:  bigbangtheoryQuestions,
  mario:          marioQuestions,
  starwars:       starwarsQuestions,
  harrypotter:    harrypotterQuestions,
  marvel:         marvelQuestions,
  theoffice:      theofficequestions,
  pokemon:        pokemonQuestions,
  dc:             dcQuestions,
  witcher:        witcherQuestions,
  blizzard:       blizzardQuestions,
  zelda:          zeldaQuestions,
  minecraft:      minecraftQuestions,
  retrogaming:    retrogamingQuestions,
  startrek:       startrekQuestions,
  bttf:           bttfQuestions,
  disney:         disneyQuestions,
  rickmorty:      rickmortyQuestions,
  xmen:           xmenQuestions,
  invincible:     invincibleQuestions,
  warhammer:      warhammerQuestions,
  dragonball:     dragonballQuestions,
  naruto:         narutoQuestions,
  onepiece:       onepieceQuestions,
  avatar:         avatarQuestions,
  futbol:         futbolQuestions,
  formula1:       formula1Questions,
  nba:            nbaQuestions,
  jurassic:       jurassicQuestions,
  madmen:         madmenQuestions,
  batman:         batmanQuestions,
  superman:       supermanQuestions,
  wonderwoman:    wonderwomanQuestions,
  spiderman:      spidermanQuestions,
  deadpool:       deadpoolQuestions,
  hellboy:        hellboyQuestions,
  spawn:          spawnQuestions,
  motu:           motuQuestions,
  sonic:          sonicQuestions,
}

export function getQuestions(id) { return QUESTION_DB[id] || [] }
export function pickQuestions(id, n = 10, type = null) {
  let pool = getQuestions(id)
  if (type) pool = pool.filter(q => q.t === type)
  if (!pool.length) return []
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(n, pool.length))
}
export function getQuestionCount(id) { return (QUESTION_DB[id] || []).length }
